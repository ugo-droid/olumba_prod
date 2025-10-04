/**
 * Clerk Billing Webhooks
 * Handles billing webhook events from Clerk for subscription and payment management
 */

import express from 'express';
import { createClerkClient } from '@clerk/backend';
import { Webhook } from 'svix';
import { supabase, supabaseAdmin, TABLES } from '../config/supabase.js';

const router = express.Router();

// Initialize Clerk client for webhook verification
const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
});

/**
 * Handle Clerk billing webhook events
 */
router.post('/clerk-billing-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const BILLING_WEBHOOK_SECRET = process.env.CLERK_BILLING_WEBHOOK_SECRET;
        
        if (!BILLING_WEBHOOK_SECRET) {
            console.error('❌ CLERK_BILLING_WEBHOOK_SECRET is not set');
            return res.status(500).json({ error: 'Billing webhook secret not configured' });
        }

        // Get headers
        const svix_id = req.headers['svix-id'];
        const svix_timestamp = req.headers['svix-timestamp'];
        const svix_signature = req.headers['svix-signature'];

        if (!svix_id || !svix_timestamp || !svix_signature) {
            console.error('❌ Missing required headers');
            return res.status(400).json({ error: 'Missing required headers' });
        }

        // Verify webhook signature
        const wh = new Webhook(BILLING_WEBHOOK_SECRET);
        let evt;
        
        try {
            evt = wh.verify(req.body, {
                'svix-id': svix_id,
                'svix-timestamp': svix_timestamp,
                'svix-signature': svix_signature,
            });
        } catch (err) {
            console.error('❌ Billing webhook verification failed:', err);
            return res.status(400).json({ error: 'Webhook verification failed' });
        }

        const { type, data } = evt;
        console.log(`💰 Received Clerk billing webhook: ${type}`);

        // Handle different event types
        switch (type) {
            case 'subscription.created':
                await handleSubscriptionCreated(data);
                break;
            case 'subscription.updated':
                await handleSubscriptionUpdated(data);
                break;
            case 'subscription.active':
                await handleSubscriptionActive(data);
                break;
            case 'subscription.past_due':
                await handleSubscriptionPastDue(data);
                break;
            case 'paymentAttempt.created':
                await handlePaymentAttemptCreated(data);
                break;
            case 'paymentAttempt.updated':
                await handlePaymentAttemptUpdated(data);
                break;
            default:
                console.log(`ℹ️ Unhandled billing webhook event type: ${type}`);
        }

        res.json({ received: true });
    } catch (error) {
        console.error('❌ Billing webhook processing error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Handle subscription.created webhook
 */
async function handleSubscriptionCreated(data) {
    try {
        const subscription = data;
        console.log(`💳 Subscription created: ${subscription.id} for user ${subscription.user_id}`);

        // Create subscription record in Supabase
        const { error } = await supabaseAdmin
            .from(TABLES.SUBSCRIPTIONS || 'subscriptions')
            .insert({
                id: subscription.id,
                user_id: subscription.user_id,
                organization_id: subscription.organization_id,
                status: subscription.status,
                plan_id: subscription.plan_id,
                plan_name: subscription.plan_name,
                price_id: subscription.price_id,
                quantity: subscription.quantity,
                current_period_start: subscription.current_period_start ? new Date(subscription.current_period_start).toISOString() : null,
                current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end).toISOString() : null,
                trial_start: subscription.trial_start ? new Date(subscription.trial_start).toISOString() : null,
                trial_end: subscription.trial_end ? new Date(subscription.trial_end).toISOString() : null,
                cancel_at_period_end: subscription.cancel_at_period_end || false,
                canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at).toISOString() : null,
                created_at: new Date(subscription.created_at).toISOString(),
                updated_at: new Date(subscription.updated_at).toISOString()
            });

        if (error) {
            console.error('❌ Error creating subscription in Supabase:', error);
        } else {
            console.log('✅ Subscription created successfully in Supabase');
        }

        // Update user's subscription status
        await updateUserSubscriptionStatus(subscription.user_id, subscription.status);
    } catch (error) {
        console.error('❌ Error handling subscription.created:', error);
    }
}

/**
 * Handle subscription.updated webhook
 */
async function handleSubscriptionUpdated(data) {
    try {
        const subscription = data;
        console.log(`💳 Subscription updated: ${subscription.id} for user ${subscription.user_id}`);

        // Update subscription record in Supabase
        const { error } = await supabaseAdmin
            .from(TABLES.SUBSCRIPTIONS || 'subscriptions')
            .update({
                status: subscription.status,
                plan_id: subscription.plan_id,
                plan_name: subscription.plan_name,
                price_id: subscription.price_id,
                quantity: subscription.quantity,
                current_period_start: subscription.current_period_start ? new Date(subscription.current_period_start).toISOString() : null,
                current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end).toISOString() : null,
                trial_start: subscription.trial_start ? new Date(subscription.trial_start).toISOString() : null,
                trial_end: subscription.trial_end ? new Date(subscription.trial_end).toISOString() : null,
                cancel_at_period_end: subscription.cancel_at_period_end || false,
                canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at).toISOString() : null,
                updated_at: new Date(subscription.updated_at).toISOString()
            })
            .eq('id', subscription.id);

        if (error) {
            console.error('❌ Error updating subscription in Supabase:', error);
        } else {
            console.log('✅ Subscription updated successfully in Supabase');
        }

        // Update user's subscription status
        await updateUserSubscriptionStatus(subscription.user_id, subscription.status);
    } catch (error) {
        console.error('❌ Error handling subscription.updated:', error);
    }
}

