// pages/api/user.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { runCorsMiddleware } from './corsMiddleware';
import { getAuth } from './firebaseAdmin';

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  // Run the CORS middleware
  await runCorsMiddleware(req, res);

  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  const sessionCookie = req.cookies.session;

  if (!sessionCookie) {
    return res.status(401).json({ error: 'Unauthorized: No session cookie' });
  }

  try {
    const decodedClaims = await getAuth().verifySessionCookie(sessionCookie, true);
    res.status(200).json({ user: decodedClaims });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    res.status(401).json({ error: errorMessage });
  }
}