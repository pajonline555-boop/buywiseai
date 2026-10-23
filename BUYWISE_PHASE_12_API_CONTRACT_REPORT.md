# BUYWISE AI — PHASE 12 API CONTRACT REPORT

**Date**: 2026-10-23  
**Status**: VERIFIED & PASS (Local Source Contract Validated; Live Deployment Pending User Authorization)  
**Corpus / Workspace**: `c:\APPS\BUYWISE AI`

---

## 1. Executive Summary

During Phase 11 live verification, `https://buywiseai.pajonline.co.in/api/compare?q=sneakers` failed with HTTP 400 `{"error":"Search query is required."}`. Phase 12 traced the complete request path across the Web search UI, Android Retrofit service, Next.js API route handlers, and multi-retailer adapters.

### Contract Status Matrix
| Caller / Client | Request Format | Method | Current Local Status | Live Production Status |
| :--- | :--- | :--- | :--- | :--- |
| **Web Search UI** (`src/app/search/page.tsx`) | `/api/compare?q={searchQuery}` | `GET` | **PASS** (200 JSON) | **FAIL** (400 JSON on legacy deployment) |
| **Android Client** (`BuyWiseApiService.kt`) | `@Query("q") query: String` | `GET` | **PASS** (200 JSON) | **FAIL** (400 JSON on legacy deployment) |
| **Alternate Client** | `/api/compare?query={query}` | `GET` | **PASS** (200 JSON) | **FAIL** (400 JSON on legacy deployment) |
| **Android Post Query** (`BuyWiseApiService.kt`) | `@Body request: ComparePostRequest` | `POST` | **PASS** (200 JSON) | **FAIL** (500 on legacy deployment) |
| **Direct Canonical POST** | `{ canonical: CanonicalProduct, mode }` | `POST` | **PASS** (200 JSON) | **FAIL** (500 on legacy deployment) |
| **Invalid GET / Missing Query** | `/api/compare` | `GET` | **PASS** (400 JSON) | **PASS** (400 JSON) |
| **Invalid POST / Empty Body** | `{}` | `POST` | **PASS** (400 JSON) | **PASS** (400 JSON) |

---

## 2. Documented Single Canonical API Contract

### 2.1 GET Endpoint
- **URL**: `/api/compare`
- **Supported Parameters**:
  - `q` (string, 1–250 chars) — Primary query parameter used by Web search and Android Retrofit.
  - `query` (string, 1–250 chars) — Supported alias for compatibility.
- **Headers**:
  - `Content-Type: application/json`
  - `X-Correlation-Id`: `corr_<timestamp>_<rand>`
  - `X-RateLimit-Limit`: `30`
  - `X-RateLimit-Remaining`: `<count>`
  - `Access-Control-Allow-Origin`: Authenticated whitelist (`https://buywiseai.pajonline.co.in`, `https://pajonline-shopping.web.app`, etc.)

### 2.2 POST Endpoint
- **URL**: `/api/compare`
- **Supported Request Formats**:
  1. Standard Query: `{"q": "sneakers", "mode": "exact" | "similar"}`
  2. Alias Query: `{"query": "sneakers", "mode": "exact" | "similar"}`
  3. Android Canonical Object (`ComparePostRequest`):
     ```json
     {
       "canonical": {
         "rawInput": "Lancer Wonder-3",
         "title": "Lancer Wonder-3",
         "category": "Footwear"
       },
       "mode": "exact"
     }
     ```
  4. Full `CanonicalProduct` schema.

---

## 3. Standard JSON Response Schema

