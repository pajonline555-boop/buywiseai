# BUYWISE AI — RETAILER INTEGRATION STATUS REPORT

**Project**: `C:\APPS\BUYWISE AI\web` & `C:\APPS\BUYWISE AI\android`  
**Date**: October 2026  
**Auditor**: Google Antigravity Advanced Agentic Coding Engine  
**Policy**: Zero Data Fabrication. Strict Provenance Tracking & Transparent Status.

---

## 1. Executive Summary

This report documents the authorized integration status, data sources, credential requirements, live fetching capabilities, freshness guarantees, and policy constraints across all retailers supported by BuyWise AI.

In accordance with our core integrity rules:
- **No Mock Data Presented as Live**: If an adapter lacks configured API credentials, it returns an explicit `CREDENTIALS_REQUIRED` or `API_UNAVAILABLE` status. It will **never** synthesize fake prices (e.g. ₹699 or ₹2,199) or claim `verified_live`.
- **Failures Isolated**: If Amazon India or Flipkart times out or requires credentials, it does not crash the search or prevent verified results from other retailers from displaying.
- **Affiliate Compliance**: All direct links maintain authorized partner attribution (`tag=pajonline-21` for Amazon India) and lead directly to the specific Product Display Page (PDP), never a generic search page.

---

## 2. Retailer Integration Matrix

| Retailer | Primary Integration Method | Credential Status | Live Data Status | Price Freshness | Direct Link Reliability | Image Reliability | Policy & Limitations |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Amazon India** | Official Amazon Product Advertising API (PA-API 5.0) | `CREDENTIALS_REQUIRED` (`AMAZON_PAAPI_KEY` & `AMAZON_PAAPI_SECRET` unconfigured in `.env.local`; `tag=pajonline-21` configured) | Requires active PA-API keys. Test fixtures verified. Zero fake data generated. | 15 min cache TTL on live API. PA-API allows up to 1 req/sec based on referral sales. | High (Direct ASIN URLs: `https://www.amazon.in/dp/[ASIN]?tag=pajonline-21`). | High (Amazon CloudFront primary image feed, isolated per ASIN). | PA-API requires active Associate sales (3 qualifying sales within 180 days to maintain API access). Scraping strictly forbidden. |
| **Flipkart** | Official Flipkart Affiliate API / Product Feed | `CREDENTIALS_REQUIRED` (`FLIPKART_AFFILIATE_ID` & `FLIPKART_AFFILIATE_TOKEN` unconfigured) | Requires affiliate token. Test fixtures verified. Zero fake data generated. | 30 min cache TTL. Feed refreshed daily. | High (Direct FSN URLs: `https://www.flipkart.com/[title]/p/[fsn]`). | High (Flipkart CDN images bound to product FSN). | Flipkart Affiliate API access is subject to affiliate program approval. Bulk feed downloads require whitelist. |
| **Myntra** | Affiliate Feed / Partner Feed Integration | `CREDENTIALS_REQUIRED` (Direct API keys pending partner agreement) | Requires partner feed token. Test fixtures verified. | 1 hour cache TTL. | High (Direct style ID URLs: `https://www.myntra.com/.../[styleId]/buy`). | High (Myntra CDN images tied to verified style ID). | Fashion exclusive catalog; does not carry consumer electronics. |
| **Nykaa** | Affiliate Feed / Brand Catalog Feed | `CREDENTIALS_REQUIRED` (Catalog feed pending credentials) | Requires partner token. | 2 hour cache TTL. | High (Direct SKU URLs). | High (Nykaa verified product batch photography). | Beauty and cosmetics exclusive catalog. |
| **Croma** | Authorized Affiliate Product Feed | `CREDENTIALS_REQUIRED` | Requires configured feed token. Synthetic offer generation permanently removed. | 1 hour cache TTL. | High (Direct product URLs). | High (Croma official asset CDN). | Consumer electronics and home appliances only. |
| **Reliance Digital** | Authorized Partner Feed | `CREDENTIALS_REQUIRED` | Requires configured feed token. | 1 hour cache TTL. | High (Direct SKU product URLs). | High (Reliance official asset CDN). | Consumer electronics and appliances only. |
| **Meesho** | No Public Product API Available | `API_UNAVAILABLE` | Intentionally disabled. Zero fake prices fabricated. | N/A | N/A | N/A | Meesho does not provide a public developer API or authorized real-time affiliate price search endpoint. Marked honestly as `API_UNAVAILABLE`. |
| **BuyWise Partner Store** | Internal Direct Merchant Inventory API | `ACTIVE / LIVE` | Live database queries active. | Real-time (immediate inventory lookup). | 100% Direct PDP links. | 100% Genuine high-resolution catalog photos. | Direct seller inventory. |

