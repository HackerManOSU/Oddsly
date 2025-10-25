import type { NextApiRequest, NextApiResponse } from 'next';
import { runCorsMiddleware } from '../corsMiddleware';
import { stripe } from './config';
import { getAuth } from '../firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await runCorsMiddleware(req, res);

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { priceId } = req.body;
    if (!priceId) {
      return res.status(400).json({ error: 'Price ID is required' });
    }

    const sessionCookie = req.cookies.session;
    if (!sessionCookie) {
      return res.status(401).json({ error: 'Unauthorized - No session cookie' });
    }

    const decodedClaims = await getAuth().verifySessionCookie(sessionCookie);
    if (!decodedClaims) {
      return res.status(401).json({ error: 'Unauthorized - Invalid session' });
    }
    
    // Get or create customer
    const customers = await stripe.customers.list({
      email: decodedClaims.email,
      limit: 1,
    });

    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: decodedClaims.email,
        metadata: {
          firebaseUID: decodedClaims.uid,
        },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/failed`,
      metadata: {
        firebaseUID: decodedClaims.uid,
      },
    });

    return res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Checkout Error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}