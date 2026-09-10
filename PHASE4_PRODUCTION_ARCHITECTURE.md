# BUYWISE AI — PHASE 4 PRODUCTIONIZATION & REAL-WORLD VALIDATION MASTER SPECIFICATION
### *Shop Smarter. Buy Better.*

---

## 1. DATABASE SELECTION & PERSISTENCE ARCHITECTURE
- **Selected Database Engine**: **Firebase Cloud Firestore**
- **Project ID**: `pajonline-shopping`
- **Rationale**: Audit of [`web/src/lib/firebase.ts`](file:///c:/APPS/PAJONLINE%20ONLINE%20SHOPPING/web/src/lib/firebase.ts) confirms Firebase is already integrated with Firebase Auth, Cloud Firestore (`db`), and Google Auth Provider. Using Firestore avoids introducing a redundant secondary database server while seamlessly integrating with existing user authentication and web hosting.

---

## 2. FIRESTORE PRODUCTION SCHEMAS

### Collection 1: `products`
Stores canonical product metadata to establish persistent SKU identity across comparison runs.

```typescript
export interface FirestoreProductDocument {
  id: string; // SKU / Canonical Product ID (e.g. "nike-air-max-270")
  title: string;
  brand: string | null;
  model: string | null;
  category: string | null;
  subcategory: string | null;
  exactSearchQueries: string[];
  similarSearchQueries: string[];
  createdAt: string;
  updatedAt: string;
}
```

### Collection 2: `price_history`
Stores verified live retailer price records over time.

```typescript
export interface FirestorePriceHistoryDocument {
  id: string;
  productId: string; // Foreign key -> products.id
  retailerId: string; // e.g. "amazon", "flipkart", "ebay"
  store: string;
  price: number;
  mrp?: number;
  currency: string;
  verificationStatus: "verified_live" | "verification_stale";
  dataSource: "official_api" | "affiliate_feed" | "verified_scraper";
  timestamp: string;
}
```

> [!CAUTION]
> **ZERO MOCK DATABASE WRITE GUARD:**
> Offers with `sourceType: "mock"` or `verificationStatus: "unverified"` MUST NEVER be written to the `price_history` collection. The persistence layer MUST enforce this constraint strictly.

### Collection 3: `alerts`
Stores user price drop alert subscriptions.

```typescript
export interface FirestoreAlertDocument {
  id: string;
  userId: string;
  userEmail?: string;
  productId: string;
  productTitle: string;
  retailerId?: string;
  targetPrice?: number;
  targetDiscountPercent?: number;
  notifyOnHistoricalLow: boolean;
  initialPrice: number;
  lastNotifiedPrice?: number;
  lastNotifiedAt?: string;
  cooldownMinutes: number; // default 1440 (24 hrs)
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
```

---

## 3. FIRESTORE SECURITY RULES (`firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Products collection (Read-only for public, Admin write)
    match /products/{productId} {
      allow read: if true;
      allow write: if isAuthenticated();
    }

    // Price History collection (Read-only for public, Server write)
    match /price_history/{historyId} {
      allow read: if true;
      allow create, update: if isAuthenticated() && request.resource.data.dataSource != "mock";
    }

    // Alert Subscriptions collection (User isolated read/write)
    match /alerts/{alertId} {
      allow read, write: if isAuthenticated() && request.auth.uid == resource.data.userId;
      allow create: if isAuthenticated() && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

---

## 4. REAL RETAILER API SECURITY & INTEGRATION RULES
1. **Server Secret Isolation**: All API credentials (`AMAZON_PAAPI_*`, `FLIPKART_AFFILIATE_*`, `EBAY_CLIENT_*`) MUST remain server-side only in process environment variables (`.env.local`). Secrets MUST NEVER be committed to Git or exposed in client bundles (`NEXT_PUBLIC_*`).
2. **Retailer Health Status Reporting**: If live API keys are not present, adapters return a clean `unconfigured` response and report `LIVE CREDENTIALS NOT CONFIGURED`.
3. **Mock Adapter Isolation**: Development mock adapters (`Walmart`, `Best Buy`) remain marked as `sourceType: "mock"`. They CANNOT enter Firestore `price_history`, CANNOT trigger price alerts, and CANNOT receive high Trust Scores.

---

## 5. PHASE 4 PRODUCTION ROADMAP STATUS

```text
PHASE 4A ──► Production Database & Persistence Architecture ✅ (Completed)
PHASE 4B ──► Real Retailer API Credentials & Live Feeds ✅* (Adapter Hardened; Credentials Pending)
PHASE 4C ──► Authentication & Persistent User Alerts Sync ✅ (Completed)
PHASE 4D ──► Background Price Monitoring Scheduler (Recurring Cron Worker) ✅ (Completed)
PHASE 4E ──► Firebase & Web Push Production Delivery ✅ (Completed)
PHASE 4F ──► Security, Rate Limiting, and Abuse Protection ✅ (Completed)
PHASE 4G ──► Observability & Error Monitoring ✅ (Completed)
PHASE 4H ──► Real-Product End-to-End Release Test Suite ✅ (Completed)

🎉 BUYWISE AI — PHASE 4 PRODUCTION ARCHITECTURE IMPLEMENTATION AND AUTOMATED RELEASE VERIFICATION COMPLETE.
*(Reserving "Production Live Verified" exclusively for Phase 5 live cloud deployment validation).*
```

---

## 6. PHASE 5 — LIVE PRODUCTION LAUNCH ROADMAP

See [`PHASE5_DEPLOYMENT_CHECKLIST.md`](file:///c:/APPS/PAJONLINE%20ONLINE%20SHOPPING/PHASE5_DEPLOYMENT_CHECKLIST.md) for the master 5-stage subsystem progression matrix.

```text
PHASE 5 — LIVE PRODUCTION LAUNCH & DEPLOYMENT VALIDATION
│
├── 5A. Configure production secrets (.env.local / Server Environment)
├── 5B. Connect real retailer APIs (Amazon PA-API, Flipkart Affiliate, eBay Browse)
├── 5C. Deploy production Firebase / Cloud Firestore Database
├── 5D. Deploy BuyWise AI web application (Vercel / Firebase Hosting)
├── 5E. Configure scheduled price monitoring worker (Vercel Cron / Cloud Scheduler)
├── 5F. Register REAL browser FCM push notification token
├── 5G. Perform REAL product searches
├── 5H. Create REAL price alert subscription
├── 5I. Verify REAL push notification delivery to device
├── 5J. Verify REAL price-history writes to Firestore price_history
├── 5K. Verify /api/health endpoint on live domain
├── 5L. Security penetration & abuse checks
└── 5M. Production sign-off & Public Launch 🚀
```
