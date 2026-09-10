import { StoreOffer } from '../retailers/types';
import { PriceTrendSummary } from '../history/types';
import { PriceAlertSubscription, AlertTriggerResult, AlertType, AlertNotificationPayload } from './types';
import { notificationManager } from './notification-provider';
import { updateSubscriptionNotificationState } from './store';

export async function evaluatePriceAlert(
  subscription: PriceAlertSubscription,
  verifiedOffer: StoreOffer,
  priceTrend?: PriceTrendSummary
): Promise<AlertTriggerResult> {
  // 1. STRICT SAFEGUARD: ZERO MOCK / UNVERIFIED TRIGGERING
  if (verifiedOffer.sourceType === 'mock' || verifiedOffer.verificationStatus === 'unverified') {
    return {
      triggered: false,
      currentPrice: verifiedOffer.price,
      suppressedByMockData: true,
      message: 'Alert suppressed: Mock/unverified retailer prices cannot trigger price alerts.',
    };
  }

  // 2. STRICT SAFEGUARD: COOLDOWN & DUPLICATE ALERT SUPPRESSION
  if (subscription.lastNotifiedAt && subscription.lastNotifiedPrice !== undefined) {
    const lastTime = new Date(subscription.lastNotifiedAt).getTime();
    const cooldownMs = (subscription.cooldownMinutes || 1440) * 60 * 1000;
    const isWithinCooldown = Date.now() - lastTime < cooldownMs;

    if (isWithinCooldown && verifiedOffer.price >= subscription.lastNotifiedPrice) {
      return {
        triggered: false,
        currentPrice: verifiedOffer.price,
        suppressedByCooldown: true,
        message: 'Alert suppressed: 24-hour notification cooldown active for unchanged price.',
      };
    }
  }

  // 3. ALERT CONDITION EVALUATION
  let triggered = false;
  let alertType: AlertType | undefined;
  let message = '';

  const dropAmount = subscription.initialPrice - verifiedOffer.price;
  const dropPercent = subscription.initialPrice > 0 ? Math.round((dropAmount / subscription.initialPrice) * 100) : 0;

  if (subscription.targetPrice && verifiedOffer.price <= subscription.targetPrice) {
    triggered = true;
    alertType = 'target_price';
    message = `Target Price Reached! ${verifiedOffer.store} verified price ₹${verifiedOffer.price.toLocaleString()} meets your target of ₹${subscription.targetPrice.toLocaleString()}.`;
  } else if (dropPercent >= (subscription.targetDiscountPercent || 10)) {
    triggered = true;
    alertType = 'percentage_drop';
    message = `Significant Price Drop! ${verifiedOffer.store} price dropped ${dropPercent}% (Saved ₹${dropAmount.toLocaleString()}).`;
  } else if (subscription.notifyOnHistoricalLow && priceTrend?.isHistoricalLow) {
    triggered = true;
    alertType = 'historical_low';
    message = `Historical Low Alert! ${verifiedOffer.store} price ₹${verifiedOffer.price.toLocaleString()} is the lowest recorded price for this product.`;
  }

  if (triggered && alertType) {
    const payload: AlertNotificationPayload = {
      subscriptionId: subscription.id,
      userId: subscription.userId,
      userEmail: subscription.userEmail,
      productTitle: subscription.productTitle,
      store: verifiedOffer.store,
      alertType,
      currentPrice: verifiedOffer.price,
      previousPrice: subscription.initialPrice,
      savingsAmount: Math.max(0, dropAmount),
      smartValueScore: verifiedOffer.smartValueScore,
      trustScore: verifiedOffer.trustScore,
      url: verifiedOffer.url,
      timestamp: new Date().toISOString(),
      message,
    };

    // Dispatch notification via NotificationProvider abstraction
    await notificationManager.dispatchNotification(payload);

    // Update notification state in store
    updateSubscriptionNotificationState(subscription.id, verifiedOffer.price);

    return {
      triggered: true,
      alertType,
      message,
      currentPrice: verifiedOffer.price,
      targetPrice: subscription.targetPrice,
      savingsAmount: Math.max(0, dropAmount),
    };
  }

  return {
    triggered: false,
    currentPrice: verifiedOffer.price,
    message: 'No price alert conditions met.',
  };
}
