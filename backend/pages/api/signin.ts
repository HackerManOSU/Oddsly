// pages/api/signin.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { runCorsMiddleware } from './corsMiddleware';
import { getAuth } from './firebaseAdmin';

export default async function signin(req: NextApiRequest, res: NextApiResponse) {
  // Run the CORS middleware
  await runCorsMiddleware(req, res);

  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { email, password } = req.body;

  try {
    const apiKey = process.env.FIREBASE_API_KEY;

    if (!apiKey) {
      throw new Error('Missing FIREBASE_API_KEY environment variable.');
    }

    // Sign in the user
    const signInResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );

    const signInData = await signInResponse.json();

    if (!signInResponse.ok) {
      throw new Error(signInData.error.message);
    }

    // Check email verification status
    const lookupResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: signInData.idToken }),
      }
    );

    const lookupData = await lookupResponse.json();

    if (!lookupResponse.ok) {
      throw new Error(lookupData.error.message);
    }

    const user = lookupData.users[0];
    if (!user.emailVerified) {
      throw new Error('Please verify your email before logging in.');
    }

    // Create a session cookie
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await getAuth().createSessionCookie(signInData.idToken, { expiresIn });

    // Set the session cookie with conditional attributes
    const cookieOptions = [
      `session=${sessionCookie}`,
      `Max-Age=${expiresIn / 1000}`,
      'Path=/',
      'HttpOnly',
      'SameSite=None',
      'Secure',
    ];

    res.setHeader('Set-Cookie', cookieOptions.join('; '));
    res.status(200).json({ message: 'Signed in successfully' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    res.status(401).json({ error: errorMessage });
  }
}
