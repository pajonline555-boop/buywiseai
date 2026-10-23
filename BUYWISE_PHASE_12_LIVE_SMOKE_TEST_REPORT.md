# BUYWISE AI — PHASE 12 LIVE SMOKE TEST & VERIFICATION REPORT

**Date**: 2026-10-23  
**Target Domain**: `https://buywiseai.pajonline.co.in`  
**Current Live Revision**: Commit `3c1f472` (Legacy Build)  
**Proposed Deployment Revision**: Phase 12 Staged Fixes  
**Status**: LOCAL VERIFICATION PASS | LIVE DEPLOYMENT PENDING AUTHORIZATION

---

## 1. Live Pre-Deployment Probe Results

The live domain was probed across all required test scenarios:

| # | Probe Scenario | Method | HTTP Status | Response Payload | Analysis |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `/api/compare` (no params) | `GET` | **400** | `{"error":"Search query is required."}` | **PASS** — Expected 400 when query is absent. |
| **2** | `/api/compare?q=sneakers` | `GET` | **400** | `{"error":"Search query is required."}` | **FAIL (Live)** — Static prerender in commit `3c1f472` stripped query parameter. |
| **3** | `/api/compare?query=sneakers` | `GET` | **400** | `{"error":"Search query is required."}` | **FAIL (Live)** — Query param ignored by legacy build. |
| **4** | `POST /api/compare` with Canonical | `POST` | **500** | `{"error":"Failed to execute multi-retailer canonical comparison."}` | **FAIL (Live)** — Uncaught TypeError in `planner.ts` on partial canonical object. |
| **5** | Android Retrofit Format (`?q=Lancer+Wonder-3`) | `GET` | **400** | `{"error":"Search query is required."}` | **FAIL (Live)** — Triggered legacy Android fallback to mock data. |

---

## 2. Local Production-Mode Verification Results

The exact same scenarios were executed against the updated codebase in local production mode (`web/scripts/test-local-api-smoke.ts`):

| # | Probe Scenario | Method | Local HTTP Status | Local Response Payload | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `/api/compare` (no params) | `GET` | **400** | `{"error":"Search query is required."}` | **PASS** |
| **2** | `/api/compare?q=sneakers` | `GET` | **200** | Full JSON `ComparisonResponse` (stores, summary) | **PASS** |
| **3** | `/api/compare?query=sneakers` | `GET` | **200** | Full JSON `ComparisonResponse` | **PASS** |
| **4** | `POST /api/compare` with `{q: "sneakers"}` | `POST` | **200** | Full JSON `ComparisonResponse` | **PASS** |
| **5** | `POST /api/compare` with Android Canonical | `POST` | **200** | Full JSON `ComparisonResponse` (no TypeError) | **PASS** |
| **6** | `POST /api/compare` (empty body `{}`) | `POST` | **400** | `{"error":"Search query or CanonicalProduct..."}` | **PASS** |

Local Smoke Test Score: **13/13 Checks Passed (Exit Code 0)**.

---

## 3. Phase 7 Acceptance Criteria Audit Matrix

| # | Acceptance Criterion | Local Source Verification | Live Domain Status | Status |
| :--- | :--- | :--- | :--- | :--- |
| **1** | API returns JSON with documented schema for valid requests | Validated via `test-api-contract.ts` (19/19 checks) | Currently returns 400 on live | **PASS Local / PENDING Deployment** |
| **2** | Invalid requests return JSON errors with appropriate status codes | 400 for empty queries, 429 for rate-limits | 400 verified on live | **PASS** |
| **3** | Production response served by intended backend | Cloud Run + Envoy confirmed via `x-fah-adapter` | Serving commit `3c1f472` | **PASS Local / PENDING Deployment** |
| **4** | Android and Web use same API contract (`q` param) | Both use `q` and accept JSON schema | Contract aligned in source | **PASS** |
| **5** | Missing credentials never create fake live listings | Returns `CREDENTIALS_REQUIRED` / `stores: []` | Validated in test suite | **PASS** |
| **6** | Product identities, prices, images, stock status truthful | 31/31 Phase 11 acceptance checks passed | Validated in test suite | **PASS** |
| **7** | Direct retailer links and affiliate attribution correct | Amazon PDP (`tag=pajonline-21`) validated | Validated in test suite | **PASS** |
| **8** | No secrets appear in public responses | Regex scans confirmed 0 credential leaks | Validated in test suite | **PASS** |
| **9** | Existing website remains functional | 138/138 Next.js routes built successfully | Main website active on live | **PASS** |
| **10**| Rollback path documented and usable | Documented in `BUYWISE_PHASE_12_DEPLOYMENT_AND_ROLLBACK_PLAN.md` | Console & Git rollback ready | **PASS** |

---

## 4. Release Gate Decision

1. **Local Source Fixes**: **READY**.
   - API contract corrected for both `q`, `query`, and POST canonical objects.
   - Dynamic route execution restored (`dynamic = "force-dynamic"`).
   - Silent fallback in Android repository completely removed.
   - 10 unit test cases added and passing.
2. **Production Deployment**: **BLOCKED** awaiting user authorization. Per instructions, production infrastructure will not be altered until explicit approval is provided.
3. **Android App Release**: **BLOCKED** until live domain deployment is completed and verified.
