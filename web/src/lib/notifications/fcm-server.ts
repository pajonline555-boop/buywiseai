import { AlertNotificationPayload } from '../alerts/types';
import { getUserNotificationTokens, deactivateNotificationToken } from './token-store';
import { NotificationDeliveryResult } from './types';

export async function sendServerPushNotification(
  payload: AlertNotificationPayload
): Promise<NotificationDeliveryResult> {
  const result: NotificationDeliveryResult = {
    attempted: 0,
    delivered: 0,
    failed: 0,
    invalidTokensRemoved: 0,
    skippedNoRegistration: 0,
    errors: [],
  };

  // ZERO MOCK NOTIFICATION GUARD: Mock offers MUST NOT dispatch push notifications
  if (payload.sourceType === 'mock' || payload.verificationStatus === 'unverified') {
    result.skippedNoRegistration++;
    result.errors.push('Notification suppressed: Offer is mock or unverified.');
    return result;
  }

  try {
    const activeTokens = await getUserNotificationTokens(payload.userId);

    if (!activeTokens || activeTokens.length === 0) {
      result.skippedNoRegistration++;
      return result;
    }

    for (const tokDoc of activeTokens) {
      result.attempted++;

      try {
        // Simulate FCM Server SDK Dispatch
        console.log(`[📱 SERVER FCM PUSH] Sending Push to User=${payload.userId}, Token=${tokDoc.tokenOrEndpoint.substring(0, 15)}...`);
        console.log(`- Title: 🔔 Price Drop Alert: ${payload.productTitle}`);
        console.log(`- Body: Now ₹${payload.currentPrice.toLocaleString()} (Target: ₹${payload.targetPrice?.toLocaleString() || 'N/A'}) at ${payload.store}`);
        console.log(`- Smart Value: ${payload.smartValueScore || 'N/A'}/100 | Trust Score: ${payload.trustScore || 'N/A'}/100`);

        result.delivered++;
      } catch (tokErr: any) {
        result.failed++;
        result.errors.push(`Token dispatch error: ${tokErr?.message || 'FCM error'}`);

        // Invalid token cleanup
        if (tokErr?.message?.includes('invalid') || tokErr?.message?.includes('expired')) {
          await deactivateNotificationToken(tokDoc.id);
          result.invalidTokensRemoved++;
        }
      }
    }
  } catch (err: any) {
    result.errors.push(err?.message || 'Failed server push notification dispatch');
  }

  return result;
}
