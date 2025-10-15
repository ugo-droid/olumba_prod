// =============================
// Stripe Webhook Handler
// =============================
// IMPORTANT: This function requires raw body for signature verification
// See vercel.json configuration
import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { stripe, STRIPE_WEBHOOK_SECRET } from '../lib/stripe';
import { supabaseAdmin, Organization, BillingEvent } from '../lib/supabaseAdmin';
import { deriveEntitlements } from '../lib/entitlements';

/**
 * Process webhook event and update database
 */
async function processWebhookEvent(event: Stripe.Event): Promise<void> {
  console.log(`Processing webhook event: ${event.type} (${event.id})`);

  // Store event for audit trail
  await storeEventInDatabase(event);

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionChanged(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;

    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

/**
 * Store webhook event in database for audit and debugging
 */
async function storeEventInDatabase(event: Stripe.Event): Promise<void> {
  try {
    const subscription = extractSubscriptionFromEvent(event);
    const orgId = subscription?.metadata?.org_id;

    const billingEvent: BillingEvent = {
      event_id: event.id,
      event_type: event.type,
      organization_id: orgId,
      stripe_customer_id: extractCustomerId(event),
      stripe_subscription_id: subscription?.id,
      payload: event,
      processed: true,
    };

    const { error } = await supabaseAdmin.from('billing_events').insert(billingEvent);

    if (error) {
      console.error('Failed to store billing event:', error);
      // Don't throw - we still want to process the event
    }
  } catch (error) {
    console.error('Error storing billing event:', error);
    // Continue processing
  }
}

/**
 * Handle successful checkout session
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const subscriptionId = session.subscription as string;
  const customerId = session.customer as string;
  const orgId = session.metadata?.org_id;

  if (!subscriptionId || !customerId || !orgId) {
    console.error('Missing required data in checkout session:', {
      subscriptionId,
      customerId,
      orgId,
    });
    return;
  }

  console.log(`Checkout completed for org ${orgId}, customer ${customerId}`);

  // Update organization with Stripe IDs
  const { error: orgError } = await supabaseAdmin
    .from('organizations')
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      billing_status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orgId);

  if (orgError) {
    console.error('Failed to update organization:', orgError);
    throw new Error(`Failed to update organization: ${orgError.message}`);
  }

  // Fetch subscription to derive entitlements
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await updateEntitlements(orgId, subscription);
}

/**
 * Handle subscription created or updated
 */
async function handleSubscriptionChanged(subscription: Stripe.Subscription): Promise<void> {
  const orgId = subscription.metadata?.org_id;

  if (!orgId) {
    console.error('No org_id in subscription metadata:', subscription.id);
    return;
  }

  console.log(`Subscription ${subscription.status} for org ${orgId}`);

  // Update organization billing status
  const { error: orgError } = await supabaseAdmin
    .from('organizations')
    .update({
      tier: extractTierFromSubscription(subscription),
      billing_status: subscription.status,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orgId);

  if (orgError) {
    console.error('Failed to update organization:', orgError);
    // Continue to update entitlements
  }

  // Update entitlements
  await updateEntitlements(orgId, subscription);
}

/**
 * Handle subscription deletion/cancellation
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const orgId = subscription.metadata?.org_id;

  if (!orgId) {
    console.error('No org_id in subscription metadata:', subscription.id);
    return;
  }

  console.log(`Subscription deleted for org ${orgId}`);

  // Update organization to canceled state
  const { error: orgError } = await supabaseAdmin
    .from('organizations')
    .update({
      billing_status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orgId);

  if (orgError) {
    console.error('Failed to update organization:', orgError);
  }

  // Set entitlements to zero/free tier
  const { error: entError } = await supabaseAdmin
    .from('organization_entitlements')
    .upsert({
      organization_id: orgId,
      tier: 'none',
      max_internal_members: 0,
      base_storage_gb: 0,
      city_integrations: 0,
      extra_storage_gb: 0,
      external_collaborators_billable: false,
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', orgId);

  if (entError) {
    console.error('Failed to update entitlements:', entError);
  }
}

/**
 * Handle payment failure
 */
async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = invoice.subscription as string;
  const customerId = invoice.customer as string;

  console.warn(`Payment failed for customer ${customerId}, subscription ${subscriptionId}`);

  // TODO: Send notification to org admins
  // TODO: Implement grace period logic
  // TODO: Consider updating billing_status to 'past_due' after grace period

  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const orgId = subscription.metadata?.org_id;

    if (orgId) {
      await supabaseAdmin
        .from('organizations')
        .update({
          billing_status: 'past_due',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orgId);
    }
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = invoice.subscription as string;
  const customerId = invoice.customer as string;

  console.log(`Payment succeeded for customer ${customerId}, subscription ${subscriptionId}`);

  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const orgId = subscription.metadata?.org_id;

    if (orgId) {
      await supabaseAdmin
        .from('organizations')
        .update({
          billing_status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orgId);
    }
  }
}

/**
 * Update organization entitlements based on subscription
 */
async function updateEntitlements(
  orgId: string,
  subscription: Stripe.Subscription
): Promise<void> {
  const entitlements = deriveEntitlements(subscription, orgId);

  console.log('Updating entitlements:', entitlements);

  const { error } = await supabaseAdmin
    .from('organization_entitlements')
    .upsert({
      ...entitlements,
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', orgId);

  if (error) {
    console.error('Failed to upsert entitlements:', error);
    throw new Error(`Failed to update entitlements: ${error.message}`);
  }

  // TODO: Add retry logic with exponential backoff
  // TODO: Store failed updates in a dead letter queue for manual review
}

/**
 * Extract tier name from subscription
 */
function extractTierFromSubscription(subscription: Stripe.Subscription): string {
  const entitlements = deriveEntitlements(subscription, 'temp');
  return entitlements.tier;
}

/**
 * Extract subscription from various event types
 */
function extractSubscriptionFromEvent(event: Stripe.Event): Stripe.Subscription | null {
  const obj = event.data.object as any;

  if (event.type.startsWith('customer.subscription.')) {
    return obj as Stripe.Subscription;
  }

  if (event.type === 'checkout.session.completed' && obj.subscription) {
    // Note: subscription in checkout is just an ID, not the full object
    return null;
  }

  return null;
}

/**
 * Extract customer ID from event
 */
function extractCustomerId(event: Stripe.Event): string | undefined {
  const obj = event.data.object as any;
  return obj.customer as string | undefined;
}

/**
 * Verify webhook signature and construct event
 */
function constructEvent(rawBody: Buffer, signature: string): Stripe.Event {
  try {
    return stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw new Error('Invalid signature');
  }
}

/**
 * Main webhook handler
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    console.error('Missing stripe-signature header');
    return res.status(400).json({ error: 'Missing signature' });
  }

  try {
    // Construct event from raw body and verify signature
    const rawBody = req.body as Buffer;
    const event = constructEvent(rawBody, signature);

    // Process the event asynchronously
    await processWebhookEvent(event);

    // Respond immediately to Stripe
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);

    if (error instanceof Error) {
      return res.status(400).json({
        error: 'Webhook processing failed',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}

// TODO: Implement idempotency keys to prevent duplicate processing
// TODO: Add circuit breaker for Supabase calls
// TODO: Set up monitoring and alerts for webhook failures

