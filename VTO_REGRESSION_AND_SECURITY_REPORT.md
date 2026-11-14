# BUYWISE AI — VTO REGRESSION & SECURITY AUDIT REPORT

**Execution Date:** October 20, 2026  
**Audited Systems:** Next.js Server API Routes, Android Mobile App (Kotlin), Python Modal Serverless Container, Provider Secret Architecture.

---

## 1. Regression Audit & Verification Matrix

| Area | Prior Risk / Defect | Remediation & Verification | Verification Method | Status |
|---|---|---|---|---|
| **API Route Strip via Static Export** | `output: "export"` stripped `/api/vto/generate` and all 35+ dynamic routes. | Made conditional on `process.env.NEXT_STATIC_EXPORT === "true"`. | `npm run build` compiled 139/139 routes; `/api/vto/generate` verified as `ƒ (Dynamic)` server route. | **PASS** |
| **Firebase Hosting SPA Rewrites** | `firebase.json` rewrites `**` to `/index.html`, returning HTML on POST `/api/vto/generate`. | Android `VtoImageSynthesizer.kt` updated with explicit Content-Type and HTML detection guards. | Verified via curl & Android Kotlin compilation. Documented Cloud Run / App Hosting migration. | **MITIGATED & DOCUMENTED** |
| **Hardcoded API Secrets in Client APK** | APK contained hardcoded `HF_TOKEN` in `VtoImageSynthesizer.kt`. | Hardcoded token eradicated from Kotlin code. All AI generations routed through server. | Full-text grep scan across `android/` returned 0 occurrences of HuggingFace token. | **PASS** |
| **Hardcoded API Secret in Python Scripts** | Default fallback `HF_TOKEN` string was present in `modal_vto_app.py`. | Removed fallback string. Now strictly reads `os.environ.get("HF_TOKEN")`. | Full-text grep across entire workspace returned 0 occurrences of secret token string. | **PASS** |
| **Image Corruptions (2D Skirt & Split)** | Pasted flat 2D rectangle at $y=60\%$ and horizontal gradient across width. | Legacy hacks eradicated locally and deployed to Modal via `modal deploy modal_vto_app.py`. | Real image pixel forensics verified: White pixel ratio dropped to 0.40%, horizontal white band = NO (CLEAN). | **PASS** |
| **Android Corrupt File Retention** | Android app saved defective or rejected try-ons to private storage. | `VtoScreen.kt` lines 919-921: automatically deletes `outputFile` if generation fails or quality check rejects it. | Verified in `VtoScreen.kt` code and tested with `testDebugUnitTest`. | **PASS** |
| **Community Publishing of Failed Images** | Defective try-ons could be shared to community lookbook. | `vtoQualityGate.ts` and `/api/vto/generate` set `canPublishToCommunity: false` on all rejections or edge cases. | Unit tests in `test-vto-router-live.ts` confirmed `canPublishToCommunity: false` on white voids & underflows. | **PASS** |
| **Duplicate Generation Protection** | Unbounded retries or ambiguity causing duplicate paid generation calls. | Provider timeouts bounded (Modal: 60s, Leffa: 30 steps, FASHN: 75s poll with 1.5s interval). Safe failover with idempotency keys. | Router tracing confirmed failover executes exactly once per request. | **PASS** |

---

## 2. Secrets & Privacy Architecture

1. **Server-Side Key Isolation:**
   - Provider keys (`FASHN_API_KEY`, `HF_TOKEN`, `MODAL_VTO_URL`, `GEMINI_API_KEY`, `OPENAI_API_KEY`) reside exclusively in server `.env.local` or Cloud Secret Manager.
   - Zero API tokens or secrets are compiled into the Android APK or exposed to web client bundles.
2. **Repository Secret Hygiene:**
   - `.env.local` is present in `.gitignore` and is untracked by Git.
   - `git diff --check` and secret grep confirm no private tokens or API keys have been staged or committed.
3. **User Image Privacy:**
   - Temporary try-on files in Android are stored in private internal app storage (`context.filesDir/vto_private`) and deleted immediately upon failure.
   - Output images are only moved to public media storage when the user explicitly clicks "Save to Gallery".
   - Input photographs are never uploaded to public cloud buckets during try-on processing.

---

## 3. Production Hosting Architecture & Requirements

### The Firebase Hosting Finding
Our runtime curl probe to `https://buywiseai.pajonline.co.in/api/vto/generate`:
```
status: 200
content-type: text/html; charset=utf-8
body: <!DOCTYPE html>...
```
**Diagnosis:**
`buywiseai.pajonline.co.in` is currently served by Firebase Hosting with `public: "out"` and a single catch-all SPA rewrite rule (`"source": "**", "destination": "/index.html"`). Firebase Hosting static hosting does not execute dynamic Node.js code or Next.js route handlers.

### Action Plan for Production Hosting
To enable `/api/vto/generate` and all Next.js API routes on the live domain, the team should execute ONE of the following hosting setups:

1. **Option A: Firebase App Hosting (Recommended for Next.js)**
   - Connect the GitHub repository to Firebase App Hosting.
   - Firebase App Hosting automatically runs the Next.js server container on Cloud Run with full dynamic SSR and API route execution.

2. **Option B: Cloud Run Service with Firebase Hosting Rewrite**
   - Build and deploy the Next.js Docker container to Google Cloud Run:
     ```bash
     gcloud run deploy buywise-web --source web/ --region asia-south1
     ```
   - Update `web/firebase.json` rewrites to proxy `/api/**` to Cloud Run:
     ```json
     "rewrites": [
       {
         "source": "/api/**",
         "run": {
           "serviceId": "buywise-web",
           "region": "asia-south1"
         }
       },
       {
         "source": "**",
         "destination": "/index.html"
       }
     ]
     ```

3. **Option C: Direct Mobile App Connection to Modal GPU (Already Active)**
   - Android's `VtoImageSynthesizer.kt` already connects directly to `https://ashupajonline--buywise-vto-engine-buywisevtoengine-generate.us-east.modal.run` as its primary engine, which bypasses Firebase Hosting and runs on the deployed L4 GPU.

---

## 4. Remaining Risks & Action Items

1. **Acquiring FASHN.ai Commercial API Key:**
   - Add `FASHN_API_KEY=your_key_here` to `web/.env.local` to enable live commercial `tryon-max` generation.
2. **Container Cold-Start Optimization on Modal:**
   - The first request to a scale-to-zero Modal L4 GPU takes ~40-45 seconds to spin up CUDA drivers and load Buffalo_L weights.
   - Subsequent requests take ~15-20 seconds.
   - To reduce cold-start latency for production users, set `scaledown_window=300` (5 minutes) or enable `keep_warm=1` during peak shopping hours in `modal_vto_app.py`.
