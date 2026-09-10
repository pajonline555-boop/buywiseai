# BUYWISE AI ANDROID — AUTHENTICATION & PROFILE CONTRACT

**Target Package:** `com.pajonline.buywiseai`  
**Web Source of Truth:** `c:\APPS\BUYWISE AI\web\src\lib\AuthContext.tsx`  
**Date:** September 6, 2026  
**Contract Version:** 1.0.0

---

## 1. AUTHENTICATION SERVICES MATRIX

| Auth Service | Status | Backend / Web Mechanism | Android Native Implementation |
| :--- | :--- | :--- | :--- |
| **Email / Password Sign-In** | 🟢 **VERIFIED** | `signInWithEmailAndPassword(auth, email, pass)` | Firebase Auth Android SDK (`FirebaseAuth.getInstance().signInWithEmailAndPassword`) |
| **Email / Password Sign-Up** | 🟢 **VERIFIED** | `createUserWithEmailAndPassword` + Firestore document creation in `users/{uid}` | Firebase Auth SDK + Firestore `users/{uid}` document initialization |
| **Password Reset** | 🟢 **VERIFIED** | `sendPasswordResetEmail(auth, email)` | `FirebaseAuth.getInstance().sendPasswordResetEmail(email)` |
| **Email Verification** | 🟢 **VERIFIED** | `sendEmailVerification(user)` | `user.sendEmailVerification()` |
| **Google Sign-In** | 🟡 **NEEDS CONFIGURATION** | Web popup `signInWithPopup(auth, googleProvider)` | Requires SHA-1 fingerprint registration in Firebase Console |
| **Guest / Anonymous Access** | 🟢 **VERIFIED** | Unauthenticated browsing permitted for public compare/scrape | Guest Mode State (`AUTH_STATE_GUEST`) with truthful `SIGN IN / SYNC ACCOUNT` prompts |
| **Sign Out** | 🟢 **VERIFIED** | `signOut(auth)` | `FirebaseAuth.getInstance().signOut()` |
| **Reauthentication & Deletion** | 🟢 **VERIFIED** | `reauthenticateWithCredential` + `deleteUser` | Firebase Auth Reauthentication API + Firestore document cleanup |

---

## 2. FIRESTORE USER PROFILE SCHEMA (`users/{uid}`)

```typescript
export interface UserProfileData {
  displayName?: string;
  email?: string | null;
  phone?: string;
  photoURL?: string;
  role?: 'shopper' | 'partner' | 'admin' | string;
  preferredLanguage?: string;
  shoppingPreferences?: {
    currency?: string;
    categories?: string[];
    retailers?: string[];
    brands?: string[];
    minPrice?: number;
    maxPrice?: number;
    condition?: string;
    smartCompareSort?: string;
  };
  createdAt?: any;
  updatedAt?: any;
}
```

* **Default Preferences created upon registration:**
  * `currency`: `"INR"`
  * `categories`: `["Fashion & Clothing", "Mobiles & Smartphones", "Audio & Headphones"]`
  * `retailers`: `["Amazon India", "Flipkart", "Myntra"]`
  * `minPrice`: `500`, `maxPrice`: `50000`
  * `role`: `"shopper"` (Role escalation is strictly server-gated. Android client cannot modify `role` to `admin` or `partner`).

---

## 3. ANDROID AUTH STATE MACHINE

```
              ┌────────────────────────┐
              │      AUTH_LOADING      │
              └───────────┬────────────┘
                          │
            ┌─────────────┴─────────────┐
            ▼                           ▼
  ┌───────────────────┐       ┌───────────────────┐
  │   GUEST_MODE      │       │   AUTHENTICATED   │
  │ (Unauthenticated) │       │ (Firebase User)   │
  └─────────┬─────────┘       └─────────┬─────────┘
            │                           │
            │  Sign In / Register       │  Sign Out / Delete
            └───────────────────────────┘
```

* **Truthful UI Rules:**
  1. The app will **never** display "Logged in" unless Firebase Auth confirms `currentUser != null`.
  2. Account counters (Saved Products, Price Alerts, Orders) show actual counts or "—" / "Not available yet" when unauthenticated.
  3. Private VTO images in `context.filesDir/vto_private/` remain local-first and are **never** synced to Firebase Profile or Firestore.
