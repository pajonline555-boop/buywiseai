import { ComparisonResponse, StoreOffer, RetailerSearchResult, GroupedOffers, ProviderStatusInfo, TierSummary } from '../retailers/types';
import { retailerRegistry } from '../retailers/registry';
import { getRetailerCapabilities } from '../retailers/capabilities';
import { isValidOffer } from './validation';
import { normalizeOffer } from './normalize';
import { validateSearchResultOffer } from '../search/SearchResultValidator';
import { CanonicalProduct } from '../query/types';
import { selectRetailerQuery } from './planner';
import { classifyProductMatch, isSameProductAndVariant } from './matcher';
import { normalizeTextQueryToCanonical } from '../query/normalize';
import { calculateSmartValueScore } from '../score/engine';
import { calculateTrustScore } from '../trust/engine';
import { recordPriceHistory, getPriceHistory } from '../history/store';
import { analyzePriceTrend } from '../history/engine';
import { auditAndIsolateDuplicateImages } from './imageAuditor';

export async function executeComparison(
  query: string,
  timeoutMs: number = 8000
): Promise<ComparisonResponse> {
  const canonical = normalizeTextQueryToCanonical(query);
  return executeCanonicalComparison(canonical, 'exact', timeoutMs);
}

export async function executeCanonicalComparison(
  canonical: CanonicalProduct,
  searchMode: 'exact' | 'similar' = 'exact',
  timeoutMs: number = 8000
): Promise<ComparisonResponse> {
  const timestamp = new Date().toISOString();
  const adapters = retailerRegistry.getEnabledAdapters();
  const capabilities = getRetailerCapabilities();

  const providerStatuses: ProviderStatusInfo[] = adapters.map((adapter) => {
    const cap = capabilities.find((c) => c.id.toLowerCase() === adapter.id.toLowerCase());
    let status: ProviderStatusInfo['status'] = 'LIVE';
    let message: string | undefined;

    if (adapter.id === 'buywise_partners' || adapter.id === 'partner') {
      status = 'PARTNER_LIVE';
      message = 'BuyWise Verified Partner Network Live';
    } else if (cap?.connectionStatus === 'CREDENTIALS_REQUIRED') {
      status = 'CREDENTIALS_REQUIRED';
      message = `${adapter.name} API credentials required.`;
    } else if (cap?.connectionStatus === 'API_UNAVAILABLE') {
      status = 'API_UNAVAILABLE';
      message = `${adapter.name} does not provide an authorized public search API.`;
    }

    return {
      retailerId: adapter.id,
      retailerName: adapter.name,
      status,
      message,
    };
  });

  const searchPromises = adapters.map((adapter) => {
    const retailerQuery = selectRetailerQuery(canonical, adapter.id, searchMode);
    const timeoutPromise = new Promise<RetailerSearchResult>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout exceeding ${timeoutMs}ms for ${adapter.name}`)), timeoutMs)
    );

    return Promise.race([adapter.search(retailerQuery), timeoutPromise]);
  });

  const settledResults = await Promise.allSettled(searchPromises);

  const rawOffers: StoreOffer[] = [];
  const errors: Array<{ retailer: string; error: string }> = [];
  let successfulStores = 0;

  settledResults.forEach((result, idx) => {
    const adapter = adapters[idx];
    const adapterName = adapter.name;

    if (result.status === 'fulfilled') {
      const searchRes = result.value;
      if (searchRes.success && searchRes.offers.length > 0) {
        successfulStores++;
        // Update provider status to LIVE
        const pStatus = providerStatuses.find((p) => p.retailerId === adapter.id);
        if (pStatus && pStatus.status !== 'PARTNER_LIVE') {
          pStatus.status = 'LIVE';
          pStatus.message = undefined;
        }

        searchRes.offers.forEach((rawOffer) => {
          if (isValidOffer(rawOffer)) {
            const normalized = normalizeOffer(rawOffer);
            const validation = validateSearchResultOffer(normalized);
            if (!validation.isValid) {
              console.warn(`[SearchResultValidator] Rejected offer from ${adapterName}: ${validation.rejectionReasons.join(', ')}`);
              return;
            }

            const classification = classifyProductMatch(normalized, canonical);
            normalized.matchType = classification.matchType;
            normalized.matchConfidence = classification.matchConfidence;
            normalized.identityConfidence = classification.identityConfidence;
            normalized.attributeMatchScore = classification.attributeMatchScore;
            normalized.visualSimilarityScore = classification.visualSimilarityScore;
            normalized.tier = classification.tier;

            rawOffers.push(normalized);
            recordPriceHistory(normalized, canonical.id);
          }
        });
      } else if (searchRes.error) {
        errors.push({ retailer: adapterName, error: searchRes.error });
        const pStatus = providerStatuses.find((p) => p.retailerId === adapter.id);
        if (pStatus) {
          if (searchRes.error.includes('CREDENTIALS_REQUIRED') || searchRes.error.includes('credentials required')) {
            pStatus.status = 'CREDENTIALS_REQUIRED';
            pStatus.message = searchRes.error;
          } else if (searchRes.error.includes('API_UNAVAILABLE') || searchRes.error.includes('does not offer')) {
            pStatus.status = 'API_UNAVAILABLE';
            pStatus.message = searchRes.error;
          }
        }
      }
    } else {
      errors.push({ retailer: adapterName, error: result.reason?.message || 'Execution error' });
      const pStatus = providerStatuses.find((p) => p.retailerId === adapter.id);
      if (pStatus) {
        pStatus.status = 'FAILED';
        pStatus.message = result.reason?.message || 'Request timed out or connection failed.';
      }
    }
  });

  // --- PHASE 4: AUDIT & PERMANENTLY PREVENT DUPLICATE PRODUCT IMAGES ---
  const { sanitizedOffers, report: imgReport } = auditAndIsolateDuplicateImages(rawOffers);
  if (imgReport.duplicateImageCount > 0) {
    console.warn(`[ImageAuditor] Isolated ${imgReport.duplicateImageCount} duplicate images across distinct products.`);
  }

  const allOffers = sanitizedOffers;

  // Calculate Smart Value Score & Independent Shopping Trust Score
  allOffers.forEach((offer) => {
    const valueResult = calculateSmartValueScore(offer, allOffers);
    offer.smartValueScore = valueResult.totalScore;
    offer.scoreBreakdown = valueResult.breakdown;

    const trustResult = calculateTrustScore(offer);
    offer.trustScore = trustResult.trustScore;
    offer.trustBreakdown = trustResult.breakdown;
    offer.trustLevel = trustResult.trustLevel;
  });

  // Determine Best Value & Best Match
  let maxScore = -1;
  let maxMatch = -1;
  allOffers.forEach((o) => {
    if ((o.smartValueScore || 0) > maxScore) maxScore = o.smartValueScore || 0;
    if ((o.matchConfidence || 0) > maxMatch) maxMatch = o.matchConfidence || 0;
  });

  allOffers.forEach((o) => {
    if (o.smartValueScore === maxScore && maxScore > 0) o.isBestValue = true;
    if (o.matchConfidence === maxMatch && maxMatch > 0) o.isBestMatch = true;
  });

  // --- PHASE 5: TRUE LOWEST PRICE COMPARISON ---
  // Sort offers by effective payable price ascending (apples-to-apples price basis)
  allOffers.sort((a, b) => (a.effectivePayablePrice || a.price) - (b.effectivePayablePrice || b.price));

  // Tag Lowest Price accurately:
  // An offer is ONLY "Lowest Price" among listings that represent the SAME product/variant!
  if (allOffers.length > 0) {
    const groupedByProduct = new Map<string, StoreOffer[]>();
    allOffers.forEach((offer) => {
      const key = `${offer.brand || 'gen'}_${offer.model || offer.title.slice(0, 20)}`.toUpperCase();
      const existing = groupedByProduct.get(key) || [];
      existing.push(offer);
      groupedByProduct.set(key, existing);
    });

    groupedByProduct.forEach((productOffers) => {
      const minPrice = Math.min(...productOffers.map((o) => o.effectivePayablePrice || o.price));
      productOffers.forEach((o) => {
        if ((o.effectivePayablePrice || o.price) === minPrice) {
          o.isLowest = true;
        }
      });
    });
  }

  let lowestPrice = 0;
  let highestPrice = 0;
  let maximumSavings = 0;

  if (allOffers.length > 0) {
    lowestPrice = allOffers[0].effectivePayablePrice || allOffers[0].price;
    highestPrice = allOffers[allOffers.length - 1].effectivePayablePrice || allOffers[allOffers.length - 1].price;
    maximumSavings = Math.max(0, highestPrice - lowestPrice);
  }

  // Analyze Price History Trends
  const historyEntries = getPriceHistory(canonical.id);
  const priceTrend = analyzePriceTrend(historyEntries, lowestPrice);

  // Group into match categories AND customer-facing categories (PREMIUM and LUXURY)
  const premiumOffers = allOffers.filter((o) => o.tier === 'PREMIUM');
  const luxuryOffers = allOffers.filter((o) => o.tier === 'LUXURY');

  const groupedOffers: GroupedOffers = {
    exact: allOffers.filter((o) => o.matchType === 'exact'),
    variant: allOffers.filter((o) => o.matchType === 'variant'),
    similar: allOffers.filter((o) => o.matchType === 'similar'),
    premium: premiumOffers,
    luxury: luxuryOffers,
  };

  const tierSummary: TierSummary = {
    premiumCount: premiumOffers.length,
    luxuryCount: luxuryOffers.length,
    lowestPremiumPrice: premiumOffers.length > 0 ? Math.min(...premiumOffers.map((o) => o.effectivePayablePrice || o.price)) : 0,
    lowestLuxuryPrice: luxuryOffers.length > 0 ? Math.min(...luxuryOffers.map((o) => o.effectivePayablePrice || o.price)) : 0,
  };

  const summary = {
    totalStoresChecked: adapters.length,
    successfulStores,
    lowestPrice,
    highestPrice,
    maximumSavings,
    currency: 'INR',
    tierSummary,
  };

  const recommendation = generateRecommendation(allOffers, maximumSavings, tierSummary);

  return {
    product: canonical.title || canonical.rawInput,
    query: canonical.rawInput,
    timestamp,
    stores: allOffers,
    groupedOffers,
    summary,
    recommendation,
    priceTrend,
    errors,
    providerStatuses,
  };
}

function generateRecommendation(
  offers: StoreOffer[],
  savings: number,
  tierSummary: TierSummary
): string {
  if (offers.length === 0) {
    return 'No verified live retailer listings were found for this query. Check retailer API credentials.';
  }

  const bestValueOffer = offers.find((o) => o.isBestValue) || offers[0];
  const lowestOffer = offers.find((o) => o.isLowest) || offers[0];

  let text = `BuyWise AI identifies ${bestValueOffer.store} as the Best Value deal at ₹${bestValueOffer.price.toLocaleString()} with a Smart Value Score of ${bestValueOffer.smartValueScore || 85}/100.`;

  if (tierSummary.premiumCount > 0 && tierSummary.luxuryCount > 0) {
    text += ` Available in Premium (Value) from ₹${tierSummary.lowestPremiumPrice.toLocaleString()} and Luxury (Branded) from ₹${tierSummary.lowestLuxuryPrice.toLocaleString()}.`;
  } else if (savings > 0) {
    text += ` Lowest verified price found at ₹${lowestOffer.price.toLocaleString()} on ${lowestOffer.store}, offering savings of ₹${savings.toLocaleString()}.`;
  }

  return text;
}
