// =============================
// Stripe Customer Portal API
// =============================
import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { stripe } from '../lib/stripe';

// Validation schema
const PortalSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  returnUrl: z.string().url('Valid return URL is required'),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate request body
    const body = PortalSchema.parse(req.body);
    const { customerId, returnUrl } = body;

    console.log(`Creating portal session for customer ${customerId}`);

    // Create Customer Portal Session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    console.log(`Portal session created: ${session.id}`);

    return res.status(200).json({
      url: session.url,
    });
  } catch (error) {
    console.error('Portal session error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    if (error instanceof Error) {
      return res.status(500).json({
        error: 'Failed to create portal session',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}

