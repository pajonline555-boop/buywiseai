# VTO Root Cause Audit & Architectural Diagnosis

**Repository:** `c:\APPS\BUYWISE AI`  
**Date:** October 2026  
**Auditor:** Principal Computer Vision & Fashion Technology Architect  
**Status:** Audit Completed · Root Causes Verified Against Live Codebase

---

## 1. Executive Summary

This audit investigates the severe visual artifacts observed in BuyWise AI Virtual Try-On (VTO) results when testing Indian ethnic apparel (specifically Navratri Chaniya Choli / Lehenga).

The test output suffered from:
1. **Harsh white gradient horizontal fog** cutting across the user's chest, neck, and outdoor background.
2. **Flat 2D rectangular skirt pasting** with raw cut-off borders and white flanking voids.
3. **Mutilated hands, arms, and jewellery** resulting from broken color-key thresholding.
4. **Side-by-side ghost duplicates / face-swapping confusion** where catalog models leaked into the scene.
5. **Corrupted images saved automatically** into user galleries and marked as "✨ Community Look • Ready for Challenge".

The audit confirmed that **none of these visual artifacts were caused by inherent diffusion randomness**. They were produced deterministically by custom post-processing scripts in `modal_vto_app.py` attempting to "repair" incomplete single-garment diffusion outputs using naive image-processing tricks.

---

## 2. Git Status & Environment Baseline

- **Working Directory:** `c:\APPS\BUYWISE AI`
- **Git Working Tree:** Clean (`git status -s` produced 0 uncommitted changes prior to audit).
- **Active Deployment:**
  - **Modal Endpoint:** `https://ashupajonline--buywise-vto-engine-buywisevtoengine-generate.us-east.modal.run` (NVIDIA L4 GPU)
  - **Script Deployed on Modal:** `modal_vto_app.py` (`BuyWiseVtoEngine.generate`)
  - **Client Callers:**
    - Android: `VtoImageSynthesizer.kt` (lines 36–76)
    - Web / API: `web/src/app/api/vto/generate/route.ts` (lines 48–78)

---

## 3. Verified Root Causes with Exact Code Locations

### Root Cause 1: Full-Width Horizontal Linear Gradient Seam
- **Location:** `modal_vto_app.py`, Lines 152–192 (`preserve_user_head_and_skin`)
- **Code Culprit:**
  ```python
  mask = np.zeros((orig_h, orig_w), dtype=np.float32)
  mask[:blend_top, :] = 1.0
  for y in range(blend_top, blend_bottom):
      alpha = 1.0 - ((y - blend_top) / float(blend_bottom - blend_top))
      mask[y, :] = alpha
  mask_3ch = np.dstack([mask, mask, mask])
  blended = (user_bgr.astype(np.float32) * mask_3ch + result_bgr.astype(np.float32) * (1.0 - mask_3ch)).astype(np.uint8)
  ```
- **Mechanism:**
  The mask blends the original image and the try-on output across the **entire image width** (`mask[:blend_top, :] = 1.0` and `mask[y, :] = alpha` across all X coordinates).
  Because diffusion engines (such as Leffa and IDM-VTON) synthesize clothing on an isolated studio or plain canvas, blending a horizontal strip across the full width forces the white background into the user's outdoor background (trees, fences, sky), producing the thick white horizontal fog band.

---

### Root Cause 2: 2D Rectangular Skirt Crop-and-Paste
- **Location:** `modal_vto_app.py`, Lines 194–249 (`synthesize_matching_lower_garment`)
- **Code Culprit:**
  ```python
  skirt_cat = catalog_bgr[int(cat_h * 0.55):, :]
  split_y = int(orig_h * 0.60)
  user_lower = result_bgr[split_y:, :]
  lower_h, lower_w = user_lower.shape[:2]
  ...
  pants_mask[:, pad_x:lower_w - pad_x] = 255
  skirt_resized = cv2.resize(skirt_cat, (lower_w, lower_h), interpolation=cv2.INTER_LANCZOS4)
  blended_lower = (skirt_resized.astype(np.float32) * pants_mask_3ch + user_lower.astype(np.float32) * (1.0 - pants_mask_3ch)).astype(np.uint8)
  ```
- **Mechanism:**
  For multi-piece outfits like Lehengas or Chaniya Cholis, the script slices the bottom 45% of the catalog product photo, forcibly resizes it with `cv2.resize()`, and pastes it at `y = 60%`. This results in a completely flat, unwarped, cardboard-like skirt with rectangular boundaries and white voids on both flanks.

---