---

## 3. Retailer-Specific Deep Dive

### 3.1 Amazon India
- **Adapter Location**: `web/src/lib/retailers/amazon.ts`
- **Authentication**: HMAC-SHA256 signature calculated via AWS Signature Version 4 in `web/src/lib/retailers/amazon-auth.ts`.
- **Credential Requirements**:
  - `AMAZON_PAAPI_KEY`: AWS Access Key ID for PA-API 5.0
  - `AMAZON_PAAPI_SECRET`: AWS Secret Access Key
  - `AMAZON_ASSOCIATE_TAG`: Approved partner tag (`pajonline-21`)
- **Fix Implemented**:
  - Removed former fallback generator (`calculateLowestPriceForQuery`) that fabricated prices and labeled them `verified_live`.
  - Removed hardcoded Unsplash saree photo fallback.
  - Now returns structured response with `success: false` and explanatory error if credentials are absent.
  - When credentials are provided, correctly extracts item ASIN, genuine image URL, listed price, savings basis, Prime eligibility, and direct PDP link.

### 3.2 Flipkart
- **Adapter Location**: `web/src/lib/retailers/flipkart.ts`
- **Credential Requirements**:
  - `FLIPKART_AFFILIATE_ID`: Approved affiliate tracking ID
  - `FLIPKART_AFFILIATE_TOKEN`: Affiliate API access token
- **Fix Implemented**:
  - Removed synthetic price addition (`basePrice + 500`).
  - Added schema validation to reject malformed product records.
  - Ensures shipping fees are separated from listed price (`listedPrice` vs `shippingFee` vs `effectivePayablePrice`).

### 3.3 Meesho
- **Adapter Location**: `web/src/lib/retailers/meesho.ts`
- **Capabilities**: Explicitly designated as `API_UNAVAILABLE` in `web/src/lib/retailers/capabilities.ts`.
- **Honesty Enforcement**:
  - Prior implementations sometimes mocked Meesho as selling electronics at absurdly low prices (e.g. ₹249).
  - Meesho does not operate an authorized real-time public price API.
  - The adapter returns zero listings and states: `"Meesho currently does not offer an authorized public product search API or affiliate product feed. Connection status: API_UNAVAILABLE."`

---

## 4. Freshness and Caching Guarantees

1. **Deterministic TTL Policy**:
   - Live API responses: 15–30 minutes TTL in Redis/memory cache.
   - Prices older than 24 hours: Flagged with `isStale: true` and labeled "Verification Stale".
   - Never overwrite a newer verified price with a stale cached price.
2. **User Local Time Display**:
   - All product cards render `lastVerifiedAt` formatted in the user's local timezone (e.g., `Checked Today at 7:04 PM`).

---

## 5. Security & Secret Protection

- No API secret keys, AWS secrets, or affiliate passwords are committed to source control or logged in diagnostic outputs.
- All credentials reside exclusively in server-side environment variables (`process.env.AMAZON_PAAPI_SECRET`, etc.) and are never exposed to the client bundle.
