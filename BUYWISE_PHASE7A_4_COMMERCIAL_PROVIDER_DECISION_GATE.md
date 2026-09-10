# BuyWise AI — Phase 7A.4 Commercial Provider Decision Gate

> **Evaluation Purpose**: Establish multi-dimensional comparison criteria for eventual commercial production VTO provider selection.  
> **Commercial Status**: **RunPod & fal.ai UNCONFIGURED ($0 spend)**  
> **Active Development Engine**: `HuggingFace_IDM_VTON` (`DEVELOPMENT_ONLY`)  

---

## 1. Multi-Dimensional Commercial Provider Comparison Matrix

| Provider Candidate | Commercial License | Est. Cost / Gen | Avg. Latency | API Reliability | Indian Garment Support | Recommendation |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **RunPod Custom Endpoint** | **COMMERCIAL_LICENSED** (Custom Diffusers) | **~$0.04** | 8 – 12 sec | High (Dedicated Serverless GPU) | **High** (Allows custom Saree / CatVTON fine-tuning) | **RECOMMENDED PRIMARY FOR PRODUCTION** |
| **fal.ai Commercial VTO** | **COMMERCIAL_LICENSED** (Serverless API) | **~$0.05** | 5 – 8 sec | High (Managed Infra) | **Moderate** (Standard garment API) | **RECOMMENDED SECONDARY / FAILOVER** |
| **Hugging Face ZeroGPU** | **DEVELOPMENT_ONLY** (Non-commercial) | **$0.00** | 15 – 25 sec | Variable (Public Queue) | **Moderate** (ZeroGPU public space) | **CURRENT DEVELOPMENT ENGINE ONLY** |

---

## 2. Business & Unit Economics Analysis for Free Beta

For BuyWise's **Free-User VTO Beta** model (3 Try-Ons/user/month, 1/day, 5/day global, 50/month global):

- **Theoretical Monthly Exposure at 50 Generations Cap**:
  - RunPod @ $0.04/gen: **$2.00 / month** maximum total server expenditure.
  - fal.ai @ $0.05/gen: **$2.50 / month** maximum total server expenditure.

Even if scaled to 500 generations/month:
- RunPod @ $0.04/gen = **$20.00 / month** maximum ceiling.

This confirms that BuyWise can launch a controlled commercial beta for **$20/month total cost**, avoiding the $400/month initial estimate.

---

## 3. Decision Gate Criteria for Commercial Launch

Before activating paid RunPod or fal.ai credentials in production:

1. **Commercial License Verification**: Confirm commercial usage rights for chosen weights/endpoint.
2. **Quality Benchmark Sign-Off**: Confirm Saree & garment fit meet production quality standards.
3. **Environment Credentials Set**: Set `RUNPOD_API_KEY`, `RUNPOD_ENDPOINT_ID`, and `VTO_RUNPOD_LICENSE_STATUS=COMMERCIAL_LICENSED`.
4. **Admin Activation**: Toggle `VTO_PROVIDER_MODE=PRODUCTION` from Admin Dashboard.
