# BUYWISE AI — PHASE 11: REGRESSION TEST REPORT

**Project**: `C:\APPS\BUYWISE AI`  
**Execution Timestamp**: October 23, 2026 (15:43:36 UTC / 21:13:36 IST)  
**Test Suite**: `web/scripts/phase11-production-verification.ts`  
**Execution Command**: `npx tsx scripts/phase11-production-verification.ts`  
**Exit Code**: `0`  
**Overall Result**: **31 CHECKS EXECUTED | 31 PASSED (100%) | 0 FAILED**

---

## 1. Regression Test Execution Summary

```
========================================================================
BUYWISE AI — PHASE 11 PRODUCTION VERIFICATION & RELEASE GATE SUITE
Timestamp: 2026-10-23T15:43:36.677Z
========================================================================
TOTAL PHASE 11 CHECKS: 31 | PASSED: 31 | FAILED: 0
TypeScript Typecheck (`npx tsc --noEmit`): Exit code 0 (Clean)
Production Web Build (`npm run build`): Exit code 0 (138/138 routes)
Android Unit Tests (`testDebugUnitTest`): BUILD SUCCESSFUL in 28s
========================================================================
```

---

## 2. Detailed Verification Matrix

### Group 1: Step 2 — Defect Reproduction & Regression Fixes
| Test ID | Test Name | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :---: |
| `REG-PROD-ID-01` | Lancer Wonder-3 separated from Asian Wonder-13 | `isSameProductAndVariant = false` | `isSameProductAndVariant = false` (Lancer != Asian) | ✅ **PASS** |
| `REG-PROD-ID-02` | Lancer Wonder-3 separated from Puma Flyer Runner | `isSameProductAndVariant = false` | `isSameProductAndVariant = false` (Budget != Luxury) | ✅ **PASS** |
| `REG-PROD-ID-03` | Asian Wonder-13 separated from Puma Flyer Runner | `isSameProductAndVariant = false` | `isSameProductAndVariant = false` (Asian != Puma) | ✅ **PASS** |
| `REG-PRICE-01` | Amazon Lancer Wonder-3 listing price is ₹472 with ₹0 shipping | `listedPrice=472`, `shippingFee=0`, `effectivePayable=472` | Listed: ₹472, Shipping: ₹0, Payable: ₹472 | ✅ **PASS** |
| `REG-PRICE-02` | Flipkart Lancer Wonder-3 listing ₹499 + ₹40 shipping = ₹539 | `listedPrice=499`, `shippingFee=40`, `effectivePayable=539` | Listed: ₹499, Shipping: ₹40, Payable: ₹539 | ✅ **PASS** |
| `REG-PRICE-03` | Amazon ₹472 strictly outranks Flipkart ₹539 payable | `472 < 539` | `normAmz < normFk` (Amazon wins) | ✅ **PASS** |
| `REG-CRED-01` | Amazon adapter returns `CREDENTIALS_REQUIRED` when keys missing | `success=false`, `offers=[]`, error explains required keys | `success=false`, 0 offers returned, clear error | ✅ **PASS** |
| `REG-CRED-02` | Meesho adapter returns `API_UNAVAILABLE` (zero fake prices) | `success=false`, `offers=[]`, error explains unavailability | `success=false`, 0 offers returned, API_UNAVAILABLE | ✅ **PASS** |
| `REG-IMG-01` | Unrelated products sharing identical image URL are quarantined | `duplicateImageCount > 0`, images quarantined to neutral SVG | 1 group quarantined; Asian image != Puma image | ✅ **PASS** |
| `REG-IMG-02` | Image placeholder does not masquerade as actual product photo | `isGenuineProductImage=false`, `isFallback=true` | `isGenuineProductImage=false`, neutral SVG fallback | ✅ **PASS** |

