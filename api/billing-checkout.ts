// =============================
// Stripe Checkout Session API
// =============================
import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { stripe } from '../lib/stripe';
import { isBasePlan, isAddon } from '../lib/entitlements';

// Validation schema
const CheckoutSchema = z.object({
  orgId: z.string().min(1, 'Organization ID is required'),
  priceId: z.string().min(1, 'Price ID is required'),
  successUrl: z.string().url('Valid success URL is required'),
  cancelUrl: z.string().url('Valid cancel URL is required'),
  quantity: z.number().int().positive().optional().default(1),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Validate request body
    const body = CheckoutSchema.parse(req.body);
    const { orgId, priceId, successUrl, cancelUrl, quantity } = body;

    // Validate price ID
    if (!isBasePlan(priceId) && !isAddon(priceId)) {
      res.status(400).json({
        error: 'Invalid price ID',
        message: 'Price ID must be a valid base plan or add-on',
      });
    return;
    }

    console.log(`Creating checkout session for org ${orgId} with price ${priceId}`);

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      allow_promotion_codes: true,
      customer_creation: 'always',
      line_items: [
        {
          price: priceId,
          quantity,
        },
      ],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: {
          org_id: orgId,
        },
      },
      metadata: {
        org_id: orgId,
      },
    });

    console.log(`Checkout session created: ${session.id}`);

    res.status(200).json({
      url: session.url,
      sessionId: session.id,
    });
    return;
  } catch (error) {
    console.error('Checkout session error:', error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    return;
    }

    if (error instanceof Error) {
      res.status(500).json({
        error: 'Failed to create checkout session',
        message: error.message,
      });
    return;
    }

    res.status(500).json({
      error: 'Internal server error',
    });
    return;
  }
}

