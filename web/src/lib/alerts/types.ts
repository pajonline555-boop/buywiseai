export type AlertType = 'target_price' | 'percentage_drop' | 'historical_low';

export interface PriceAlertSubscription {
  id: string;
  userId: string;
  userEmail?: string;
  productId: string;
  productTitle: string;
  retailerId?: string;
  targetPrice?: number;
  targetDiscountPercent?: number; // e.g. 10 for 10%
  notifyOnHistoricalLow?: boolean;
  initialPrice: number;
  lastNotifiedPrice?: number;
  lastNotifiedAt?: string;
  cooldownMinutes: number; // default 1440 (24 hrs)
  active: boolean;
  createdAt: string;
}

export interface AlertNotificationPayload {
  subscriptionId: string;
  userId: string;
  userEmail?: string;
  productTitle: string;
  store: string;
  alertType: AlertType;
  currentPrice: number;
  previousPrice: number;
  savingsAmount: number;
  targetPrice?: number;
  smartValueScore?: number;
  trustScore?: number;
  url: string;
  sourceType?: string;
  verificationStatus?: string;
  timestamp: string;
  message: string;
}

export interface AlertTriggerResult {
  triggered: boolean;
  alertType?: AlertType;
  message?: string;
  currentPrice: number;
  targetPrice?: number;
  savingsAmount?: number;
  suppressedByCooldown?: boolean;
  suppressedByMockData?: boolean;
}

export interface NotificationDispatchResult {
  success: boolean;
  error?: string;
  providerId: string;
  timestamp: string;
}

export interface NotificationProvider {
  id: string;
  name: string;
  sendNotification(payload: AlertNotificationPayload): Promise<NotificationDispatchResult | boolean>;
}
