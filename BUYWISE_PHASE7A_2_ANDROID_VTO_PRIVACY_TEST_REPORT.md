# BuyWise AI — Phase 7A.2 Android VTO Privacy & Security Audit Report

> **Audit Date**: 2026-09-07  
> **Privacy Architecture**: Local-First On-Device Storage  
> **Audit Scope**: Android Client Storage, Firestore Metadata, API Request Payload Logging, Network API Key Exposure  

---

## 1. Privacy Audit Checklist & Compliance Matrix

| Audit Item | Constraint / Requirement | Audit Finding | Status |
| :--- | :--- | :--- | :--- |
| **Android Local Storage** | User photos & generated try-ons stored in `vto_private/` | Stored exclusively in local sandbox directory (`/data/user/0/ai.buywise.app/app_flutter/vto_private/`) | **COMPLIANT** |
| **No Firestore Upload** | Zero user photo uploads to public Cloud Storage/Firestore | Firestore contains only anonymized job metadata (`requestId`, `status`, `providerId`) | **COMPLIANT** |
| **No Exposed API Keys** | Provider API keys must never be included in Android APK | Decompiled APK audit confirms 0 provider API keys (RunPod/fal/HF keys) on client device | **COMPLIANT** |
| **Telemetry & Log Safety** | Logs must never contain raw base64 images or auth tokens | Telemetry logs record only safe metrics (latency, provider ID, status code, error code) | **COMPLIANT** |
| **User Deletion Right** | User can purge all private try-on images on demand | Tap "Delete Photo" purges local `vto_private/` file and Web IndexedDB entry instantly | **COMPLIANT** |
| **HTTPS Communications** | Mobile client connects exclusively via TLS/HTTPS in release | Production release builds restrict network cleartext; dev cleartext scoped to local IP | **COMPLIANT** |

---

## 2. Storage Architecture Comparison

```text
       [PUBLIC STORAGE]               [PRIVATE / LOCAL-FIRST STORAGE]
  (Firestore & Cloud Storage)           (On-Device Sandbox Environment)
             │                                        │
             ▼                                        ▼
   - Anonymized Request ID                  - Raw User Photographs
   - Provider Name                          - Garment Try-On Results
   - Success / Failure Code                 - Face Mesh & Segmentation Data
   - Cost Estimate ($0.00)                  - Local History Cache
   - Processing Latency (ms)
```

---

## 3. Security Audit Findings

1. **Client Isolation**: The Android APK acts solely as a client view renderer. All decision logic, credit checks, license validation, and provider API credentials reside securely on the server.
2. **Zero Data Leakage**: In the event of a server error or quality failure, no intermediate image buffers remain stranded in temporary server directories or public logs.
3. **GDPR / Privacy Compliance**: User images never train public AI models and are processed ephemerally during request execution.
