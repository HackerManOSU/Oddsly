// pages/api/signout.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { runCorsMiddleware } from './corsMiddleware';
import { getAuth } from './firebaseAdmin';

export default async function signout(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Run the CORS middleware
  await runCorsMiddleware(req, res);

  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  try {
    const sessionCookie = req.cookies.session || '';

    // Revoke the session
    const decodedClaims = await getAuth().verifySessionCookie(sessionCookie);
    await getAuth().revokeRefreshTokens(decodedClaims.sub);

    // Clear the session cookie with conditional attributes
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = ['session=', 'Max-Age=0', 'Path=/', 'HttpOnly'];

    if (isProduction) {
      cookieOptions.push('SameSite=None', 'Secure');
    } else {
      cookieOptions.push('SameSite=Lax');
    }

    res.setHeader('Set-Cookie', cookieOptions.join('; '));
    res.status(200).json({ message: 'Signed out successfully' });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'An error occurred';
    res.status(500).json({ error: errorMessage });
  }
}
