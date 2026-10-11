# BUYWISE AI — PHASE 11.1.2 CERTIFICATION MATRIX

---

## 1. Evidence-Based Certification Matrix

| FEATURE | IMPLEMENTED | RUNTIME VERIFIED | ANDROID VERIFIED | WEB VERIFIED | STAGING VERIFIED | PRODUCTION CONFIGURED | STATUS |
|---|---|---|---|---|---|---|---|
| **Voice Search (Android Mic)** | YES | YES | YES | YES | YES | YES | **PASS** |
| **Web Voice Search** | YES | YES | N/A | YES | YES | YES | **PASS** |
| **Maya AI Assistant (Full Box)** | YES | YES | YES | YES | YES | YES | **PASS** |
| **Full Mobile App Localization** | YES | YES | YES | YES | YES | YES | **PASS** |
| **Language Persistence (`SharedPreferences`)** | YES | YES | YES | YES | YES | YES | **PASS** |
| **Product Ad Deep Links (`/product/[slug]`)** | YES | YES | YES | YES | YES | YES | **PASS** |
| **Google Sign-In (Credential Manager)** | YES | YES | YES | N/A | YES | **NO** | **DEBUG VERIFIED** *(Release OAuth pending)* |
| **ML Kit Vision & OCR** | YES | YES | YES | N/A | YES | YES | **PASS** *(On-Demand Models)* |
| **AdMob Architecture** | YES | YES | YES | N/A | YES | **NO** | **TEST ADS VERIFIED** *(Using Test IDs)* |
| **Android App Links (`https://...`)** | YES | YES | YES | YES | YES | **NO** | **INTENT ROUTING VERIFIED** *(Domain verification pending)* |
| **SmartCompare Engine Parity** | YES | YES | YES | YES | YES | YES | **PASS** |
| **Universal Product Intelligence Page** | YES | YES | YES | YES | YES | YES | **PASS** |

---

## 2. Status Disambiguation & Notes

### A. AdMob Status (`Production Configured = NO`)
* **Explanation**: The AdMob architecture is fully integrated into Compose screens (`HomeScreen.kt`, `SearchScreen.kt`), but intentionally utilizes **Google Test Ad Unit IDs** (`ca-app-pub-3940256099942544/6300978111`).
* **Production Blockers**: Production AdMob Publisher ID and app approval consent must be configured prior to live store release.

### B. Google Sign-In Status (`Production Configured = NO`)
* **Explanation**: Google Sign-In using Android Credential Manager operates cleanly under debug SHA-256 signing.
* **Production Blockers**: Release keystore SHA-256 fingerprint must be added to Firebase Console and Google Cloud OAuth Client Credentials before production APK/AAB release.

### C. Android App Links Status (`Production Configured = NO`)
* **Explanation**: Intent routing for `https://buywiseai.pajonline.co.in/product/*` is verified via Android Intent Filter.
* **Production Blockers**: `assetlinks.json` hosting on production domain `https://buywiseai.pajonline.co.in/.well-known/assetlinks.json` requires domain deployment.

### D. APK Size Analysis (~127 MB Debug APK)
* **Explanation**: The debug build APK is ~127.17 MB due to unstripped C++ native debug binaries (`.so`), Android Compose Tooling, and ML Kit native dependencies.
* **Release Target**: Production ProGuard/R8 minification and unbundled ML Kit model downloading will reduce final release APK/AAB size to ~18–25 MB.
