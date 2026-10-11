# BUYWISE AI — PHASE 11.1.3 CERTIFICATION MATRIX

---

## 1. Governance & Evidence-Based Certification Matrix

| FEATURE | IMPLEMENTED | RUNTIME VERIFIED | ANDROID VERIFIED | WEB VERIFIED | STAGING VERIFIED | PRODUCTION CONFIGURED | STATUS |
|---|---|---|---|---|---|---|---|
| **Voice Search (Android Mic)** | YES | YES | YES | YES | YES | YES | **PHYSICAL DEVICE VERIFIED** |
| **Web Voice Search** | YES | YES | N/A | YES | YES | YES | **PASS** |
| **Maya AI Assistant (Floating Card)** | YES | YES | YES | YES | YES | YES | **PHYSICAL DEVICE VERIFIED** |
| **Full Mobile App Localization** | YES | YES | YES | YES | YES | YES | **PHYSICAL DEVICE VERIFIED** |
| **Language Persistence (`SharedPreferences`)** | YES | YES | YES | YES | YES | YES | **PHYSICAL DEVICE VERIFIED** |
| **Product Ad Deep Links (`/product/[slug]`)** | YES | YES | YES | YES | YES | YES | **PASS** |
| **Google Sign-In (Credential Manager)** | YES | YES | YES | N/A | YES | **NO** | **DEBUG VERIFIED** *(Release OAuth pending)* |
| **ML Kit Vision & OCR** | YES | YES | YES | N/A | YES | YES | **PASS** *(On-Demand Models)* |
| **AdMob Architecture** | YES | YES | YES | N/A | YES | **NO** | **TEST ADS VERIFIED** *(Using Test IDs)* |
| **Android App Links (`https://...`)** | YES | YES | YES | YES | YES | **NO** | **INTENT ROUTING VERIFIED** *(Domain verification pending)* |
| **SmartCompare Engine Parity** | YES | YES | YES | YES | YES | YES | **PASS** |
| **Universal Product Intelligence Page** | YES | YES | YES | YES | YES | YES | **PASS** |

---

## 2. Evidence Disambiguation Notes
* **AdMob Status (`Production Configured = NO`)**: Operating under Google Test Ad Unit IDs (`ca-app-pub-3940256099942544/6300978111`).
* **Google Sign-In Status (`Production Configured = NO`)**: Verified under debug keystore SHA-256 fingerprint (`DEBUG VERIFIED`).
* **Android App Links Status (`Production Configured = NO`)**: Intent routing to `/product/[slug]` verified via ADB (`INTENT ROUTING VERIFIED`). Domain `assetlinks.json` verification pending production domain deploy.
