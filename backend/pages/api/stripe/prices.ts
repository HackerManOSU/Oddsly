// Backend/pages/api/stripe/prices.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { runCorsMiddleware } from '../corsMiddleware';
import { stripe } from './config';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runCorsMiddleware(req, res);

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const prices = await stripe.prices.list({
      active: true,
      type: 'recurring',
      expand: ['data.product'],
    });

    res.status(200).json(prices.data);
  } catch (error) {
    console.error('Error fetching prices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}