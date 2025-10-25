// pages/api/forgotPassword.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { runCorsMiddleware } from './corsMiddleware';

export default async function forgotPassword(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Run the CORS middleware
  await runCorsMiddleware(req, res);

  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { email } = req.body;

  try {
    const apiKey = process.env.FIREBASE_API_KEY;

    if (!apiKey) {
      throw new Error('Missing FIREBASE_API_KEY environment variable.');
    }

    // Send password reset email
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: 'PASSWORD_RESET',
          email: email,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error.message);
    }

    res.status(200).json({ message: 'Password reset email sent.' });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'An error occurred';
    res.status(500).json({ error: errorMessage });
  }
}
