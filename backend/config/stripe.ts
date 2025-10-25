import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia', // Update to latest stable version
});

export const SUBSCRIPTION_TIERS = {
  BASIC: process.env.STRIPE_PRICE_BASIC || 'price_basic',
  PRO: process.env.STRIPE_PRICE_PRO || 'price_pro',
  PREMIUM: process.env.STRIPE_PRICE_PREMIUM || 'price_premium',
} as const;