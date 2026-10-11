import { parseSearchIntent } from '../src/lib/search/ProductIntentParser';
import { getCategoryCapabilities } from '../src/lib/search/CategoryCapabilityMatrix';
import { validateSearchResultOffer } from '../src/lib/search/SearchResultValidator';
import { buildAffiliateUrl } from '../src/lib/affiliate/affiliateLinkBuilder';

const TEST_QUERIES = [
  'atta',
  'aata',
  'flour',
  'wheat flour',
  'गेहूं आटा',
  '5kg atta',
  'atta under 300',
  'iPhone 17',
  'Samsung phone',
  'red saree',
  'running shoes',
  'AirPods Pro',
  'laptop',
  'washing machine',
  'lipstick',
  'gold earrings',
];

async function runPhase12Tests() {
  console.log('=== BUYWISE AI PHASE 12 AUTOMATED SEARCH INTENT & QUALITY SUITE ===\n');

  let passed = 0;
  let failed = 0;

  for (const q of TEST_QUERIES) {
    const parsed = parseSearchIntent(q);
    const intent = parsed.intent;
    const caps = getCategoryCapabilities(intent.category);

    console.log(`QUERY: "${q}"`);
    console.log(`  -> Intent Category: ${intent.category} | Subcategory: ${intent.subcategory}`);
    console.log(`  -> Normalized Title: "${intent.normalizedQuery}"`);
    console.log(`  -> Query Type: ${parsed.queryType}`);
    console.log(`  -> VTO Eligible: ${caps.tryOnSupported ? 'YES' : 'NO'}`);

    // Assertion 1: "atta" / "aata" / "flour" must NOT show VTO
    if (['atta', 'aata', 'flour', 'wheat flour', 'गेहूं आटा', '5kg atta', 'atta under 300'].includes(q)) {
      if (caps.tryOnSupported) {
        console.error(`  ❌ FAIL: VTO should be FALSE for grocery query "${q}"`);
        failed++;
        continue;
      }
      if (intent.category !== 'GROCERY') {
        console.error(`  ❌ FAIL: Query "${q}" should map to GROCERY category`);
        failed++;
        continue;
      }
    }

    // Assertion 2: "red saree" MUST support VTO
    if (q === 'red saree' && !caps.tryOnSupported) {
      console.error(`  ❌ FAIL: "red saree" should support VTO`);
      failed++;
      continue;
    }

    console.log('  ✅ PASSED\n');
    passed++;
  }

  // Assertion 3: Synthetic fallback price validator test
  console.log('TESTING DATA QUALITY VALIDATOR:');
  const fakeOffer = {
    title: 'Aata Premium Edition with live deal discount',
    price: 14999,
    url: 'https://www.amazon.in/s?k=aata',
  };
  const fakeValidation = validateSearchResultOffer(fakeOffer as any);
  if (!fakeValidation.isValid) {
    console.log('  ✅ PASSED: Data quality validator successfully rejected synthetic offer');
    passed++;
  } else {
    console.error('  ❌ FAIL: Data quality validator failed to reject synthetic offer');
    failed++;
  }

  // Assertion 4: Affiliate link builder test for Flipkart deep link
  console.log('\nTESTING FLIPKART DEEP-LINK BUILDER:');
  const fkUrl = buildAffiliateUrl('https://www.flipkart.com/dp/123', 'Flipkart', 'GEN_G_STORE', true);
  if (fkUrl.includes('affid=') || fkUrl.includes('dl.flipkart.com')) {
    console.log(`  ✅ PASSED: Flipkart deep-link generated: ${fkUrl}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: Flipkart deep-link failed`);
    failed++;
  }

  console.log(`\n==================================================`);
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`==================================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase12Tests();
