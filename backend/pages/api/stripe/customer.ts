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
      return res.status(401).json({ error: 'No session cookie' });
    }

    const decodedClaims = await getAuth().verifySessionCookie(sessionCookie);
    
    // Check if customer exists
    const customers = await stripe.customers.list({
      email: decodedClaims.email,
      limit: 1,
    });

    let customer;
    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: decodedClaims.email,
        metadata: {
          firebaseUID: decodedClaims.uid,
        },
      });
    }

    res.status(200).json({ 
      customerId: customer.id,
      email: customer.email,
      created: customer.created
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
}