# BUYWISE AI — PHASE 12 DEPLOYMENT AND ROLLBACK PLAN

**Target Environment**: Production (`https://buywiseai.pajonline.co.in`)  
**Hosting Target**: Firebase App Hosting (Google Cloud Run + Envoy)  
**Firebase Project**: `pajonline-shopping`  
**GitHub Repository**: `https://github.com/pajonline555-boop/buywiseai.git` (branch `main`)  
**Deployment Policy**: Gated — Requires explicit human authorization before execution.

---

## 1. Pre-Deployment Validation Checklist

All local checks have been executed and passed with zero errors:

| Check | Tool / Command | Exit Code | Result |
| :--- | :--- | :--- | :--- |
| **Phase 11 Acceptance Suite** | `npx tsx scripts/phase11-production-verification.ts` | 0 | **PASS (31/31 checks)** |
| **Phase 12 API Contract Suite**| `npx tsx scripts/test-api-contract.ts` | 0 | **PASS (19/19 checks)** |
| **Local API Smoke Tests** | `npx tsx scripts/test-local-api-smoke.ts` | 0 | **PASS (13/13 checks)** |
| **TypeScript Compilation** | `npx tsc --noEmit` | 0 | **PASS (0 errors)** |
| **Next.js Production Build** | `npm run build` | 0 | **PASS (138/138 routes, `/api/compare` designated Dynamic)** |
| **Android Unit Tests** | `.\gradlew.bat testDebugUnitTest` | 0 | **PASS (0 failures)** |

---

## 2. Retailer Integration Secrets Checklist

For full live multi-retailer price aggregation, the following secret names must be configured in Google Cloud Secret Manager / Firebase App Hosting:

| Secret Name | Integration | Usage | Current Status |
| :--- | :--- | :--- | :--- |
| `AMAZON_PAAPI_KEY` | Amazon India PA-API 5.0 | Request signature | Unconfigured (Safely returns `CREDENTIALS_REQUIRED`) |
| `AMAZON_PAAPI_SECRET` | Amazon India PA-API 5.0 | Request signature | Unconfigured (Safely returns `CREDENTIALS_REQUIRED`) |
| `AMAZON_ASSOCIATE_TAG` | Amazon India Associates | Affiliate attribution | Defaults to `pajonline-21` |
| `FLIPKART_AFFILIATE_ID` | Flipkart Affiliate API | Affiliate query | Unconfigured (Safely returns `CREDENTIALS_REQUIRED`) |
| `FLIPKART_AFFILIATE_TOKEN` | Flipkart Affiliate API | Authorization token | Unconfigured (Safely returns `CREDENTIALS_REQUIRED`) |

> **Important**: When credentials are absent, the comparison engine safely isolates the affected retailer with status `CREDENTIALS_REQUIRED` or `API_UNAVAILABLE`. Zero fabricated prices are served.

---

## 3. Deployment Procedure (Step-by-Step)

> **DO NOT RUN THESE COMMANDS UNTIL EXPLICITLY AUTHORIZED BY THE USER.**

### Step 1: Stage and Commit the Phase 12 Fixes
```powershell
cd "c:\APPS\BUYWISE AI"

# Stage web comparison API fixes and Android repository hardening
git add web/src/app/api/compare/route.ts
git add web/src/lib/comparison/planner.ts
git add web/scripts/test-api-contract.ts
git add web/scripts/test-local-api-smoke.ts
git add android/app/src/main/java/com/pajonline/buywiseai/data/repository/SmartCompareRepository.kt
git add android/app/src/test/java/com/pajonline/buywiseai/SmartCompareRepositoryTest.kt

# Commit with detailed changelog
git commit -m "fix(api): make /api/compare dynamic, harden contract and remove silent Android fallback"
```

### Step 2: Push to Main to Trigger Firebase App Hosting Cloud Build
```powershell
git push origin main
```
Firebase App Hosting automatically listens to GitHub repository `pajonline555-boop/buywiseai` on branch `main` and initiates a Cloud Build container deployment.

### Step 3: Monitor Cloud Build Deployment
Open Google Cloud Console or Firebase Console:
- Firebase Console -> Project `pajonline-shopping` -> App Hosting
- Verify build status transitions from `Building` -> `Deployed`.

---

## 4. Post-Deployment Verification Commands

Run the probe script against the live production domain immediately following rollout:

```powershell
cd "c:\APPS\BUYWISE AI\web"

# Probe 1: Missing query must return 400 JSON
npx tsx -e "fetch('https://buywiseai.pajonline.co.in/api/compare').then(r => r.json()).then(console.log)"

# Probe 2: Valid query must return 200 JSON with stores array
npx tsx -e "fetch('https://buywiseai.pajonline.co.in/api/compare?q=sneakers').then(r => r.json()).then(console.log)"

# Probe 3: Android query format
npx tsx -e "fetch('https://buywiseai.pajonline.co.in/api/compare?q=Lancer+Wonder-3').then(r => r.json()).then(console.log)"
```

---

## 5. Rollback Procedure

If the live deployment exhibits unexpected regressions or runtime errors:

### Rollback Option A: Instant Rollback via Firebase Console
1. Navigate to Firebase Console -> `pajonline-shopping` -> App Hosting.
2. Select **Deployments**.
3. Locate the previous stable build revision (commit `3c1f472`).
4. Click the three dots (`...`) and select **Rollback to this version**.
5. Traffic will shift back immediately (within ~30 seconds) without requiring a new build.

### Rollback Option B: Git Revert Rollback
```powershell
cd "c:\APPS\BUYWISE AI"
git revert HEAD --no-edit
git push origin main
```
This forces a fresh build of the prior revision.

---

## 6. Android Release Status
- Android client improvements are committed locally and all unit tests pass.
- **Android App Store / APK Release**: **BLOCKED** until live production domain verification passes.
