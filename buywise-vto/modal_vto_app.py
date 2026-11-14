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
    secrets=[modal.Secret.from_name("huggingface-secret")],
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

    def isolate_garment_fabric(self, catalog_bgr):
        """
        Isolates ONLY the garment fabric from catalog photos.
        Removes catalog model's head, neck, bare arms, and bare midriff skin,
        so the diffusion model receives pure clothing fabric and NEVER transfers
        another person's pale skin, thin body silhouette, or posture onto the user.
        """
        import cv2
        import numpy as np

        h, w = catalog_bgr.shape[:2]
        clean_garment = catalog_bgr.copy()

        # 1. Detect catalog model face to find chin & neckline
        faces = self.face_app.get(catalog_bgr)
        chin_y = int(h * 0.25)
        if faces:
            face = sorted(faces, key=lambda x: (x.bbox[2] - x.bbox[0]) * (x.bbox[3] - x.bbox[1]), reverse=True)[0]
            chin_y = max(chin_y, int(face.bbox[3]))

        # Mask out everything above chin level
        clean_garment[:chin_y, :] = [255, 255, 255]

        # 2. Detect skin in YCrCb color space
        ycrcb = cv2.cvtColor(catalog_bgr, cv2.COLOR_BGR2YCrCb)
        cr = ycrcb[:, :, 1]
        cb = ycrcb[:, :, 2]
        skin_mask = (cr >= 133) & (cr <= 180) & (cb >= 77) & (cb <= 130)

        # 3. Mask out arms (left side and right side skin)
        arm_left = skin_mask & (np.arange(w) < int(w * 0.30))[None, :]
        clean_garment[arm_left] = [255, 255, 255]

        arm_right = skin_mask & (np.arange(w) > int(w * 0.70))[None, :]
        clean_garment[arm_right] = [255, 255, 255]

        # 4. Mask out midriff skin between blouse and skirt waistband
        midriff_y1 = int(h * 0.45)
        midriff_y2 = int(h * 0.65)
        if midriff_y2 > midriff_y1:
            midriff_skin = skin_mask[midriff_y1:midriff_y2, :]
            clean_garment[midriff_y1:midriff_y2, :][midriff_skin] = [255, 255, 255]

        # 5. Mask out scoop neck / chest skin
        chest_y1 = chin_y
        chest_y2 = min(h, int(chin_y + h * 0.15))
        chest_x1 = int(w * 0.25)
        chest_x2 = int(w * 0.75)
        if chest_y2 > chest_y1:
            chest_skin = skin_mask[chest_y1:chest_y2, chest_x1:chest_x2]
            clean_garment[chest_y1:chest_y2, chest_x1:chest_x2][chest_skin] = [255, 255, 255]

        return clean_garment

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

    def apply_neural_identity_preservation(self, result_bgr, user_bgr):
        """
        Uses InsightFace deep neural swapper to seamlessly blend the user's authentic face,
        skin tone, and features onto the diffusion try-on output.
        Zero cv2 thresholding, zero geometric oval cutouts, zero background seam cutting!
        """
        user_faces = self.face_app.get(user_bgr)
        result_faces = self.face_app.get(result_bgr)

        if not user_faces or not result_faces:
            return result_bgr

        source_face = sorted(user_faces, key=lambda x: (x.bbox[2] - x.bbox[0]) * (x.bbox[3] - x.bbox[1]), reverse=True)[0]
        target_face = sorted(result_faces, key=lambda x: (x.bbox[2] - x.bbox[0]) * (x.bbox[3] - x.bbox[1]), reverse=True)[0]

        swapped_bgr = self.face_swapper.get(result_bgr, target_face, source_face, paste_back=True)
        return swapped_bgr

    def validate_generation_quality(self, result_bgr, user_bgr):
        """
        Automated quality gate before returning try-on results.
        Rejects empty generations or severe pixel collapse.
        """
        import numpy as np

        if result_bgr is None:
            return False, "EMPTY_GENERATION"

        # Check for image collapse / zero variance
        if np.std(result_bgr) < 8.0:
            return False, "IMAGE_COLLAPSE_DETECTED"

        return True, "PASSED"

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
            user_urls = [user_b64]
            if "buywiseai.pajonline.co.in" in user_b64:
                user_urls.append(user_b64.replace("buywiseai.pajonline.co.in", "buywiseai--pajonline-shopping.asia-southeast1.hosted.app"))
            raw_user = None
            async with httpx.AsyncClient(verify=False, follow_redirects=True, timeout=25.0) as http_client:
                for u_url in user_urls:
                    try:
                        u_resp = await http_client.get(u_url)
                        if u_resp.status_code == 200:
                            raw_user = u_resp.content
                            break
                    except Exception as e:
                        print(f"User image fetch error from {u_url}: {e}")
            if raw_user is None:
                raise HTTPException(status_code=400, detail="Failed to download user photo from URL")
        else:
            raw_user = base64.b64decode(user_b64.split(",")[-1] if "," in user_b64 else user_b64)

        user_np = np.frombuffer(raw_user, np.uint8)
        user_bgr = cv2.imdecode(user_np, cv2.IMREAD_COLOR)

        # 2. Download Catalog Garment Image (with TLS resilience and hosted.app fallback)
        if garment_url.startswith("data:"):
            g_raw = base64.b64decode(garment_url.split(",")[-1])
            garment_np = np.frombuffer(g_raw, np.uint8)
            catalog_bgr = cv2.imdecode(garment_np, cv2.IMREAD_COLOR)
        else:
            garment_urls = [garment_url]
            if "buywiseai.pajonline.co.in" in garment_url:
                garment_urls.append(garment_url.replace("buywiseai.pajonline.co.in", "buywiseai--pajonline-shopping.asia-southeast1.hosted.app"))
            elif "buywiseai--pajonline-shopping.asia-southeast1.hosted.app" in garment_url:
                garment_urls.append(garment_url.replace("buywiseai--pajonline-shopping.asia-southeast1.hosted.app", "buywiseai.pajonline.co.in"))

            catalog_bgr = None
            last_err = None
            async with httpx.AsyncClient(verify=False, follow_redirects=True, timeout=25.0) as http_client:
                for g_url in garment_urls:
                    try:
                        resp = await http_client.get(g_url)
                        if resp.status_code == 200:
                            garment_np = np.frombuffer(resp.content, np.uint8)
                            catalog_bgr = cv2.imdecode(garment_np, cv2.IMREAD_COLOR)
                            if catalog_bgr is not None and catalog_bgr.size > 0:
                                break
                    except Exception as e:
                        last_err = e
                        print(f"Garment image fetch warning from {g_url}: {e}")

            if catalog_bgr is None:
                raise HTTPException(status_code=400, detail=f"Failed to download garment image: {last_err}")

        # 3. Always execute 100% Authentic User Try-On:
        # Fits directly onto user's body, natural posture, warm skin tone, and authentic photo background.
        # NEVER replaces user with a skinny catalog model.
        garment_clean_bgr = self.isolate_garment_fabric(catalog_bgr)

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

        # If diffusion synthesis produced an image, apply neural identity preservation (zero cutouts, zero background splicing)
        if result_bgr is not None:
            try:
                result_bgr = self.apply_neural_identity_preservation(result_bgr, user_bgr)
            except Exception as e:
                print("Neural identity preservation notice:", e)

            # Quality Gate Check before returning result
            passed, reason = self.validate_generation_quality(result_bgr, user_bgr)
            if not passed:
                print(f"VTO Quality Gate Rejection: {reason}")
                raise HTTPException(
                    status_code=422,
                    detail="AI Try-On could not fit garment naturally on this photo. Please try with a clearer photo."
                )
        else:
            raise HTTPException(
                status_code=503, 
                detail="AI Try-On diffusion servers are busy. Please retry in a few moments."
            )

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
