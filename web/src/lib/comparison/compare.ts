import { ComparisonResponse, StoreOffer, RetailerSearchResult, GroupedOffers } from '../retailers/types';
import { retailerRegistry } from '../retailers/registry';
import { isValidOffer } from './validation';
import { normalizeOffer } from './normalize';
import { CanonicalProduct } from '../query/types';
import { selectRetailerQuery } from './planner';
import { classifyProductMatch } from './matcher';
import { normalizeTextQueryToCanonical } from '../query/normalize';
import { calculateSmartValueScore } from '../score/engine';
import { calculateTrustScore } from '../trust/engine';
import { recordPriceHistory, getPriceHistory } from '../history/store';
import { analyzePriceTrend } from '../history/engine';

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

  const searchPromises = adapters.map((adapter) => {
    // Query Planner selects 1 optimal query for this retailer
    const retailerQuery = selectRetailerQuery(canonical, adapter.id, searchMode);

    // Timeout wrapper for resilience against slow retailers
    const timeoutPromise = new Promise<RetailerSearchResult>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout exceeding ${timeoutMs}ms for ${adapter.name}`)), timeoutMs)
    );

    return Promise.race([adapter.search(retailerQuery), timeoutPromise]);
  });

  const settledResults = await Promise.allSettled(searchPromises);

  const allOffers: StoreOffer[] = [];
  const errors: Array<{ retailer: string; error: string }> = [];
  let successfulStores = 0;

  settledResults.forEach((result, idx) => {
    const adapterName = adapters[idx].name;

    if (result.status === 'fulfilled') {
      const searchRes = result.value;
      if (searchRes.success && searchRes.offers.length > 0) {
        successfulStores++;
        searchRes.offers.forEach((rawOffer) => {
          if (isValidOffer(rawOffer)) {
            const normalized = normalizeOffer(rawOffer);
            
            // Product Match Classification (Exact, Variant, Similar)
            const classification = classifyProductMatch(normalized, canonical);
            normalized.matchType = classification.matchType;
            normalized.matchConfidence = classification.matchConfidence;
            normalized.identityConfidence = classification.identityConfidence;
            normalized.attributeMatchScore = classification.attributeMatchScore;
            normalized.visualSimilarityScore = classification.visualSimilarityScore;

            allOffers.push(normalized);

            // Record into Price History store (safeguarded against mock data contamination)
            recordPriceHistory(normalized, canonical.id);
          }
        });
      } else if (searchRes.error) {
        errors.push({ retailer: adapterName, error: searchRes.error });
      }
    } else {
      errors.push({ retailer: adapterName, error: result.reason?.message || 'Execution error' });
    }
  });

  // Calculate 100-point Smart Value Score & Independent Shopping Trust Score for all offers
  allOffers.forEach((offer) => {
    const valueResult = calculateSmartValueScore(offer, allOffers);
    offer.smartValueScore = valueResult.totalScore;
    offer.scoreBreakdown = valueResult.breakdown;

    const trustResult = calculateTrustScore(offer);
    offer.trustScore = trustResult.trustScore;
    offer.trustBreakdown = trustResult.breakdown;
    offer.trustLevel = trustResult.trustLevel;
  });

  // Determine 3 Awards: Best Value (highest score), Best Match (highest match confidence), Lowest Price (lowest price)
  let maxScore = -1;
  let maxMatch = -1;

  allOffers.forEach((o) => {
    if ((o.smartValueScore || 0) > maxScore) maxScore = o.smartValueScore || 0;
    if ((o.matchConfidence || 0) > maxMatch) maxMatch = o.matchConfidence || 0;
  });

  // Tag 3 Awards
  allOffers.forEach((o) => {
    if (o.smartValueScore === maxScore && maxScore > 0) o.isBestValue = true;
    if (o.matchConfidence === maxMatch && maxMatch > 0) o.isBestMatch = true;
  });

  // Sort offers by price ascending
  allOffers.sort((a, b) => a.price - b.price);

  let lowestPrice = 0;
  let highestPrice = 0;
  let maximumSavings = 0;

  if (allOffers.length > 0) {
    lowestPrice = allOffers[0].price;
    highestPrice = allOffers[allOffers.length - 1].price;
    maximumSavings = highestPrice - lowestPrice;

    // Tag lowest offer
    allOffers.forEach((o) => {
      if (o.price === lowestPrice) {
        o.isLowest = true;
      }
    });
  }

  // Analyze Price History Trends for this Canonical Product
  const historyEntries = getPriceHistory(canonical.id);
  const priceTrend = analyzePriceTrend(historyEntries, lowestPrice);

  // Group offers into 3 distinct result buckets
  const groupedOffers: GroupedOffers = {
    exact: allOffers.filter(o => o.matchType === 'exact'),
    variant: allOffers.filter(o => o.matchType === 'variant'),
    similar: allOffers.filter(o => o.matchType === 'similar'),
  };

  const summary = {
    totalStoresChecked: adapters.length,
    successfulStores,
    lowestPrice,
    highestPrice,
    maximumSavings,
    currency: 'INR',
  };

  const recommendation = generateRecommendation(allOffers, maximumSavings);

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
  };
}

function generateRecommendation(offers: StoreOffer[], savings: number): string {
  if (offers.length === 0) {
    return 'No active store offers were found for this product. Ensure retailer API keys are configured.';
  }

  const bestValueOffer = offers.find((o) => o.isBestValue) || offers[0];

  if (savings > 0) {
    return `BuyWise AI identifies ${bestValueOffer.store} as the Best Value choice with a Smart Value Score of ${bestValueOffer.smartValueScore || 85}/100 and a Trust Score of ${bestValueOffer.trustScore || 85}/100 at ₹${bestValueOffer.price.toLocaleString()}, offering maximum savings of ₹${savings.toLocaleString()} across checked stores.`;
  }

  return `BuyWise AI identifies ${bestValueOffer.store} as the Best Value choice with a Smart Value Score of ${bestValueOffer.smartValueScore || 85}/100 and a Trust Score of ${bestValueOffer.trustScore || 85}/100 at ₹${bestValueOffer.price.toLocaleString()}.`;
}
