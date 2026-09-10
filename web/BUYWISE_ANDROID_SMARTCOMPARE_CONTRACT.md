# BUYWISE AI ANDROID — SMARTCOMPARE API CONTRACT

**Target Package:** `com.pajonline.buywiseai`  
**Web Endpoint Source:** `c:\APPS\BUYWISE AI\web\src\app\api\compare\route.ts`  
**Date:** September 6, 2026  
**Contract Version:** 1.0.0

---

## 1. ENDPOINT MATRIX

* **Endpoint:** `/api/compare`
* **HTTP Methods:** `GET` (query params `?q=...`) & `POST` (canonical JSON body)
* **Authentication:** Public / Guest Accessible
* **Rate Limits:** 60 requests/min per IP
* **Headers:** `Content-Type: application/json`, `X-Correlation-Id: <uuid>`

---

## 2. REQUEST CONTRACT

### GET `/api/compare?q={query}`
* `q` (string, **REQUIRED**): Product search query (e.g. `"Saree"`, `"iPhone 17"`). Must be sanitized text.

### POST `/api/compare`
```json
{
  "canonical": {
    "rawInput": "iPhone 17",
    "title": "iPhone 17",
    "category": "Electronics"
  },
  "mode": "exact"
}
```

---

## 3. RESPONSE CONTRACT (`ComparisonResponse`)

```json
{
  "product": "iPhone 17",
  "query": "iPhone 17",
  "timestamp": "2026-09-06T10:20:00.000Z",
  "summary": {
    "totalStoresChecked": 14,
    "successfulStores": 4,
    "lowestPrice": 74999,
    "highestPrice": 79999,
    "maximumSavings": 5000,
    "currency": "INR"
  },
  "recommendation": "BuyWise AI identifies Amazon India as the Best Value choice...",
  "stores": [
    {
      "id": "amz_123",
      "retailerId": "amazon_in",
      "store": "Amazon India",
      "title": "Apple iPhone 17 (128 GB) - Blue",
      "url": "https://www.amazon.in/dp/B0D12345?tag=pajonline-21",
      "price": 74999,
      "currency": "INR",
      "mrp": 79999,
      "discount": 5000,
      "imageUrl": "https://m.media-amazon.com/images/I/71xyz.jpg",
      "rating": 4.6,
      "reviewCount": 1240,
      "availability": "in_stock",
      "isLowest": true,
      "isBestValue": true,
      "smartValueScore": 92,
      "trustScore": 96,
      "verificationStatus": "verified_live",
      "tryOnEnabled": false
    }
  ],
  "errors": []
}
```

---

## 4. FIELD PARITY MATRIX

| Field Name | Type | Status | Android Kotlin Model Field |
| :--- | :--- | :--- | :--- |
| `product` | String | **REQUIRED** | `product: String` |
| `query` | String | **REQUIRED** | `query: String` |
| `timestamp` | String | **REQUIRED** | `timestamp: String` |
| `summary` | Object | **REQUIRED** | `summary: ComparisonSummary` |
| `stores` | Array<StoreOffer> | **REQUIRED** | `stores: List<StoreOffer>` |
| `id` | String | **REQUIRED** | `id: String` |
| `store` | String | **REQUIRED** | `store: String` |
| `title` | String | **REQUIRED** | `title: String` |
| `url` | String | **REQUIRED** | `url: String` |
| `price` | Double | **REQUIRED** | `price: Double` |
| `currency` | String | **REQUIRED** | `currency: String` |
| `mrp` | Double | **OPTIONAL / NULLABLE** | `mrp: Double? = null` |
| `discount` | Double | **OPTIONAL / NULLABLE** | `discount: Double? = null` |
| `imageUrl` | String | **OPTIONAL / NULLABLE** | `imageUrl: String? = null` |
| `rating` | Double | **OPTIONAL / NULLABLE** | `rating: Double? = null` |
| `reviewCount` | Int | **OPTIONAL / NULLABLE** | `reviewCount: Int? = null` |
| `smartValueScore` | Int | **OPTIONAL / NULLABLE** | `smartValueScore: Int? = null` |
| `trustScore` | Int | **OPTIONAL / NULLABLE** | `trustScore: Int? = null` |
| `verificationStatus`| String | **OPTIONAL / NULLABLE** | `verificationStatus: String? = null` |
| `tryOnEnabled` | Boolean | **OPTIONAL / NULLABLE** | `tryOnEnabled: Boolean? = false` |
