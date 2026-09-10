# BUYWISE AI — Phase 11.1 Implementation Audit & Technical Specification

## Executive Summary
This audit inspects the current repository baseline (`4d09e03`) for Phase 11.1: Mobile + Web AI UX, ML Kit, Credential Manager Google Sign-In, Native AdMob, Splash Screen, Post-Signup Onboarding Guide, and Voice Search (Hindi/English/Hinglish).

---

## 1. Existing Functionality & Reusable Components

### Android Native App (`android/`)
- **UI System**: Jetpack Compose with Material3, custom dark theme (`BuyWiseTheme`), and Navigation Compose (`BuyWiseNavGraph`, `BuyWiseBottomBar`).
- **Auth Architecture**: `AuthRepository` & `AuthViewModel` using Firebase Auth state streams (`AuthState.Authenticated`, `AuthState.Unauthenticated`).
- **Search System**: `SearchScreen`, `SearchViewModel`, and `SmartCompareRepository` calling REST API (`/api/search`).
- **Assistant**: `AiAssistantBottomSheet` ("Maya AI Assistant").
- **Preferences & i18n**: `LanguageManager` supporting 14 Indian languages with native translations (`tr(key)`).

### Web Application (`web/`)
- **Framework**: Next.js App Router (15+ React Pages), TypeScript, Tailwind/Vanilla CSS.
- **Auth**: Firebase Auth web SDK (`signInWithPopup`, `GoogleAuthProvider`).
- **Search & Comparison**: `/search` page, `/api/search` endpoint.
- **AI Services**: `/api/vision/analyze`, `/api/chat`.

---

## 2. Dependency Matrix & Version Audit

### Android Gradle Dependencies (`android/gradle/libs.versions.toml`)
- **Android Gradle Plugin**: `8.7.2`
- **Kotlin**: `2.0.21`
- **Target SDK**: `35` | **Min SDK**: `24`
- **Firebase BOM**: `33.6.0` (`firebase-auth-ktx`, `firebase-firestore-ktx`, `firebase-messaging-ktx`)
- **New Dependencies to Add**:
  - `com.google.android.gms:play-services-auth:21.3.0` & `androidx.credentials:credentials:1.3.0` (Credential Manager / Google Identity)
  - `com.google.android.gms:play-services-code-scanner:16.1.0` / `com.google.mlkit:text-recognition:16.0.1` (Unbundled OCR)
  - `com.google.mlkit:translate:17.0.3` & `com.google.mlkit:language-id:17.0.6` (On-demand translation & language ID)
  - `com.google.android.gms:play-services-ads:23.6.0` (Google Mobile Ads / AdMob SDK)

### Web Dependencies (`web/package.json`)
- **Next.js**: `15.0.3`
- **Firebase Web SDK**: `^11.0.1`
- **Web Speech API**: Standard Browser API (`window.SpeechRecognition` || `window.webkitSpeechRecognition`). No external npm weight required.

---

## 3. Scope of Modifications

### Files to Modify / Create

#### Android (`android/app/src/main/java/com/pajonline/buywiseai/`)
1. **[NEW] `core/mlkit/`**:
   - `MlKitManager.kt`
   - `MlKitTextRecognitionService.kt`
   - `MlKitTranslationService.kt`
   - `MlKitLanguageService.kt`
   - `MlKitModelManager.kt`
2. **[NEW] `core/ads/`**:
   - `AdsManager.kt` (Test Ad Unit IDs default)
   - `BannerAdView.kt`
   - `NativeAdView.kt`
   - `InterstitialAdManager.kt`
   - `RewardedAdManager.kt`
3. **[NEW] `ui/screens/onboarding/OnboardingScreen.kt`**:
   - 5–7 Page onboarding tutorial cards with Skip, Next, Start Shopping buttons and persistent completion state.
4. **[MODIFY] `MainActivity.kt`**:
   - 1.5-second splash screen handling without UI thread blocking.
   - Onboarding state check routing.
5. **[MODIFY] `ui/screens/auth/AuthDialog.kt`**:
   - Credential Manager + Sign in with Google flow.
6. **[MODIFY] `ui/screens/search/SearchScreen.kt`**:
   - Search bar microphone button (`🎙`), voice-to-text listener (English, Hindi, Hinglish), camera OCR button.
7. **[MODIFY] `AndroidManifest.xml`**:
   - Contextual permissions (`RECORD_AUDIO`), AdMob App ID metadata.

#### Web (`web/src/`)
1. **[NEW] `web/src/lib/ai/`**:
   - `webSpeechService.ts`
   - `webAiCapabilities.ts`
2. **[NEW] `web/src/components/OnboardingModal.tsx`**:
   - Replayable 5–7 card onboarding guide for web users.
3. **[MODIFY] `web/src/app/search/page.tsx` & `web/src/components/AppHeader.tsx`**:
   - Add microphone voice search button (`🎙`) with Web Speech API fallback detection.
4. **[MODIFY] `web/src/app/login/page.tsx` & `web/src/app/signup/page.tsx`**:
   - Ensure Google Sign-In popup/redirect fallback works reliably.

---

## 4. Protected Baseline Files (DO NOT MODIFY UNNECESSARILY)
- Payment gateway integration files (`Razorpay` backend/web hooks).
- Security controls (`authorizeRequest()`, `abuseProtection.ts`, `inputLimits.ts`).
- VTO processing logic & Fal.ai endpoints.
- Merchandising, Partner Fulfillment & Dropshipping logic.

---

## 5. Risk Assessment & Mitigation Plan
1. **Risk**: ML Kit models increasing initial APK size.
   - **Mitigation**: Use unbundled / dynamically downloaded models (`com.google.mlkit:translate` on-demand download).
2. **Risk**: Google Sign-In failure on device due to SHA-1 or Credential Manager configuration.
   - **Mitigation**: Implement robust exception handling with local credential fallback and clear error feedback.
3. **Risk**: AdMob accidental policy violation during development.
   - **Mitigation**: Enforce official Google AdMob Test Ad Unit IDs in `AdsManager`. Never use live production ad IDs during testing.
4. **Risk**: Speech recognition hanging or blocking main thread.
   - **Mitigation**: Auto-release SpeechRecognizer on timeout/dismiss, request `RECORD_AUDIO` only on direct microphone button click.

---

## 6. Verification & Certification Plan
1. **Android Compilation**: `.\gradlew.bat assembleDebug` must finish with 0 errors.
2. **Web Compilation**: `npm run build` in `web/` must finish with 0 TypeScript/lint errors.
3. **Device Testing**: Install APK on physical Android device (`926dbc44`) and verify:
   - 1.5-second splash screen transition.
   - Onboarding 5-7 cards with Skip & persistent completion state.
   - Credential Manager / Google Sign-In flow.
   - Microphone button voice search (Hindi, English, Hinglish).
   - Banner & Interstitial Test Ads in non-sensitive content screens.
