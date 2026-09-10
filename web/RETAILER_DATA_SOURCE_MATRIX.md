# Retailer Data Source Discovery Matrix

> **Project:** SmartCompare / PAJOnline Online Shopping  
> **Document Version:** 1.0.0  
> **Scope:** Technical Discovery of Legitimate & Available Data Sources for Multi-Retailer Price Comparison

---

## Executive Summary

To deliver a trusted price & quality comparison platform, SmartCompare requires accurate, reliable retailer data. Fabricated prices or fragile scrapers undermine user trust. This document evaluates 10 target e-commerce platforms in India and globally, identifying official APIs, affiliate product feeds, authorized data endpoints, and current access limitations before writing integration code for **Phase 1.5B**.

---

## Retailer Data Source Matrix

| Retailer | Country | Product Categories | Data Source | Official/Authorized? | API/Feed Available? | Authentication | Price Data | Availability | Rating | Reviews | Product Image | Product URL | Implementation Difficulty | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Amazon India** | IN | All Categories (Electronics, Fashion, Home, etc.) | PA-API 5.0 / Amazon Associates | ✅ Official | ✅ Yes | AWS SigV4 (Access Key, Secret, Partner Tag) | ✅ Real-time | ✅ Stock Msg | ✅ Stars | ✅ Count | ✅ High-Res | ✅ Affiliate Link | Moderate | **Research Complete / Ready for Keys** |
| **Flipkart** | IN | Electronics, Appliances, Fashion, Mobiles | Flipkart Affiliate API / Feed | ✅ Official | ✅ Yes | Affiliate ID + Secret Token | ✅ Real-time | ✅ In Stock | ❌ Partial | ❌ Partial | ✅ High-Res | ✅ Affiliate Link | Moderate | **Research Complete / Ready for Keys** |
| **eBay** | Global / IN | Electronics, Global Goods, Refurbished | eBay Browse API (OAuth 2.0) | ✅ Official | ✅ Yes | OAuth 2.0 Client Credentials (App ID + Secret) | ✅ Real-time | ✅ Stock Qty | ✅ Seller Rating | ✅ Review Count | ✅ High-Res | ✅ EPN Link | Low-Moderate | **Research Complete / Ready for Keys** |
| **Myntra** | IN | Fashion, Apparel, Footwear, Accessories | Affiliate Network Feed (EarnKaro / Admitad) / Search JSON | ⚠️ Authorized Affiliate Feed | ⚠️ Network Feed | Network API Key / Token | ✅ Feed Price | ✅ Availability | ❌ No | ❌ No | ✅ Style Images | ✅ Deep Link | Moderate | **Research Complete (Tier 2)** |
| **AJIO** | IN | Fashion, Clothing, Ethnic, Accessories | Affiliate Network Feed (vCommission / EarnKaro) / Catalog JSON | ⚠️ Authorized Affiliate Feed | ⚠️ Network Feed | Network API Key | ✅ Feed Price | ✅ Stock Status | ❌ No | ❌ No | ✅ Image CDN | ✅ Affiliate Link | Moderate | **Research Complete (Tier 2)** |
| **Croma** | IN | Consumer Electronics, Mobiles, Laptops, Appliances | Affiliate Network Feed / Catalog Search JSON | ⚠️ Authorized Affiliate Feed | ⚠️ Network Feed | API Key / Public Headers | ✅ Real-time | ✅ In Stock | ❌ No | ❌ No | ✅ Product Img | ✅ Store Link | Moderate | **Research Complete (Tier 3)** |
| **Tata CLiQ** | IN | Luxury Fashion, Electronics, Footwear | Affiliate Network Feed / Search Service API | ⚠️ Authorized Affiliate Feed | ⚠️ Network Feed | Network Token | ✅ Catalog Price | ✅ Availability | ❌ No | ❌ No | ✅ Image CDN | ✅ Affiliate Link | Moderate | **Research Complete (Tier 3)** |
| **Reliance Digital**| IN | Electronics, Smartphones, Home Appliances | Affiliate Network Feed / Web Search Endpoint | ⚠️ Authorized Affiliate Feed | ❌ No Public REST API | Network Key / Headers | ✅ List Price | ✅ Availability | ❌ No | ❌ No | ✅ Image CDN | ✅ Product Link | Moderate | **Research Complete (Tier 3)** |
| **Vijay Sales** | IN | Home Electronics, Mobiles, Air Conditioners | Affiliate Product Feed / Web Search Endpoint | ⚠️ Authorized Affiliate Feed | ❌ No Public REST API | Network Key | ✅ List Price | ✅ In Stock | ❌ No | ❌ No | ✅ Image URL | ✅ Product Link | Moderate | **Research Complete (Tier 3)** |
| **Meesho** | IN | Budget Fashion, Home, Accessories | None Verified | ❌ Unverified | ❌ No Public API/Feed | N/A | ❌ Unavailable | ❌ Unavailable | ❌ No | ❌ No | ❌ Unavailable | ❌ Unavailable | Restricted | **UNAVAILABLE / Graceful Failure** |