/**
 * Handle subscription.active webhook
 */
async function handleSubscriptionActive(data) {
    try {
        const subscription = data;
        console.log(`💳 Subscription activated: ${subscription.id} for user ${subscription.user_id}`);

        // Update subscription status to active
        const { error } = await supabaseAdmin
            .from(TABLES.SUBSCRIPTIONS || 'subscriptions')
            .update({
                status: 'active',
                updated_at: new Date().toISOString()
            })
            .eq('id', subscription.id);

        if (error) {
            console.error('❌ Error activating subscription in Supabase:', error);
        } else {
            console.log('✅ Subscription activated successfully in Supabase');
        }

        // Update user's subscription status
        await updateUserSubscriptionStatus(subscription.user_id, 'active');
    } catch (error) {
        console.error('❌ Error handling subscription.active:', error);
    }
}

/**
 * Handle subscription.past_due webhook
 */
async function handleSubscriptionPastDue(data) {
    try {
        const subscription = data;
        console.log(`💳 Subscription past due: ${subscription.id} for user ${subscription.user_id}`);

        // Update subscription status to past_due
        const { error } = await supabaseAdmin
            .from(TABLES.SUBSCRIPTIONS || 'subscriptions')
            .update({
                status: 'past_due',
                updated_at: new Date().toISOString()
            })
            .eq('id', subscription.id);

        if (error) {
            console.error('❌ Error updating subscription to past_due in Supabase:', error);
        } else {
            console.log('✅ Subscription marked as past_due in Supabase');
        }

        // Update user's subscription status
        await updateUserSubscriptionStatus(subscription.user_id, 'past_due');

        // TODO: Send notification to user about past due payment
        console.log('ℹ️ TODO: Send past due payment notification to user');
    } catch (error) {
        console.error('❌ Error handling subscription.past_due:', error);
    }
}

/**
 * Handle paymentAttempt.created webhook
 */
async function handlePaymentAttemptCreated(data) {
    try {
        const paymentAttempt = data;
        console.log(`💳 Payment attempt created: ${paymentAttempt.id} for subscription ${paymentAttempt.subscription_id}`);

        // Create payment attempt record in Supabase
        const { error } = await supabaseAdmin
            .from(TABLES.PAYMENT_ATTEMPTS || 'payment_attempts')
            .insert({
                id: paymentAttempt.id,
                subscription_id: paymentAttempt.subscription_id,
                user_id: paymentAttempt.user_id,
                organization_id: paymentAttempt.organization_id,
                status: paymentAttempt.status,
                amount: paymentAttempt.amount,
                currency: paymentAttempt.currency,
                payment_method_id: paymentAttempt.payment_method_id,
                failure_reason: paymentAttempt.failure_reason,
                created_at: new Date(paymentAttempt.created_at).toISOString(),
                updated_at: new Date(paymentAttempt.updated_at).toISOString()
            });

        if (error) {
            console.error('❌ Error creating payment attempt in Supabase:', error);
        } else {
            console.log('✅ Payment attempt created successfully in Supabase');
        }
    } catch (error) {
        console.error('❌ Error handling paymentAttempt.created:', error);
    }
}

/**
 * Handle paymentAttempt.updated webhook
 */
async function handlePaymentAttemptUpdated(data) {
    try {
        const paymentAttempt = data;
        console.log(`💳 Payment attempt updated: ${paymentAttempt.id} - Status: ${paymentAttempt.status}`);

        // Update payment attempt record in Supabase
        const { error } = await supabaseAdmin
            .from(TABLES.PAYMENT_ATTEMPTS || 'payment_attempts')
            .update({
                status: paymentAttempt.status,
                failure_reason: paymentAttempt.failure_reason,
                updated_at: new Date(paymentAttempt.updated_at).toISOString()
            })
            .eq('id', paymentAttempt.id);

        if (error) {
            console.error('❌ Error updating payment attempt in Supabase:', error);
        } else {
            console.log('✅ Payment attempt updated successfully in Supabase');
        }

        // If payment succeeded, update subscription status
        if (paymentAttempt.status === 'succeeded') {
            console.log('✅ Payment succeeded, updating subscription status');
            // TODO: Update subscription status based on payment success
        }
    } catch (error) {
        console.error('❌ Error handling paymentAttempt.updated:', error);
    }
}

/**
 * Helper function to update user's subscription status
 */
async function updateUserSubscriptionStatus(userId, status) {
    try {
        const { error } = await supabaseAdmin
            .from(TABLES.USERS)
            .update({
                subscription_status: status,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (error) {
            console.error('❌ Error updating user subscription status:', error);
        } else {
            console.log(`✅ User ${userId} subscription status updated to: ${status}`);
        }
    } catch (error) {
        console.error('❌ Error updating user subscription status:', error);
    }
}

export default router;
