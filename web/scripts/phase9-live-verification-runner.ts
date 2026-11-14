import { executeComparison } from '../src/lib/comparison/compare';
import { GET, POST } from '../src/app/api/compare/route';
import { NextRequest } from 'next/server';

interface QueryVerificationResult {
  query: string;
  httpStatus: number;
  totalOffers: number;
  bestMatchesCount: number;
  sameProductGroupsCount: number;
  providerStatuses: Array<{
    retailerId: string;
    retailerName: string;
    status: string;
    message?: string;
  }>;
  retailerBreakdown: Array<{
    store: string;
    count: number;
    sampleTitle: string;
    samplePrice: number;
    priceType: 'live' | 'stale' | 'absent' | 'unverified';
    isSearchLinkOnly: boolean;
    verificationStatus: string;
    urlMatchesProduct: boolean;
    hasImage: boolean;
    lastVerified?: string;
  }>;
  sameProductGroups: Array<{
    id: string;
    productTitle: string;
    brand?: string;
    variantInfo?: string;
    lowestPrice: number;
    highestPrice: number;
    stores: string[];
  }>;
  blockedIntegrations: string[];
  authOrTimeoutIssues: string[];
}

const QUERIES = [
  'girls dresses',
  'girls cotton dresses under ₹500',
  'garba dresses',
  "men's running shoes",
  'branded smartphone',
];

async function runPhase9LiveVerification() {
  console.log('=== BUYWISE AI PHASE 9 LIVE RETAILER & SEARCH VERIFICATION ===\n');

  const results: QueryVerificationResult[] = [];

  for (const q of QUERIES) {
    console.log(`Testing Query: "${q}"...`);
    const req = new NextRequest(`http://localhost:3000/api/compare?q=${encodeURIComponent(q)}`);
    const httpRes = await GET(req);
    const httpStatus = httpRes.status;
    const body = await httpRes.json();

    const comparison = body;
    const stores = comparison.stores || [];
    const bestMatches = comparison.bestMatches || [];
    const sameProductGroups = comparison.sameProductComparisons || [];
    const providerStatuses = comparison.providerStatuses || [];

    // Retailer breakdown
    const storesGrouped: { [store: string]: typeof stores } = {};
    stores.forEach((o: any) => {
      storesGrouped[o.store] = storesGrouped[o.store] || [];
      storesGrouped[o.store].push(o);
    });

    const breakdown = Object.entries(storesGrouped).map(([store, offers]) => {
      const first = offers[0];
      const isSearchOnly = !!first.isSearchLinkOnly;
      const vStatus = first.verificationStatus || 'unverified';
      let priceType: 'live' | 'stale' | 'absent' | 'unverified' = 'unverified';

      if (vStatus === 'verified_live' && !isSearchOnly) {
        priceType = 'live';
      } else if (first.price === 0) {
        priceType = 'absent';
      } else if (isSearchOnly) {
        priceType = 'unverified';
      }

      const urlMatches = !!first.url && (first.url.includes('http') || first.url.includes('search') || first.url.includes('dp'));
      const hasImage = !!first.imageUrl && first.imageUrl.length > 5;

      return {
        store,
        count: offers.length,
        sampleTitle: first.title,
        samplePrice: first.price,
        priceType,
        isSearchLinkOnly: isSearchOnly,
        verificationStatus: vStatus,
        urlMatchesProduct: urlMatches,
        hasImage,
        lastVerified: first.checkedAt,
      };
    });

    const blocked: string[] = [];
    const issues: string[] = [];

    providerStatuses.forEach((ps: any) => {
      if (ps.status === 'CREDENTIALS_REQUIRED' || ps.status === 'API_UNAVAILABLE') {
        blocked.push(`${ps.retailerName} (${ps.status})`);
      }
      if (ps.status === 'FAILED' || ps.status === 'RATE_LIMITED') {
        issues.push(`${ps.retailerName}: ${ps.message || ps.status}`);
      }
    });

    const spgSummary = sameProductGroups.map((g: any) => ({
      id: g.id,
      productTitle: g.productTitle,
      brand: g.brand,
      variantInfo: g.variantInfo,
      lowestPrice: g.lowestPrice,
      highestPrice: g.highestPrice,
      stores: g.offers ? g.offers.map((o: any) => o.store) : [],
    }));

    results.push({
      query: q,
      httpStatus,
      totalOffers: stores.length,
      bestMatchesCount: bestMatches.length,
      sameProductGroupsCount: sameProductGroups.length,
      providerStatuses,
      retailerBreakdown: breakdown,
      sameProductGroups: spgSummary,
      blockedIntegrations: blocked,
      authOrTimeoutIssues: issues,
    });
  }

  const fs = await import('fs');
  const path = await import('path');
  fs.writeFileSync(path.join(__dirname, 'phase9_results.json'), JSON.stringify(results, null, 2));
  console.log('Results successfully written to scripts/phase9_results.json');
  process.exit(0);
}

runPhase9LiveVerification().catch((err) => {
  console.error('Phase 9 verification failed:', err);
  process.exit(1);
});
