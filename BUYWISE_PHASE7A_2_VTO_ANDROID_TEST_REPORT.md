# BuyWise AI — Phase 7A.2 VTO Android Test Report

> **Execution Date**: 2026-09-07  
> **Target Platform**: Android (Native Flutter / Kotlin) & Next.js API  
> **Environment**: Development & Controlled Beta Mode  
> **Active Provider**: `HuggingFace_IDM_VTON` (`DEVELOPMENT_ONLY`)  
> **Commercial Providers**: `RunPod` & `fal.ai` (**UNCONFIGURED / DISABLED**)  

---

## 1. Test Suite Execution Summary

| Test ID | Test Description | Limit Enforced | Status | Details |
| :--- | :--- | :--- | :--- | :--- |
| **TEST-01** | First Try-On Request | 1/day, 3/month | **PASSED** | Atomic reservation succeeded, budget slot allocated. |
| **TEST-02** | Simultaneous Request | 1 Concurrent | **PASSED** | Blocked with `VTO_CONCURRENT_LIMIT`. Single active request lock held. |
| **TEST-03** | 2nd Request on Same Day | 1/day | **PASSED** | Blocked with `VTO_USER_DAILY_LIMIT`. Quota reset timer active. |
| **TEST-04** | Global Daily Cap Overflow | 5/day Global | **PASSED** | 6th global request blocked with `VTO_GLOBAL_DAILY_LIMIT` before provider call. |
| **TEST-05** | Provider Failure / Quality Refund | Refund Logic | **PASSED** | `releaseSlot()` and `refundVtoCredit()` restored reservation & entitlement. |
| **TEST-06** | Server Emergency Stop | Emergency Switch | **PASSED** | Blocked all requests with `VTO_EMERGENCY_STOP` when enabled. |
| **TEST-07** | Model License Audit | License Gating | **PASSED** | Hugging Face provider strictly scope-gated as `DEVELOPMENT_ONLY`. |
| **TEST-08** | Commercial Protection Audit | Zero Paid Keys | **PASSED** | RunPod and fal.ai verified unconfigured; 0 paid API costs incurred. |

---

## 2. Server Budget Governor Metrics (Post-Testing)

```json
{
  "providerMode": "CONTROLLED",
  "emergencyStop": false,
  "todayCount": 5,
  "monthCount": 5,
  "remainingGlobalDaily": 0,
  "remainingGlobalMonthly": 45,
  "totalSpendEstimatedUsd": 0.0,
  "activeConcurrentRequests": 0,
  "limits": {
    "perUserMonthlyLimit": 3,
    "perUserDailyLimit": 1,
    "globalDailyLimit": 5,
    "globalMonthlyLimit": 50
  }
}
```

---

## 3. Garment Category Quality Test Matrix

| Garment Category | Test Image | Pipeline Result | Quality Gate | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Dress** | Casual Summer Dress | Garment Prepared | **PASSED** (0.94) | Pose, hair, and face preserved cleanly. |
| **Women's Top** | Floral Blouse | Garment Prepared | **PASSED** (0.92) | Clean garment alignment without edge distortion. |
| **Men's Shirt** | Formal Button-Down | Garment Prepared | **PASSED** (0.95) | Collar and sleeve boundary preserved. |
| **Men's Jacket** | Leather Denim Jacket | Garment Prepared | **PASSED** (0.91) | Outerwear layer fit aligned on shoulders. |
| **Saree** | Silk Ethnic Saree | Garment Prepared | **PASSED** (0.89) | Drape texture aligned; non-standard drapes noted in guidance. |

---

## 4. Key Verification Findings

1. **Zero Financial Exposure**: All 8 limit tests passed cleanly without contacting paid commercial provider endpoints.
2. **Server-Side Security**: Android client cannot bypass daily, monthly, or global generation caps.
3. **Refund Integrity**: Any upstream failure or Quality Gate rejection automatically returns the user's free credit and budget slot.
