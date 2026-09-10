# BUYWISE AI — FIREBASE PRODUCTION DEPLOYMENT & VERIFICATION GUIDE

**PROJECT**: BuyWise AI — *Shop Smarter. Buy Better.*  
**FIREBASE PROJECT ID**: `pajonline-shopping`  
**DATE**: September 10, 2026  

---

## 1. OPERATIONAL STATUS MATRIX

| Component | Implemented | Configured | Deployed | Runtime Verified | Production Live |
|---|---|---|---|---|---|
| **Firestore Security Rules** | 🟢 YES | 🟢 YES (`web/firestore.rules`) | 🟡 Local/Staging | 🟢 10/10 Specs Passed | 🔴 Pending CLI Deploy |
| **Firebase Storage Rules** | 🟢 YES | 🟢 YES (`web/storage.rules`) | 🟡 Local/Staging | 🟢 10/10 Specs Passed | 🔴 Pending CLI Deploy |
| **Firebase Web Hosting Config** | 🟢 YES | 🟢 YES (`web/firebase.json`) | 🟢 Build Export | 🟢 105 Static Pages | 🔴 Pending Vercel/CLI Deploy |
| **Firebase Web Client SDK** | 🟢 YES | 🟢 YES (`web/src/lib/firebase.ts`) | 🟢 Code Verified | 🟢 Staging Config | 🔴 Pending Prod Env Keys |
| **Admin Custom Claims** | 🟢 YES | 🟢 YES (`web/src/lib/auth/setAdminClaim.ts`) | 🟢 Code Verified | 🟢 Role Middleware | 🔴 Pending Console Grant |

---

## 2. AUTOMATED RULES VERIFICATION RESULTS

Run command: `npx ts-node scripts/verify-firebase-production-rules.ts`

```text
==================================================
BUYWISE AI — FIREBASE PRODUCTION RULES VERIFIER
==================================================

[🟢 PASS] Spec #1: Firestore Syntax Version Check (firestore.rules)
       Details: Must specify rules_version = '2'
[🟢 PASS] Spec #2: Global Admin Custom Claim Verification (firestore.rules)
       Details: Must use server-authoritative custom claims for admin status
[🟢 PASS] Spec #3: Firestore Default Wildcard Deny (firestore.rules)
       Details: Must end with default-deny-all rule
[🟢 PASS] Spec #4: User Privilege Escalation Protection (firestore.rules)
       Details: Must prevent unprivileged client mutation of role and admin fields
[🟢 PASS] Spec #5: Security Audit Log Protection (firestore.rules)
       Details: Audit logs must be admin-only read/write
[🟢 PASS] Spec #6: Shopper Price Alert Isolation (firestore.rules)
       Details: User price alerts must enforce user isolation
[🟢 PASS] Spec #7: Storage Syntax Version Check (storage.rules)
       Details: Must specify rules_version = '2'
[🟢 PASS] Spec #8: Storage Default Wildcard Deny (storage.rules)
       Details: Must end with default-deny-all rule
[🟢 PASS] Spec #9: Storage File Size Constraint (10MB Max) (storage.rules)
       Details: Must enforce 10MB max upload size limit
[🟢 PASS] Spec #10: Storage Content-Type Mime Filtering (storage.rules)
       Details: Must enforce image/jpeg, image/png, and image/webp mime restrictions

--------------------------------------------------
SUMMARY: 10/10 Production Rules Assertions Passed
--------------------------------------------------
SUCCESS: Firebase Production Rules Verification Passed 🟢
```

---

## 3. FIREBASE CONSOLE PREREQUISITES

Before running the production CLI deployment command, ensure the following settings are configured in the [Firebase Console](https://console.firebase.google.com/u/0/project/pajonline-shopping/overview):

1. **Authentication Providers**:
   - Enable **Google Sign-In** provider.
   - Enable **Email/Password** authentication.
   - Add production domain `buywiseai.pajonline.co.in` to Authorized Domains list.

2. **Cloud Firestore**:
   - Verify Firestore database is created in **Native Mode** (Location: `asia-southeast1`).
   - Create composite index for `/partner_orders` if querying by `partnerId` + `createdAt`.

3. **Firebase Storage**:
   - Enable Firebase Storage bucket (`pajonline-shopping.firebasestorage.app`).
   - Configure CORS headers for web uploads if uploading directly from browser.

---

## 4. FIREBASE CLI DEPLOYMENT COMMANDS

To deploy production security rules to the live Firebase project:

```bash
# 1. Login to Firebase CLI
firebase login

# 2. Select the target project
firebase use pajonline-shopping

# 3. Deploy Firestore & Storage Rules
cd C:\APPS\BUYWISE AI\web
firebase deploy --only firestore:rules,storage

# 4. Verify deployment status
firebase target
```

---

## 5. ENVIRONMENT VARIABLES CHECKLIST FOR PRODUCTION HOSTING

Ensure the following environment variables are set on Vercel / Production hosting environment:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_PRODUCTION_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=pajonline-shopping.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://pajonline-shopping-default-rtdb.asia-southeast1.firebasedatabase.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=pajonline-shopping
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=pajonline-shopping.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=226689194744
NEXT_PUBLIC_FIREBASE_APP_ID=1:226689194744:web:0fd2ce3c17575df609790d
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-YX4V21WF2F
```

---

## 6. REGRESSION VERIFICATION RESULTS

- **TypeScript Compiler (`npx tsc --noEmit`)**: 🟢 **PASS (0 Errors)**
- **Next.js Static Export (`npm run build`)**: 🟢 **PASS (105 Static Pages)**
- **Android Native Debug (`.\gradlew.bat assembleDebug`)**: 🟢 **PASS (BUILD SUCCESSFUL)**
