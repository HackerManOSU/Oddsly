// Backend/config/stripe.ts
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing Stripe secret key');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

export const SUBSCRIPTION_TIERS = {
  BASIC: 'price_basic',
  PRO: 'price_pro',
  PREMIUM: 'price_premium',
} as const;