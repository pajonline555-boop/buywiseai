# VTO Migration & Production Rollout Plan

**Project:** BuyWise AI — AI Virtual Fitting Room  
**Date:** October 2026  
**Status:** In Progress · Phased Production Execution  

---

## 1. Migration Overview

This document details the transition path from the legacy image-processing hack pipeline to a production-grade, commercially viable, and photorealistic Indian ethnic Virtual Try-On system.

---

## 2. Phased Rollout Schedule

```
Phase 1 (Immediate)        Phase 2 (Baseline)          Phase 3 (Quality Gate)      Phase 4 (Ethnic Certification)
┌───────────────────────┐  ┌────────────────────────┐  ┌────────────────────────┐  ┌─────────────────────────────┐
│ Eliminate 2D Pasting  │  │ Deploy FashnVtoProvider│  │ Enforce vtoQualityGate │  │ Benchmark 50 Ethnic SKUs    │
│ & Horizontal Seams    │->│ (Try-On Max benchmark) │->│ & Safe Rejection Path  │->│ Sarees, Lehengas, Kurtis    │
│ in modal_vto_app.py   │  │ Configure fallback pool│  │ in Web & Android App   │  │ Measure Artifact Rate < 5%  │
└───────────────────────┘  └────────────────────────┘  └────────────────────────┘  └─────────────────────────────┘
```

---

## 3. Detailed Phase Breakdown

### Phase 1: Disablement of Known Destructive Artifact Sources (COMPLETED)
- **Objective:** Eliminate visual abominations (white fog bands, cardboard skirts, severed limbs) immediately.
- **Actions Taken:**
  1. Removed `synthesize_matching_lower_garment` (2D crop-and-paste) from `modal_vto_app.py` and `buywise-vto/modal_vto_app.py`.
  2. Removed full-width horizontal linear gradient `preserve_user_head_and_skin`.
  3. Replaced with `composite_with_identity_and_background_preservation` using localized InsightFace head anchoring and foreground background preservation.
  4. Added `validate_generation_quality` rejecting generations with >35% solid white void bleed.

---

### Phase 2: Commercial Benchmark & Adapter Integration (COMPLETED)
- **Objective:** Provide a production-grade engine capable of authentic multi-piece ethnic wear draping.
- **Actions Taken:**
  1. Created `FashnVtoProvider.ts` implementing `IVtoProvider`:
     - Flagship model: `tryon-max` (supports full ensemble, sarees, jewelry, up to 4K resolution).
     - Fast model: `tryon-v1.6` (for real-time preview).
     - Async prediction submission to `POST https://api.fashn.ai/v1/run` and polling `GET https://api.fashn.ai/v1/status/{id}`.
  2. Integrated `fashnVtoProvider` into `VtoProviderRouter.ts` as the primary commercial quality benchmark.
  3. Preserved `falVtoProvider` and `modalVtoProvider` in the routing tier.

---

### Phase 3: Quality Gate Enforcement & Client Hardening (COMPLETED)
- **Objective:** Ensure corrupt generations can never be displayed as "Community Looks" or saved into private user media.
- **Actions Taken:**
  1. Enhanced `vtoQualityGate.ts` with perceptual void detection, minimum resolution checks, and `canPublishToCommunity: false` flagging.
  2. Integrated `validateGeneratedImage` into Next.js `/api/vto/generate/route.ts`. Returns HTTP 422 with actionable guidance on quality failure.
  3. Updated Android `VtoScreen.kt` to delete temporary files if `success == false` and show an honest retry message.
  4. Removed hardcoded `HF_TOKEN` from Android `VtoImageSynthesizer.kt` and routed fallbacks through the secure backend.

---

### Phase 4: Modal GPU Architecture Rationalization (SCHEDULED)
- **Objective:** Eliminate wasteful nested HTTP calls to external Gradio spaces from inside an expensive Modal L4 GPU container.
- **Migration Path:**
  - **Option 1 (Preferred for High Volume / Low Cost):** Deploy `buywise-vto/modal_vto.py` which runs local headless ComfyUI CatVTON with pre-downloaded weights on persistent volume `buywise-vto-models`. Cold starts reduced to <15s with Modal memory snapshots (`@modal.enter(snap=True)`).
  - **Option 2 (Preferred for Maximum Fidelity):** Route ethnic and multi-piece garments through `FashnVtoProvider` (Try-On Max) directly from Next.js, reserving Modal for single-garment or fast face-swap workloads.

---

## 4. Rollback & Fail-Safe Instructions

If any regression occurs during deployment:
1. **To switch primary provider to fal.ai:**
   Set `VTO_PRIMARY_PROVIDER=fal-vto` in `.env.local` or production environment variables.
2. **To switch to Modal self-hosted:**
   Set `VTO_PRIMARY_PROVIDER=modal-vto` in `.env.local`.
3. **Emergency Disablement:**
   Set `VTO_ROUTER_ENABLED=false` to return the multi-body instant avatar switcher, guaranteeing zero broken visual outputs for end users.
