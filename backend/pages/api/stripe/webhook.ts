// Backend/pages/api/stripe/webhook.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import { stripe } from './config';
import { db } from '../firebaseAdmin';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature']!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).end();
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const firebaseUID = session.metadata?.firebaseUID;

        if (firebaseUID) {
          await db.collection('users').doc(firebaseUID).update({
            stripeCustomerId: session.customer,
            subscriptionStatus: 'active',
            subscriptionId: session.subscription,
            subscriptionType: 'premium',
            updatedAt: new Date().toISOString(),
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const firebaseUID = subscription.metadata?.firebaseUID;

        if (firebaseUID) {
          await db.collection('users').doc(firebaseUID).update({
            subscriptionStatus: subscription.status,
            updatedAt: new Date().toISOString(),
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const firebaseUID = subscription.metadata?.firebaseUID;

        if (firebaseUID) {
          await db.collection('users').doc(firebaseUID).update({
            subscriptionStatus: 'cancelled',
            updatedAt: new Date().toISOString(),
          });
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).end();
  }
}