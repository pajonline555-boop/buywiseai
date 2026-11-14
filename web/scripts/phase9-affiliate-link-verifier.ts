import { buildAffiliateUrl } from '../src/lib/affiliate/affiliateLinkBuilder';
import { AmazonAdapter } from '../src/lib/retailers/amazon';
import { FlipkartAdapter } from '../src/lib/retailers/flipkart';
import { MeeshoAdapter } from '../src/lib/retailers/meesho';

async function runAffiliateAudit() {
  console.log('=== BUYWISE AI PHASE 9 AFFILIATE LINK INTEGRITY AUDIT ===\n');

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

  // 1. Amazon Tag Preservation
  console.log('1. Testing Amazon Tracking Tag Preservation:');
  {
    const rawAmz = 'https://www.amazon.in/dp/B0DF123456';
    const tagged = buildAffiliateUrl(rawAmz, 'Amazon India', 'SEARCH', false);
    assert(tagged.includes('tag=pajonline-21'), 'Amazon URL includes tag=pajonline-21', `Got: ${tagged}`);
    assert(!tagged.includes('undefined'), 'Amazon URL does not contain undefined parameters');
    assert(tagged.startsWith('https://www.amazon.in/dp/B0DF123456'), 'Target product path is preserved without silent change');
  }

  // 2. Flipkart Affiliate Parameters
  console.log('\n2. Testing Flipkart Affiliate Link Builder:');
  {
    const rawFk = 'https://www.flipkart.com/girls-cotton-dress/p/itm123';
    // If FLIPKART_AFFILIATE_ID is unset, it should return unadulterated raw URL or valid affid when configured
    const fkUrl = buildAffiliateUrl(rawFk, 'Flipkart', 'SEARCH', false);
    assert(fkUrl.startsWith('https://www.flipkart.com/'), 'Flipkart domain intact');
    assert(!fkUrl.includes('null') && !fkUrl.includes('undefined'), 'No null or undefined in Flipkart URL');
  }

  // 3. Meesho Search Link Integrity
  console.log('\n3. Testing Meesho Search Link Integrity:');
  {
    const meesho = new MeeshoAdapter();
    const result = await meesho.search('Girls pure cotton frock');
    const offer = result.offers[0];

    assert(offer.isSearchLinkOnly === true, 'Meesho offer explicitly flagged as search link only');
    assert(offer.verificationStatus === 'unverified', 'Meesho offer explicitly flagged as unverified');
    assert(offer.url.startsWith('https://www.meesho.com/search?q='), 'URL points to genuine search page on Meesho');
    assert(offer.price === 0, 'Does NOT fabricate an artificial product price for a search link');
  }

  // 4. Product Link Continuity
  console.log('\n4. Testing Product Link Continuity:');
  {
    const originalUrl = 'https://www.amazon.in/Hopscotch-Girls-Floral-Dress/dp/B09XYZ';
    const processed = buildAffiliateUrl(originalUrl, 'Amazon India', 'PRICE_COMPARISON', false);
    const parsed = new URL(processed);
    assert(parsed.pathname === '/Hopscotch-Girls-Floral-Dress/dp/B09XYZ', 'Product ASIN and path remain completely identical');
  }

  console.log(`\nTOTAL AFFILIATE AUDIT: ${passed} PASSED, ${failed} FAILED\n`);
  if (failed > 0) process.exit(1);
}

runAffiliateAudit();
