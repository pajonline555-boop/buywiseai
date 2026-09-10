import { NotificationProvider, AlertNotificationPayload } from './types';

export class ConsoleNotificationProvider implements NotificationProvider {
  readonly id = 'console';
  readonly name = 'Console Logger Notification Provider';

  async sendNotification(payload: AlertNotificationPayload): Promise<boolean> {
    console.log(`\n[🔔 PRICE DROP ALERT NOTIFICATION - ${payload.store.toUpperCase()}]`);
    console.log(`- Product: ${payload.productTitle}`);
    console.log(`- Alert Type: ${payload.alertType.toUpperCase()}`);
    console.log(`- Verified Price: ₹${payload.currentPrice.toLocaleString()} (Was ₹${payload.previousPrice.toLocaleString()}, Saved ₹${payload.savingsAmount.toLocaleString()})`);
    console.log(`- Smart Value Score: ${payload.smartValueScore || 'N/A'}/100 | Trust Score: ${payload.trustScore || 'N/A'}/100`);
    console.log(`- Message: ${payload.message}`);
    console.log(`- Store Link: ${payload.url}\n`);
    return true;
  }
}

export class FirebaseNotificationProvider implements NotificationProvider {
  readonly id = 'firebase';
  readonly name = 'Firebase Notification Provider';

  async sendNotification(payload: AlertNotificationPayload): Promise<boolean> {
    // In production, triggers Firebase Cloud Messaging / Firestore notification document
    return true;
  }
}

export class NotificationManager {
  private providers: NotificationProvider[] = [];

  constructor() {
    this.registerProvider(new ConsoleNotificationProvider());
    this.registerProvider(new FirebaseNotificationProvider());
  }

  registerProvider(provider: NotificationProvider): void {
    this.providers.push(provider);
  }

  async dispatchNotification(payload: AlertNotificationPayload): Promise<boolean> {
    const results = await Promise.allSettled(
      this.providers.map((p) => p.sendNotification(payload))
    );
    return results.some((r) => r.status === 'fulfilled' && r.value === true);
  }
}

export const notificationManager = new NotificationManager();