---

## Detailed Notes & Data Source Analysis

### 1. Amazon India
* **Official Data Mechanism:** Amazon Product Advertising API (PA-API 5.0).
* **Affiliate Program:** Amazon Associates Program India.
* **Authentication Requirements:** AWS Signature Version 4 signing using `AMAZON_PAAPI_KEY`, `AMAZON_PAAPI_SECRET`, and `AMAZON_ASSOCIATE_TAG`.
* **Available Product Fields:** Real-time item title, offer price, list price (MRP), discount amount, currency (`INR`), product image gallery, customer ratings, review counts, stock availability text, and geotargeted affiliate URL.
* **Access Requirements & Eligibility:** Requires an active Amazon Associates India account. PA-API access requires maintaining at least 3 qualifying sales every 180 days.
* **Current App Status:** Currently uses `sourceType: "mock"` fallback in `amazon.ts`. Cleanly isolated for seamless upgrade to PA-API SDK.

### 2. Flipkart
* **Official Data Mechanism:** Flipkart Affiliate API (`https://affiliate-api.flipkart.net/affiliate/1.0/search.json`) & Category Product Feeds.
* **Affiliate Program:** Flipkart Affiliate Program.
* **Authentication Requirements:** HTTP headers `Fk-Affiliate-Id` and `Fk-Affiliate-Token`.
* **Available Product Fields:** Product title, SKU, current selling price, MRP, discount percentage, category path, high-resolution product image URLs, stock availability (`true`/`false`), and affiliate buy URL.
* **Scraper Limitations (Current Implementation):** The existing Cheerio HTML parser in `flipkart.ts` is vulnerable to Flipkart's dynamic DOM changes (`._30jeq3` class obfuscation) and Akamai anti-bot challenges.
* **Recommendation:** Replace scraping with official Flipkart Affiliate API or structured feed parser in Phase 1.5B.

### 3. eBay
* **Official Data Mechanism:** eBay Browse API (part of official eBay RESTful APIs).
* **Affiliate Program:** eBay Partner Network (EPN).
* **Authentication Requirements:** OAuth 2.0 Client Credentials Grant using `EBAY_CLIENT_ID` and `EBAY_CLIENT_SECRET` to fetch temporary Bearer Access Tokens.
* **Available Product Fields:** Item summary search, real-time price, converted currency (`INR`), item condition (New/Refurbished), seller rating score, shipping options, item thumbnail image, and EPN affiliate tracking link.
* **Recommendation:** Upgrade current HTML scraper in `ebay.ts` to official eBay Browse API.

### 4. Myntra
* **Data Access Mechanism:** Authorized Affiliate Product Feeds (EarnKaro, Admitad, vCommission) & Myntra Catalog Search JSON endpoint (`https://www.myntra.com/gateway/v2/search/`).
* **Category Focus:** Fashion, apparel, footwear, accessories, and lifestyle products.
* **Available Product Fields:** Brand name, product title, style ID, price, original price, discount percentage, size availability, primary image URL, product landing URL.
* **Notes:** Crucial for Phase 2 image-based fashion search.

### 5. AJIO
* **Data Access Mechanism:** Reliance Retail Affiliate Partner Feeds & AJIO internal catalog search service.
* **Category Focus:** Fashion, clothing, ethnic wear, footwear, accessories.
* **Available Product Fields:** Brand name, product name, offer price, MRP, discount %, color variants, image CDN links, store product URL.

### 6. Croma
* **Data Access Mechanism:** Croma Affiliate Network Feeds (EarnKaro / vCommission) & catalog query endpoints.
* **Category Focus:** Mobiles, laptops, audio, TVs, kitchen appliances.
* **Available Product Fields:** Product name, price, MRP, stock status, product images, warranty details, product URL.

