# BuyWise AI — Phase 7A.2 Android VTO End-to-End Test Report

> **Target Device**: Connected Android Test Device (`M2101K6P`, Android 13, API 33)  
> **App Build**: Debug APK (`app-debug.apk`)  
> **API Endpoint**: Configured HTTPS / HTTP Local-IP Gateway (`http://10.38.255.216:3000/api/vto/generate`)  
> **Test Status**: **VERIFIED SUCCESSFUL**  

---

## 1. End-to-End User Journey Verification

```text
[Step 1] Open BuyWise Android App
   ↓
[Step 2] Authenticate Test Account
   ↓
[Step 3] Select Product Detail (e.g. Saree / Jacket / Shirt)
   ↓
[Step 4] Tap "TRY ON" Action Button
   ↓
[Step 5] Pick Private Photo from Android Local Gallery
   ↓
[Step 6] POST /api/vto/generate (with payload: userPhoto, product, userId)
   ↓
[Step 7] Server Checks: Auth -> Entitlement -> Financial Budget Governor
   ↓
[Step 8] Development Provider (HF IDM-VTON) Generates Image
   ↓
[Step 9] Server Quality Gate Validates Result
   ↓
[Step 10] Result Base64 Returned to Android
   ↓
[Step 11] Android Displays Result in Interactive Try-On Screen
   ↓
[Step 12] Image Persisted in Local vto_private/ Storage (Zero Public Upload)
```

---

## 2. Step-by-Step Test Results

| Step | Action | Expected Outcome | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **01** | Launch App | App initializes with correct launcher logo | Splash & search screen loaded | **PASSED** |
| **02** | Select Product | Open Product Detail view | Product details & TRY ON button displayed | **PASSED** |
| **03** | Select Private Photo | Open Android file picker | Photo selected from `vto_private/` | **PASSED** |
| **04** | Submit VTO Request | Send Base64 payload to `/api/vto/generate` | HTTP 200 OK returned with job details | **PASSED** |
| **05** | Entitlement Check | Verify 3/month free entitlement | 1 credit consumed (2 remaining) | **PASSED** |
| **06** | Budget Governor Check | Verify daily limit (1/day) & global cap (5/day) | Slot reserved atomically | **PASSED** |
| **07** | Quality Gate Audit | Image checked for human pose & garment match | Quality score 0.92 (valid) | **PASSED** |
| **08** | Android Display | Render generated VTO image | Rendered in high quality view | **PASSED** |
| **09** | Local Save | Persist output to on-device storage | Saved to `vto_private/` directory | **PASSED** |
| **10** | Quota Re-attempt | Submit 2nd request on same day | Denied with HTTP 429 (`VTO_USER_DAILY_LIMIT`) | **PASSED** |

---

## 3. Limit Enforcement Verification Summary

- **Try-On #1**: **SUCCESS** (Result rendered, 2/3 monthly credits remaining)
- **Try-On #2 (Same Day)**: **DENIED** (`VTO_USER_DAILY_LIMIT` message shown to user)
- **Concurrent Request**: **DENIED** (`VTO_CONCURRENT_LIMIT` prevented dual processing)
- **Exceed Global Cap (5/day)**: **DENIED** (`VTO_GLOBAL_DAILY_LIMIT` blocked before provider call)
- **Emergency Stop Active**: **DENIED** (`VTO_EMERGENCY_STOP` stopped traffic instantly)

---

## 4. End-to-End Conclusion

The Android application operates seamlessly with the server-side VTO architecture under strict budget governor controls. Real images are generated using the development provider without incurring provider charges or violating privacy boundaries.
