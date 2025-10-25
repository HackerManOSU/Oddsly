// Backend/middleware/requireSubscription.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { verifySubscriptionAccess } from '../utils/subscriptionUtils';
import { getAuth } from '../pages/api/firebaseAdmin';

export async function requireSubscription(
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void
) {
  try {
    const sessionCookie = req.cookies.session;
    if (!sessionCookie) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decodedClaims = await getAuth().verifySessionCookie(sessionCookie);
    const hasAccess = await verifySubscriptionAccess(decodedClaims.uid);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Subscription required' });
    }

    next();
  } catch (error) {
    console.error('Subscription check failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}