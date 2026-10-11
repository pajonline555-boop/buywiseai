# BUYWISE AI — PHASE 11.1.2 AUDIT & INSPECTION REPORT

**PROJECT**: BuyWise AI — *Shop Smarter. Buy Better.*  
**CANONICAL WEB**: `https://buywiseai.pajonline.co.in`  
**ANDROID PACKAGE**: `com.pajonline.buywiseai`  
**BASELINE GIT**: `f27d501`  
**DATE**: September 11, 2026  

---

## 1. AUDIT SUMMARY OF CURRENT IMPLEMENTATION

### A. Voice Search Implementation
- **Defect Identified**: In `SearchScreen.kt` (lines 97-100) and `HomeScreen.kt` (lines 223-226), the microphone button (`🎙️`) click handler was hardcoded to set `searchQuery = "red saree under 3000"` without invoking Android's `SpeechRecognizer` or requesting `RECORD_AUDIO` runtime permission.
- **Web App Voice Search**: Web App speech recognition is handled in `webSpeechService.ts` and `VoiceSearchModal.tsx`, attached to header, homepage, and search bar.

### B. AI Assistant Implementation
- **Android App**: `AiAssistantBottomSheet.kt` exists with Maya persona, but `MainActivity.kt` lacks a floating action button anchored to the bottom-right corner. The assistant sheet also lacks a 🎙️ voice input button in its chat input bar.
- **Web App**: Floating Maya avatar is rendered at bottom-right in `Chatbot.tsx` with responsive mobile clearance (`bottom: 78px` on mobile, `bottom: 30px` on desktop, `z-index: 100000`).

### C. Localization Architecture
- **Android App**: `LanguageManager.kt` provides language selection state (`en`, `hi`, `hi-en`), but several Android screens (`SearchScreen.kt`, `HomeScreen.kt`, `ProductDetailsScreen.kt`, `AiAssistantBottomSheet.kt`) contain hardcoded English strings instead of calling `LanguageManager.tr(...)`.
- **Web App**: Complete 14-language master dictionary in `translations.ts` and `i18nContext.tsx`.

### D. Product Routing & Ad Deep-Linking
- **Web Canonical Format**: `https://buywiseai.pajonline.co.in/product/[slug]`
- **Android Deep Link**: `AndroidManifest.xml` has intent-filter for `https` host `buywiseai.pajonline.co.in`, but `BannerAdView.kt` and `BannerCarousel.kt` need explicit route handlers to navigate directly to `ProductDetailsScreen` / `/product/[slug]` when an ad for a product is clicked.

---

## 2. EXACT TARGET FILES FOR MODIFICATION

| Component | Target File | Action Required |
|---|---|---|
| Native Speech Engine | `android/app/src/main/java/com/pajonline/buywiseai/core/voice/SpeechRecognizerManager.kt` | **[NEW]** SpeechRecognizer wrapper with locale mapping and permission callbacks |
| Android Search Screen | `android/app/src/main/java/com/pajonline/buywiseai/ui/screens/search/SearchScreen.kt` | **[MODIFY]** Wire mic button to `SpeechRecognizerManager` & permission launcher |
| Android Home Screen | `android/app/src/main/java/com/pajonline/buywiseai/ui/screens/home/HomeScreen.kt` | **[MODIFY]** Wire mic button to `SpeechRecognizerManager` |
| Android Main Activity | `android/app/src/main/java/com/pajonline/buywiseai/MainActivity.kt` | **[MODIFY]** Add bottom-right Floating Action Button for Maya AI Assistant |
| Android AI Assistant | `android/app/src/main/java/com/pajonline/buywiseai/ui/screens/ai/AiAssistantBottomSheet.kt` | **[MODIFY]** Add voice input button & localize all UI strings |
| Android Localization | `android/app/src/main/java/com/pajonline/buywiseai/data/i18n/LanguageManager.kt` | **[MODIFY]** Expand dictionary for English, Hindi, and Hinglish across all screens |
| Android Banner Ads | `android/app/src/main/java/com/pajonline/buywiseai/core/ads/BannerAdView.kt` | **[MODIFY]** Direct product ad clicks to `ProductDetailsScreen` |
| Android Banner Carousel | `android/app/src/main/java/com/pajonline/buywiseai/ui/components/BannerCarousel.kt` | **[MODIFY]** Direct carousel ad clicks to `ProductDetailsScreen` |
| Web Canonical Ad Helper | `web/src/lib/ads/adRouter.ts` | **[NEW]** Canonical `getProductLandingUrl(product)` helper |

---

## 3. VERIFICATION STRATEGY

1. **Gradle Build Verification**: `./gradlew assembleDebug` (Exit code: 0).
2. **Next.js Production Build**: `npm run build` (Exit code: 0).
3. **Physical ADB Test**: Deploy to attached phone (`926dbc44`). Verify microphone, bottom-right AI Assistant, language persistence, and ad deep-linking to `/product/[slug]`.
