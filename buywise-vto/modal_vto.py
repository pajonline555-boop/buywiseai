import io
import json
import subprocess
import time
import urllib.request
import uuid
import base64
from pathlib import Path
from typing import Dict, Any

import modal

# 1. Define the Container Image with ComfyUI, CatVTON, and Segmentation Nodes
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("git", "wget", "libgl1", "libglib2.0-0")
    .pip_install(
        "fastapi[standard]",
        "comfy-cli==1.3.8",
        "requests",
        "Pillow",
        "huggingface_hub[hf_transfer]",
    )
    .env({"HF_HUB_ENABLE_HF_TRANSFER": "1"})
    .run_commands(
        # Install ComfyUI headless
        "comfy --skip-prompt install --nvidia --version 0.3.14",
        # Install Custom Nodes for Virtual Try-On & Indian Dress Full-Body Masking
        "comfy node install ComfyUI_CatVTON_Wrapper || git clone https://github.com/chflame163/ComfyUI_CatVTON_Wrapper.git /root/comfy/ComfyUI/custom_nodes/ComfyUI_CatVTON_Wrapper",
        "cd /root/comfy/ComfyUI/custom_nodes/ComfyUI_CatVTON_Wrapper && pip install -r requirements.txt",
    )
)

# 2. Persistent Volume for Models (Zero re-download on cold starts)
vol = modal.Volume.from_name("buywise-vto-models", create_if_missing=True)

app = modal.App("buywise-vto-api", image=image)


# 3. One-time Model Downloader Function
@app.function(
    volumes={"/root/models": vol},
    timeout=1800,
)
def download_models():
    """Run once via `modal run modal_vto.py::download_models` to populate the volume."""
    from huggingface_hub import snapshot_download

    print("Downloading CatVTON & DensePose/SCHP weights for Indian/Western Try-On...")
    snapshot_download(
        repo_id="zhengchong/CatVTON",
        local_dir="/root/models/CatVTON",
    )
    snapshot_download(
        repo_id="runwayml/stable-diffusion-inpainting",
        local_dir="/root/models/stable-diffusion-inpainting",
        ignore_patterns=["*.ckpt", "*.safetensors"],
    )
    vol.commit()
    print("All models saved to Modal Volume successfully!")


# 4. Interactive ComfyUI Web GUI (Use this once to test & export workflow_api.json)
@app.function(
    gpu="L4",
    volumes={"/root/models": vol},
    max_containers=1,
    timeout=3600,
)
@modal.web_server(8188, startup_timeout=60)
def ui():
    # Symlink our persistent models into ComfyUI's model directory
    subprocess.run("ln -sfn /root/models/* /root/comfy/ComfyUI/models/", shell=True)
    subprocess.Popen(
        "comfy launch -- --listen 0.0.0.0 --port 8188",
        shell=True,
    )


