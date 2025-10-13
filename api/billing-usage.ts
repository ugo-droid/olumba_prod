// =============================
// Report Metered Usage API (Optional - for storage overages)
// =============================
import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { stripe } from '../lib/stripe';

// Validation schema
const UsageSchema = z.object({
  subscriptionItemId: z.string().min(1, 'Subscription item ID is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  timestamp: z.number().int().positive().optional(),
  action: z.enum(['increment', 'set']).optional().default('set'),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate request body
    const body = UsageSchema.parse(req.body);
    const { subscriptionItemId, quantity, timestamp, action } = body;

    console.log(
      `Reporting ${action} usage: ${quantity} for subscription item ${subscriptionItemId}`
    );

    // Create usage record
    const usageRecord = await stripe.subscriptionItems.createUsageRecord(
      subscriptionItemId,
      {
        quantity,
        timestamp: timestamp || Math.floor(Date.now() / 1000),
        action,
      }
    );

    console.log(`Usage record created: ${usageRecord.id}`);

    return res.status(200).json({
      success: true,
      usageRecord: {
        id: usageRecord.id,
        quantity: usageRecord.quantity,
        timestamp: usageRecord.timestamp,
      },
    });
  } catch (error) {
    console.error('Usage reporting error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    if (error instanceof Error) {
      return res.status(500).json({
        error: 'Failed to report usage',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}

// TODO: Implement scheduled job to report storage usage daily/weekly
// Example: Vercel Cron or separate worker that:
// 1. Queries current storage per org from Supabase
// 2. Compares to entitlement limits
// 3. Reports overage usage via this endpoint

