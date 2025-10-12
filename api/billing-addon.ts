// =============================
// Add or Update Subscription Add-ons API
// =============================
import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { stripe } from '../lib/stripe';
import { isAddon } from '../lib/entitlements';

// Validation schema
const AddonSchema = z.object({
  subscriptionId: z.string().min(1, 'Subscription ID is required'),
  priceId: z.string().min(1, 'Price ID is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate request body
    const body = AddonSchema.parse(req.body);
    const { subscriptionId, priceId, quantity } = body;

    // Validate that this is an add-on price
    if (!isAddon(priceId)) {
      return res.status(400).json({
        error: 'Invalid price ID',
        message: 'Price ID must be a valid add-on (City Integrations or Extra Storage)',
      });
    }

    console.log(`Adding addon ${priceId} (qty: ${quantity}) to subscription ${subscriptionId}`);

    // Retrieve the subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Check if the add-on already exists in the subscription
    const existingItem = subscription.items.data.find(item => item.price.id === priceId);

    if (existingItem) {
      // Update existing add-on quantity
      await stripe.subscriptionItems.update(existingItem.id, {
        quantity,
        proration_behavior: 'create_prorations',
      });

      console.log(`Updated existing addon item ${existingItem.id}`);
    } else {
      // Add new add-on to subscription
      await stripe.subscriptionItems.create({
        subscription: subscriptionId,
        price: priceId,
        quantity,
        proration_behavior: 'create_prorations',
      });

      console.log(`Added new addon to subscription`);
    }

    // Retrieve updated subscription
    const updatedSubscription = await stripe.subscriptions.retrieve(subscriptionId);

    return res.status(200).json({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        items: updatedSubscription.items.data.map(item => ({
          id: item.id,
          priceId: item.price.id,
          quantity: item.quantity,
        })),
      },
    });
  } catch (error) {
    console.error('Add-on error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    if (error instanceof Error) {
      return res.status(500).json({
        error: 'Failed to add addon',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}

