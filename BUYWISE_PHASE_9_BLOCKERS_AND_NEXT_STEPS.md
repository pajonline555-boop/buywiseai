# BUYWISE AI — PHASE 9: BLOCKERS AND NEXT STEPS

**Milestone**: Phase 9 Production Readiness & Live Retailer Verification  
**Date**: October 2026  
**Auditor**: Google Antigravity Advanced Agentic Coding Engine  
**Strict Classification**: PASS · FAIL · BLOCKED · NOT TESTED  

---

## 1. Status Summary of Blockers

| Component | Status | Blocker Type | Description |
| :--- | :--- | :--- | :--- |
| **Amazon India Live API** | **BLOCKED** | External Account Eligibility | PA-API 5.0 keys cannot be generated until the Amazon Associates account generates 3 qualifying sales within 180 days. The new Amazon Creators API has developer registration prerequisites. |
| **Flipkart Live API** | **BLOCKED** | Credential Configuration | `FLIPKART_AFFILIATE_TOKEN` is unconfigured in `.env.local`. Flipkart Affiliate program API access requires active bearer token renewal. |
| **Meesho Live API** | **NOT AVAILABLE (PASS for Search-Link)** | Architectural / No Public API | Meesho does not provide a public developer search API in India. Scraping is prohibited by Terms of Service. Honest search-link fallback is permanent until partnership. |
| **Modal VTO Security** | **ACTION REQUIRED** | Code Hygiene Before VTO Launch | Legacy Hugging Face read token in `modal_vto_app.py` should be migrated to Modal Secret before running serverless VTO workloads. (Does not affect search comparison engine). |
| **Git & Production Infrastructure** | **SAFE (Zero Commits / Zero Pushes)** | Policy Gate | All Phase 9 modifications are held locally. Production deployment blocked pending user review and approval. |

---

## 2. Platform-Specific Blocker Breakdown & Action Steps

### 2.1 Amazon India (PA-API 5.0 / Amazon Creators API)
- **Current Behavior**:
  - Outbound direct search links (`https://www.amazon.in/s?k=...&tag=pajonline-21`) and product links (`https://www.amazon.in/dp/...&tag=pajonline-21`) work properly.
  - Live product price and stock queries via PA-API 5.0 fail due to missing `AMAZON_PAAPI_KEY` and `AMAZON_PAAPI_SECRET`.
- **Root Cause**:
  - Amazon restricts PA-API 5.0 access to Associates who have generated at least 3 qualifying sales within the past 180 days.
  - The newer Amazon Creators API requires separate developer enrollment.
- **Manual Actions Required**:
  1. Drive initial traffic through BuyWise AI search links with tag `pajonline-21` to generate the 3 required qualifying sales.
  2. Once sales threshold is met, log into [Amazon Associates Central](https://affiliate-program.amazon.in/) > Tools > Product Advertising API.
  3. Generate `Access Key` and `Secret Key`.
  4. Add to production environment secrets:
     ```bash
     AMAZON_PAAPI_KEY="your-access-key"
     AMAZON_PAAPI_SECRET="your-secret-key"
     AMAZON_ASSOCIATE_TAG="pajonline-21"
     ```

---

### 2.2 Flipkart (Affiliate API 1.0)
- **Current Behavior**:
  - Fallback deep links with tracking parameter `affid=pajonline` work properly.
  - Live API queries to `https://affiliate-api.flipkart.net/affiliate/1.0/search.json` fail due to missing `FLIPKART_AFFILIATE_TOKEN`.
- **Root Cause**:
  - Flipkart Affiliate API requires a server-side Bearer Token header (`Fk-Affiliate-Token`).
- **Manual Actions Required**:
  1. Log into [Flipkart Affiliate Portal](https://affiliate.flipkart.com/).
  2. Navigate to **API** > **API Credentials**.
  3. Copy your Affiliate ID and generate an API Token.
  4. Add to production environment secrets:
     ```bash
     FLIPKART_AFFILIATE_ID="pajonline"
     FLIPKART_AFFILIATE_TOKEN="your-flipkart-api-token"
     ```

---

### 2.3 Meesho
- **Current Behavior**:
  - Outbound search link (`https://www.meesho.com/search?q=...`) displays with clear `SEARCH_LINK_ONLY` and `unverified` status badge.
  - Zero scraping is performed, preventing IP blacklisting or legal non-compliance.
- **Root Cause**:
  - Meesho operates primarily through mobile apps and a closed web frontend. There is no official public REST or GraphQL product catalog API for third-party affiliate aggregators in India.
- **Resolution**:
  - Retain the current search-link-only integration. It is 100% legally compliant, transparent to the user, and functional.
  - No credential action is required.

---

### 2.4 Modal VTO Secret Migration (Pre-VTO Deployment Step)
- **Action**:
  - In `modal_vto_app.py`, replace raw string token with:
    ```python
    import os
    hf_token = os.environ.get("HF_TOKEN")
    ```
  - In Modal CLI, run:
    ```bash
    modal secret create huggingface-secret HF_TOKEN="hf_..."
    ```

---

## 3. Decision Framework for Launch

| Deployment Pathway | Status | Pros | Cons / Dependencies |
| :--- | :--- | :--- | :--- |
| **Path 1: Compliant Search-Link & Partner Launch (Recommended for Immediate Launch)** | **READY** | • Zero external credentials needed<br>• Fully compliant with Amazon & Flipkart policies<br>• Genuine BuyWise Partner Store prices and live checkout<br>• Accumulates qualifying clicks for Amazon 3-sale threshold | • Live prices on external stores rely on catalog benchmarks until API keys are set |
| **Path 2: Full Live Dynamic API Launch** | **BLOCKED** | • Real-time dynamic price pulls from Amazon and Flipkart | • Requires waiting for Amazon Associates 3-sale qualification and Flipkart token generation |

---

## 4. Next Steps & Approval Gate

Before any files are staged, committed, or pushed to GitHub (`origin/main`), or deployed to Firebase Hosting / Cloud Run:

1. [ ] **Review Phase 9 Documentation Deliverables**:
   - [BUYWISE_PHASE_9_PRODUCTION_READINESS_REPORT.md](file:///C:/APPS/BUYWISE%20AI/BUYWISE_PHASE_9_PRODUCTION_READINESS_REPORT.md)
   - [BUYWISE_PHASE_9_LIVE_RETAILER_VERIFICATION.md](file:///C:/APPS/BUYWISE%20AI/BUYWISE_PHASE_9_LIVE_RETAILER_VERIFICATION.md)
   - [BUYWISE_PHASE_9_GIT_AND_SECURITY_AUDIT.md](file:///C:/APPS/BUYWISE%20AI/BUYWISE_PHASE_9_GIT_AND_SECURITY_AUDIT.md)
   - [BUYWISE_PHASE_9_BLOCKERS_AND_NEXT_STEPS.md](file:///C:/APPS/BUYWISE%20AI/BUYWISE_PHASE_9_BLOCKERS_AND_NEXT_STEPS.md)
2. [ ] **Select Deployment Pathway**:
   - Confirm whether to proceed with **Path 1** (Deploy in Compliant Search-Link & Partner Mode) or pause for **Path 2** (Obtain API credentials).
3. [ ] **Authorize Git Staging & Deployment**:
   - Awaiting explicit instruction from the user before executing `git add`, `git commit`, `git push`, or `firebase deploy`.
