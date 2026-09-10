import { PriceAlertSubscription } from '../alerts/types';

export interface ProductBatchGroup {
  productId: string;
  productTitle: string;
  subscriptions: PriceAlertSubscription[];
}

export interface MonitoringCycleResult {
  startedAt: string;
  completedAt: string;
  alertsEvaluated: number;
  uniqueProductsChecked: number;
  retailersQueried: number;
  successfulChecks: number;
  failedChecks: number;
  pricesRecorded: number;
  notificationsTriggered: number;
  notificationsSuppressed: number;
  errors: Array<{ retailer?: string; productId?: string; error: string }>;
}

export interface MonitoringOptions {
  maxConcurrency?: number;
  timeoutMs?: number;
  specificProductId?: string;
  forceAll?: boolean;
}
