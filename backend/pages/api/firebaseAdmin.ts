// pages/api/firebaseAdmin.ts

import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const base64ServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 || '';
    const serviceAccount = JSON.parse(
      Buffer.from(base64ServiceAccount, 'base64').toString('utf-8')
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    throw new Error('Could not initialize Firebase Admin SDK');
  }
}

export const getAuth = () => admin.auth();
export const db = admin.firestore();
