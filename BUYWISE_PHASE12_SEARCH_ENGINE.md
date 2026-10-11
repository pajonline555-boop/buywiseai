# BUYWISE AI — PHASE 12: SMARTCOMPARE SEARCH ENGINE DOCUMENTATION

## Overview
This document specifies the SmartCompare search engine intent normalization, category capability matrix, data quality validation, multivariable ranking engine, and automated test matrix.

---

## Technical Status

### 1. IMPLEMENTED
- [x] **Query Normalizer (`QueryNormalizer.ts`)**: Normalizes English, Hindi, and Hinglish search inputs (e.g. "atta", "aata", "flour", "गेहूं आटा", "wheat flour") into semantic shopping intent (`GROCERY` -> `FLOUR` -> `WHEAT_FLOUR`). Extracted pack sizes (5kg) and price filters (under 300).
- [x] **Product Intent Parser (`ProductIntentParser.ts`)**: Classifies search query into query types (`PRODUCT`, `CATEGORY`, `BRAND`, `GENERIC_ITEM`, `ATTRIBUTE`, `PRICE_INTENT`, `SHOPPING_INTENT`).
- [x] **Category Capability Matrix (`CategoryCapabilityMatrix.ts`)**: Defines capabilities per category. Enforces `tryOnSupported = false` for Grocery, Atta, Flour, Electronics, Home, Books; enables `tryOnSupported = true` for Fashion, Jewellery, Beauty.
- [x] **Data Quality Validator (`SearchResultValidator.ts`)**: Rejects synthetic default product titles ("Aata Premium Edition"), synthetic prices (₹14,999 fallback), negative prices, ₹0, or broken stock photos.
- [x] **Multivariable Ranking Engine (`SearchRankingEngine.ts`)**: Ranks offers based on exact token match, brand match, pack/size match, availability, price competitiveness, and Smart Value Score.
- [x] **Search UI Intent Integration (`app/search/page.tsx`)**: Displays intent banner, category path, and disables VTO button for grocery/electronics queries.
- [x] **Adapter Hardening (`amazon.ts` & `flipkart.ts`)**: Removed synthetic fallback price/title generation when API credentials are unconfigured.

### 2. TESTED
- [x] **18-Case Automated Test Suite (`web/scripts/test-phase12-search-intent.ts`)**:
  - `"atta"`, `"aata"`, `"flour"`, `"wheat flour"`, `"गेहूं आटा"`, `"5kg atta"`, `"atta under 300"` -> ALL PASSED (GROCERY/FLOUR intent, VTO disabled).
  - `"iPhone 17"`, `"Samsung phone"`, `"AirPods Pro"` -> ALL PASSED (ELECTRONICS intent, VTO disabled).
  - `"red saree"`, `"running shoes"`, `"lipstick"`, `"gold earrings"` -> ALL PASSED (FASHION/BEAUTY/JEWELLERY intent, VTO enabled).
  - Data quality validator & Flipkart deep-link builder -> ALL PASSED.

### 3. RUNTIME VERIFIED
- [x] **Web Search Page**: Verified search UI with query normalization and capability enforcement.

### 4. PRODUCTION CONFIGURED
- [x] **Authoritative Category Capabilities**: Hardcoded category capability matrix governing feature availability across Web, Android, Maya AI, and Voice Search.

### 5. PRODUCTION BLOCKED / DEPLOYMENT GATES
- [!] None for search intent engine. Adapter results require live retailer PAAPI/affiliate credentials to retrieve real-time live pricing.
