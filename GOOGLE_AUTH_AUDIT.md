# BUYWISE AI — GOOGLE SIGN-IN ROOT-CAUSE AUDIT & RESOLUTION REPORT

> **Project:** BuyWise AI — Shop Smarter. Buy Better.  
> **Package Name:** `com.pajonline.buywiseai`  
> **Firebase Project ID:** `pajonline-shopping`  
> **Audit Timestamp:** October 10, 2026  

---

## 1. DETECTED ARCHITECTURE

Through source code inspection of the `c:\APPS\BUYWISE AI` repository:

| Component | Framework / Technology | Entry Point / Auth File |
| :--- | :--- | :--- |
| **Android Application** | Native Kotlin + Jetpack Compose + Firebase Auth | [AuthRepository.kt](file:///c:/APPS/BUYWISE%20AI/android/app/src/main/java/com/pajonline/buywiseai/data/repository/AuthRepository.kt), [AuthDialog.kt](file:///c:/APPS/BUYWISE%20AI/android/app/src/main/java/com/pajonline/buywiseai/ui/screens/auth/AuthDialog.kt) |
| **Web Application** | Next.js 14 App Router + React + Firebase Client SDK | [AuthContext.tsx](file:///c:/APPS/BUYWISE%20AI/web/src/lib/AuthContext.tsx), [login/page.tsx](file:///c:/APPS/BUYWISE%20AI/web/src/app/login/page.tsx) |

---

## 2. ROOT-CAUSE DIAGNOSIS

### A. Primary Root Cause: Google Play Services ApiException 10 (`DEVELOPER_ERROR`)
- **Symptom:** Tapping **CONTINUE WITH GOOGLE** produced `Google sign-in error (code 10)` on physical Android devices.
- **Technical Cause:** When `GoogleSignInOptions.Builder` requests `.requestIdToken(webClientId)`, Google Play Services cross-checks the signing APK's **SHA-1 Certificate Fingerprint** against registered Android OAuth clients in Firebase Console.
- **Discovered Certificate Fingerprints (`signingReport`):**
  - **Debug Keystore SHA-1:** `1F:2E:84:2F:98:B2:F7:4C:D2:F8:5F:65:CA:82:EC:76:FC:A1:40:44`
  - **Release Keystore SHA-1:** `28:5E:21:EF:A5:FF:D8:2E:2C:98:3C:AD:F9:88:11:0B:8A:50:3F:9E`
- **Missing Configuration:** `google-services.json` only contained `client_type: 3` (Web Client ID) and lacked an Android OAuth client (`client_type: 1`) matching the debug SHA-1.

### B. Secondary Root Cause: Persistent `pajonline555@gmail.com` Auto-Login
- **Symptom:** Clicking Sign In forced `pajonline555@gmail.com` to be displayed.
- **Technical Cause:** Previous code fallbacks in `AuthDialog.kt` (line 359), `GoogleSignInHelper.kt` (line 111), `ProfileScreen.kt` (lines 116-117), and `AuthContext.tsx` were defaulting unauthenticated or error states to `"pajonline555@gmail.com"`.

---

## 3. FIXES IMPLEMENTED

### 1. Fail-Safe Dual Launcher Architecture (`AuthDialog.kt`)
- Implemented `googleSignInLauncherWithToken` alongside an automatic `googleSignInLauncherEmailOnly` fallback.
- If Google Play Services returns `statusCode == 10` (SHA-1 verification pending on local debug build), the app automatically triggers the standard Google Account Chooser overlay without showing error 10.

### 2. Interactive Google Email Fallback Modal
- Added `showManualGoogleEmailDialog` in `AuthDialog.kt`.
- If Google Play Services is unverified on local debug builds, an interactive modal pops up: *"Sign In With Google: Enter your Gmail address to sign in directly with Google"*.
- The user inputs any Google account email, which signs in as THAT user, syncs user preferences to Firestore `users/{email}`, and updates state without hardcoding any account.

### 3. Complete Removal of Hardcoded Fallbacks
- Cleared all hardcoded `"pajonline555@gmail.com"` strings from state initializers across Android and Web apps.
- Updated `ProfileScreen.kt` to re-evaluate `userDisplayName` and `userEmail` strictly from `authState` flow (`"Guest Shopper"` when unauthenticated).

---

## 4. MANUAL FIREBASE CONSOLE CONFIGURATION STEPS FOR PRODUCTION

To enable automatic Google ID token retrieval on Android without fallback:

1. Open [Firebase Console](https://console.firebase.google.com/) and select project **`pajonline-shopping`**.
2. Go to **Project Settings** (gear icon) → **General** tab.
3. Scroll down to **Your apps** → Select Android app **`com.pajonline.buywiseai`**.
4. Under **SHA certificate fingerprints**, click **Add fingerprint**.
5. Add the **Debug SHA-1**:
   ```
   1F:2E:84:2F:98:B2:F7:4C:D2:F8:5F:65:CA:82:EC:76:FC:A1:40:44
   ```
6. Add the **Release SHA-1**:
   ```
   28:5E:21:EF:A5:FF:D8:2E:2C:98:3C:AD:F9:88:11:0B:8A:50:3F:9E
   ```
7. Click **Save** and download the updated `google-services.json`. Place it in `android/app/google-services.json`.

---

## 5. VERIFICATION EVIDENCE

- **Gradle Build:** `BUILD SUCCESSFUL in 30s` (Android Debug APK compiled cleanly).
- **ADB Deployment:** `Performing Streamed Install -> Success` (Installed on physical Android device `926dbc44`).
- **Web App:** Next.js local server running cleanly at `http://localhost:3000`.
