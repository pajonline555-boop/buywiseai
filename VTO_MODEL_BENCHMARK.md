# VTO Model Benchmark & Indian Ethnic Compatibility Evaluation

**Project:** BuyWise AI — AI Virtual Fitting Room  
**Date:** October 2026  
**Auditor:** Principal Computer Vision & Fashion Technology Architect  
**Scope:** Commercial vs Self-Hosted Models for Western & Indian Ethnic Fashion

---

## 1. Executive Summary

This benchmark evaluates leading Virtual Try-On (VTO) models on two critical dimensions:
1. **Indian Ethnic Compatibility:** Ability to drape 6-yard Sarees with visible Pallu/pleats, fit 2-piece/3-piece Lehengas (Choli blouse + flared Skirt + Dupatta), and retain midriff/jewellery without 2D cut-and-paste hacks.
2. **Operational Viability:** Model licensing (commercial use terms), latency, infrastructure cost, and reliability.

---

## 2. Comparative Matrix

| Model / Service | Native Multi-Piece / Ethnic Support | Commercial License Status | Avg Latency | Est. Cost / Try-On | Output Resolution | Operational Complexity | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FASHN Try-On Max** | **Gold Standard** (Full ensemble, saree drapes, prompt-directed styling) | **Commercially Licensed** (SaaS Enterprise API) | 12–16s | ~$0.038 (4 credits) | Up to 4096×4096 (4K) | Zero (Managed REST API, status polling) | **Primary Benchmark & High-Fidelity Tier** |
| **FASHN Try-On v1.6** | High (Tops, bottoms, one-pieces; struggles on complex multi-piece lehengas) | **Commercially Licensed** | 6–8s | ~$0.012 (1 credit) | 864×1296 | Zero (Managed REST API) | **Cost-Optimized Fast Tier** |
| **fal.ai CatVTON** | Moderate (Standard one-pieces and tops; requires manual prompt tuning) | **Commercially Licensed** (Commercial endpoint on fal.run) | 7–10s | ~$0.025 | 1024×1024 | Low (REST API) | **Secondary Commercial Fallback** |
| **Self-Hosted CatVTON (Modal L4)** | Moderate-High with custom `CatVTON_AutoMasker` & ComfyUI workflow | Apache-2.0 code; Model weights require attribution | 5–8s (warm) / 45s (cold start) | ~$0.0013 (L4 GPU @ $0.80/hr) | 1024×1024 | Medium-High (ComfyUI headless, Modal Volume management) | **Cost-Effective Self-Hosted Baseline** |
| **Kwai-Kolors VTO** | High (Photorealistic cloth folds and embroidery) | **Restricted / Registration Required** (Weights have specific commercial licensor terms) | 15–22s | ~$0.004 (Requires A10G/A100 GPU due to high VRAM) | 1024×1024 | High (Large model weights, slow cold boot) | **Hold until commercial license registration completed** |
| **IDM-VTON / Leffa (Hugging Face)** | **Poor on Ethnic Wear** (Trained on Western VITON-HD; fails on midriff cholis & flared skirts) | **Research / Non-Commercial Only** (Weights restricted to non-commercial academic use) | 25–60s (Gradio queue) | Free (ZeroGPU) / Unstable | 768×1024 | High (Subject to queue drops, 429 rate limits, cold starts) | **Deprecated from Production Path** |

---

## 3. Deep Dive into Evaluated Options

### Option A: FASHN AI Try-On Max (Production Quality Leader)
- **Architecture:** Multimodal diffusion with native garment segmenters, accessory conditioning, and natural language prompt injection.
- **Why It Excels for Indian Ethnic Wear:**
  - Handles complex 2-piece and 3-piece outfits (Choli blouse + flared Lehenga + Dupatta) in a single unified diffusion pass without requiring manual 2D pasting or horizontal slicing.
  - Understands prompt instructions: `"Photorealistic natural fit of Chaniya Choli, preserve intricate zari embroidery and natural fabric folds"`.
  - Supports jewellery, bangles, waistbands (kamarbandh), and maang tikkas without erasing arms or skin.
- **API Endpoints:**
  - Submission: `POST https://api.fashn.ai/v1/run` (`model_name: "tryon-max"`)
  - Status Polling: `GET https://api.fashn.ai/v1/status/{id}`
- **Adapter Implemented in BuyWise:** `FashnVtoProvider.ts` in `web/src/lib/vto/providers/`.

### Option B: FASHN AI Try-On v1.6 (High-Speed Budget Option)
- **Architecture:** Lightweight latent diffusion model optimized for sub-10 second try-ons.
- **Strengths:** 3× lower cost than Max, very fast turnaround (~6s), clean background preservation.
- **Limitations:** Optimized primarily for Western tops, bottoms, and one-piece dresses; complex saree pleats can exhibit pattern blur.
- **Adapter Implemented in BuyWise:** Configurable via `FASHN_MODEL_NAME=tryon-v1.6`.

### Option C: Self-Hosted ComfyUI CatVTON on Modal.com
- **Architecture:** Headless ComfyUI instance running inside a Modal container (`buywise-vto/modal_vto.py`) loaded onto an L4 GPU.
- **Masking Mechanism:** Uses `CatVTON_AutoMasker` (`cloth_type="overall"`).
- **Strengths:** Lowest marginal cost per generation (~$0.0013), zero external API token dependencies.
- **Requirements for Production:**
  - Cold starts must be mitigated using Modal memory snapshots (`@modal.enter(snap=True)`).
  - Model weights (~6GB) must be pre-populated on a persistent volume (`buywise-vto-models`).

### Option D: Kwai-Kolors Virtual Try-On
- **Licensing Notice:** While the Kolors GitHub repository is released under Apache-2.0, the **model weights** are subject to additional commercial use terms specified by Kuaishou (Kwai), which require explicit commercial registration and approval.
- **Hardware Requirement:** Kolors requires >16GB VRAM, necessitating NVIDIA A10G or A100 GPUs, making it 2.5× more expensive to host on Modal than L4.
- **Status:** Evaluated but deferred pending formal license registration.

---

## 4. Architectural Decision Record (ADR)

1. **Adopt FASHN Try-On Max as the Gold Standard Commercial Baseline:**
   - Immediately eliminates the need for crude image-processing heuristics (`synthesize_matching_lower_garment` and `preserve_user_head_and_skin`).
   - Generates natural, coherent full-body ethnic outfits with authentic drape and wrinkles.
2. **Maintain Self-Hosted CatVTON on Modal as the Zero-Cost Tier:**
   - Use `modal_vto.py` (ComfyUI CatVTON with `CatVTON_AutoMasker`) instead of calling external Hugging Face Gradio spaces.
3. **Decouple Free Users and VIP Users:**
   - Free users route to Modal CatVTON or Instant Body-Type Avatar preview ($0 cost).
   - VIP / Challenge entries route to FASHN Try-On Max for guaranteed photorealism.
