# Retailer Adapter Integration & Architecture Guide

> **Document Version:** 1.5.0  
> **Target Module:** SmartCompare Multi-Retailer Comparison System (`/web/src/lib/retailers`)

---

## 1. Architecture Overview

SmartCompare uses an isolated **Retailer Adapter Pattern**. The API route (`/api/compare`) acts purely as an orchestrator, delegating queries to the `RetailerRegistry` and `executeComparison()` engine.

```text
[GET /api/compare?q=...]
         │
         ▼
[executeComparison()] (Parallel Promise.allSettled + 8s Timeout)
         │
  ┌──────┴─────────┬──────────────┬──────────────┬──────────────┐
  ▼                ▼              ▼              ▼              ▼
[AmazonAdapter] [FlipkartAdapter] [EbayAdapter]  [MeeshoAdapter] [Walmart/BestBuy]
 (PA-API 5.0)    (Affiliate API)   (Browse API)   (Unavailable)    (Mock)
```

---

## 2. Supported Retailers & Operational Status

Every offer identifies how its data was obtained via `sourceType`:

| Retailer | ID | Source Type (`sourceType`) | Status | Operational Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Amazon India** | `amazon` | `api` / `unavailable` | **CONFIGURED (PA-API 5.0)** | Calls Amazon PA-API 5.0 using AWS SigV4 signed requests when credentials exist; returns explicit unconfigured status when absent. |
| **Flipkart** | `flipkart` | `api` / `unavailable` | **CONFIGURED (Affiliate API)** | Queries official Flipkart Affiliate API (`search.json`) when `FLIPKART_AFFILIATE_ID` exists; returns explicit unconfigured status when absent. |
| **eBay** | `ebay` | `api` / `unavailable` | **CONFIGURED (OAuth 2.0 Browse API)** | Acquires and caches OAuth 2.0 bearer token server-side to query eBay Browse API (`/item_summary/search`); returns explicit unconfigured status when absent. |
| **Meesho** | `meesho` | `unavailable` | **UNAVAILABLE** | Returns `success: false` gracefully without fabricating fake prices. |
| **Walmart** | `walmart` | `mock` | Active (Demo) | Placeholder structure ready for Walmart Developer API key. |
| **Best Buy** | `bestbuy` | `mock` | Active (Demo) | Placeholder structure ready for Best Buy API key. |

---

## 3. How to Add a New Retailer Adapter

1. **Create Adapter File** in `web/src/lib/retailers/[store_id].ts`:
   ```typescript
   import { RetailerAdapter, RetailerSearchResult } from './types';

   export class MyntraAdapter implements RetailerAdapter {
     readonly id = 'myntra';
     readonly name = 'Myntra';
     readonly country = 'IN';
     readonly currency = 'INR';
     readonly enabled = true;

     async search(query: string): Promise<RetailerSearchResult> {
       // Server-side fetch logic using environment credentials
     }
   }
   export const myntraAdapter = new MyntraAdapter();
   ```

2. **Register Adapter** in `web/src/lib/retailers/registry.ts`:
   ```typescript
   import { myntraAdapter } from './myntra';
   this.register(myntraAdapter);
   ```

---

## 4. Error Handling & Resilience Architecture

* **Zero Hardcoded Credentials:** All authentication uses server-side environment variables.
* **Graceful Unconfigured Operation:** Adapters verify credential presence before making network calls. If credentials are missing, they return explicit unconfigured statuses without crashing or producing fake prices.
* **Timeout Protection:** Every adapter call is wrapped in an 8,000ms `Promise.race()` timeout.
* **Failure Isolation:** Uses `Promise.allSettled()`. If a single retailer times out or is unconfigured, all valid offers from active retailers are returned cleanly.
* **Price Validation:** Invalid prices (`NaN`, `<= 0`, `null`) are filtered out prior to lowest-price calculations.

---

## 5. Environment Variables & Credentials Reference

| Variable Name | Scope | Purpose | Required |
| :--- | :--- | :--- | :--- |
| `AMAZON_PAAPI_KEY` | Server-side | Amazon PA-API 5.0 Access Key | Required for live Amazon API |
| `AMAZON_PAAPI_SECRET` | Server-side | Amazon PA-API 5.0 Secret Key | Required for live Amazon API |
| `AMAZON_ASSOCIATE_TAG` | Server-side | Amazon India Associate Tag | Required for live Amazon API |
| `FLIPKART_AFFILIATE_ID` | Server-side | Flipkart Affiliate ID | Required for live Flipkart API |
| `FLIPKART_AFFILIATE_TOKEN` | Server-side | Flipkart Affiliate Token | Required for live Flipkart API |
| `EBAY_CLIENT_ID` | Server-side | eBay OAuth 2.0 Client ID | Required for live eBay API |
| `EBAY_CLIENT_SECRET` | Server-side | eBay OAuth 2.0 Client Secret | Required for live eBay API |
| `OPENAI_API_KEY` | Server-side | Powers AI Assistant & AI Vision product detection | Optional (Falls back to Demo mode) |
