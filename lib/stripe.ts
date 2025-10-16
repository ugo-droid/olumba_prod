// =============================
// Stripe Client Configuration
// =============================
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required but not set in environment variables');
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('STRIPE_WEBHOOK_SECRET is required but not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  typescript: true,
});

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Price IDs - Replace these with your actual Stripe Price IDs
export const PRICE_IDS = {
  STARTER_MONTHLY: process.env.PRICE_STARTER_MONTHLY || 'price_starter_monthly_XXXX',
  STARTER_ANNUAL: process.env.PRICE_STARTER_ANNUAL || 'price_starter_annual_XXXX',
  PRO_MONTHLY: process.env.PRICE_PRO_MONTHLY || 'price_pro_monthly_XXXX',
  PRO_ANNUAL: process.env.PRICE_PRO_ANNUAL || 'price_pro_annual_XXXX',
  STUDIO_MONTHLY: process.env.PRICE_STUDIO_MONTHLY || 'price_studio_monthly_XXXX',
  STUDIO_ANNUAL: process.env.PRICE_STUDIO_ANNUAL || 'price_studio_annual_XXXX',
  CITY_INTEGRATIONS: process.env.PRICE_CITY_INTEGRATIONS || 'price_city_integration_XXXX',
  EXTRA_STORAGE_BLOCK: process.env.PRICE_EXTRA_STORAGE_BLOCK || 'price_extra_storage_block_XXXX',
} as const;

export type PriceId = typeof PRICE_IDS[keyof typeof PRICE_IDS];

