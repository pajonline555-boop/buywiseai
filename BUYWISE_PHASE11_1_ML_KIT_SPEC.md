# BUYWISE AI — Phase 11.1 ML Kit Specification

## Overview
This specification details the Google ML Kit capabilities integrated into BuyWise AI Android Native (`android/`).

## Architecture & Components
- **Text Recognition / OCR**: `MlKitTextRecognitionService.kt` uses unbundled Google ML Kit Text Recognition (`com.google.mlkit:text-recognition:16.0.1`). Initial APK weight addition is 0 MB for unbundled models.
- **Dynamic Translation**: `MlKitTranslationService.kt` uses on-demand dynamic translation models (`com.google.mlkit:translate:17.0.3`) for Hindi ↔ English.
- **Language Identification**: `MlKitLanguageService.kt` (`com.google.mlkit:language-id:17.0.6`) identifies input text language.
- **Model Manager**: `MlKitModelManager.kt` provides user options for Wi-Fi vs mobile data model downloading, downloaded model enumeration, and model deletion.

## User Transparency Wording
- **UI Message**: *"AI language tools download only when you use them."*
- **Settings Choice**:
  - `[ ] Download language/AI models when needed`
  - `[ ] Download over Wi-Fi only`
- **Graceful Fallback**: If model download fails or device is offline, raw input text is passed into SmartCompare without crashing or blocking the user.
