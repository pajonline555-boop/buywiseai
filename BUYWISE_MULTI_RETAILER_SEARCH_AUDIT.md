# BUYWISE AI — MULTI-RETAILER SHOPPING SEARCH & PRICE COMPARISON AUDIT
**Phase 1: Architecture, Credential & Codebase Integrity Audit**  
**Date**: October 2026  
**Auditor**: Google Antigravity Advanced Agentic Coding Engine  
**Policy**: Zero Synthetic Data Fabrication · Transparent Provenance · Google-Quality Product Comparison

---

## 1. Executive Summary

This audit establishes the baseline for upgrading BuyWise AI's shopping search and price comparison engine across Web (`web`) and Android (`android`). The objective is to deliver Google Shopping-grade comparison across major platforms (Amazon India, Flipkart, Meesho, Myntra, and BuyWise Partner Store) while enforcing complete data honesty, strict separation between **Best Matches** and **Same Product Comparison**, and preserving all Phase 11/12 stability guarantees.

---

## 2. Retailer Integration & Credential Audit

| Platform | Current Adapter Location | Documented Integration Method | Active Credential Status | Real Data vs Fallback Behavior | Constraints & Requirements |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Amazon India** | `web/src/lib/retailers/amazon.ts` | AWS Signature v4 for PA-API 5.0 | `AMAZON_ASSOCIATE_TAG=pajonline-21` configured. `AMAZON_PAAPI_KEY` & `AMAZON_PAAPI_SECRET` unconfigured. | Returns `CREDENTIALS_REQUIRED`. Currently blocked from live API calls. | Amazon PA-API 5.0 is deprecated for new creators; Amazon now operates the **Amazon Creators API**, which mandates 10 qualifying sales in 30 days, registration, and approved OAuth credentials. When API credentials are absent, only authorized search links (`https://www.amazon.in/s?k=...&tag=pajonline-21`) are permitted. |
| **Flipkart** | `web/src/lib/retailers/flipkart.ts` | Flipkart Affiliate API 1.0 (`/affiliate/1.0/search.json`) | `FLIPKART_AFFILIATE_ID` & `FLIPKART_AFFILIATE_TOKEN` unconfigured. | Returns `CREDENTIALS_REQUIRED`. | Requires active Flipkart Affiliate token. Until configured, verified search links (`https://www.flipkart.com/search?q=...`) must be clearly labeled as `SEARCH_LINK_ONLY` / `unverified`. |
| **Meesho** | `web/src/lib/retailers/meesho.ts` | No public API exists. | N/A (`API_UNAVAILABLE`) | Returns zero offers with explanatory error. | Meesho has no authorized public developer search API. Permitted behavior: provide clearly labeled search-link redirects (`https://www.meesho.com/search?q=...`) with explicit disclaimer: *"Search link only; price and stock must be verified on retailer site."* Scraping is prohibited. |
| **Myntra** | `web/src/lib/retailers/myntra.ts` | Affiliate catalog feed | `CREDENTIALS_REQUIRED` | Blocked until partner feed credentials provided. | Dedicated fashion catalog. Permitted search-link fallback for fashion categories. |
| **BuyWise Store** | `web/src/lib/retailers/partnerAdapter.ts` | Internal Direct Merchant Inventory API | `LIVE / ACTIVE` | Live real-time catalog queries across partner inventory. | Direct verified seller inventory with 100% authentic images and instant checkout. |

---

## 3. Review of Existing Pipeline & Vulnerabilities

### 3.1 Comparison Endpoint (`/api/compare`)
- **Current Behavior**:
  - `GET /api/compare?q=query` & `POST /api/compare` accept text queries or `CanonicalProduct`.
  - Concurrently queries enabled adapters via `Promise.allSettled`.
  - When raw offers are fewer than 3, calls `getCategoryMarketFallbackOffers()`.
- **Identified Gaps**:
  1. The API currently returns a flat `stores: StoreOffer[]` array without cleanly partitioning into **Best Matches** (different products) vs **Same Product Comparison** (exact same brand/model across stores).
  2. The natural language query parser does not extract explicit budget constraints (e.g. `"under ₹500"`), fabric requirements (`"cotton"`), or age groups (`"girls"`, `"2-3 years"`).
  3. Retailer search links were not provided when API credentials were unconfigured, resulting in either empty retailer lists or hard fallback triggers.

### 3.2 Product Matcher (`matcher.ts`)
- **Current Behavior**:
  - Compares brands, models (footwear-heavy regex), sizes (UK/US), and genders.
