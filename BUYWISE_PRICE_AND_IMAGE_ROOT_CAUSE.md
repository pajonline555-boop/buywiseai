# BUYWISE AI — ROOT-CAUSE AUDIT REPORT
## Price Discrepancies (₹472 vs ₹699) & Duplicate Sneaker Image Analysis

**Project**: `C:\APPS\BUYWISE AI\web` & `C:\APPS\BUYWISE AI\android`  
**Date**: October 2026  
**Status**: AUDITED & ROOT CAUSES IDENTIFIED

---

### Executive Summary

An audit was conducted on BuyWise AI in response to two user-reported defects:
1. **Price Discrepancy**: Live Amazon India showed a sneaker deal at **₹472**, whereas BuyWise AI displayed Amazon's minimum price as **₹699** and Flipkart as **₹649**.
2. **Duplicate Product Images**: Distinct sneaker products (such as *Asian Men Wonder-13* and *Puma Men Flyer Runner*) displayed the **exact same red sneaker photograph**.
3. **Misleading Deal Links**: "View Deal" links directed users to generic retailer search query pages (`https://www.amazon.in/s?k=...`) rather than exact, verified product listings.
4. **Synthetic Data Presented as Live**: In both the web API and Android client, fallback mock generators synthesized product prices and claimed `sourceType: 'api'` with `verificationStatus: 'verified_live'` when official API credentials were not configured.

---

### 1. Issue 1: Amazon ₹472 vs BuyWise AI ₹699

#### Evidence & Observations
- **Image 1 (Real Amazon India App)**:
  - Search query: `Asian Men Wonder-...`
  - Top search result on Amazon India: **LANCER Mens Wonder-3nbl-lgr Running Shoes** at **₹472** (MRP ₹1,199, 61% off, Prime eligible, free delivery).
  - Second result: **LANCER Mens Wonder-10 Sneakers** at **₹475**.
- **Image 2 (BuyWise AI App)**:
  - Search query: `Sneakers`
  - Card 1: Flipkart — *Asian Men Wonder-13 Lightweight Mesh Sports Running Shoes (Anti-Slip Grip)* at **₹649** (MRP ₹1,299, 50% OFF).
  - Card 2: Amazon India (badged "👑 LOWEST", "Trust: 97/100") — *Asian Men Wonder-13 Lightweight Mesh Sports Running Shoes (Anti-Slip Grip)* at **₹699** (MRP ₹1,299, 46% OFF).
  - Card 3: Myntra (badged "💎 BRANDED", "Trust: 99/100") — *Puma Men Flyer Runner Mesh Lightweight Running Shoes* at **₹1,799** (MRP ₹3,499, 49% OFF).

#### Root Causes
1. **Hardcoded Mock Formula in Android Fallback (`SmartMarketIntelligence.kt`)**:
   - Location: `android/app/src/main/java/com/pajonline/buywiseai/data/repository/SmartMarketIntelligence.kt` (lines 1083–1240).
   - When the user searches for `sneakers`, `shoes`, or `footwear`, the engine selects:
     ```kotlin
     lowestItem = Quad("Asian Men Wonder-13 Lightweight Mesh Sports Running Shoes (Anti-Slip Grip)", 599.0, 1299.0, ...)
     ```
   - It then computes artificial store prices via arbitrary offsets:
     - Flipkart price: `lowestItem.second + 50.0` = **₹649.0**
     - Amazon India price: `lowestItem.second + 100.0` = **₹699.0**
   - The price was never fetched from Amazon India; it was mathematically synthesized by adding ₹100 to an arbitrary ₹599 base price.

2. **Synthetic Fallback in Web Adapter (`web/src/lib/retailers/amazon.ts`)**:
   - Location: `web/src/lib/retailers/amazon.ts` (lines 167–206).
   - `AMAZON_PAAPI_KEY` and `AMAZON_PAAPI_SECRET` are not configured in `.env.local`.
   - Instead of returning `CREDENTIALS_REQUIRED` or an empty result, the adapter executed:
     ```typescript
     const basePrice = calculateLowestPriceForQuery(cleanQuery, 0); // returns 2199 for shoes
     // Fabricates StoreOffer with:
     sourceType: 'api',
     verificationStatus: 'verified_live',
     ```
   - This fabricated prices and falsely claimed that they were live verified API prices.

3. **Product Conflation & Distinct Brand Collision**:
   - The listing on Amazon at ₹472 was **LANCER Mens Wonder-3**, manufactured by **Lancer Footwear**.
   - The listing in BuyWise AI was **Asian Men Wonder-13**, manufactured by **Asian Footwear**.
   - Because of keyword matching on the token "Wonder", the search engine treated different shoe brands and models as interchangeable. BuyWise AI lacked an exact brand+model identity classifier to separate Lancer Wonder from Asian Wonder.

---

### 2. Issue 2: Duplicate Product Images Across All Sneakers

#### Evidence & Observations
- In Image 2, every single sneaker card (*Asian Men Wonder-13* on Flipkart, *Asian Men Wonder-13* on Amazon India, and *Puma Men Flyer Runner* on Myntra) displayed the **exact same red sneaker photograph**.

