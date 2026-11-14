import { classifyProductMatch } from '../src/lib/comparison/matcher';
import { getCategoryMarketFallbackOffers } from '../src/lib/comparison/categoryMarketFallback';
import { calculateSmartValueScore } from '../src/lib/score/engine';
import { StoreOffer } from '../src/lib/retailers/types';
import { CanonicalProduct } from '../src/lib/query/types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`✅ PASS: ${msg}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${msg}`);
    failed++;
  }
}

async function runTests() {
  console.log('=== BUYWISE AI PHOTO SEARCH & PRODUCT COMPARISON TEST SUITE ===\n');

  const canonical: CanonicalProduct = {
    id: 'test_suit_1',
    rawInput: "Women's dark teal velvet embroidered salwar kameez suit",
    category: 'fashion',
    fabric: 'Velvet',
    gender: 'women',
  };

  // TEST 1: Matcher correctly scores authentic Teal Velvet Salwar Suit
  console.log('--- TEST 1: Authentic Velvet Salwar Suit Offer Match ---');
  const authenticOffer: StoreOffer = {
    id: 'off_1',
    retailerId: 'cbazaar',
    store: 'Cbazaar',
    title: 'Dark Teal Velvet Zari Embroidered Sequins Straight Pant Suit Festive Wear',
    price: 3799,
    currency: 'INR',
    imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b',
    availability: 'in_stock',
    url: 'https://cbazaar.com',
    fabric: 'Velvet',
    style: 'Straight Pant Salwar Suit',
  };

  const matchRes1 = classifyProductMatch(authenticOffer, canonical);
  console.log('Authentic Offer Result:', {
    matchType: matchRes1.matchType,
    matchConfidence: matchRes1.matchConfidence,
    identityConfidence: matchRes1.identityConfidence,
    attributeMatchScore: matchRes1.attributeMatchScore,
    matchingAttributes: matchRes1.matchExplanation?.matchingAttributes,
  });

  assert(matchRes1.matchConfidence >= 0.78, `Match confidence >= 0.78 (got ${matchRes1.matchConfidence})`);
  assert(matchRes1.attributeMatchScore >= 0.65, `Attribute score >= 0.65 (got ${matchRes1.attributeMatchScore})`);
  assert(matchRes1.matchType === 'exact', `Match type is exact (got ${matchRes1.matchType})`);
  assert(matchRes1.matchExplanation?.materialMatch === true, 'Material match is true');
  assert(matchRes1.matchExplanation?.categoryMatch === true, 'Category match is true');

  // TEST 2: Hard Category Mismatch - Kamarbandh / Waistband vs Salwar Suit
  console.log('\n--- TEST 2: Unrelated Accessory (Kamarbandh Waistband) Match ---');
  const kamarbandhOffer: StoreOffer = {
    id: 'off_2',
    retailerId: 'buywise_partners',
    store: 'BuyWise Store',
    title: 'Women Traditional Gujarati Kamarbandh Belly Chain Waistband for Festive Wear',
    price: 499,
    currency: 'INR',
    imageUrl: 'https://images.unsplash.com/photo-kamarbandh',
    availability: 'in_stock',
    url: 'https://buywise.com',
  };

  const matchRes2 = classifyProductMatch(kamarbandhOffer, canonical);
  console.log('Kamarbandh Result:', {
    matchType: matchRes2.matchType,
    matchConfidence: matchRes2.matchConfidence,
    diffReason: matchRes2.differenceReason,
  });

  assert(matchRes2.matchConfidence <= 0.15, `Kamarbandh match confidence <= 0.15 (got ${matchRes2.matchConfidence})`);
  assert(matchRes2.matchType === 'similar', `Kamarbandh classified as similar/unrelated (got ${matchRes2.matchType})`);
  assert(matchRes2.matchExplanation?.categoryMatch === false, 'Kamarbandh categoryMatch is false');

  // TEST 3: Smart Value Score Capping for low-confidence matches
  console.log('\n--- TEST 3: Smart Value Score Capping on Weak Matches ---');
  kamarbandhOffer.matchConfidence = matchRes2.matchConfidence;
  const scoreRes = calculateSmartValueScore(kamarbandhOffer, [authenticOffer, kamarbandhOffer]);
  console.log('Kamarbandh Smart Value Score:', scoreRes.totalScore);
  assert(scoreRes.totalScore <= 15, `Low confidence match Smart Value Score capped at <= 15 (got ${scoreRes.totalScore})`);

  // TEST 4: Category Market Fallback for Ethnic Suits
  console.log('\n--- TEST 4: Category Market Fallback for Ethnic Suits ---');
  const fallbackOffers = getCategoryMarketFallbackOffers(canonical.rawInput, canonical);
  console.log(`Generated ${fallbackOffers.length} fallback offers for ethnic suit query`);
  assert(fallbackOffers.length >= 3, 'Returns at least 3 fallback offers');

  const prices = fallbackOffers.map(o => o.price);
  const stores = fallbackOffers.map(o => o.store);
  console.log('Fallback Stores:', stores);
  console.log('Fallback Prices:', prices);

  assert(prices.every(p => p >= 2000), 'All ethnic suit offers have realistic prices (>= ₹2000, zero ₹499 anomalies)');
  assert(!fallbackOffers.some(o => o.imageUrl.includes('photo-1523275335684-37898b6baf30')), 'Zero watch images in ethnic suits');
  assert(fallbackOffers.some(o => (o.fabric || '').toLowerCase().includes('velvet')), 'Includes authentic Velvet fabric option');

  console.log(`\n========================================`);
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================`);

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

