# BuyWise AI — Virtual Try-On Architecture

## Overview
The AI Virtual Try-On & Shopping Discovery System enables users to upload a selfie/portrait photo and visually preview clothing, sarees, dresses, suits, sherwanis, and jewellery from connected stores (Amazon India, Flipkart, Myntra, Meesho) on their body while preserving facial identity, body proportions, and lighting.

## Architecture Pipeline

```
  ┌───────────────────────┐
  │   USER PHOTO UPLOAD   │ (MIME, Size, Consent, Privacy Validation)
  └───────────┬───────────┘
              │
              ▼
  ┌───────────────────────┐
  │ VISION & POSE ENGINE  │ (Pose estimation, landmark detection, segmentation)
  └───────────┬───────────┘
              │
              ▼
  ┌───────────────────────┐
  │ VIRTUAL TRY-ON ENGINE │ (Garment transfer, saree drape: Nivi/Bengali/Gujarati)
  └───────────┬───────────┘
              │
              ▼
  ┌───────────────────────┐
  │ MULTI-STORE DISCOVERY │ (Amazon, Flipkart, Myntra, Meesho affiliate URLs)
  └───────────────────────┘
```

## Key Components

1. **Photo Upload & Privacy Guard (`src/components/vto/PhotoUploadDropzone.tsx`)**:
   - Explicit user consent & resolution/suitability check.
   - Immediate 1-click user photo deletion (`/api/try-on/delete`).

2. **VirtualTryOnProvider Abstraction (`src/lib/vto/provider.ts`)**:
   - Supports Gemini 1.5 Vision / OpenAI Vision providers.
   - Reports controlled configuration status (`isConfigured`) when credentials are not present rather than returning fake AI images.

3. **Saree & Jewellery Specialized Engines (`src/lib/vto/sareeDrapingEngine.ts`, `jewelleryEngine.ts`)**:
   - Draping styles: Nivi, Bengali, Gujarati, Lehenga-Saree.
   - Jewellery anchors: Necklaces, Earrings, Maang Tikka, Bangles, Rings.

4. **Multi-Look Comparison (`src/components/vto/LookComparisonGrid.tsx`)**:
   - Compare up to 4 tried-on looks side-by-side with Smart Value Score, Shopping Trust Score, and direct purchase links.

## VTO COST POLICY — FREE-FIRST

> BuyWise AI VTO must initially operate using free Hugging Face ZeroGPU resources and open-source VTO models wherever technically possible.
>
> No paid VTO provider may be invoked automatically.
>
> No credit card, paid API, RunPod GPU, Replicate GPU, Gemini image-generation API, or OpenAI image-generation API may be required for the initial development/test mode.
>
> When the free provider quota is exhausted, the system must stop generation and display a clear provider-quota/unavailable message.
>
> The system must never substitute a product image, catalog model, canvas overlay, face swap, or body swap and represent it as a VTO result.
