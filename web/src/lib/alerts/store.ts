import { PriceAlertSubscription } from './types';

const subscriptionsStore: Map<string, PriceAlertSubscription> = new Map();

export function createAlertSubscription(
  sub: Partial<PriceAlertSubscription> & { userId: string; productId: string; productTitle: string; initialPrice: number }
): PriceAlertSubscription {
  const id = sub.id || `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const subscription: PriceAlertSubscription = {
    id,
    userId: sub.userId,
    userEmail: sub.userEmail,
    productId: sub.productId.toLowerCase().trim(),
    productTitle: sub.productTitle,
    retailerId: sub.retailerId,
    targetPrice: sub.targetPrice,
    targetDiscountPercent: sub.targetDiscountPercent || 10,
    notifyOnHistoricalLow: typeof sub.notifyOnHistoricalLow === 'boolean' ? sub.notifyOnHistoricalLow : true,
    initialPrice: sub.initialPrice,
    lastNotifiedPrice: sub.lastNotifiedPrice,
    lastNotifiedAt: sub.lastNotifiedAt,
    cooldownMinutes: sub.cooldownMinutes || 1440, // 24 hours
    active: typeof sub.active === 'boolean' ? sub.active : true,
    createdAt: sub.createdAt || new Date().toISOString(),
  };

  subscriptionsStore.set(id, subscription);
  return subscription;
}

export function getAlertSubscriptions(userId?: string, productId?: string): PriceAlertSubscription[] {
  let list = Array.from(subscriptionsStore.values()).filter((s) => s.active);

  if (userId) {
    list = list.filter((s) => s.userId === userId);
  }

  if (productId) {
    const skuKey = productId.toLowerCase().trim();
    list = list.filter((s) => s.productId === skuKey);
  }

  return list;
}

export function updateSubscriptionNotificationState(id: string, notifiedPrice: number): void {
  const sub = subscriptionsStore.get(id);
  if (sub) {
    sub.lastNotifiedPrice = notifiedPrice;
    sub.lastNotifiedAt = new Date().toISOString();
    subscriptionsStore.set(id, sub);
  }
}

export function deleteAlertSubscription(id: string): boolean {
  return subscriptionsStore.delete(id);
}

export function clearAlertSubscriptionsStore(): void {
  subscriptionsStore.clear();
}
