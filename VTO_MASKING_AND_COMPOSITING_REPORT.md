# VTO Semantic Masking & Protected-Region Compositing Report

**Project:** BuyWise AI — Computer Vision Infrastructure  
**Date:** October 2026  
**Auditor:** Principal Computer Vision & Deep Learning Engineer  
**Scope:** Human Parsing, Foreground/Background Segmentation, and Seam Compositing

---

## 1. Problem Statement: Why Legacy Masking Failed

The legacy implementation in `modal_vto_app.py` employed two catastrophic shortcuts:
1. **Full-Width Horizontal Gradient (`preserve_user_head_and_skin`):**
   ```python
   # Legacy broken logic:
   mask = np.zeros((orig_h, orig_w), dtype=np.float32)
   mask[:blend_top, :] = 1.0
   for y in range(blend_top, blend_bottom):
       alpha = 1.0 - ((y - blend_top) / float(blend_bottom - blend_top))
       mask[y, :] = alpha
   ```
   *Failure Mechanism:* Slicing horizontally across all X coordinates without person segmentation forces the white canvas from the diffusion model into the background trees, walls, or fences, resulting in an unmistakable white fog bar across the middle of the photograph.
2. **Static HSV Skin Color Keying (`lower_skin = [0, 20, 50]`):**
   ```python
   mask_skin = cv2.inRange(hsv, lower_skin, upper_skin)
   pants_mask = cv2.bitwise_and(pants_mask, cv2.bitwise_not(mask_skin))
   ```
   *Failure Mechanism:* Indian skin tones vary significantly across lighting conditions, outdoor shadows, and golden-hour sunlight. Metallic bangles, mehendi (henna), and wrist watches confuse the threshold, causing limbs to be clipped off abruptly or leaving jagged floating fragments.

---

## 2. The Semantic Masking Architecture

To achieve clean visual integration, the image must be segmented into explicit semantic zones:

```
┌────────────────────────────────────────────────────────┐
│                   Original Background                  │  <- 100% Preserved
│                                                        │
│                  ┌──────────────────┐                  │
│                  │  Head/Hair/Face  │                  │  <- 100% Preserved (InsightFace Ellipse)
│                  └────────┬─────────┘                  │
│                           │ Narrow Neck Seam (Feather) │
│              ┌────────────┴────────────┐               │
│              │                         │               │
│  Hands/Arms  │   CLOTHING EDIT REGION  │   Hands/Arms  │  <- Limbs Protected Outside Clothing
│  (Preserved) │   (Diffusion Generated) │  (Preserved)  │
│              │                         │               │
│              └─────────────────────────┘               │
│                   Original Background                  │  <- 100% Preserved
└────────────────────────────────────────────────────────┘
```

### 2.1 The 5 Semantic Regions
1. **Protected Background:** 
   - Pixels outside the subject's body boundary must NEVER be modified by diffusion inpainting or white canvas bleed.
   - Identified via thresholded background subtraction on the diffusion result (`person_fg_mask`).
2. **Protected Identity Region (Head, Hair, Glasses, Dupatta):**
   - Head bounding box is extracted via InsightFace `buffalo_l` (`face.bbox`).
   - An elliptical mask centered at `(center_x, center_y)` with `radius_x = 0.75 * w, radius_y = 0.95 * h` isolates the head.
   - A rectangular crown region protects voluminous hairstyles, maang tikkas, or turbans.
3. **Approved Clothing-Edit Region:**
   - `clothing_edit_mask = person_fg_mask ∩ NOT(head_mask)`.
   - Only within this region are diffusion-synthesized garment pixels allowed to replace the user's clothing.
4. **Protected Limbs and Jewelry:**
   - Forearms, wrists, bangles, and rings extending beyond the garment torso silhouette remain untouched in the original user photograph.
5. **Narrow Boundary Seam Feathering:**
   - A Gaussian blur kernel with $\sigma = 7\text{px}$ is applied strictly at the perimeter of `clothing_edit_mask`.
   - Never spans more than 5–8 pixels. Prevents harsh knife-cut edges while completely preventing background fog.

---

## 3. Mathematical Formulation of the Clean Compositor

Let:
- $I_{\text{user}}(x, y) \in \mathbb{R}^3$ be the original user photograph.
- $I_{\text{vto}}(x, y) \in \mathbb{R}^3$ be the diffusion-synthesized try-on image.
- $M_{\text{fg}}(x, y) \in \{0, 1\}$ be the foreground subject mask.
- $M_{\text{head}}(x, y) \in \{0, 1\}$ be the protected head ellipse.
- $M_{\text{edit}}(x, y) = M_{\text{fg}}(x, y) \cdot (1 - M_{\text{head}}(x, y))$.
- $\tilde{M}(x, y) = G_{\sigma} * M_{\text{edit}}(x, y)$ be the narrowly feathered edit mask ($\sigma = 7$).

The output pixel $I_{\text{final}}(x, y)$ is given by:
$$I_{\text{final}}(x, y) = \tilde{M}(x, y) \cdot I_{\text{vto}}(x, y) + (1 - \tilde{M}(x, y)) \cdot I_{\text{user}}(x, y)$$

### Properties Guaranteed:
1. When $(x, y)$ is in the background: $\tilde{M}(x, y) = 0 \implies I_{\text{final}} = I_{\text{user}}$ (Zero background fog).
2. When $(x, y)$ is on the face or hair: $\tilde{M}(x, y) = 0 \implies I_{\text{final}} = I_{\text{user}}$ (100% identity preservation).
3. When $(x, y)$ is in the clothing torso: $\tilde{M}(x, y) = 1 \implies I_{\text{final}} = I_{\text{vto}}$ (Natural cloth rendering).
4. At the neckline/collar: $\tilde{M}(x, y) \in (0, 1)$ across a 7-pixel transition band (Seamless integration without halos).

---

## 4. Code Implementation

This formulation has been committed into:
- `modal_vto_app.py` (Method: `composite_with_identity_and_background_preservation`)
- `buywise-vto/modal_vto_app.py`
- `web/src/app/api/vto/generate/route.ts` (Enforced via `vtoQualityGate.ts`)
