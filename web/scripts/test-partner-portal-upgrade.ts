import {
  createPartnerProductListing,
  updatePartnerProductListing,
  archivePartnerProductListing,
  adminReviewProduct,
  adminVerifyProductPrice
} from '../src/lib/partners/partnerService';
import {
  validatePurchaseUrl,
  calculateDiscountPercent,
  validateCsvRow,
  validateProductPublication
} from '../src/lib/partners/partnerValidation';
import {
  trackPartnerEvent,
  computePartnerAnalytics,
  generatePartnerAnalyticsCsv,
  filterEventsByDateRange
} from '../src/lib/partners/partnerAnalytics';
import { BuyWisePartnerAdapter } from '../src/lib/retailers/partnerAdapter';
import { PartnerProduct, PartnerAnalyticsEvent } from '../src/lib/partners/types';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, suite: string, name: string, details?: string) {
  results.push({
    suite,
    name,
    passed: condition,
    details: condition ? undefined : details
  });
  if (condition) {
    console.log(`  [PASS] ${name}`);
  } else {
    console.error(`  [FAIL] ${name}: ${details}`);
  }
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('BUYWISE AI: PARTNER COMMERCE PORTAL & ANALYTICS TEST SUITE');
  console.log('================================================================\n');

  // 1. Purchase URL Safety Validation Tests
  console.log('Suite 1: Purchase URL Validation & XSS Safeguards');
  {
    const safeHttps = validatePurchaseUrl('https://partnerstore.com/item?ref=buywise&utm_source=app');
    assert(safeHttps.valid === true, 'URL Validation', 'Permits valid HTTPS URL with affiliate params');

    const safeHttp = validatePurchaseUrl('http://insecure-store.com/item');
    assert(safeHttp.valid === true, 'URL Validation', 'Permits standard HTTP URL');

    const unsafeJs = validatePurchaseUrl('javascript:alert("XSS")');
    assert(unsafeJs.valid === false, 'URL Validation', 'Strictly rejects javascript: URL scheme');

    const unsafeData = validatePurchaseUrl('data:text/html,<script>alert(1)</script>');
    assert(unsafeData.valid === false, 'URL Validation', 'Strictly rejects data: URL scheme');

    const missingScheme = validatePurchaseUrl('example.com/no-scheme');
    assert(missingScheme.valid === false, 'URL Validation', 'Rejects URLs lacking http/https protocol');
  }

  // 2. Discount Calculation Tests
  console.log('\nSuite 2: Authoritative Discount Calculation');
  {
    const disc30 = calculateDiscountPercent(1000, 700);
    assert(disc30 === 30, 'Discount Calc', 'Calculates exact 30% discount for MRP 1000 and Price 700');

    const discZero = calculateDiscountPercent(1000, 1000);
    assert(discZero === 0, 'Discount Calc', 'Calculates 0% discount when selling price equals MRP');

    const discInvalid = calculateDiscountPercent(500, 600);
    assert(discInvalid === 0, 'Discount Calc', 'Returns 0% discount when selling price exceeds MRP');
  }

  // 3. CSV Row Validation & Parser Tests
  console.log('\nSuite 3: Bulk CSV Parser & Row Validation');
  {
    const validRow = {
      'Title': 'Traditional Banarasi Saree',
      'Category': 'Fashion',
      'Price': '2499',
      'MRP': '4999',
      'Stock': '30',
      'SKU': 'SKU-BANARASI-1',
      'Buy Link': 'https://silkcraft.in/saree-1'
    };
    const check1 = validateCsvRow(validRow, 1);
    assert(check1.valid === true, 'CSV Validation', 'Validates properly structured CSV row');
    assert(check1.product?.sellingPrice === 2499, 'CSV Validation', 'Parses selling price correctly');

    const invalidRowMissingTitle = {
      'Title': '',
      'Price': '1500',
      'Stock': '5'
    };
    const check2 = validateCsvRow(invalidRowMissingTitle, 2);
    assert(check2.valid === false, 'CSV Validation', 'Catches missing product title');

    const invalidRowNegativePrice = {
      'Title': 'Bluetooth Speaker',
      'Price': '-500',
      'Stock': '5'
    };
    const check3 = validateCsvRow(invalidRowNegativePrice, 3);
    assert(check3.valid === false, 'CSV Validation', 'Catches negative selling price in CSV');

    const formulaInjectionRow = {
      'Title': "=cmd|' /C calc'!A0",
      'Price': '1200',
      'Stock': '5'
    };
    const checkFormula = validateCsvRow(formulaInjectionRow, 4);
    assert(checkFormula.valid === false, 'CSV Security', 'Catches and rejects spreadsheet formula injection in CSV title');
  }

  // 4. Product Creation & Ownership Security
  console.log('\nSuite 4: Product Listing Creation & State Defaults');
  let createdProductId = '';
  {
    const res = await createPartnerProductListing({
      partnerId: 'partner_silkcraft',
      partnerName: 'SilkCraft India',
      title: 'Handloom Kanjivaram Wedding Saree Gold Zari',
      description: 'Authentic pure silk Kanjivaram saree hand-woven by master artisans.',
      category: 'Fashion',
      brand: 'SilkCraft',
      sku: `SKU-TEST-${Date.now()}`,
      mrp: 9999,
      sellingPrice: 5999,
      stock: 15,
      images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800'],
      primaryImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800',
      productUrl: 'https://silkcraft.in/p/kanjivaram-wedding',
      shippingCharges: 0,
      tryOnEnabled: true,
      garmentCategory: 'saree'
    });

    assert(res.success === true, 'Product Creation', 'Successfully creates valid partner listing');
    assert(res.product?.reviewStatus === 'PENDING_REVIEW', 'Product Creation', 'Defaults reviewStatus to PENDING_REVIEW');
    assert(res.product?.verificationStatus === 'unverified', 'Product Creation', 'Strictly defaults verificationStatus to unverified');
    assert(res.product?.status === 'PENDING_APPROVAL', 'Product Creation', 'Defaults status to PENDING_APPROVAL');

    if (res.product) {
      createdProductId = res.product.id;
    }
  }

  // 5. Cross-Partner Data Isolation & Unauthorized Updates
  console.log('\nSuite 5: Cross-Partner Data Isolation & Mass Assignment Prevention');
  {
    // Attempt modification from a different partner
    const unauthorizedUpdate = await updatePartnerProductListing(
      createdProductId,
      'partner_malicious_attacker', // Different partner
      { title: 'Hacked Title' },
      false // Not admin
    );
    assert(unauthorizedUpdate.success === false, 'Isolation Security', 'Strictly blocks cross-tenant edits from unauthorized partner');

    // Attempt privileged field mass-assignment by owner (e.g. self-assigning verified_live)
    const selfVerifyAttempt = await updatePartnerProductListing(
      createdProductId,
      'partner_silkcraft', // Owner
      { 
        title: 'Handloom Kanjivaram Wedding Saree (Updated)',
        verificationStatus: 'verified_live' as any // Attempting self-verification
      },
      false // Non-admin partner
    );
    assert(selfVerifyAttempt.success === true, 'Mass Assignment', 'Allows legitimate owner updates');
    assert(selfVerifyAttempt.product?.verificationStatus === 'unverified', 'Mass Assignment', 'Strips attempted self-verification');
  }

  // 6. Material Change Re-Verification Workflow
  console.log('\nSuite 6: Material Change Automatic Re-Verification');
  {
    // Modify selling price
    const priceChange = await updatePartnerProductListing(
      createdProductId,
      'partner_silkcraft',
      { sellingPrice: 5499 }, // Price changed
      false
    );
    assert(priceChange.success === true, 'Re-verification Trigger', 'Processes valid price change');
    assert(priceChange.product?.verificationStatus === 'unverified', 'Re-verification Trigger', 'Resets verificationStatus to unverified on price change');
    assert(priceChange.product?.reviewStatus === 'PENDING_REVIEW', 'Re-verification Trigger', 'Resets reviewStatus to PENDING_REVIEW for re-audit');
  }

  // 7. Admin Review Workflow (Approval & Rejection with Reasons)
  console.log('\nSuite 7: Admin Listing Moderation');
  {
    // Rejection with reason
    const rejectRes = await adminReviewProduct(
      createdProductId,
      'REJECTED',
      'Primary image does not clearly depict garment details.',
      'admin_pajonline'
    );
    assert(rejectRes === true, 'Admin Moderation', 'Admin successfully rejects listing with actionable reason');

    // Approval
    const approveRes = await adminReviewProduct(
      createdProductId,
      'APPROVED',
      undefined,
      'admin_pajonline'
    );
    assert(approveRes === true, 'Admin Moderation', 'Admin successfully approves listing');
  }

  // 8. Admin Price Verification Workflow
  console.log('\nSuite 8: Price Verification & Lowest Verified Safeguard');
  {
    const verifyRes = await adminVerifyProductPrice(
      createdProductId,
      5499,
      'Live feed verified on SilkCraft official checkout page',
      'admin_pajonline'
    );
    assert(verifyRes === true, 'Price Verification', 'Admin grants verified_live status with verification audit note');
  }

  // 9. Retailer Adapter Multi-Store Search Integration
  console.log('\nSuite 9: Multi-Retailer Search Adapter Safeguards');
  {
    const adapter = new BuyWisePartnerAdapter();
    const searchRes = await adapter.search('Kanjivaram');
    assert(searchRes.success === true, 'Search Adapter', 'Adapter searches partner catalog successfully');

    const foundOffer = searchRes.offers.find(o => o.id === createdProductId);
    assert(foundOffer !== undefined, 'Search Adapter', 'Finds approved partner listing');
    assert(foundOffer?.verificationStatus === 'verified_live', 'Search Adapter', 'Displays verified_live only after admin verification');
    assert(foundOffer?.trustLevel === 'high', 'Search Adapter', 'High trust level applied to verified listing');
  }

  // 10. Partner Analytics Event Deduplication & Deduplication Logic
  console.log('\nSuite 10: Real Analytics Ingestion, Deduplication, and Calculation');
  {
    // First impression
    const evt1 = await trackPartnerEvent({
      partnerId: 'partner_silkcraft',
      productId: createdProductId,
      eventType: 'product_detail_view',
      sessionId: 'sess_user_alpha_123'
    });
    assert(evt1.recorded === true, 'Analytics Pipeline', 'Records first user detail view');

    // Rapid duplicate impression within throttle window
    const evt2 = await trackPartnerEvent({
      partnerId: 'partner_silkcraft',
      productId: createdProductId,
      eventType: 'product_detail_view',
      sessionId: 'sess_user_alpha_123'
    });
    assert(evt2.recorded === false, 'Analytics Pipeline', 'Deduplicates burst click / refresh within 15-second window');

    // Compute metrics
    const sampleEvents: PartnerAnalyticsEvent[] = [
      {
        eventId: 'e1',
        timestamp: new Date().toISOString(),
        partnerId: 'partner_silkcraft',
        productId: createdProductId,
        eventType: 'product_impression'
      },
      {
        eventId: 'e2',
        timestamp: new Date().toISOString(),
        partnerId: 'partner_silkcraft',
        productId: createdProductId,
        eventType: 'product_detail_view'
      },
      {
        eventId: 'e3',
        timestamp: new Date().toISOString(),
        partnerId: 'partner_silkcraft',
        productId: createdProductId,
        eventType: 'outbound_buy_click'
      }
    ];

    const summary = computePartnerAnalytics({
      partnerId: 'partner_silkcraft',
      dateRange: '30d',
      events: sampleEvents,
      products: [],
      orders: []
    });

    assert(summary.totalViews === 1, 'Analytics Math', 'Correctly aggregates views');
    assert(summary.totalOutboundClicks === 1, 'Analytics Math', 'Correctly aggregates outbound buy clicks');
    assert(summary.clickThroughRate === 100, 'Analytics Math', 'Calculates accurate 100% CTR');

    // Generate CSV
    const csvContent = generatePartnerAnalyticsCsv(summary, []);
    assert(csvContent.includes('# BuyWise AI Partner Analytics Export'), 'CSV Export', 'Generates standard CSV header');
    assert(csvContent.includes('# Partner ID: partner_silkcraft'), 'CSV Export', 'Includes partner identity metadata in export');

    // Test formula escaping in CSV export
    const productWithFormula: PartnerProduct = {
      id: 'p_sec_test',
      partnerId: 'partner_silkcraft',
      partnerName: 'SilkCraft',
      title: '=HYPERLINK("http://evil.com")',
      description: 'Test',
      category: 'Fashion',
      brand: 'SilkCraft',
      sku: '+MALICIOUS_SKU',
      mrp: 1000,
      sellingPrice: 800,
      stock: 5,
      images: ['/img.jpg'],
      primaryImage: '/img.jpg',
      fulfillment: 'PARTNER_FULFILLED',
      source: 'PARTNER',
      tryOnEnabled: false,
      returnPolicy: '7d',
      warranty: '1y',
      gstPercent: 5,
      status: 'LIVE',
      commissionType: 'PERCENTAGE',
      commissionValue: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const escapedCsv = generatePartnerAnalyticsCsv(summary, [productWithFormula]);
    assert(escapedCsv.includes(`"'=HYPERLINK`), 'CSV Export Security', 'Mitigates formula injection in exported CSV by prepending single quote');
    assert(escapedCsv.includes(`"'+MALICIOUS_SKU"`), 'CSV Export Security', 'Mitigates formula injection in exported SKU by prepending single quote');

    // Empty dataset / zero-event account test
    const zeroSummary = computePartnerAnalytics({
      partnerId: 'partner_brand_new',
      dateRange: 'all',
      events: [],
      products: [],
      orders: []
    });
    assert(zeroSummary.totalViews === 0, 'Zero-Event Account', 'Empty event account produces 0 views without error');
    assert(zeroSummary.totalOutboundClicks === 0, 'Zero-Event Account', 'Empty event account produces 0 clicks');
    assert(zeroSummary.clickThroughRate === 0, 'Zero-Event Account', 'Empty event account produces 0% CTR without NaN');
    assert(zeroSummary.attributedOrders === 0, 'Zero-Event Account', 'Empty order account produces 0 orders');
    assert(zeroSummary.totalSalesVolume === 0, 'Zero-Event Account', 'Empty sales produces ₹0 volume');
  }

  // 11. Archive Listing Test
  console.log('\nSuite 11: Product Archiving');
  {
    const archiveRes = await archivePartnerProductListing(createdProductId, 'partner_silkcraft', false);
    assert(archiveRes === true, 'Archive Listing', 'Successfully archives product listing');
  }

  console.log('\n================================================================');
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`SUMMARY: ${passed} / ${total} Tests Passed (${failed} Failed)`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runTestSuite().catch(err => {
  console.error('Fatal error during test suite execution:', err);
  process.exit(1);
});
