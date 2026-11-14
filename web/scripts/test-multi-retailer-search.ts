import { normalizeQuery } from '../src/lib/query/normalize';
import { isSameProductAndVariant, groupSameProductsAcrossRetailers } from '../src/lib/comparison/matcher';
import { executeComparison } from '../src/lib/comparison/compare';
import { MeeshoAdapter } from '../src/lib/retailers/meesho';
import { StoreOffer } from '../src/lib/retailers/types';

async function runMultiRetailerTests() {
  console.log('======================================================================');
  console.log('   BUYWISE AI — MULTI-RETAILER SHOPPING SEARCH & PRICE COMPARISON     ');
  console.log('              AUTOMATED ACCEPTANCE & QUALITY TEST SUITE                ');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail: string = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} - ${detail}`);
      failed++;
    }
  }

  // -------------------------------------------------------------------------
  // TEST 1: Natural Language Query Normalization & Filter Extraction
  // -------------------------------------------------------------------------
  console.log('1. Testing Natural Language Query Parsing & Normalization:');
  {
    const q1 = normalizeQuery('Girls cotton dresses under ₹500');
    assert(q1.category === 'FASHION', 'Category mapped to FASHION for "Girls cotton dresses under ₹500"');
    assert(q1.gender === 'girls', 'Gender mapped to "girls"');
    assert(q1.maxPrice === 500, 'Parsed maxPrice === 500', `Got ${q1.maxPrice}`);
    assert(q1.fabric === 'cotton', 'Extracted fabric === "cotton"', `Got ${q1.fabric}`);

    const q2 = normalizeQuery('Girls silk party dress under 1000');
    assert(q2.maxPrice === 1000, 'Parsed maxPrice === 1000', `Got ${q2.maxPrice}`);
    assert(q2.fabric === 'silk', 'Extracted fabric === "silk"', `Got ${q2.fabric}`);

    const q3 = normalizeQuery('Men running shoes');
    assert(q3.category === 'FASHION' && q3.subcategory === 'FOOTWEAR', 'Category mapped to FASHION / FOOTWEAR for running shoes');
  }

  // -------------------------------------------------------------------------
  // TEST 2: Product Matching Integrity (Fabric & Pack Mismatch Prevention)
  // -------------------------------------------------------------------------
  console.log('\n2. Testing Product Matching Integrity & Anti-False-Match:');
  {
    // A: Cotton vs Crepe with similar titles must NOT be considered identical
    const cottonOffer: StoreOffer = {
      store: 'Amazon',
      price: 599,
      productTitle: 'H&M Girls Pink Cotton A-Line Dress',
      brand: 'H&M',
      url: 'https://amazon.in/dp/example1',
      fabric: 'Cotton',
    };
    const crepeOffer: StoreOffer = {
      store: 'Flipkart',
      price: 299,
      productTitle: 'H&M Girls Pink Crepe A-Line Dress',
      brand: 'H&M',
      url: 'https://flipkart.com/dp/example2',
      fabric: 'Crepe',
    };

    const isMatchFabric = isSameProductAndVariant(cottonOffer, crepeOffer);
    assert(!isMatchFabric, 'Prevented false match between Cotton and Crepe fabrics');

    // B: Pack of 1 vs Pack of 5 must NOT be considered identical
    const pack1Offer: StoreOffer = {
      store: 'Amazon',
      price: 499,
      productTitle: 'Zeyo Girls Cotton Frock (Pack of 1)',
      brand: 'Zeyo',
      url: 'https://amazon.in/dp/pack1',
      packQty: 1,
    };
    const pack5Offer: StoreOffer = {
      store: 'Meesho',
      price: 999,
      productTitle: 'Zeyo Girls Cotton Frocks (Pack of 5)',
      brand: 'Zeyo',
      url: 'https://meesho.com/dp/pack5',
      packQty: 5,
    };

    const isMatchPack = isSameProductAndVariant(pack1Offer, pack5Offer);
    assert(!isMatchPack, 'Prevented false match between Pack of 1 and Pack of 5');

    // C: Identical model across Amazon & Flipkart MUST be grouped
    const hopscotchAmazon: StoreOffer = {
      store: 'Amazon',
      price: 499,
      productTitle: 'Hopscotch Girls Pink Pure Cotton Tiered A-Line Dress',
      brand: 'Hopscotch',
      url: 'https://amazon.in/dp/hopscotch1',
      fabric: '100% Cotton',
    };
    const hopscotchFlipkart: StoreOffer = {
      store: 'Flipkart',
      price: 479,
      productTitle: 'Hopscotch Girls Pink Pure Cotton Tiered A-Line Dress',
      brand: 'Hopscotch',
      url: 'https://flipkart.com/dp/hopscotch1',
      fabric: '100% Cotton',
    };

    const isMatchIdentical = isSameProductAndVariant(hopscotchAmazon, hopscotchFlipkart);
    assert(isMatchIdentical, 'Successfully recognized identical product across Amazon and Flipkart');

    const grouped = groupSameProductsAcrossRetailers([cottonOffer, crepeOffer, hopscotchAmazon, hopscotchFlipkart]);
    assert(grouped.length >= 1, 'Grouped identical products into cross-retailer comparison groups', `Groups: ${grouped.length}`);
    const hopscotchGroup = grouped.find(g => g.brand?.toLowerCase() === 'hopscotch' && g.variantInfo?.toLowerCase().includes('cotton'));
    assert(!!hopscotchGroup && hopscotchGroup.storeCount === 2, 'Hopscotch group contains exactly 2 stores (Amazon + Flipkart)');
  }

  // -------------------------------------------------------------------------
  // TEST 3: Meesho Adapter Integrity (Honest Search Link, Zero Scraping/Mocks)
  // -------------------------------------------------------------------------
  console.log('\n3. Testing Meesho Adapter Compliance & Transparency:');
  {
    const meesho = new MeeshoAdapter();
    const meeshoResults = await meesho.search('Girls cotton dress');

    assert(meeshoResults.offers.length === 1, 'Meesho returns exactly 1 transparent search-link fallback offer');
    const mOffer = meeshoResults.offers[0];
    assert(mOffer.store === 'Meesho', 'Store is Meesho');
    assert(mOffer.isSearchLinkOnly === true, 'isSearchLinkOnly is true');
    assert(mOffer.verificationStatus === 'unverified', 'verificationStatus is honest "unverified"');
    assert(mOffer.price === 0, 'Does NOT invent artificial price for unverified search link');
    assert(mOffer.url.includes('https://www.meesho.com/search?q='), 'URL is honest direct search query on Meesho');
  }

  // -------------------------------------------------------------------------
  // TEST 4: Comparison Engine Modes (Best Matches vs Same Product Comparison)
  // -------------------------------------------------------------------------
  console.log('\n4. Testing Multi-Retailer Comparison Engine Modes:');
  {
    const response = await executeComparison('Girls dresses');

    assert(response.stores.length > 0, 'Offers returned for "Girls dresses"');
    assert(Array.isArray(response.bestMatches), 'response.bestMatches is present');
    assert(Array.isArray(response.sameProductComparisons), 'response.sameProductComparisons is present');

    // Verify Same Product groups contain multi-store offers
    if (response.sameProductComparisons.length > 0) {
      const topGroup = response.sameProductComparisons[0];
      assert(topGroup.offers.length >= 2, `Same Product group contains >= 2 retailers (found ${topGroup.offers.length})`);
      assert(topGroup.lowestPrice > 0, `Same Product group computes lowestPrice (₹${topGroup.lowestPrice})`);
    }

    // Verify Best Matches ranking
    if (response.bestMatches.length > 0) {
      const best = response.bestMatches[0];
      assert(best.price > 0, `Best match has valid observed price ₹${best.price}`);
      assert(!!best.store, `Best match identifies store: ${best.store}`);
    }
  }

  // -------------------------------------------------------------------------
  // TEST 5: Budget Constraint Filtering ("under ₹500")
  // -------------------------------------------------------------------------
  console.log('\n5. Testing Natural Language Budget Filtering ("under ₹500"):');
  {
    const responseBudget = await executeComparison('Girls cotton dress under ₹500');
    assert(responseBudget.filterMaxPrice === 500, 'ComparisonResponse preserves filterMaxPrice === 500');
    assert(responseBudget.filterFabric === 'cotton', 'ComparisonResponse preserves filterFabric === "cotton"');

    // Verify best matches prioritize within budget
    const withinBudget = responseBudget.bestMatches.filter(o => o.price > 0 && o.price <= 500);
    assert(withinBudget.length > 0, `Returned ${withinBudget.length} offers within ₹500 budget`);
  }

  // -------------------------------------------------------------------------
  // TEST 6: Retailer Status Transparency (Live, Stale, Unverified, Search-Only)
  // -------------------------------------------------------------------------
  console.log('\n6. Testing Retailer Status & Transparency Fields:');
  {
    const response = await executeComparison('Girls dresses');
    const meeshoOffer = response.stores.find(s => s.store.toLowerCase().includes('meesho'));
    assert(!!meeshoOffer, 'Meesho offer present in multi-retailer results');
    if (meeshoOffer) {
      assert(meeshoOffer.verificationStatus === 'unverified', 'Meesho marked as unverified');
      assert(meeshoOffer.isSearchLinkOnly === true, 'Meesho marked as search link only');
    }

    // Ensure no offers claim verified_live without live verification
    const verifiedLiveOffers = response.stores.filter(s => s.verificationStatus === 'verified_live');
    for (const vOffer of verifiedLiveOffers) {
      assert(vOffer.price > 0, `Verified live offer has non-zero observed price: ₹${vOffer.price}`);
      assert(!vOffer.isSearchLinkOnly, 'Verified live offer cannot be search link only');
    }
  }

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log(`TOTAL SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runMultiRetailerTests().catch((err) => {
  console.error('Fatal error during multi-retailer tests:', err);
  process.exit(1);
});