### Root Cause 3: HSV Skin-Color Thresholding Clipping Limbs & Jewellery
- **Location:** `modal_vto_app.py`, Lines 217–236
- **Code Culprit:**
  ```python
  hsv = cv2.cvtColor(user_lower, cv2.COLOR_BGR2HSV)
  lower_skin = np.array([0, 20, 50])
  upper_skin = np.array([25, 255, 255])
  mask_skin = cv2.inRange(hsv, lower_skin, upper_skin)
  kernel_skin = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
  mask_skin = cv2.dilate(mask_skin, kernel_skin, iterations=2)
  pants_mask = cv2.bitwise_and(pants_mask, cv2.bitwise_not(mask_skin))
  ```
- **Mechanism:**
  Crude static HSV thresholds fail in natural outdoor lighting, variable shadows, Indian skin undertones, and bangles/bracelets. Arms and hands are partially classified as background or clothing, producing jagged holes, floating wrist fragments, and erased jewellery.

---

### Root Cause 4: Multi-Piece Indian Ethnic Mismatch in Western VTO Models
- **Location:** `modal_vto_app.py`, Lines 86–125 (`run_leffa_vto`) and Lines 126–150 (`run_idm_vton`)
- **Mechanism:**
  Both Leffa and IDM-VTON were trained on VITON-HD and DressCode datasets consisting of Western upper-body shirts, lower-body trousers/skirts, or 1-piece Western dresses.
  When passed a 2-piece Lehenga (Choli blouse + flared flared skirt) or a 6-yard draped Saree, the single-garment conditioning fails because the model expects a single continuous garment topology.

---

### Root Cause 5: Nested Modal L4 GPU Calling External Hugging Face Spaces
- **Location:** `modal_vto_app.py`, Lines 91–95, 130–133
- **Code Culprit:**
  ```python
  client = Client("franciszzj/Leffa", token=hf_token)
  ...
  client = Client("yisol/IDM-VTON", token=hf_token)
  ```
- **Mechanism:**
  The Modal container allocates an expensive NVIDIA L4 GPU ($0.80/hr) merely to act as an HTTP reverse-proxy forwarding requests to free Hugging Face Gradio spaces (`franciszzj/Leffa` and `yisol/IDM-VTON`). This adds 30–90 seconds of network hop overhead, inherits public space rate limits and cold starts, and prevents direct access to diffusion latents, attention maps, or custom segmentation tensors.

---

### Root Cause 6: Missing Quality Gate Enforcement & Automatic False-Success
- **Location:**
  - `web/src/app/api/vto/generate/route.ts`, Lines 107–118:
    Any image returned by Modal is stamped `success: true` and returned with HTTP 200 without running quality validation.
  - `web/src/lib/vto/vtoQualityGate.ts`, Lines 14–109:
    Quality gate only validates whether the image is non-empty base64; it performs zero checks for background preservation, limb integrity, or white voids.
  - `web/src/lib/vto/identityValidator.ts` & `garmentFidelityValidator.ts`:
    Both validators return hardcoded mock scores (`facialSimilarityScore: 98`, `overallFidelityScore: 95`).
  - Android `VtoScreen.kt`, Line 1365:
    Unconditionally saves any received image into "Local Private Media" and displays it as "✨ Community Look • Ready for Challenge".

---

## 4. Architectural Trace of Real VTO Requests

```
[Android App: VtoScreen.kt / VtoImageSynthesizer.kt]
                    │
                    ▼ (Direct HTTP POST with userImageBase64 & garmentImageUrl)
[Modal L4 Container: modal_vto_app.py (FastAPI)]
                    │
                    ├── 1. InsightFace face detection (chin_y extraction)
                    ├── 2. HTTP POST -> HuggingFace Gradio Space (Leffa / IDM-VTON)
                    │       └── Synthesizes upper dress on white studio canvas
                    ├── 3. preserve_user_head_and_skin()
                    │       └── FULL-WIDTH horizontal gradient blend (causes white fog bar)
                    ├── 4. synthesize_matching_lower_garment()
                    │       └── Crops 45% catalog skirt, resizes, pastes with HSV mask (causes cardboard skirt & severed arms)
                    └── 5. Return base64 WebP with success: true
                    │
                    ▼
[Android App / Web Frontend]
                    └── Saved to Local Private Media & presented as "Community Look Ready"
```

---

## 5. Summary of Corrective Action Plan

1. **Immediate Removal:** Strip `preserve_user_head_and_skin` and `synthesize_matching_lower_garment` from the inference pipeline.
2. **Strict Mask Compositing:** Isolate the permitted clothing-edit region using semantic human parsing (SCHP/DensePose); composite generated pixels ONLY within the clothing region, retaining 100% of the original background, head, and hands.
3. **Commercial Engine Integration:** Integrate a production-grade commercial VTO engine (FASHN Try-On Max / fal.ai) as the high-fidelity baseline for complex garments.
4. **Real Automated Quality Gate:** Implement deterministic perceptual quality checks (face similarity, background edge drift, void detection) that reject failed generations before they reach user media or community challenges.
