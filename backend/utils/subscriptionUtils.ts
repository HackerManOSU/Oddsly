// Backend/utils/subscriptionUtils.ts
import { stripe } from '../config/stripe';
import { db } from '../pages/api/firebaseAdmin';

export async function updateUserSubscriptionStatus(
  userId: string,
  status: string,
  customerId?: string,
  subscriptionId?: string
) {
  const updateData: Record<string, any> = {
    subscriptionStatus: status,
    updatedAt: new Date().toISOString(),
  };

  if (customerId) {
    updateData.stripeCustomerId = customerId;
  }

  if (subscriptionId) {
    updateData.subscriptionId = subscriptionId;
  }

  await db.collection('users').doc(userId).update(updateData);
}

export async function verifySubscriptionAccess(userId: string): Promise<boolean> {
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data();

  if (!userData?.stripeCustomerId) {
    return false;
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: userData.stripeCustomerId,
    status: 'active',
    limit: 1,
  });

  return subscriptions.data.length > 0;
}