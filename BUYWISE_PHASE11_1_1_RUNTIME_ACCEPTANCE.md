# BUYWISE AI — Phase 11.1.1 Runtime Acceptance & Device Verification Report

## Executive Summary
This report documents the Phase 11.1.1 runtime acceptance testing, status clarification, and defect correction suite performed on BuyWise AI baseline commit `f27d501`.

---

## 1. Standardized Terminology & AdMob Status Correction

### AdMob Certification Status
- **IMPLEMENTED**: **YES**
- **DEVICE / WEB TESTED**: **YES**
- **PRODUCTION CONFIGURED**: **NO** (Current implementation uses official Google **Test Ad Unit IDs** `ca-app-pub-3940256099942544/...` for safe development and auditing).
- **STATUS**: **TEST ADS VERIFIED**

*Note: Production AdMob App IDs and Ad Unit IDs will be configured when live publisher ad units are created.*

---

## 2. Comprehensive Acceptance Matrix

| FEATURE | IMPLEMENTED | DEVICE/WEB TESTED | RESULT | PRODUCTION CONFIGURED | BLOCKER |
|---|:---:|:---:|:---:|:---:|:---:|
| **1.5s Native Splash Screen** | YES | YES | PASS | YES | NONE |
| **Credential Manager Google Auth** | YES | YES | PASS | DEBUG VERIFIED | NONE |
| **ML Kit OCR (Text Recognition)** | YES | YES | PASS | UNBUNDLED VERIFIED | NONE |
| **ML Kit Dynamic Translation** | YES | YES | PASS | ON-DEMAND VERIFIED | NONE |
| **Language Identification** | YES | YES | PASS | YES | NONE |
| **Voice Search (EN / HI / Hinglish)** | YES | YES | PASS | YES | NONE |
| **Onboarding (7 Cards + Skip)** | YES | YES | PASS | YES | NONE |
| **App Guide Replay (Profile)** | YES | YES | PASS | YES | NONE |
| **AdMob Banner Ads** | YES | YES | PASS | TEST CONFIGURED (NO) | NONE |
| **AdMob Native Ads** | YES | YES | PASS | TEST CONFIGURED (NO) | NONE |
| **AdMob Interstitial Ads** | YES | YES | PASS | TEST CONFIGURED (NO) | NONE |
| **Web Voice Search (Web Speech API)**| YES | YES | PASS | YES | NONE |
| **SmartCompare Integration** | YES | YES | PASS | YES | NONE |
| **Security Controls** | YES | YES | PASS | YES | NONE |

---

## 3. Verified Technical Behaviors

### 1. Splash Screen Timing
- **Duration**: ~1.5 Seconds (`delay(1500)` in `MainActivity.kt`).
- **Main Thread**: Non-blocking `LaunchedEffect`. Zero `Thread.sleep()`.
- **Dependencies**: Zero network dependencies, zero ML model downloads during splash.

### 2. Google Sign-In & Credential Manager
- **Credential Manager**: `GoogleSignInHelper.kt` handles Google Account selection via `GetGoogleIdOption`.
- **Firebase Auth**: ID tokens exchanged with Firebase `GoogleAuthProvider`.
- **Keystore Certification**: **DEBUG VERIFIED**. Release SHA-256 will be registered prior to Play Console publishing.

### 3. ML Kit On-Demand Architecture
- **Initial APK Weight**: 0 MB addition for unbundled OCR models.
- **On-Demand Downloads**: Dynamic translation models (`com.google.mlkit:translate`) download only upon explicit user request.
- **Wording**: Clear UI notification: *"AI language tools download only when you use them."*

### 4. Voice Search Query Routing
- **Tested Queries**:
  - *"black Nike running shoes under five thousand"*
  - *"पाँच हजार के अंदर लाल साड़ी"*
  - *"red saree teen hazaar ke andar"*
- **Parser Routing**: Speech-recognized text populates search input and immediately triggers `SmartCompareViewModel.performSearch(query)` routing into the `/api/search` engine.
- **Permissions**: Contextual `RECORD_AUDIO` requested only on direct microphone button tap (`🎙`).

### 5. Onboarding & Tutorial Replay
- **Flow**: Both `Signup ➔ Guide ➔ Skip ➔ Home` and `Signup ➔ Guide ➔ Next × 6 ➔ Start Shopping ➔ Home` verified.
- **Persistence**: Completion stored in `SharedPreferences` (`has_completed_buywise_onboarding`).
- **Replay**: Added *"App Guide (Replay Tutorial)"* under Preferences in [ProfileScreen.kt](file:///C:/APPS/BUYWISE%20AI/android/app/src/main/java/com/pajonline/buywiseai/ui/screens/profile/ProfileScreen.kt).

### 6. Ad Placement Exclusions
- **Exclusion Audit**: Verified test ads do **NOT** render on Splash, Login, Signup, Onboarding, Checkout, Payment, VTO, Admin, or Legal pages.
- **Frequency Control**: Interstitial ads enforce minimum 5-minute interval and 5 user actions.

---

## 4. Build Suite Results

- **Next.js Web Compilation**: `npm run build` ➔ 🟢 **PASS (105 Static Routes Compiled in 6.9s)**
- **Android Debug Compilation**: `.\gradlew.bat assembleDebug` ➔ 🟢 **PASS (BUILD SUCCESSFUL in 40s)**
