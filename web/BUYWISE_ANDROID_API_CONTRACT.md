# BUYWISE AI — ANDROID API CONTRACT SPECIFICATION

**VERSION:** 1.0  
**TIMESTAMP:** 2026-09-06T14:10:00+05:30  
**TARGET APP:** BuyWise AI Native Android Application (`com.pajonline.buywiseai`)  
**BACKEND HOST:** Next.js Web Server (`http://localhost:3000` / Production Host)  

---

## 1. DEFINITIVE ENDPOINTS MATRIX

| Endpoint | Method | Auth | Guest | Timeout | Rate Limit | Privacy Classification | Production Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/compare` | `GET` / `POST` | Optional | Allowed | 15s | 60 req/min | Public Product Data | 🟢 **LIVE** |
| `/api/vto/generate` | `POST` | Optional | Allowed | 60s | 10 req/min | Private Image - Temporary AI | 🟢 **LIVE** |
| `/api/vto/analyze` | `POST` | Optional | Allowed | 15s | 30 req/min | Private Image - Local Validation | 🟢 **LIVE** |
| `/api/scrape-product` | `POST` | Optional | Allowed | 20s | 30 req/min | Public Product URL | 🟢 **LIVE** |
| `/api/vision/analyze` | `POST` | Optional | Allowed | 25s | 20 req/min | Search Photo Payload | 🟢 **LIVE** |
| `/api/chat` | `POST` | Optional | Allowed | 20s | 30 req/min | Text Chat Query | 🟢 **LIVE** |
| `/api/health` | `GET` | None | Allowed | 5s | Unlimited | Telemetry Data | 🟢 **LIVE** |
| `/api/blog/generate` | `POST` | Required | Denied | 30s | 5 req/min | Internal CMS Data | 🟢 **LIVE** |

---

## 2. DETAILED ENDPOINT SCHEMAS

### 2.1 `/api/compare` (SmartCompare Price Matrix)
- **Method:** `GET` (keyword query `?q=saree`) or `POST` (canonical product object)
- **Authentication:** Optional (Guest Mode Supported)
- **GET Request:** `GET /api/compare?q=iPhone+16`
- **POST Request Body:**
```json
{
  "canonical": {
    "title": "Kanjivaram Silk Saree",
    "category": "sarees_ethnic",
    "brand": "SilkCraft"
  },
  "mode": "exact"
}
```
- **Success Response (200 OK):**
```json
{
  "canonicalProduct": {
    "title": "Kanjivaram Silk Saree",
    "category": "sarees_ethnic"
  },
  "stores": [
    {
      "storeName": "Amazon India",
      "price": 3499,
      "mrp": 6999,
      "availability": true,
      "productUrl": "https://www.amazon.in/dp/B0FNWFT4FB?tag=pajonline-21",
      "imageUrl": "https://images-na.ssl-images-amazon.com/images/P/B0FNWFT4FB.jpg",
      "effectivePrice": 3199,
      "couponCode": "BUYWISE300"
    }
  ],
  "smartValueScore": 96
}
```
- **Error Response (429 / 500):**
```json
{
  "error": "Too many search requests. Please wait before trying again.",
  "retryAfterSeconds": 30
}
```

---

### 2.2 `/api/vto/generate` (Real AI Virtual Try-On)
- **Method:** `POST`
- **Authentication:** Optional (Guest Access Supported)
- **Privacy Classification:** Private User Image — Temporary Server-Side HTTPS Transmission
- **Request Body:**
```json
{
  "userPhoto": {
    "url": "data:image/jpeg;base64,...",
    "mimeType": "image/jpeg",
    "width": 800,
    "height": 1200
  },
  "product": {
    "id": "prod_kanjivaram_01",
    "title": "Royal Silk Saree",
    "price": 3499,
    "store": "SilkCraft",
    "productUrl": "https://www.amazon.in/dp/B0FNWFT4FB",
    "imageUrl": "https://images.unsplash.com/photo-1610030469983-98e550d6193c",
    "category": "sarees_ethnic",
    "drapeStyle": "Nivi"
  },
  "drapeStyle": "Nivi"
}
```
- **Success Response (200 OK):**
```json
{
  "success": true,
  "resultImageUrl": "data:image/png;base64,...",
  "job": {
    "id": "tryon_1788680000",
    "providerId": "huggingface_idm_vton",
    "status": "COMPLETED",
    "drapeStyle": "Nivi",
    "resultImageUrl": "data:image/png;base64,..."
  }
}
```
- **Error Response (502 / 400):**
```json
{
  "success": false,
  "code": "VTO_GENERATION_FAILED",
  "message": "Virtual try-on generation could not be completed."
}
```

---

### 2.3 `/api/scrape-product` (Retailer URL Product Import)
- **Method:** `POST`
- **Authentication:** Optional (Guest Mode Supported)
- **Request Body:**
```json
{
  "url": "https://www.amazon.in/dp/B0FNWFT4FB?tag=pajonline-21"
}
```
- **Success Response (200 OK):**
```json
{
  "success": true,
  "store": "Amazon India",
  "title": "Silk Kanjivaram Saree with Zari Border",
  "image": "https://images-na.ssl-images-amazon.com/images/P/B0FNWFT4FB.01._SCLZZZZZZZ_.jpg",
  "price": 3499,
  "mrp": 6999,
  "asin": "B0FNWFT4FB"
}
```

---

### 2.4 `/api/vision/analyze` (Search by Image Vision AI)
- **Method:** `POST`
- **Request Body:**
```json
{
  "image": "data:image/jpeg;base64,...",
  "mode": "exact"
}
```
- **Success Response (200 OK):**
```json
{
  "success": true,
  "detectedGarment": "Saree",
  "primaryColor": "Crimson Red",
  "pattern": "Zari Brocade",
  "searchKeywords": ["silk saree", "kanjivaram", "red sari"]
}
```

---

### 2.5 `/api/chat` (BuyWise Intelligence Assistant)
- **Method:** `POST`
- **Request Body:**
```json
{
  "messages": [
    { "role": "user", "content": "Which phone is better for photography under ₹50,000?" }
  ]
}
```
- **Success Response (200 OK):**
```json
{
  "role": "assistant",
  "content": "Based on BuyWise SmartCompare data..."
}
```

---

### 2.6 `/api/health` (Telemetry Endpoint)
- **Method:** `GET`
- **Success Response (200 OK):**
```json
{
  "status": "degraded",
  "brand": "BuyWise AI",
  "tagline": "Shop Smarter. Buy Better.",
  "version": "0.1.0",
  "environment": "production",
  "timestamp": "2026-09-06T14:10:00.000Z",
  "services": {
    "auth": "operational",
    "database": "operational",
    "scheduler": "operational",
    "notifications": "operational"
  }
}
```
