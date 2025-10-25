// pages/api/userProfile.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { runCorsMiddleware } from './corsMiddleware';
import { getAuth, db } from './firebaseAdmin';

export default async function userProfile(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Run the CORS middleware
  await runCorsMiddleware(req, res);

  try {
    const sessionCookie = req.cookies.session || '';
    const decodedClaims = await getAuth().verifySessionCookie(
      sessionCookie,
      true
    );
    const uid = decodedClaims.uid;

    if (req.method === 'GET') {
      // Fetch user profile
      const doc = await db.collection('users').doc(uid).get();
      if (!doc.exists) {
        throw new Error('User profile not found.');
      }
      res.status(200).json({ profile: doc.data() });
    } else if (req.method === 'PUT') {
      // Update user profile
      const { fullName, dateOfBirth } = req.body;
      await db.collection('users').doc(uid).update({
        fullName,
        dateOfBirth,
      });
      res.status(200).json({ message: 'Profile updated successfully.' });
    } else {
      res.status(405).json({ error: 'Method not allowed.' });
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'An error occurred';
    res.status(401).json({ error: errorMessage });
  }
}