#### Root Causes
1. **Shared Hardcoded Unsplash URL in `SmartMarketIntelligence.kt`**:
   - Location: `android/app/src/main/java/com/pajonline/buywiseai/data/repository/SmartMarketIntelligence.kt` (lines 1083–1094).
   ```kotlin
   lower.contains("shoes") || lower.contains("sneakers") || lower.contains("footwear") -> {
       Quad(
           "Asian Men Wonder-13 Lightweight Mesh Sports Running Shoes (Anti-Slip Grip)",
           599.0,
           1299.0,
           "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80"
       ) to Quad(
           "Puma Men Flyer Runner Mesh Lightweight Running Shoes",
           1799.0,
           3499.0,
           "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80"
       )
   }
   ```
   - Both the budget shoe (`Asian Men Wonder-13`) and the branded shoe (`Puma Men Flyer Runner`) were assigned the identical URL: `https://images.unsplash.com/photo-1542291026-7eec264c27ff` (a red Nike running shoe on Unsplash).
   - When generating individual store offers (Myntra, AJIO, Flipkart, Amazon India), each card copied `lowestItem.fourth` or `brandedItem.fourth`, propagating the exact same image to every card.

2. **Category-Level Image Guessing in `web/src/lib/retailers/amazon.ts`**:
   - Location: `web/src/lib/retailers/amazon.ts` (lines 33–36):
   ```typescript
   if (lower.includes('saree') || lower.includes('kurta') || lower.includes('dress') || lower.includes('shoes')) {
       return 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80';
   }
   ```
   - Any query containing "shoes" in the web fallback was assigned a static photo from Unsplash (which happens to be a traditional saree photograph), showing an image completely unrelated to footwear.

3. **Absence of Image URL Uniqueness Validation**:
   - Neither `web/src/lib/search/SearchResultValidator.ts` nor the UI components verified whether distinct products shared identical image URLs.

---

### 3. Issue 3: Misleading Store Links

#### Evidence & Observations
- In Image 2, tapping "VIEW DEAL" on Amazon India or Flipkart did not take the user to the Asian Men Wonder-13 product page.

#### Root Causes
1. **Search URL Builder (`buildDirectStoreUrl`)**:
   - Location: `android/app/src/main/java/com/pajonline/buywiseai/data/repository/SmartMarketIntelligence.kt` (lines 118–137) and `web/src/lib/retailers/amazon.ts` (line 165).
   - URLs were built using:
     - Amazon: `"https://www.amazon.in/s?k=" + encode(cleanKeyword)`
     - Flipkart: `"https://www.flipkart.com/search?q=" + encode(cleanKeyword)`
     - Myntra: `"https://www.myntra.com/" + encode(cleanKeyword)`
     - Meesho: `"https://www.meesho.com/search?q=" + encode(cleanKeyword)`
   - These are generic keyword search result pages, NOT direct product listing pages (PDPs). Users were forced to manually search again on the target site.

---

### 4. Issue 4: Fabrication of "Verified Live" Status

#### Root Causes
1. When API credentials were missing, adapters in `web/src/lib/retailers/` (`amazon.ts`, `flipkart.ts`, `croma.ts`, `tatacliq.ts`) synthesized products and attached:
   - `sourceType: 'api'`
   - `verificationStatus: 'verified_live'`
   - `trustScore: 97`
2. `web/src/lib/retailers/verification.ts` evaluated `ageInHours <= 24` against `Date.now()` and returned `verified_live = true`, validating fabricated records.
3. The UI rendered badges: `VERIFIED PRICE (INR)`, `VERIFIED_TODAY`, `🛡️ Trust: 97/100`, and `👑 LOWEST`, misleading the user into thinking that these prices were verified live comparisons.

---

### 5. Architectural Corrective Plan

| Area | Current Defect | Target Fix |
| :--- | :--- | :--- |
| **Data Integrity** | Fake prices and `verified_live` status fabricated when credentials missing | Strictly forbid mock synthesis in production. If credentials are missing or API fails, mark retailer status honestly (`CREDENTIALS_REQUIRED` / `PROVIDER_UNAVAILABLE`). |
| **Product Identity** | Lancer Wonder-3 (₹472) conflated with Asian Wonder-13 (₹699) and Puma Flyer Runner (₹1,799) | Implement 3-tier matcher: Exact (Brand + Model + SKU), Variant (Size/Color), and Alternative/Similar. Never merge different products into the same card. |
| **Image Integrity** | Identical Unsplash red shoe image used for all sneakers | Bind images to stable product ID + variant. Reject duplicate image URLs across different products. Use neutral "Image Unavailable" placeholder on missing images. |
| **Comparison Tiers** | Single mixed list | Two dedicated user-facing categories: **PREMIUM** (best value, lowest verified prices for value brands) and **LUXURY** (branded, premium quality, verified authentic listings). |
| **Retailer Links** | Search URLs (`/s?k=...`) presented as deals | Require exact product listing URL (PDP). If only search URL is available, explicitly label as "Search on Retailer". Preserve authorized affiliate tags. |
| **Price Basis** | Arbitrary price offsets without basis | Transparently show: Listed Price, Shipping, and Effective Payable Price. Lancer Wonder at ₹472 is lowest only among Lancer Wonder listings. |
