// Backend/pages/api/stripe/subscription-status.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { runCorsMiddleware } from '../corsMiddleware';
import { stripe } from './config';
import { getAuth, db } from '../firebaseAdmin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runCorsMiddleware(req, res);

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionCookie = req.cookies.session;
    if (!sessionCookie) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decodedClaims = await getAuth().verifySessionCookie(sessionCookie);
    const userDoc = await db.collection('users').doc(decodedClaims.uid).get();
    const userData = userDoc.data();

    if (!userData?.stripeCustomerId) {
      return res.status(200).json({ status: 'no_subscription' });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: userData.stripeCustomerId,
      status: 'active',
      limit: 1,
    });

    res.status(200).json({
      status: subscriptions.data.length > 0 ? 'active' : 'inactive',
      subscription: subscriptions.data[0] || null,
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}