- **Identified Gaps**:
  1. **Pack Quantity Blindness**: Does not check if an offer is a "Pack of 2", "Pack of 5", or single piece. Comparing a 5-pack of cotton panties/briefs (₹289) to a single luxury item leads to inaccurate price comparisons.
  2. **Fabric / Material Blindness**: Does not distinguish 100% Cotton from Crepe, Polyester, or Georgette. A ₹299 polyester party frock was at risk of being compared as the same product as a ₹699 pure cotton casual dress.
  3. **No Grouping into Distinct Comparison Sets**: Lacks a structured `sameProductComparisons` aggregator that groups multi-store listings of the identical item.

### 3.3 Android SmartCompare UI (`SearchScreen.kt`)
- **Current Behavior**:
  - Renders dual-tier showcase (Lowest Price vs Branded) and store cards.
- **Identified Gaps**:
  1. Does not offer a distinct tab or toggle between **Best Matches** (different styles, fabrics, price points) and **Compare Same Product** (same dress across Amazon, Flipkart, Myntra).
  2. Needs clear visual badges for Fabric (e.g., `🌿 100% Cotton`, `✨ Crepe / Georgette`) and transparent status labels (`Live Verified` vs `Search Link Only`).

---

## 4. Preservation of Phase 11 & Phase 12 Guarantees

In accordance with Phase 11 and Phase 12 audits:
1. **Zero Silent Synthetic Overwrite**:
   - HTTP 400, 429, and 500 errors must never trigger synthetic offers.
   - Live verified badges (`verified_live`) must NEVER be applied to search links or unverified estimates.
2. **Honest Stale Caching**:
   - Network dropouts use stale cached queries labeled `[Offline Cache - Stale]`.
3. **Strict Test Isolation**:
   - All 23 Android unit tests (`SmartCompareRepositoryTest`, `SmartMarketIntelligenceTest`) and 13 Web smoke tests must remain passing at 100%.

---

## 5. Implementation Roadmap & Exact Files to Modify

| Component | Target File | Specific Enhancements |
| :--- | :--- | :--- |
| **Data Types** | `web/src/lib/retailers/types.ts` | Add `bestMatches`, `sameProductComparisons`, `variant.fabric`, `variant.packCount`, `isSearchLinkOnly`, `sourceLabel`. |
| **Retailer Adapters** | `web/src/lib/retailers/meesho.ts`<br>`web/src/lib/retailers/amazon.ts`<br>`web/src/lib/retailers/flipkart.ts` | Add verified search-link generation with honest `SEARCH_LINK_ONLY` status when direct API credentials are unconfigured. |
| **Matching Engine** | `web/src/lib/comparison/matcher.ts` | Add fabric extraction, pack-count conflict detection, and `groupSameProductsAcrossRetailers()`. |
| **Query Understanding** | `web/src/lib/query/normalize.ts` | Extract budget (`under ₹500` -> `maxPrice: 500`), fabric (`cotton`, `crepe`), and category. |
| **Comparison Pipeline** | `web/src/lib/comparison/compare.ts` | Assemble two distinct outputs: **Mode A: Best Matches** and **Mode B: Same Product Comparison**. |
| **API Route** | `web/src/app/api/compare/route.ts` | Expose query parameters (`maxPrice`, `fabric`, `mode`) while maintaining full backward compatibility. |
| **Android Domain** | `android/.../domain/model/Models.kt` | Add `bestMatches`, `sameProductComparisons`, `SameProductGroup`, and `StoreOffer` variant fields. |
| **Android Intelligence** | `android/.../data/repository/SmartMarketIntelligence.kt` | Provide structured multi-retailer dress listings (Amazon, Flipkart, Meesho, Myntra, BuyWise) with verified fabric and pricing tiers. |
| **Android UI** | `android/.../ui/screens/search/SearchScreen.kt` | Add toggle/tabs for **Best Matches** vs **Compare Same Product**, fabric badges, and search link transparency. |
| **Automated Tests** | `web/scripts/test-multi-retailer-search.ts`<br>`android/.../SmartMarketIntelligenceTest.kt` | Automated verification of fabric matching, pack-count conflict prevention, price transparency, and search link attribution. |

---

## 6. Audit Conclusion & Approval

Phase 1 audit is complete. All existing security, contract, and test guarantees are mapped. We will now proceed with Phase 2 through Phase 7 implementations locally.
