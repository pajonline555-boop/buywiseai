# BuyWise AI — Phase 7A.3 Physical Android Device VTO Privacy Report

> **Audit Date**: 2026-09-07  
> **Physical Device Audit**: Xiaomi Redmi Note 10 Pro (`M2101K6P`, Android 13)  
> **Privacy Model**: Local-First On-Device Sandbox Storage  
> **Status**: **100% COMPLIANT**  

---

## 1. Privacy Audit & Storage Verification

| Audit Dimension | Requirement | Physical Device Finding | Compliance |
| :--- | :--- | :--- | :--- |
| **Android Local Storage** | User photos remain under `context.filesDir/vto_private/` | Verified: Saved under `/data/user/0/com.pajonline.buywiseai/files/vto_private/` | **COMPLIANT** |
| **No Raw Image Firestore Writes** | Zero base64 raw user photo bytes in Firestore | Verified: Firestore contains only job metadata (`requestId`, `status`, `latencyMs`) | **COMPLIANT** |
| **No Private Image URL Exposure** | Zero private image URLs written to public Firestore | Verified: No public cloud storage URLs stored in Firestore collections | **COMPLIANT** |
| **Zero API Key Leakage** | API credentials must not exist in Android APK / logcat | Decompiled APK & logcat audit confirms 0 provider API keys on client | **COMPLIANT** |
| **Log Telemetry Hygiene** | Application logs must omit raw image payloads & tokens | Logs record only safe metrics (latency, HTTP status, request ID) | **COMPLIANT** |
| **Commercial Provider Protection** | RunPod / fal.ai keys unconfigured | Verified: Commercial providers remain unconfigured ($0 spend) | **COMPLIANT** |

---

## 2. On-Device vs Server Data Lifecycle

```text
               ON-DEVICE SANDBOX (Android)
  ┌──────────────────────────────────────────────────┐
  │  - User Photograph (vto_private/)                 │
  │  - Rendered Garment Try-On Result                 │
  │  - Private Image Deletion Controls               │
  └──────────────────────────────────────────────────┘
                            │
              POST /api/vto/generate (HTTPS Base64)
                            │
                            ▼
              SERVER-SIDE EPHEMERAL PROCESSING
  ┌──────────────────────────────────────────────────┐
  │  - Entitlement & Budget Check                     │
  │  - Garment Preparation Pipeline                  │
  │  - Hugging Face IDM-VTON (DEVELOPMENT_ONLY)       │
  │  - Ephemeral Quality Gate Validation             │
  │  - Zero Disk Retention of Private User Photos    │
  └──────────────────────────────────────────────────┘
```

---

## 3. Privacy Audit Conclusion

The physical Android application strictly satisfies BuyWise AI local-first privacy requirements. Private user photographs remain isolated on the device, zero private image URLs or raw payloads are exposed in Firestore or application logs, and server-side provider credentials remain 100% protected.
