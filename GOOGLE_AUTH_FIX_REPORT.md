# BUYWISE AI — GOOGLE AUTHENTICATION SECURITY REMEDIATION REPORT

> **Project:** BuyWise AI — Shop Smarter. Buy Better.  
> **Package Name:** `com.pajonline.buywiseai`  
> **Firebase Project ID:** `pajonline-shopping`  
> **Report Timestamp:** October 10, 2026  

---

## 1. EXECUTIVE SUMMARY & SECURITY STATEMENT

All unverified/insecure fallbacks (including `showManualGoogleEmailDialog` and email-only identity assignment) have been **completely removed** from the BuyWise AI Android codebase.

Entering an email address alone can no longer grant access, mark a session as authenticated, create a user identity, or write/overwrite Firestore user documents. If Google Sign-In is cancelled, unverified, or returns an OAuth configuration error (such as Developer Error 10), the application strictly retains the **Guest Shopper** unauthenticated state.

---

## 2. INSECURE FALLBACK REMOVAL

| Item / Feature | Status | Implementation Details |
| :--- | :--- | :--- |
| **`showManualGoogleEmailDialog`** | **REMOVED** | Deleted from [AuthDialog.kt](file:///c:/APPS/BUYWISE%20AI/android/app/src/main/java/com/pajonline/buywiseai/ui/screens/auth/AuthDialog.kt). No prompt accepts raw email strings for Google login. |
| **Unverified Email Session** | **REMOVED** | Stripped from `AuthRepository.signInWithGoogle`. `idToken` is mandatory. |
| **Mock Password Bypass** | **REMOVED** | Removed hardcoded password checks (`admin123`, `Ramkanaam@108`). Firebase Auth handles password validation. |
| **Unauthenticated Firestore Write** | **REMOVED** | `syncUserProfileToFirestore` requires an active Firebase `currentUser.uid`. |

---

## 3. ACTUAL ROOT CAUSE OF DEVELOPER ERROR 10

When `GoogleSignInOptions.Builder` requests `.requestIdToken(webClientId)`, Google Play Services extracts the APK's certificate SHA-1 fingerprint and sends it to Google OAuth servers. If the signing SHA-1 is not registered under an Android OAuth Client ID in the Firebase project (`pajonline-shopping`), Google Play Services returns `ApiException` code **10** (`DEVELOPER_ERROR`).

---

## 4. CERTIFICATE FINGERPRINTS (VERIFIED VIA GRADLE & KEYTOOL)

### Debug Certificate Fingerprint
* **Keystore Path:** `C:\Users\Pngag\.android\debug.keystore`
* **Alias:** `AndroidDebugKey`
* **SHA-1:** `1F:2E:84:2F:98:B2:F7:4C:D2:F8:5F:65:CA:82:EC:76:FC:A1:40:44`
* **SHA-256:** `4F:7C:70:84:37:23:40:1A:FE:4F:5F:D1:F6:7E:9A:C3:B9:40:D9:5F:A9:0E:3B:16:0A:5A:EA:D3:AC:1C:8A:85`

### Release Certificate Fingerprint
* **Keystore Path:** `C:\APPS\BUYWISE AI\buywise-release-key.jks`
* **Alias:** `buywise_key`
* **SHA-1:** `28:5E:21:EF:A5:FF:D8:2E:2C:98:3C:AD:F9:88:11:0B:8A:50:3F:9E`
* **SHA-256:** `93:11:E5:67:ED:A1:03:72:49:9A:A2:6C:01:69:E3:42:C9:7B:04:60:CF:4D:E9:E6:90:FC:2E:9D:CD:E1:AB:D4`

---

## 5. FIRESTORE AUTHORIZATION & SECURITY RULES AUDIT

Inspection of [firestore.rules](file:///c:/APPS/BUYWISE%20AI/web/firestore.rules):

```firestore-rules
// 1. User Profiles (/users/{userId})
match /users/{userId} {
  allow read: if isOwner(userId) || isAdmin();
  allow create: if request.auth != null && request.auth.uid == userId 
                && (!request.resource.data.keys().hasAny(['role', 'admin']) || isAdmin());
  allow update: if (isOwner(userId) && isUnprivilegedUserFieldMutation()) || isAdmin();
  allow delete: if isAdmin();
}
```

* **UID Binding:** Firestore Security Rules explicitly restrict document creation/mutation at `/users/{userId}` to requests where `request.auth.uid == userId`.
* **Repository Alignment:** Updated [AuthRepository.kt](file:///c:/APPS/BUYWISE%20AI/android/app/src/main/java/com/pajonline/buywiseai/data/repository/AuthRepository.kt) `syncUserProfileToFirestore` to target `doc(currentUser.uid)` rather than raw email strings.

---

## 6. FILES MODIFIED

1. [AuthDialog.kt](file:///c:/APPS/BUYWISE%20AI/android/app/src/main/java/com/pajonline/buywiseai/ui/screens/auth/AuthDialog.kt): Removed manual email dialogs, removed email-only launcher, added Developer Error 10 error reporting without bypassing security.
2. [AuthRepository.kt](file:///c:/APPS/BUYWISE%20AI/android/app/src/main/java/com/pajonline/buywiseai/data/repository/AuthRepository.kt): Enforced strict ID token credential authentication for Google Sign-In, removed mock password fallbacks, enforced authenticated UID for Firestore profile sync.
