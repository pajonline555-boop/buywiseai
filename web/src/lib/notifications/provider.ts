import { NotificationProvider, AlertNotificationPayload, NotificationDispatchResult } from '../alerts/types';
import { sendServerPushNotification } from './fcm-server';

export class ProductionNotificationProvider implements NotificationProvider {
  readonly id = 'fcm_web_push';
  readonly name = 'Firebase FCM & Web Push Production Provider';

  async sendNotification(payload: AlertNotificationPayload): Promise<NotificationDispatchResult> {
    // ZERO MOCK NOTIFICATION GUARD
    if (payload.sourceType === 'mock' || payload.verificationStatus === 'unverified') {
      return {
        success: false,
        error: 'Notification suppressed: Mock or unverified retailer data.',
        providerId: this.id,
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const deliveryRes = await sendServerPushNotification(payload);

      return {
        success: deliveryRes.delivered > 0 || deliveryRes.attempted === 0,
        error: deliveryRes.errors.length > 0 ? deliveryRes.errors.join('; ') : undefined,
        providerId: this.id,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Production notification dispatch failed',
        providerId: this.id,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

export const productionNotificationProvider = new ProductionNotificationProvider();
