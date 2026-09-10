import { StoreOffer } from '../retailers/types';
import { TrustResult, TrustScoreBreakdown, TrustFactorScore, TrustLevel } from './types';

export function calculateTrustScore(offer: StoreOffer): TrustResult {
  // 1. Retailer API Verification (Max 25 pts)
  let apiScore = 0;
  let apiStatus: TrustFactorScore['status'] = 'unavailable';
  let apiDetails = 'Unverified store adapter';

  if (offer.sourceType === 'api' || offer.sourceType === 'affiliate') {
    apiScore = 25;
    apiStatus = 'verified';
    apiDetails = `Official ${offer.store} API listing (25/25 pts)`;
  } else if (offer.sourceType === 'scraper') {
    apiScore = 18;
    apiStatus = 'verified';
    apiDetails = `Verified merchant scraper feed (18/25 pts)`;
  } else if (offer.sourceType === 'mock') {
    apiScore = 5;
    apiStatus = 'unverified';
    apiDetails = 'Unverified mock data source (5/25 pts)';
  }

  const retailerApiVerification: TrustFactorScore = {
    score: apiScore,
    maxScore: 25,
    status: apiStatus,
    details: apiDetails,
  };

  // 2. Price Freshness (Max 20 pts)
  let freshnessScore = 0;
  let freshnessStatus: TrustFactorScore['status'] = 'unverified';
  let freshnessDetails = 'Price timestamp unverified';

  if (offer.sourceType === 'api' || offer.sourceType === 'affiliate') {
    const checkedAtTime = new Date(offer.checkedAt).getTime();
    const ageInHours = (Date.now() - checkedAtTime) / (1000 * 60 * 60);

    if (ageInHours <= 1) {
      freshnessScore = 20;
      freshnessStatus = 'verified';
      freshnessDetails = 'Price verified within past hour (20/20 pts)';
    } else if (ageInHours <= 6) {
      freshnessScore = 18;
      freshnessStatus = 'verified';
      freshnessDetails = `Price verified ${Math.round(ageInHours)} hours ago (18/20 pts)`;
    } else if (ageInHours <= 24) {
      freshnessScore = 15;
      freshnessStatus = 'verified';
      freshnessDetails = `Price verified ${Math.round(ageInHours)} hours ago (15/20 pts)`;
    } else {
      freshnessScore = 5;
      freshnessStatus = 'stale';
      freshnessDetails = 'Verification stale (> 24 hrs ago) (5/20 pts)';
    }
  }

  const priceFreshness: TrustFactorScore = {
    score: freshnessScore,
    maxScore: 20,
    status: freshnessStatus,
    details: freshnessDetails,
  };

  // 3. Seller Verification (Max 20 pts)
  let sellerScore = 5;
  let sellerStatus: TrustFactorScore['status'] = 'unverified';
  let sellerDetails = 'Merchant verification pending';

  const storeLower = offer.store.toLowerCase();
  if (offer.sellerVerified || ['amazon', 'flipkart', 'ebay', 'myntra', 'croma', 'tatacliq'].includes(storeLower)) {
    sellerScore = 20;
    sellerStatus = 'verified';
    sellerDetails = `Verified top-tier merchant ${offer.store} (20/20 pts)`;
  }

  const sellerVerification: TrustFactorScore = {
    score: sellerScore,
    maxScore: 20,
    status: sellerStatus,
    details: sellerDetails,
  };

  // 4. Product Identity Confidence (Max 15 pts)
  const identityConfidenceRaw = typeof offer.identityConfidence === 'number' ? offer.identityConfidence : 0.50;
  const identityScore = Math.round(identityConfidenceRaw * 15);
  const identityConfidence: TrustFactorScore = {
    score: identityScore,
    maxScore: 15,
    status: identityConfidenceRaw >= 0.80 ? 'verified' : 'unverified',
    details: `${Math.round(identityConfidenceRaw * 100)}% verified identity match (${identityScore}/15 pts)`,
  };

  // 5. Availability Confidence (Max 10 pts)
  let availScore = 5;
  let availStatus: TrustFactorScore['status'] = 'unverified';
  let availDetails = 'Availability unverified';

  if (offer.availability === 'in_stock') {
    availScore = 10;
    availStatus = 'verified';
    availDetails = 'In Stock verified (10/10 pts)';
  } else if (offer.availability === 'out_of_stock') {
    availScore = 0;
    availStatus = 'unavailable';
    availDetails = 'Out of Stock (0/10 pts)';
  }

  const availabilityConfidence: TrustFactorScore = {
    score: availScore,
    maxScore: 10,
    status: availStatus,
    details: availDetails,
  };

  // 6. Return & Warranty Evidence (Max 10 pts)
  let returnScore = 0;
  let returnStatus: TrustFactorScore['status'] = 'unavailable';
  let returnDetails = 'Return policy unverified';

  if (offer.deliveryText && (offer.deliveryText.toLowerCase().includes('return') || offer.deliveryText.toLowerCase().includes('warranty'))) {
    returnScore = 10;
    returnStatus = 'verified';
    returnDetails = `Explicit return/warranty: "${offer.deliveryText}" (10/10 pts)`;
  } else if (['amazon', 'flipkart', 'ebay', 'myntra', 'croma'].includes(storeLower)) {
    returnScore = 7;
    returnStatus = 'verified';
    returnDetails = `${offer.store} standard merchant return policy (7/10 pts)`;
  }

  const returnWarrantyEvidence: TrustFactorScore = {
    score: returnScore,
    maxScore: 10,
    status: returnStatus,
    details: returnDetails,
  };

  const breakdown: TrustScoreBreakdown = {
    retailerApiVerification,
    priceFreshness,
    sellerVerification,
    identityConfidence,
    availabilityConfidence,
    returnWarrantyEvidence,
  };

  const rawSum = apiScore + freshnessScore + sellerScore + identityScore + availScore + returnScore;

  // STRICT MOCK DATA CAP: Mock data offers are capped at max 40 points
  const trustScore = offer.sourceType === 'mock' ? Math.min(40, rawSum) : Math.min(100, Math.max(0, rawSum));

  let trustLevel: TrustLevel = 'caution';
  if (trustScore >= 85 && offer.sourceType !== 'mock') {
    trustLevel = 'high';
  } else if (trustScore >= 65 && offer.sourceType !== 'mock') {
    trustLevel = 'moderate';
  }

  const reasoning = generateTrustReasoning(offer, trustScore, trustLevel);

  return {
    trustScore,
    trustLevel,
    breakdown,
    reasoning,
  };
}

function generateTrustReasoning(offer: StoreOffer, trustScore: number, trustLevel: TrustLevel): string {
  if (offer.sourceType === 'mock') {
    return `Trust Score: ${trustScore}/100 (Unverified mock data source — exercise caution)`;
  }

  if (trustLevel === 'high') {
    return `Verified High Trust Deal (${trustScore}/100): Official ${offer.store} API listing with 100% price freshness and verified merchant credentials.`;
  }

  if (trustLevel === 'moderate') {
    return `Moderate Trust Deal (${trustScore}/100): Listing retrieved from ${offer.store} with partial merchant verification.`;
  }

  return `Caution Deal (${trustScore}/100): Unverified or stale data source.`;
}