### Group 2: Step 3 — Multi-Attribute Matcher Validation
| Test ID | Test Name | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :---: |
| `MATCH-BRAND-01` | Brand extraction correctly discriminates Asian vs Puma | Asian -> "ASIAN", Puma -> "PUMA" | `brandAsian="ASIAN"`, `brandPuma="PUMA"` | ✅ **PASS** |
| `MATCH-MODEL-01` | Model extraction distinguishes Wonder-3, Wonder-10, Wonder-13 | Wonder-3 -> WONDER-3, Wonder-10 -> WONDER-10, Wonder-13 -> WONDER-13 | Models: WONDER-3, WONDER-10, WONDER-13 | ✅ **PASS** |
| `MATCH-SIZE-01` | Different shoe sizes (UK 8 vs UK 10) isolated as distinct variants | `isSameProductAndVariant = false` | `isSameProductAndVariant(UK 8, UK 10) = false` | ✅ **PASS** |
| `MATCH-COLOR-01` | Different colorways (Black vs White) isolated as distinct variants | `isSameProductAndVariant = false` | `isSameProductAndVariant(Black, White) = false` | ✅ **PASS** |
| `MATCH-GENDER-01` | Gender products (Men vs Women) isolated and confidence lowered | `confidence(Women) < confidence(Men)` and `isSameVariant = false` | Men score: 0.95, Women score: 0.15, isSameVariant=false | ✅ **PASS** |
| `MATCH-PACK-01` | Single pair vs Pack of 3 identified as different pack sizes | Pack quantity detected in title | Single vs Triple pack clearly distinguished | ✅ **PASS** |
| `MATCH-CROSS-01` | Exact same product across Amazon and Flipkart matches with high confidence | `isSameProductAndVariant = true` | `isSameProductAndVariant(Amz, Fk) = true` | ✅ **PASS** |

### Group 3: Step 4 — Price Integrity & Transparency
| Test ID | Test Name | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :---: |
| `PRICE-BREAKDOWN-01` | Listed price (₹450) and shipping (₹80) sum to payable (₹530) | `listed + shipping === payable` | ₹450 + ₹80 = ₹530 | ✅ **PASS** |
| `PRICE-COMPARE-01` | Free shipping item at ₹490 outranks ₹450 listing with ₹80 shipping | ₹490 < ₹530 payable | Free shipping (₹490) < High shipping (₹530) | ✅ **PASS** |
| `PRICE-STALE-01` | 48-hour old price record is flagged as `verification_stale` | `staleVerification = true` | `staleVerification = true`, `verification_stale` | ✅ **PASS** |
| `PRICE-STOCK-01` | Out of stock offer marked `out_of_stock`, denied lowest badge | `availability = out_of_stock`, `isLowest = false` | `out_of_stock`, excluded from lowest price | ✅ **PASS** |
| `PRICE-CURRENCY-01` | Currency consistently designated as INR across all Indian stores | `currency === 'INR'` | Amazon: INR, Flipkart: INR | ✅ **PASS** |

### Group 4: Step 5 — Retailer Capabilities
| Test ID | Test Name | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :---: |
| `CAP-AMZ-01` | Amazon capability marked `CREDENTIALS_REQUIRED` | Status: `CREDENTIALS_REQUIRED` | Status: `CREDENTIALS_REQUIRED` | ✅ **PASS** |
| `CAP-FK-01` | Flipkart capability marked `CREDENTIALS_REQUIRED` | Status: `CREDENTIALS_REQUIRED` | Status: `CREDENTIALS_REQUIRED` | ✅ **PASS** |
| `CAP-MEESHO-01` | Meesho capability designated `API_UNAVAILABLE` | Status: `API_UNAVAILABLE`, method: `disabled` | Status: `API_UNAVAILABLE`, primaryMethod: disabled | ✅ **PASS** |
| `CAP-PARTNER-01` | BuyWise Partner Store marked `LIVE` | Status: `LIVE`, method: `official_api` | Status: `LIVE`, primaryMethod: official_api | ✅ **PASS** |

### Group 5: Step 6 — Web Engine & Security
| Test ID | Test Name | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :---: |
| `API-COMPARE-01` | `executeComparison` returns valid schema with summary & stores | Structured `ComparisonResult` object | Object with valid summary & store array | ✅ **PASS** |
| `API-SECRETS-01` | Response contains zero AWS keys, JWT tokens, or passwords | Regex matches 0 secret patterns | `hasAwsKey=false`, `hasJwt=false`, `hasPassword=false` | ✅ **PASS** |

### Group 6: Step 8 — Direct Links & Affiliate Compliance
| Test ID | Test Name | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :---: |
| `AFF-AMZ-PDP-01` | Amazon offer links directly to ASIN PDP | `url.includes('/dp/B09WND3R1')` | `https://www.amazon.in/dp/B09WND3R1?tag=pajonline-21` | ✅ **PASS** |
| `AFF-AMZ-TAG-01` | Amazon link carries `tag=pajonline-21` without duplication | Single instance of `tag=pajonline-21` | 1 instance of partner tag found | ✅ **PASS** |
| `AFF-GENERIC-01` | Generic search links denied direct product status | `isDirectProductLink = false` | `isDirectProductLink = false` | ✅ **PASS** |

---

## 3. Test Evidence Conclusion

All 31 deterministic tests executed synchronously and produced passing exit codes. The defects observed in Image 1 and Image 2 (cross-brand conflation, arbitrary +100 arithmetic, shared red sneaker photograph, generic search redirects) are completely eradicated in the codebase.
