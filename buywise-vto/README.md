# BuyWise ComfyUI Virtual Try-On (VTO) on Modal

Production-ready serverless Virtual Try-On API built on **Modal**, **ComfyUI**, and **CatVTON**, optimized for Indian ethnic wear (Sarees, Kurtis, Anarkalis, Lehengas) and western apparel.

---

## Architecture & Economics

- **GPU Type**: NVIDIA L4 GPU ($0.80/hr, billed per-second).
- **Inference Time**: ~4–6 seconds per try-on.
- **Cost Per Try-On**: ~$0.0013 USD (~₹0.11 INR).
- **Modal Free Tier**: Includes **$30/month free credits** = **~20,000+ try-ons/month for free**.
- **Cold-Start Optimization**: `enable_memory_snapshot=True` to freeze initialized state.
- **Scale-to-Zero**: Shuts down after 15 seconds of inactivity (`scaledown_window=15`).
- **Output Format**: WebP compressed at 82% quality for low latency and high bandwidth efficiency.

---

## Folder Contents

- `modal_vto.py`: Complete Modal Python serverless deployment script with both ComfyUI Web UI mode and FastAPI POST endpoint.
- `workflow_api.json`: Exported ComfyUI API workflow JSON mapping Nodes 10, 11, 12, 13, 14.
- `test_modal_call.js`: Ready-to-run Node.js verification script to test your deployed endpoint.

---

## Step-by-Step Launch Guide

### 1. Install Modal & Authenticate

```bash
pip install modal
modal setup
```

This opens your browser to authenticate. Make sure your card is linked under Modal **Billing** to unlock the **$30/month free credits** (₹0 upfront charge).

### 2. Download VTO Models to Modal Volume (Run Once)

Populate the persistent Modal volume `buywise-vto-models`:

```bash
cd buywise-vto
modal run modal_vto.py::download_models
```

### 3. (Optional) Open Interactive ComfyUI Web UI to Customize Workflow

If you want to test garments interactively or export a custom workflow:

```bash
modal serve modal_vto.py
```

1. Click the `https://...modal.run` URL printed for the `ui` function.
2. ComfyUI will open in your browser with persistent models linked.
3. Test your ethnic wear nodes, enable **Dev Mode** in ComfyUI settings, and click **Export (API)** to replace `workflow_api.json`.
4. Press `Ctrl+C` to stop the interactive dev server.

### 4. Deploy the Permanent Serverless API

Deploy your production scale-to-zero HTTPS endpoint:

```bash
modal deploy modal_vto.py
```

Modal will print your permanent webhook URL:
`https://<your-username>--buywise-vto-api-buywisevto-generate-tryon.modal.run`

### 5. Verify the Deployed API

Run the test script with your deployed URL:

```bash
node test_modal_call.js https://<your-username>--buywise-vto-api-buywisevto-generate-tryon.modal.run
```

This will run an Indian ethnic wear try-on and save `test_output_result.webp` locally.

### 6. Connect to BuyWise AI Web App

Add your Modal URL to `web/.env.local`:

```env
MODAL_VTO_URL=https://<your-username>--buywise-vto-api-buywisevto-generate-tryon.modal.run
MODAL_ENABLED=true
```
