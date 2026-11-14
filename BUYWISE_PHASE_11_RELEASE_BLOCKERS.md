# BUYWISE AI — PHASE 11: RELEASE BLOCKERS & ACTION PLAN

**Project**: `C:\APPS\BUYWISE AI`  
**Date**: October 23, 2026  
**Auditor**: Google Antigravity Advanced Agentic Coding Engine  
**Release Gate Status**: **NOT READY FOR PRODUCTION DEPLOYMENT**

---

## 1. Release Blocker Summary

While 100% of local regression tests (31/31) and build checks have passed on both Web and Android, **BuyWise AI cannot be released to production until the following blockers are resolved by the project owner**.

```
+---------------------------------------------------------------------------------------------------------+
|                                    PRODUCTION RELEASE BLOCKER REGISTER                                   |
+----+----------+-------------------------------------------------------+------------------+--------------+
| ID | Severity | Blocker Description                                   | Category         | Status       |
+----+----------+-------------------------------------------------------+------------------+--------------+
| B1 | CRITICAL | Live Firebase App Hosting /api/compare returns HTTP 400 | Live Hosting     | ❌ BLOCKED    |
| B2 | CRITICAL | Amazon PA-API 5.0 Credentials Missing in Production  | Live Credentials | ❌ BLOCKED    |
| B3 | HIGH     | Flipkart Affiliate Credentials Missing in Production | Live Credentials | ❌ BLOCKED    |
| B4 | MEDIUM   | Android Production Release Approval Pending           | Release Approval | ⏸️ ON HOLD   |
| B5 | INFO     | Meesho Public API Limitation (API_UNAVAILABLE)        | Provider Status  | ℹ️ DISCLOSED  |
+----+----------+-------------------------------------------------------+------------------+--------------+
```

---

## 2. Detailed Blocker Analysis

### Blocker B1: Live Production Hosting Mismatch & API 400 Failure
- **Severity**: **CRITICAL**
- **Impact**: When the Android client or web client queries `https://buywiseai.pajonline.co.in/api/compare?q=sneakers`, the live Envoy / Firebase App Hosting server returns:
  ```json
  HTTP/1.1 400 Bad Request
  {"error":"Search query is required."}
  ```
  This HTTP 400 failure triggers Android's repository fallback mechanism in `SmartCompareRepository.kt`, forcing mobile users into offline intelligence mode where only pre-calibrated data is shown.
- **Root Cause**: The live host is currently running an older Next.js 14 deployment (`x-fah-adapter: nextjs-14.0.21`). The local codebase has been upgraded to Next.js 16 (`web@0.1.0`), where Turbopack build succeeds (`138/138` static routes generated, dynamic `/api/compare` registered).
- **Resolution Required**:
  1. Project owner must approve deployment of the local Next.js 16 build to Firebase App Hosting.
  2. Deploy via `firebase deploy --only apphosting` or GitHub CI/CD pipeline after credentials are configured.
- **Safety Constraint**: Per Mandatory Safety Rule 7, Antigravity has not modified hosting configurations or triggered a production deployment.

### Blocker B2: Live Amazon India PA-API 5.0 Credentials Missing
- **Severity**: **CRITICAL**
- **Impact**: Amazon India live price verification cannot query Amazon's catalog without authorized PA-API 5.0 credentials. Currently, `web/.env.local` contains `AMAZON_ASSOCIATE_TAG=pajonline-21`, but lacks:
  - `AMAZON_PAAPI_KEY` (AWS Access Key ID)
  - `AMAZON_PAAPI_SECRET` (AWS Secret Access Key)
- **Current Behavior**: Under our Zero Data Fabrication policy, the Amazon adapter truthfully returns `CREDENTIALS_REQUIRED`. It does not invent prices or fake live statuses.
- **Resolution Required**:
  1. The project owner must obtain or renew active PA-API 5.0 credentials from the Amazon Associates portal.
  2. Confirm that the Amazon Associates account has completed 3 qualifying sales within the past 180 days (Amazon requirement to retain active API access).
  3. Add the keys to `web/.env.local` and the production Firebase App Hosting environment secrets.

### Blocker B3: Flipkart Affiliate API Credentials Missing
- **Severity**: **HIGH**
- **Impact**: Flipkart live prices and stock availability cannot be verified via real-time feeds without affiliate credentials.
- **Current Behavior**: Flipkart adapter reports `CREDENTIALS_REQUIRED`.
- **Resolution Required**:
  1. Configure `FLIPKART_AFFILIATE_ID` and `FLIPKART_AFFILIATE_TOKEN` in `web/.env.local` and production environment secrets.

### Blocker B4: Android Mobile Release Approval
- **Severity**: **MEDIUM**
- **Impact**: Android unit tests passed (`BUILD SUCCESSFUL in 28s`), and `SmartMarketIntelligence.kt` has been updated with the ₹472 Lancer price, unique shoe images, and partner tags. However, publishing a new APK or Google Play release requires manual review and signing by the project owner.
- **Resolution Required**:
  1. Build release APK/AAB (`./gradlew assembleRelease` or bundle).
  2. Test on a physical Android test device.
  3. Deploy update to Google Play Console.

### Blocker B5: Meesho Provider Limitation (Informational)
- **Severity**: **INFORMATIONAL**
- **Status**: **RESOLVED VIA HONEST DISCLOSURE**
- **Detail**: Meesho operates no public developer search API. Rather than fabricating mock listings, BuyWise AI explicitly designates Meesho as `API_UNAVAILABLE`. If a commercial feed (e.g. Cuelinks) is contracted in the future, it can be plugged in via `CUELINKS_API_KEY`.

---

## 3. Step-by-Step Production Launch Checklist

Follow these exact steps to achieve `READY FOR PRODUCTION`:

1. [ ] **Step 1: Obtain Credentials**
   - Retrieve Amazon PA-API 5.0 Access Key & Secret from Amazon Associates India Console.
   - Retrieve Flipkart Affiliate Tracking ID & Token.
2. [ ] **Step 2: Inject Environment Variables**
   - Add keys to `c:\APPS\BUYWISE AI\web\.env.local`:
     ```env
     AMAZON_PAAPI_KEY=your_key_here
     AMAZON_PAAPI_SECRET=your_secret_here
     AMAZON_ASSOCIATE_TAG=pajonline-21
     FLIPKART_AFFILIATE_ID=your_id_here
     FLIPKART_AFFILIATE_TOKEN=your_token_here
     ```
   - Add corresponding secrets in Firebase App Hosting secret manager.
3. [ ] **Step 3: Test Real Live API Request**
   - Run `npx tsx scripts/test-real-retailer-request.ts` to confirm that live PA-API returns HTTP 200 with genuine ASINs and prices.
4. [ ] **Step 4: Authorize and Deploy Web Backend**
   - Authorize deployment of the Next.js 16 build to Firebase App Hosting.
   - Verify that `https://buywiseai.pajonline.co.in/api/compare?q=shoes` returns HTTP 200 JSON with live store offers.
5. [ ] **Step 5: Sign & Release Android App**
   - Build production release AAB in Android Studio.
   - Confirm that the Android app receives HTTP 200 from the live backend without falling back to offline mode.
6. [ ] **Step 6: Release Gate Final Sign-Off**
   - Re-evaluate release gate to mark **READY FOR PRODUCTION**.
