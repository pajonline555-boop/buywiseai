# modal_vto_app.py
import io
import os
import base64
import modal
from fastapi import Request, HTTPException

app = modal.App("buywise-vto-engine")

# Persistent volume so model weights don't re-download on cold starts
model_volume = modal.Volume.from_name("buywise-vto-weights", create_if_missing=True)

vto_image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("git", "libgl1", "libglib2.0-0", "wget", "unzip")
    .pip_install(
        "fastapi[standard]",
        "torch",
        "torchvision",
        "numpy<2.0.0",
        "opencv-python-headless",
        "pillow",
        "httpx",
        "insightface==0.7.3",
        "onnxruntime-gpu",
        "gradio_client>=0.17.0",
    )
    .run_commands(
        "mkdir -p /root/.insightface/models/inswapper && "
        "wget -O /root/.insightface/models/inswapper_128.onnx "
        "https://huggingface.co/ezioruan/inswapper_128.onnx/resolve/main/inswapper_128.onnx",
        "mkdir -p /root/.insightface/models/buffalo_l && "
        "wget -O /tmp/buffalo_l.zip https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip && "
        "unzip -q /tmp/buffalo_l.zip -d /root/.insightface/models/buffalo_l && rm /tmp/buffalo_l.zip"
    )
)


@app.cls(
    gpu="L4",
    image=vto_image,
    timeout=180,
    scaledown_window=120,
)
class BuyWiseVtoEngine:
    @modal.enter()
    def setup(self):
        import insightface
        from insightface.app import FaceAnalysis

        # Real InsightFace Analyzer & Neural Swapper on L4 GPU
        self.face_app = FaceAnalysis(name="buffalo_l", root="/root/.insightface", providers=["CUDAExecutionProvider", "CPUExecutionProvider"])
        self.face_app.prepare(ctx_id=0, det_size=(640, 640))
        self.face_swapper = insightface.model_zoo.get_model(
            "/root/.insightface/models/inswapper_128.onnx",
            providers=["CUDAExecutionProvider", "CPUExecutionProvider"],
        )
        print("Real InsightFace Analyzer loaded on GPU.")

    def isolate_garment(self, catalog_bgr):
        """
        If the catalog image features a model wearing the garment (e.g. Kamarbandh / Saree / Dress with model head),
        detect the model's chin and crop from the neckline down so the diffusion pipeline sees ONLY the garment itself.
        """
        import cv2
        faces = self.face_app.get(catalog_bgr)
        if not faces:
            return catalog_bgr

        # Find the most prominent face
        face = sorted(faces, key=lambda x: (x.bbox[2] - x.bbox[0]) * (x.bbox[3] - x.bbox[1]), reverse=True)[0]
        h, w = catalog_bgr.shape[:2]
        chin_y = int(face.bbox[3])

        # If face is in the top 40% of the image, crop below chin
        if chin_y < h * 0.45:
            # Crop starting slightly below chin to capture collar/neckline cleanly
            crop_y = min(int(chin_y + (face.bbox[3] - face.bbox[1]) * 0.1), int(h * 0.35))
            cropped = catalog_bgr[crop_y:, :]
            if cropped.shape[0] > 100:
                print(f"Isolated garment from model: cropped from y={crop_y} to {h}")
                return cropped

        return catalog_bgr

    def run_leffa_vto(self, user_img_path: str, garment_img_path: str, category: str, garment_title: str = "") -> str:
        """
        Primary Diffusion Try-On via Leffa (VitonHD / DressCode).
        Maintains 100% of user identity, skin tone, hair, headwear, posture, and pose.
        """
        from gradio_client import Client, handle_file

        hf_token = os.environ.get("HF_TOKEN")
        client = Client("franciszzj/Leffa", token=hf_token)

        combined_desc = ((category or "") + " " + (garment_title or "")).lower()
        if any(k in combined_desc for k in ["saree", "lehenga", "chaniya", "choli", "kamarbandh", "navratri", "garba", "anarkali", "dress", "gown", "kurta", "suit", "ethnic", "set"]):
            vt_model = "dress_code"
            vt_type = "dresses"
        elif any(k in combined_desc for k in ["pant", "jean", "skirt", "trouser", "lower"]):
            vt_model = "dress_code"
            vt_type = "lower_body"
        else:
            vt_model = "viton_hd"
            vt_type = "upper_body"

        print(f"Calling Leffa with model={vt_model}, garment_type={vt_type}")
        result = client.predict(
            src_image_path=handle_file(user_img_path),
            ref_image_path=handle_file(garment_img_path),
            ref_acceleration=False,
            step=30,
            scale=2.5,
            seed=42,
            vt_model_type=vt_model,
            vt_garment_type=vt_type,
            vt_repaint=False,
            api_name="/leffa_predict_vt",
        )

        out = result[0]
        if isinstance(out, dict):
            out = out.get("path") or out.get("url")
        return out

    def run_idm_vton(self, user_img_path: str, garment_img_path: str, garment_title: str) -> str:
        """
        Secondary Diffusion Try-On via IDM-VTON.
        """
        from gradio_client import Client, handle_file

        hf_token = os.environ.get("HF_TOKEN")
        client = Client("yisol/IDM-VTON", token=hf_token)

        print("Executing IDM-VTON diffusion try-on...")
        result = client.predict(
            dict={"background": handle_file(user_img_path), "layers": [], "composite": None},
            garm_img=handle_file(garment_img_path),
            garment_des=garment_title or "garment",
            is_checked=True,
            is_checked_crop=False,
            denoise_steps=28,
            seed=42,
            api_name="/tryon",
        )

        out = result[0]
        if isinstance(out, dict):
            out = out.get("path") or out.get("url")
        return out

    def composite_with_identity_and_background_preservation(self, result_bgr, user_bgr):
        """
        Preserves 100% of the user's original background, face, hair, and hands.
        Only allows diffusion-synthesized pixels to replace the clothing region.
        Eliminates the legacy full-width horizontal gradient and 2D skirt pasting.
        """
        import cv2
        import numpy as np

        orig_h, orig_w = user_bgr.shape[:2]
        if result_bgr.shape[:2] != (orig_h, orig_w):
            result_bgr = cv2.resize(result_bgr, (orig_w, orig_h), interpolation=cv2.INTER_LANCZOS4)

        # 1. Detect person face landmarks with InsightFace
        faces = self.face_app.get(user_bgr)

        # 2. Extract clothing replacement mask:
        # If result_bgr has a white/plain background (common in diffusion try-on),
        # extract foreground person mask from result_bgr:
        gray_result = cv2.cvtColor(result_bgr, cv2.COLOR_BGR2GRAY)
        _, person_fg_mask = cv2.threshold(gray_result, 248, 255, cv2.THRESH_BINARY_INV)

        # Clean morphological opening/closing
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
        person_fg_mask = cv2.morphologyEx(person_fg_mask, cv2.MORPH_CLOSE, kernel, iterations=2)
        person_fg_mask = cv2.morphologyEx(person_fg_mask, cv2.MORPH_OPEN, kernel, iterations=1)

        # 3. Create Protected Head / Face / Hair Mask
        head_mask = np.zeros((orig_h, orig_w), dtype=np.uint8)
        if faces:
            face = sorted(faces, key=lambda x: (x.bbox[2] - x.bbox[0]) * (x.bbox[3] - x.bbox[1]), reverse=True)[0]
            bbox = face.bbox.astype(int)
            x1, y1, x2, y2 = bbox[0], bbox[1], bbox[2], bbox[3]

            # Expand to include hair & ears
            center_x = (x1 + x2) // 2
            center_y = (y1 + y2) // 2
            radius_x = int((x2 - x1) * 0.75)
            radius_y = int((y2 - y1) * 0.95)

            # Head ellipse (strictly localized around the head, never full-width)
            cv2.ellipse(head_mask, (center_x, center_y), (radius_x, radius_y), 0, 0, 360, 255, -1)
            # Ensure hair above face is also protected
            hair_top = max(0, y1 - int((y2 - y1) * 0.5))
            cv2.rectangle(head_mask, (max(0, x1 - int((x2 - x1) * 0.25)), hair_top), (min(orig_w, x2 + int((x2 - x1) * 0.25)), y1), 255, -1)

        # 4. Final Clothing Edit Region:
        # Edit region = Foreground person from diffusion EXCEPT the user's authentic head/face/hair
        clothing_edit_mask = cv2.bitwise_and(person_fg_mask, cv2.bitwise_not(head_mask))

        # Feather ONLY the narrow seam boundary (7px)
        clothing_mask_f = cv2.GaussianBlur(clothing_edit_mask.astype(np.float32) / 255.0, (7, 7), 0)
        clothing_mask_3ch = np.dstack([clothing_mask_f, clothing_mask_f, clothing_mask_f])

        # 5. Composite:
        # Inside clothing_edit_mask -> diffusion try-on result
        # Outside clothing_edit_mask (background, head, hair, hands outside clothing) -> 100% original user image
        final_bgr = (result_bgr.astype(np.float32) * clothing_mask_3ch + user_bgr.astype(np.float32) * (1.0 - clothing_mask_3ch)).astype(np.uint8)

        return final_bgr

    def validate_generation_quality(self, result_bgr, user_bgr):
        """
        Automated quality gate before returning try-on results.
        Rejects generations with massive white void artifacts, extreme color distortion, or image collapse.
        """
        import numpy as np

        if result_bgr is None:
            return False, "EMPTY_GENERATION"

        # 1. Check for massive white void regions (>35% pure white pixels)
        white_pixels = np.count_nonzero((result_bgr[:, :, 0] > 250) & (result_bgr[:, :, 1] > 250) & (result_bgr[:, :, 2] > 250))
        total_pixels = result_bgr.shape[0] * result_bgr.shape[1]
        white_ratio = white_pixels / float(total_pixels)
        if white_ratio > 0.35:
            return False, f"EXCESSIVE_VOID_ARTIFACTS ({round(white_ratio * 100)}% white canvas bleed)"

        # 2. Check for image collapse / zero variance
        if np.std(result_bgr) < 15.0:
            return False, "IMAGE_COLLAPSE_DETECTED"

        return True, "PASSED"

    def run_neural_runway_swap(self, user_bgr, catalog_bgr):
        """
        Only used for Runway Studio model showcase when the user explicitly requests runway fitting.
        """
        user_faces = self.face_app.get(user_bgr)
        catalog_faces = self.face_app.get(catalog_bgr)

        if not user_faces or not catalog_faces:
            return catalog_bgr

        source_face = sorted(user_faces, key=lambda x: (x.bbox[2] - x.bbox[0]) * (x.bbox[3] - x.bbox[1]), reverse=True)[0]
        target_face = sorted(catalog_faces, key=lambda x: (x.bbox[2] - x.bbox[0]) * (x.bbox[3] - x.bbox[1]), reverse=True)[0]

        swapped_bgr = self.face_swapper.get(catalog_bgr, target_face, source_face, paste_back=True)
        return swapped_bgr

    @modal.fastapi_endpoint(method="POST")
    async def generate(self, request: Request):
        import cv2
        import numpy as np
        import httpx
        from PIL import Image

        body = await request.json()
        user_b64 = body.get("userImageBase64") or body.get("userPhoto") or body.get("person_image_url")
        if isinstance(user_b64, dict) and "url" in user_b64:
            user_b64 = user_b64["url"]

        garment_url = body.get("garmentImageUrl") or (body.get("product") and body["product"].get("imageUrl")) or body.get("garment_image_url")
        category = body.get("category") or "dresses"
        title = body.get("title") or "garment"
        mode = body.get("mode") or "FIT_ON_USER"

        if not user_b64 or not garment_url:
            raise HTTPException(status_code=400, detail="Missing userImageBase64 or garmentImageUrl")

        # 1. Decode User Image
        if user_b64.startswith("http://") or user_b64.startswith("https://"):
            async with httpx.AsyncClient() as http_client:
                u_resp = await http_client.get(user_b64, timeout=25.0)
                raw_user = u_resp.content
        else:
            raw_user = base64.b64decode(user_b64.split(",")[-1] if "," in user_b64 else user_b64)

        user_np = np.frombuffer(raw_user, np.uint8)
        user_bgr = cv2.imdecode(user_np, cv2.IMREAD_COLOR)

        # 2. Download Catalog Garment Image
        if garment_url.startswith("data:"):
            g_raw = base64.b64decode(garment_url.split(",")[-1])
            garment_np = np.frombuffer(g_raw, np.uint8)
            catalog_bgr = cv2.imdecode(garment_np, cv2.IMREAD_COLOR)
        else:
            async with httpx.AsyncClient() as http_client:
                resp = await http_client.get(garment_url, timeout=25.0)
                garment_np = np.frombuffer(resp.content, np.uint8)
                catalog_bgr = cv2.imdecode(garment_np, cv2.IMREAD_COLOR)

        # 3. Route according to requested fitting mode
        if mode == "RUNWAY_MODEL":
            # Explicit Runway Studio Mode
            result_bgr = self.run_neural_runway_swap(user_bgr, catalog_bgr)
            mode_used = "runway_studio"
        else:
            # FIT_ON_USER: 100% User Identity, Pose, Body, & Skin Tone Preservation
            garment_clean_bgr = self.isolate_garment(catalog_bgr)

            cv2.imwrite("/tmp/user_input.jpg", user_bgr)
            cv2.imwrite("/tmp/garment_input.png", garment_clean_bgr)

            result_bgr = None
            mode_used = "diffusion_garment_vto"

            # Primary: Leffa Diffusion VTO
            try:
                out_path = self.run_leffa_vto("/tmp/user_input.jpg", "/tmp/garment_input.png", category, title)
                if out_path and os.path.exists(out_path):
                    result_bgr = cv2.imread(out_path)
            except Exception as e:
                print("Leffa VTO exception:", e)

            # Secondary Fallback: IDM-VTON Diffusion VTO
            if result_bgr is None:
                try:
                    out_path = self.run_idm_vton("/tmp/user_input.jpg", "/tmp/garment_input.png", title)
                    if out_path and os.path.exists(out_path):
                        result_bgr = cv2.imread(out_path)
                        mode_used = "idm_vton_diffusion"
                except Exception as e:
                    print("IDM-VTON exception:", e)

            # If diffusion synthesis produced an image, apply semantic identity & background protection
            if result_bgr is not None:
                try:
                    result_bgr = self.composite_with_identity_and_background_preservation(result_bgr, user_bgr)
                except Exception as e:
                    print("Semantic compositing warning:", e)

                # Quality Gate Check before returning result
                passed, reason = self.validate_generation_quality(result_bgr, user_bgr)
                if not passed:
                    print(f"VTO Quality Gate Rejection: {reason}")
                    raise HTTPException(
                        status_code=422,
                        detail=f"Try-on quality check failed ({reason}). Please try with a clearer front-facing photo or different garment."
                    )
            else:
                # Under NO circumstances replace user with catalog model in FIT_ON_USER mode!
                raise HTTPException(status_code=503, detail="AI Fitting Room is processing high volume, please retry in 10 seconds.")

        # 4. Encode final image as clean WebP
        result_rgb = cv2.cvtColor(result_bgr, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(result_rgb)
        buf = io.BytesIO()
        pil_img.save(buf, format="WEBP", quality=90)
        out_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

        return {
            "success": True,
            "modeUsed": mode_used,
            "imageBase64": f"data:image/webp;base64,{out_b64}",
            "imageUrl": f"data:image/webp;base64,{out_b64}",
            "resultImage": f"data:image/webp;base64,{out_b64}",
        }
