// pages/api/signup.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { runCorsMiddleware } from './corsMiddleware';
import { db } from './firebaseAdmin';

export default async function signup(req: NextApiRequest, res: NextApiResponse) {
  // Run the CORS middleware
  await runCorsMiddleware(req, res);

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests are allowed' });
  }

  const { email, password, fullName, dateOfBirth } = req.body;

  try {
    const apiKey = process.env.FIREBASE_API_KEY;

    if (!apiKey) {
      throw new Error('Missing FIREBASE_API_KEY environment variable.');
    }

    // Sign up the user
    const signUpResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      }
    );

    const signUpData = await signUpResponse.json();

    if (!signUpResponse.ok) {
      throw new Error(signUpData.error.message);
    }

    // Send email verification
    const sendOobCodeResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: 'VERIFY_EMAIL',
          idToken: signUpData.idToken,
        }),
      }
    );

    const sendOobCodeData = await sendOobCodeResponse.json();

    if (!sendOobCodeResponse.ok) {
      throw new Error(sendOobCodeData.error.message);
    }

    const uid = signUpData.localId;
    await db.collection('users').doc(uid).set({
      fullName,
      dateOfBirth,
      emailVerified: false,
    });

    res.status(200).json({
      message: 'User created, verification email sent.',
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'An error occurred';
    res.status(500).json({ error: errorMessage });
  }
}
