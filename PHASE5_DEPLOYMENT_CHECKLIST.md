# BUYWISE AI — PHASE 5 DEPLOYMENT-READINESS CHECKLIST
> **Shop Smarter. Buy Better.**

---

## 1. Subsystem 5-Stage Status Progression Matrix

```text
 🔵 STAGE 1: IMPLEMENTATION VERIFIED  (Phase 4 Complete — Architecture & automated tests pass)
      │
      ▼
 🟡 STAGE 2: CONFIGURED               (Secrets & env variables set in hosting environment)
      │
      ▼
 🟣 STAGE 3: DEPLOYED                 (Deployed to cloud host with Firestore security rules)
      │
      ▼
 🟠 STAGE 4: LIVE TESTED              (Real API queries, real FCM device push, live DB writes)
      │
      ▼
 🟢 STAGE 5: PRODUCTION LIVE VERIFIED (Final public release sign-off 🚀)
```

| Subsystem Component | 🔵 Implementation Verified | 🟡 Configured | 🟣 Deployed | 🟠 Live Tested | 🟢 Production Live Verified |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Amazon PA-API 5.0 Adapter** | ✅ | ⏳ Pending Keys | ⏳ | ⏳ | ⏳ |
| **Flipkart Affiliate API Adapter** | ✅ | ⏳ Pending Keys | ⏳ | ⏳ | ⏳ |
| **eBay Browse API v1 Adapter** | ✅ | ⏳ Pending Keys | ⏳ | ⏳ | ⏳ |
| **Cloud Firestore Database (`db`)** | ✅ | ⏳ Project Link | ⏳ Rules | ⏳ Writes | ⏳ |
| **Firebase Auth User Sync** | ✅ | ⏳ Domain Link | ⏳ Rules | ⏳ Login | ⏳ |
| **Price Monitoring Scheduler** | ✅ | ⏳ Cron Secret | ⏳ Trigger | ⏳ Cycle | ⏳ |
| **FCM & Web Push Provider** | ✅ | ⏳ VAPID Keys | ⏳ SW Active | ⏳ Device Push | ⏳ |
| **Security & CORS Allowlist** | ✅ | ⏳ Origin Set | ⏳ Active | ⏳ Rate Test | ⏳ |
| **Observability & /api/health** | ✅ | ⏳ Sentry DSN | ⏳ Live Domain | ⏳ Ping | ⏳ |

---

## 2. Phase 5 Execution Sequence (5A → 5M)

### 5A — Production Secrets Configuration
- [x] Create secret-safe configuration validator ([`scratch/verify_phase5a.ts`](file:///C:/Users/Pngag/.gemini/antigravity-ide/brain/d340bf80-e4de-4f22-b2cc-a2d5e8f9f982/scratch/verify_phase5a.ts)) with 0 secret leaks
- [ ] Configure `AMAZON_PAAPI_KEY`, `AMAZON_PAAPI_SECRET`, `AMAZON_ASSOCIATE_TAG` in server environment
- [ ] Configure `FLIPKART_AFFILIATE_ID`, `FLIPKART_AFFILIATE_TOKEN` in server environment
- [ ] Configure `EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET` in server environment
- [ ] Configure `FIREBASE_SERVICE_ACCOUNT_KEY` & `NEXT_PUBLIC_FIREBASE_VAPID_KEY`
- [ ] Configure `BUYWISE_CRON_SECRET` & `SENTRY_DSN` (Optional)

### 5B — Live Retailer API Verification
- [ ] Execute test query to Amazon PA-API 5.0 → confirm `verified_live` response status
- [ ] Execute test query to Flipkart Affiliate API → confirm `verified_live` response status
- [ ] Execute test query to eBay Browse API → confirm `verified_live` response status

### 5C — Production Firestore Deployment
- [ ] Deploy Cloud Firestore database project
- [ ] Apply `firestore.rules` (user isolation, `price_history`, `notification_tokens`, `rate_limits`)

### 5D — Web Application Cloud Deployment
- [ ] Deploy Next.js build to Vercel / Firebase Hosting
- [ ] Confirm all 16 static and dynamic routes compile and render cleanly on custom domain

### 5E — Scheduled Price Monitoring Worker Activation
- [ ] Configure Vercel Cron / Cloud Scheduler to invoke `/api/scheduler` with `x-buywise-cron-secret`
- [ ] Verify `runPriceMonitoringCycle()` completes execution cycle without errors

### 5F — Real Browser / Device FCM Token Registration
- [ ] Grant Web Push notification permissions on a physical browser/device
- [ ] Verify active token document is written to Firestore `notification_tokens` collection

### 5G — Real Product Search & Multi-Store Comparison
- [ ] Perform search for a live retail product on the deployed application
- [ ] Verify exact identity matcher, Smart Value Score, and Trust Score compute using real prices

### 5H — Real Price Alert Subscription Creation
- [ ] Create price drop alert subscription for an active product

### 5I — Real Device Push Notification Delivery Verification
- [ ] Trigger price drop condition and verify push notification appears on physical device screen

### 5J — Real Price-History Firestore Writes Verification
- [ ] Query Firestore `price_history` collection and confirm verified live price records exist

### 5K — Live Operational Health Endpoint Verification
- [ ] Query `/api/health` on live domain and confirm status transitions from `degraded` to `healthy`

### 5L — Security Penetration & Abuse Protection Checks
- [ ] Test rate limiting (HTTP 429), CORS origin restriction (HTTP 403), and secret-free audit logging

### 5M — Final Production Sign-off & Public Launch 🚀
- [ ] Obtain stakeholder approval and update status to **🟢 PRODUCTION LIVE VERIFIED**!

---

## 3. Mandatory Release Rule

> [!CAUTION]
> **HARD RELEASE RULE**: No Phase 5M sign-off unless all required components have passed Stages 1 → 2 → 3 → 4 in strict order:
> **Configured ≠ Deployed ≠ Live Tested ≠ Production Live Verified.**
> Subsystems MUST NOT be marked as live verified until real external API responses, persistent Firestore records, and physical browser push notifications are verified in the deployed production environment.