# 5. Production Serverless API with Memory Snapshot & Fast Scale-to-Zero
@app.cls(
    gpu="L4",
    volumes={"/root/models": vol},
    scaledown_window=15,          # Shuts down 15s after try-on finishes to save credits
    enable_memory_snapshot=True,  # Freezes initialized state for faster cold starts
    max_containers=4,             # Handles up to 4 concurrent users
)
class BuyWiseVTO:
    @modal.enter(snap=True)
    def prepare_dirs(self):
        # Link persistent volume before snapshot
        subprocess.run("ln -sfn /root/models/* /root/comfy/ComfyUI/models/", shell=True)

    @modal.enter(snap=False)
    def launch_comfy_background(self):
        # Start ComfyUI local server inside container when GPU wakes up
        self.proc = subprocess.Popen(
            "comfy launch --background -- --port 8188",
            shell=True,
        )
        # Wait until local ComfyUI server is ready
        for _ in range(60):
            try:
                urllib.request.urlopen("http://127.0.0.1:8188/system_stats", timeout=1)
                break
            except Exception:
                time.sleep(0.5)

    def _download_input_image(self, url_or_data: str, filename: str):
        """Downloads or decodes an image (HTTP/HTTPS URL or base64 data URI) to ComfyUI input folder."""
        input_path = Path("/root/comfy/ComfyUI/input") / filename
        input_path.parent.mkdir(parents=True, exist_ok=True)

        if url_or_data.startswith("data:"):
            # Handle base64 Data URI (e.g. data:image/webp;base64,...)
            header, encoded = url_or_data.split(",", 1) if "," in url_or_data else ("", url_or_data)
            raw_bytes = base64.b64decode(encoded)
            with open(input_path, "wb") as out:
                out.write(raw_bytes)
        else:
            # Handle remote HTTP/HTTPS URL
            req = urllib.request.Request(url_or_data, headers={"User-Agent": "BuyWise-VTO/1.0"})
            with urllib.request.urlopen(req, timeout=30) as resp, open(input_path, "wb") as out:
                out.write(resp.read())

    @modal.fastapi_endpoint(method="POST")
    def generate_tryon(self, payload: Dict[str, Any]):
        """
        Expected JSON Payload from BuyWise Backend:
        {
          "person_image_url": "https://r2.buywise.com/users/u123.webp", # or base64 data URI
          "garment_image_url": "https://m.media-amazon.com/images/I/dress.jpg", # or base64 data URI
          "category": "overall",   # "upper", "lower", or "overall" (use "overall" for Sarees/Kurtis/Lehengas)
          "workflow": { ... }      # Optional: exported workflow_api.json object (uses default if omitted)
        }
        """
        import requests
        from fastapi.responses import Response
        from PIL import Image

        if "person_image_url" not in payload or "garment_image_url" not in payload:
            return Response(content="Missing person_image_url or garment_image_url in request", status_code=400)

        run_id = uuid.uuid4().hex[:8]
        person_file = f"person_{run_id}.webp"
        garment_file = f"garment_{run_id}.webp"

        try:
            # 1. Download user photo & catalog dress into ComfyUI input dir
            self._download_input_image(payload["person_image_url"], person_file)
            self._download_input_image(payload["garment_image_url"], garment_file)
        except Exception as e:
            return Response(content=f"Failed to process input images: {str(e)}", status_code=400)

        # 2. Inject filenames and garment category into the ComfyUI API JSON
        workflow = payload.get("workflow")
        if not workflow:
            # Check for bundled workflow_api.json
            for candidate in [
                Path("/root/workflow_api.json"),
                Path("/root/comfy/ComfyUI/workflow_api.json"),
                Path("workflow_api.json"),
            ]:
                if candidate.exists():
                    try:
                        with open(candidate, "r", encoding="utf-8") as f:
                            workflow = json.load(f)
                        break
                    except Exception:
                        pass

        if not workflow:
            return Response(
                content="No workflow provided in payload and workflow_api.json not found on server",
                status_code=400,
            )

        # NOTE: Match these Node IDs ("10", "11", "12") to your exported workflow_api.json
        person_node_id = str(payload.get("person_node_id", "10"))
        garment_node_id = str(payload.get("garment_node_id", "11"))
        mask_node_id = str(payload.get("mask_node_id", "12"))

        if person_node_id in workflow:
            workflow[person_node_id]["inputs"]["image"] = person_file
        if garment_node_id in workflow:
            workflow[garment_node_id]["inputs"]["image"] = garment_file
        if mask_node_id in workflow and "category" in payload:
            # Set to "overall" for Sarees, Anarkalis, Lehengas, Full Salwar Suits
            workflow[mask_node_id]["inputs"]["cloth_type"] = payload["category"]

        # 3. Queue prompt in local ComfyUI engine
        try:
            res = requests.post("http://127.0.0.1:8188/prompt", json={"prompt": workflow}, timeout=10).json()
            prompt_id = res.get("prompt_id")
            if not prompt_id:
                return Response(content=f"ComfyUI prompt rejection: {json.dumps(res)}", status_code=500)
        except Exception as e:
            return Response(content=f"Error connecting to local ComfyUI server: {str(e)}", status_code=500)

        # 4. Poll until generation completes (~4-6 seconds on L4)
        output_image_bytes = None
        for _ in range(120):
            try:
                history = requests.get(f"http://127.0.0.1:8188/history/{prompt_id}", timeout=5).json()
                if prompt_id in history:
                    outputs = history[prompt_id].get("outputs", {})
                    for node_out in outputs.values():
                        if "images" in node_out and len(node_out["images"]) > 0:
                            img_info = node_out["images"][0]
                            img_res = requests.get(
                                "http://127.0.0.1:8188/view",
                                params={
                                    "filename": img_info["filename"],
                                    "subfolder": img_info.get("subfolder", ""),
                                    "type": img_info.get("type", "output"),
                                },
                                timeout=10,
                            )
                            output_image_bytes = img_res.content
                            break
                    break
            except Exception:
                pass
            time.sleep(0.25)

        # Cleanup input images to save disk space
        try:
            (Path("/root/comfy/ComfyUI/input") / person_file).unlink(missing_ok=True)
            (Path("/root/comfy/ComfyUI/input") / garment_file).unlink(missing_ok=True)
        except Exception:
            pass

        if not output_image_bytes:
            return Response(content="Generation timed out", status_code=504)

        # 5. Convert output PNG directly to compressed WebP (82% quality) to save bandwidth
        try:
            img = Image.open(io.BytesIO(output_image_bytes)).convert("RGB")
            webp_buffer = io.BytesIO()
            img.save(webp_buffer, format="WEBP", quality=82, method=4)
            return Response(content=webp_buffer.getvalue(), media_type="image/webp")
        except Exception as e:
            # Fallback to raw output if WebP conversion fails
            return Response(content=output_image_bytes, media_type="image/png")
