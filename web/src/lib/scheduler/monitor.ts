import { MonitoringCycleResult, MonitoringOptions, ProductBatchGroup } from './types';
import { getAlertSubscriptions } from '../alerts/store';
import { normalizeTextQueryToCanonical } from '../query/normalize';
import { executeCanonicalComparison } from '../comparison/compare';
import { saveVerifiedPriceHistory } from '../db/firestore-service';
import { analyzePriceTrend } from '../history/engine';
import { getPriceHistory } from '../history/store';
import { evaluatePriceAlert } from '../alerts/engine';
import { retailerRegistry } from '../retailers/registry';

export async function runPriceMonitoringCycle(
  options: MonitoringOptions = {}
): Promise<MonitoringCycleResult> {
  const startedAt = new Date().toISOString();
  const timeoutMs = options.timeoutMs || 8000;
  const errors: Array<{ retailer?: string; productId?: string; error: string }> = [];

  let alertsEvaluated = 0;
  let uniqueProductsChecked = 0;
  let successfulChecks = 0;
  let failedChecks = 0;
  let pricesRecorded = 0;
  let notificationsTriggered = 0;
  let notificationsSuppressed = 0;

  try {
    // 1. Fetch active alert subscriptions
    const allActiveSubscriptions = getAlertSubscriptions();

    // 2. SKU Deduplication & Batch Grouping
    const batchMap = new Map<string, ProductBatchGroup>();

    allActiveSubscriptions.forEach((sub) => {
      const skuKey = sub.productId.toLowerCase().trim();
      if (options.specificProductId && skuKey !== options.specificProductId.toLowerCase().trim()) {
        return;
      }

      if (!batchMap.has(skuKey)) {
        batchMap.set(skuKey, {
          productId: skuKey,
          productTitle: sub.productTitle,
          subscriptions: [],
        });
      }
      batchMap.get(skuKey)!.subscriptions.push(sub);
    });

    const batchGroups = Array.from(batchMap.values());
    uniqueProductsChecked = batchGroups.length;

    // 3. Process each SKU batch group
    for (const group of batchGroups) {
      alertsEvaluated += group.subscriptions.length;
      const canonical = normalizeTextQueryToCanonical(group.productTitle);

      try {
        const compResult = await executeCanonicalComparison(canonical, 'exact', timeoutMs);

        if (compResult.errors && compResult.errors.length > 0) {
          compResult.errors.forEach((err) => {
            errors.push({ retailer: err.retailer, productId: group.productId, error: err.error });
            failedChecks++;
          });
        }

        // Filter for verified non-mock store offers
        const verifiedLiveOffers = compResult.stores.filter(
          (o) => o.sourceType !== 'mock' && o.verificationStatus !== 'unverified'
        );

        if (verifiedLiveOffers.length > 0) {
          successfulChecks++;

          for (const verifiedOffer of verifiedLiveOffers) {
            // Save to Firestore price_history
            const saved = await saveVerifiedPriceHistory({
              id: `hist-${Date.now()}`,
              productId: group.productId,
              retailerId: verifiedOffer.retailerId,
              store: verifiedOffer.store,
              price: verifiedOffer.price,
              mrp: verifiedOffer.mrp,
              currency: verifiedOffer.currency,
              timestamp: verifiedOffer.checkedAt,
              verificationStatus: verifiedOffer.verificationStatus || 'verified_live',
              dataSource: verifiedOffer.sourceType,
            });

            if (saved) pricesRecorded++;

            // Price history trend calculation
            const history = getPriceHistory(group.productId);
            const priceTrend = analyzePriceTrend(history, verifiedOffer.price);

            // Evaluate alerts for matching subscriptions
            for (const sub of group.subscriptions) {
              const evalRes = await evaluatePriceAlert(sub, verifiedOffer, priceTrend);

              if (evalRes.triggered) {
                notificationsTriggered++;
              } else if (evalRes.suppressedByCooldown || evalRes.suppressedByMockData) {
                notificationsSuppressed++;
              }
            }
          }
        }
      } catch (groupErr: any) {
        failedChecks++;
        errors.push({
          productId: group.productId,
          error: groupErr?.message || 'Failed processing SKU batch',
        });
      }
    }
  } catch (cycleErr: any) {
    errors.push({ error: cycleErr?.message || 'Monitoring cycle execution failed' });
  }

  const completedAt = new Date().toISOString();
  const enabledAdapters = retailerRegistry.getEnabledAdapters();
  const retailersQueried = enabledAdapters.length * uniqueProductsChecked;

  return {
    startedAt,
    completedAt,
    alertsEvaluated,
    uniqueProductsChecked,
    retailersQueried,
    successfulChecks,
    failedChecks,
    pricesRecorded,
    notificationsTriggered,
    notificationsSuppressed,
    errors,
  };
}
