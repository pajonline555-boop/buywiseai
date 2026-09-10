# BUYWISE AI — WEBSITE & NATIVE MOBILE APP PRODUCTION ONBOARDING REPORT

**PROJECT**: BuyWise AI — *Shop Smarter. Buy Better.*  
**CANONICAL WEBSITE**: `https://buywiseai.pajonline.co.in`  
**ANDROID APPLICATION ID**: `com.pajonline.buywiseai`  
**DATE**: September 10, 2026  

---

## 1. COMPONENT ONBOARDING & EXECUTION STATUS

| Platform / Subsystem | Status | Verification Detail | Artifact Location / URL |
|---|---|---|---|
| **Web Canonical Site** | **PRODUCTION READY** | 105 static/dynamic routes compiled cleanly | `https://buywiseai.pajonline.co.in` |
| **Android Native App** | **COMPILED & READY** | Native Gradle debug build completed (19.05 MB) | `android/app/build/outputs/apk/debug/app-debug.apk` |
| **ApiClient Network Fallback**| **CONFIGURED** | Dynamic fallback to canonical web URL | `ApiClient.kt` |
| **Razorpay Merchant Engine** | **CONFIGURED** | Webhook signature validation & sandbox fallback | `web/src/lib/checkout/providers/razorpayAdapter.ts` |
| **Commercial VTO Router** | **CONFIGURED** | Fallback router & budget governor active | `web/src/lib/vto/providers/VtoProviderRouter.ts` |
| **Firebase Infrastructure** | **RULES VERIFIED** | 10/10 security specifications passed | `web/firestore.rules` & `web/storage.rules` |

---

## 2. REGRESSION VERIFICATION RESULTS

- **TypeScript Compiler (`npx tsc --noEmit`)**: 🟢 **PASS (0 Errors)**
- **Next.js Web Build (`npm run build`)**: 🟢 **PASS (105 Static Pages)**
- **Android Native Debug (`.\gradlew.bat assembleDebug`)**: 🟢 **PASS (BUILD SUCCESSFUL in 28s)**

---

## 3. MOBILE DEVICE LAUNCH INSTRUCTIONS

To run and test the native BuyWise AI mobile app on your Android smartphone:

### USB Installation:
```powershell
adb install -r "C:\APPS\BUYWISE AI\android\app\build\outputs\apk\debug\app-debug.apk"
```

### Direct APK Transfer:
Transfer `app-debug.apk` (~19.05 MB) to your Android device via WhatsApp, Google Drive, or USB cable, and tap to install.
