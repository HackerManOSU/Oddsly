// Backend/pages/api/stripe/portal.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { runCorsMiddleware } from '../corsMiddleware';
import { stripe } from './config';
import { getAuth } from '../firebaseAdmin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runCorsMiddleware(req, res);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sessionCookie = req.cookies.session;
    if (!sessionCookie) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decodedClaims = await getAuth().verifySessionCookie(sessionCookie);
    
    // Get customer
    const customers = await stripe.customers.list({
      email: decodedClaims.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: `${process.env.FRONTEND_URL}/profile`,
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}