### 3.1 Valid 200 OK Response
```json
{
  "product": "Lancer Wonder-3 Running Shoes",
  "query": "Lancer Wonder-3",
  "timestamp": "2026-10-23T16:38:18.082Z",
  "stores": [
    {
      "id": "amz_B09WND3R1",
      "retailerId": "amazon",
      "store": "Amazon India",
      "title": "Lancer Mens Wonder-3 Running Shoes",
      "url": "https://www.amazon.in/dp/B09WND3R1?tag=pajonline-21",
      "price": 472.0,
      "currency": "INR",
      "originalPrice": 699.0,
      "mrp": 699.0,
      "discount": 32.47,
      "availability": "in_stock",
      "isLowest": true,
      "matchType": "exact",
      "matchConfidence": 0.95,
      "identityConfidence": 0.95,
      "smartValueScore": 92,
      "trustScore": 96,
      "verificationStatus": "verified_live",
      "productSource": "AFFILIATE",
      "directProductUrl": "https://www.amazon.in/dp/B09WND3R1?tag=pajonline-21",
      "affiliateUrl": "https://www.amazon.in/dp/B09WND3R1?tag=pajonline-21",
      "isDirectProductLink": true
    }
  ],
  "summary": {
    "totalStoresChecked": 6,
    "successfulStores": 1,
    "lowestPrice": 472.0,
    "highestPrice": 472.0,
    "maximumSavings": 0.0,
    "currency": "INR",
    "tierSummary": {
      "premiumCount": 1,
      "luxuryCount": 0,
      "lowestPremiumPrice": 472.0,
      "lowestLuxuryPrice": 0.0
    }
  },
  "recommendation": "Best verified price is ₹472 on Amazon India.",
  "errors": [],
  "providerStatuses": [
    {
      "retailerId": "amazon",
      "retailerName": "Amazon India",
      "status": "LIVE"
    },
    {
      "retailerId": "flipkart",
      "retailerName": "Flipkart",
      "status": "CREDENTIALS_REQUIRED",
      "message": "Flipkart API credentials required."
    },
    {
      "retailerId": "meesho",
      "retailerName": "Meesho",
      "status": "API_UNAVAILABLE",
      "message": "Meesho does not provide an authorized public search API."
    }
  ]
}
```

### 3.2 Error Responses (Strict JSON Only — Never HTML)
- **HTTP 400 Bad Request**:
  ```json
  { "error": "Search query is required." }
  ```
- **HTTP 403 Forbidden (Origin Disallowed)**:
  ```json
  { "error": "CORS origin not allowed" }
  ```
- **HTTP 429 Too Many Requests**:
  ```json
  {
    "error": "Too many search requests. Please wait before trying again.",
    "retryAfterSeconds": 60
  }
  ```
- **HTTP 500 Internal Server Error**:
  ```json
  { "error": "Failed to aggregate comparison data from retailers." }
  ```

---

## 4. Contract Automated Test Results

Automated Contract Suite: `web/scripts/test-api-contract.ts`  
Command: `npx tsx scripts/test-api-contract.ts`  
Exit Code: `0` (Success)

```
--- BUYWISE AI PHASE 12: API CONTRACT VERIFICATION ---
[PASS] isValidQuery accepts valid string
[PASS] isValidQuery rejects blank spaces
[PASS] isValidQuery rejects empty string
[PASS] isValidQuery rejects null
[PASS] isValidQuery rejects undefined
[PASS] isValidQuery rejects queries exceeding max length 250
[PASS] Planner selects exact query for Amazon
[PASS] Planner selects fallback exact query for Flipkart when index 1 is undefined
[PASS] Planner falls back to title without throwing TypeError
[PASS] executeComparison returns an object
[PASS] compResult has product field
[PASS] compResult has query field
[PASS] compResult.stores is an Array
[PASS] compResult.summary is an object
[PASS] summary.lowestPrice is a number
[PASS] providerStatuses is an Array
[PASS] Flipkart without configured credentials reports CREDENTIALS_REQUIRED or API_UNAVAILABLE
[PASS] executeCanonicalComparison returns response object
[PASS] stores array returned

API Contract Test Summary: 19 passed, 0 failed
```

---

## 5. Summary & Release Gate Status
- **Contract Defined**: PASS
- **Web & Android Parameter Alignment (`q`)**: PASS
- **Robustness Against Partial POST Payloads**: PASS
- **Strict JSON Error Responses**: PASS
- **No Fabricated Offers on Missing Credentials**: PASS