### 7. Tata CLiQ
* **Data Access Mechanism:** Tata CLiQ Affiliate Feeds (Admitad / EarnKaro).
* **Category Focus:** Electronics, apparel, luxury goods, footwear.
* **Available Product Fields:** Product title, brand, sale price, MRP, image URL, affiliate URL.

### 8. Reliance Digital
* **Data Access Mechanism:** Affiliate product feeds & public catalog search endpoints.
* **Category Focus:** Consumer electronics, appliances, smartphones.
* **Available Product Fields:** Title, model name, price, MRP, image URL, store page link.

### 9. Vijay Sales
* **Data Access Mechanism:** Affiliate product feeds / structured web data.
* **Category Focus:** Home appliances, televisions, mobile phones.
* **Available Product Fields:** Product title, deal price, original price, product image URL, product URL.

### 10. Meesho
* **Data Access Mechanism:** **No verified public API or open affiliate product feed available.**
* **Analysis:** Meesho operates a reseller-focused mobile platform. Seller APIs (`supplier.meesho.com`) are restricted to registered sellers, and client web pages rely on heavy anti-scraping protections (ShieldSquare/Kasada).
* **Determination:** **Explicitly state as UNAVAILABLE.** `meesho.ts` must return `success: false` with notice `"Meesho API / Scraper data source not configured yet."` to ensure the platform never fabricates fake Meesho prices.

---

## Recommended Integration Order

### Tier 1 — Recommended Immediate Integrations (Core Market Coverage)
1. **Amazon India**: Official PA-API 5.0 integration (broadest inventory, highest accuracy).
2. **Flipkart**: Official Affiliate API integration (top Indian electronics & fashion retailer).
3. **eBay**: Official OAuth 2.0 Browse API integration (global electronics & international shipping).

### Tier 2 — Fashion & Lifestyle Expansion
4. **Myntra**: Affiliate Feed / Catalog API integration (essential for Phase 2 fashion photo search).
5. **AJIO**: Affiliate Feed / Catalog API integration.

### Tier 3 — Electronics & Appliances Expansion
6. **Croma**: Electronics catalog integration.
7. **Tata CLiQ**: Multi-category integration.
8. **Reliance Digital**: Electronics integration.
9. **Vijay Sales**: Home appliance integration.

### Do Not Integrate Yet
* **Meesho**: Keep as graceful fallback (`sourceType: "unavailable"`). Do not create mock/fake prices.

---

## Required Credentials & Environment Variables

```env
# Tier 1 Official APIs
AMAZON_PAAPI_KEY=""
AMAZON_PAAPI_SECRET=""
AMAZON_ASSOCIATE_TAG=""

FLIPKART_AFFILIATE_ID=""
FLIPKART_AFFILIATE_TOKEN=""

EBAY_CLIENT_ID=""
EBAY_CLIENT_SECRET=""

# Tier 2 & 3 Affiliate Networks
AFFILIATE_NETWORK_API_KEY=""
```

---

## Estimated Technical Complexity & Risks

1. **API Credentials Dependency:** Official APIs require active affiliate/developer accounts. Fallbacks must gracefully retain `"mock"` or `"unavailable"` tags without breaking queries when credentials are not set.
2. **Scraper Fragility:** Direct HTML scraping (without official APIs) breaks whenever retailers update DOM CSS classes. Transitioning to official APIs/feeds eliminates broken selectors.
3. **Rate Limiting & Timeout Controls:** Retain `executeComparison()`'s 8,000ms `Promise.race()` timeout wrapper and `Promise.allSettled()` error boundary to ensure slow third-party APIs never block user searches.

---

## Phase 1.5B Implementation Roadmap Plan

1. **Step 1:** Implement Amazon PA-API 5.0 client in `amazon.ts` (using optional environment keys, falling back cleanly if unconfigured).
2. **Step 2:** Implement Flipkart Affiliate API parser in `flipkart.ts`.
3. **Step 3:** Implement eBay OAuth 2.0 Browse API in `ebay.ts`.
4. **Step 4:** Add Tier 2 adapters (`myntra.ts`, `ajio.ts`) into `web/src/lib/retailers/` and register them in `registry.ts`.
5. **Step 5:** Add Tier 3 adapters (`croma.ts`, `tatacliq.ts`, `reliancedigital.ts`, `vijaysales.ts`).
6. **Step 6:** Re-run verification suite and `npm run build`.
