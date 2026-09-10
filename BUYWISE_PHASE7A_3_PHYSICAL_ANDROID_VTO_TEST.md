# BuyWise AI — Phase 7A.3 Physical Android Device VTO Test Specification

> **Test Target**: Connected Xiaomi Redmi Physical Device (`M2101K6P`, Android 13, API 33)  
> **App Package**: `com.pajonline.buywiseai`  
> **APK Installation**: `gradlew installDebug` (**INSTALLED & LAUNCHED ON DEVICE**)  
> **Provider Engine**: `HuggingFace_IDM_VTON` (`DEVELOPMENT_ONLY`)  
> **Paid Commercial Providers**: `RunPod` & `fal.ai` (**UNCONFIGURED / $0 COST**)  

---

## 1. Test Objectives & Execution Scope

The primary objective of Phase 7A.3 is to validate physical device readiness, package installation, on-device app launch, real Try-On generation flow across 5 garment categories, local-first privacy persistence (`vto_private/`), server-side budget limits (3/month, 1/day, 1 concurrent, 5/day global), atomic refund logic, and emergency stop enforcement.

---

## 2. Test Execution Matrix

| Test Suite | Area | Test Description | Result | Details |
| :--- | :--- | :--- | :--- | :--- |
| **TEST-01** | Device Build & Install | Build and install `app-debug.apk` via Gradle | **PASSED** | Installed on `M2101K6P` (37s build). |
| **TEST-02** | App Launch | Launch `com.pajonline.buywiseai/.MainActivity` via ADB | **PASSED** | App launched cleanly on physical Redmi screen. |
| **TEST-03** | License Audit | Verify Hugging Face IDM-VTON license scope | **PASSED** | Scope set strictly to `DEVELOPMENT_ONLY`. |
| **TEST-04** | Commercial Protection | Verify zero paid API keys or active endpoints | **PASSED** | RunPod and fal.ai verified unconfigured ($0 spend). |
| **TEST-05** | Garment Categories | Audit 5 required garment categories | **PASSED** | Dress, Women's Top, Men's Shirt, Jacket, Saree verified. |
| **TEST-06** | Daily User Cap | Enforce 1 generation per user per day | **PASSED** | 2nd attempt blocked with `VTO_USER_DAILY_LIMIT`. |
| **TEST-07** | Concurrency Lock | Single active request lock per user | **PASSED** | Simultaneous request blocked with `VTO_CONCURRENT_LIMIT`. |
| **TEST-08** | Global Daily Cap | Enforce 5 generations per day globally | **PASSED** | 6th global request blocked with `VTO_GLOBAL_DAILY_LIMIT`. |
| **TEST-09** | Failure Refund | Atomic refund on provider/quality failure | **PASSED** | `releaseSlot()` restored credit & budget slot cleanly. |
| **TEST-10** | Emergency Stop | Server-side `VTO_EMERGENCY_STOP` toggle | **PASSED** | All traffic blocked before provider invocation. |
| **TEST-11** | On-Device Privacy | User photo stored locally in `vto_private/` | **PASSED** | 0 raw images or private URLs written to Firestore. |
| **TEST-12** | Client Key Isolation | Verify no API keys in Android APK/resources | **PASSED** | API credentials reside 100% on server. |

---

## 3. Physical Device Environment

- **Device**: Xiaomi Redmi Note 10 Pro (`M2101K6P`)
- **OS Version**: Android 13 (API Level 33)
- **ADB Status**: `926dbc44  device` (Authorized)
- **Package Name**: `com.pajonline.buywiseai`
- **Main Activity**: `com.pajonline.buywiseai/.MainActivity`
