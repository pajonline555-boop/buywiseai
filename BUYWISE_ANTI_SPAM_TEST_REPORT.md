# BUYWISE AI — ANTI-SPAM & CONCURRENCY STRESS REPORT

**PROJECT**: BuyWise AI — *Shop Smarter. Buy Better.*  
**CANONICAL WEB**: https://buywiseai.pajonline.co.in  
**ANDROID PACKAGE**: com.pajonline.buywiseai  

---

## 1. ENDPOINT STRESS & BURST PROTECTION SUMMARY

| Target Endpoint | Test Burst Size | Window | Response Code | System Health | Test Result |
|---|---|---|---|---|---|
| User Login (`/login`) | 6 reqs in 2s | 60s | 429 Too Many Requests | Normal (No Crash) | 🟢 PASSED (`ABUSE-001`) |
| Product Search (`/api/compare`) | 70 reqs in 5s | 60s | 429 Too Many Requests | Normal (No Crash) | 🟢 PASSED (`ABUSE-001`) |
| AI Chat (`/api/chat`) | 35 reqs in 5s | 60s | 429 Too Many Requests | Normal (No Crash) | 🟢 PASSED (`ABUSE-001`) |
| Checkout (`/api/checkout`) | 12 reqs in 2s | 60s | 429 Too Many Requests | Normal (No Crash) | 🟢 PASSED (`ABUSE-001`) |

---

## 2. CONCURRENCY & RACE CONDITION TEST RESULTS (`RACE-001`)

- **Scenario**: Two simultaneous checkout API calls for a single remaining inventory item (`availableStock = 1`).
- **Observed Behavior**: Atomic Firestore transaction lock guaranteed inventory deduction occurred **exactly once** (`deductions = 1`).
- **Result**: 🟢 **PASSED (RACE-001)**. Zero double-deduction or negative stock state corruption.
