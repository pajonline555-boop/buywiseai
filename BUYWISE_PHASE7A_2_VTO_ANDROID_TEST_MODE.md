# BuyWise AI — VTO Test Mode for Android Development & Budget Control Architecture

> [!IMPORTANT]
> **Commercial Provider Protection**: RunPod and fal.ai commercial endpoints remain **unconfigured and inactive**. Hugging Face IDM-VTON is strictly categorized as `DEVELOPMENT_ONLY` for non-commercial Android/web testing.

---

## 1. Test Mode Overview & Server-Side Controls

```text
Android App (Debug/Test User)
      ↓
POST /api/vto/generate
      ↓
Authentication & User Eligibility Check
      ↓
Server-Side VTO Budget Governor
  [Max 1 Concurrent / User]
  [Cap: 3/month, 1/day per user]
  [GLOBAL Daily Ceiling: 5/day]
  [GLOBAL Monthly Ceiling: 50/month]
      ↓
Development Provider Router (Hugging Face IDM-VTON)
      ↓
Quality Gate Verification
      ↓
Return Base64 Image to Android App
      ↓
Local Private Storage (vto_private/ on Android)
```

### Key Rules:
1. **Server-Side Enforcement**: The client cannot override budget limits, provider selection, or license checks.
2. **Zero Commercial Bill Risk**: Unconfigured credentials prevent accidental deployment to paid commercial providers.
3. **Atomic Reservation & Refund**: If provider call or Quality Gate fails, reservation slot and user credit are automatically restored.
4. **Local-First Privacy**: User photos and VTO generations are stored strictly on-device in `vto_private/` (Android) and `IndexedDB` (Web). Zero private images are stored in public Firestore collections.

---

## 2. Configurable Budget & Quotas

| Parameter | Test Mode Value | Config Variable |
| :--- | :--- | :--- |
| **Provider Mode** | `CONTROLLED` | `VTO_PROVIDER_MODE` |
| **Emergency Stop** | `false` (Server Switch) | `VTO_EMERGENCY_STOP` |
| **Per-User Monthly Limit** | 3 generations | `VTO_PER_USER_MONTHLY_LIMIT` |
| **Per-User Daily Limit** | 1 generation | `VTO_PER_USER_DAILY_LIMIT` |
| **Max Concurrent Requests** | 1 request / user | `VTO_MAX_CONCURRENT_PER_USER` |
| **Global Daily Cap** | 5 generations / day | `VTO_DAILY_GENERATION_LIMIT` |
| **Global Monthly Cap** | 50 generations / month | `VTO_MONTHLY_GENERATION_LIMIT` |

---

## 3. Provider License & Routing Safety

- **RunPod VTO**: `isConfigured() = false`, `licenseStatus = COMMERCIAL_LICENSED` (Pending API Key & Endpoint)
- **fal.ai VTO**: `isConfigured() = false`, `licenseStatus = COMMERCIAL_LICENSED` (Pending API Key)
- **Hugging Face IDM-VTON**: `isConfigured() = true`, `licenseStatus = DEVELOPMENT_ONLY` (Development / Test Traffic Only)

---

## 4. Operational Controls & Emergency Stop

- **Admin Status API**: `GET /api/admin/vto-budget` & `GET /api/admin/vto-monitoring`
- **Dynamic Config Update**: `POST /api/admin/vto-budget` allows instant toggling of Emergency Stop or dynamic limit adjustments without redeployment.
