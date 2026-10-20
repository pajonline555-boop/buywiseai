import crypto from "crypto";

export type ShotType = "FULL_OR_HALF_BODY" | "CLOSEUP_SELFIE";

export interface VtoCacheRecord {
  cacheKey: string;
  imageUrl: string;
  modeUsed: "garment_tryon" | "face_swap";
  createdAt: number;
}

// In-memory cache & quota maps (can be backed by Firestore/Redis in production)
const vtoResultCache = new Map<string, VtoCacheRecord>();
const userFreeQuotaUsed = new Map<string, number>(); // userId -> count of GPU gens used

const MAX_FREE_TRYONS_PER_USER = 1;

export class BuyWiseVtoService {
  /**
   * 1. Generates deterministic cache key: sha256(userPhotoHash + garmentSkuId)
   */
  static createCacheKey(userImageBase64: string, garmentSkuId: string): string {
    const photoHash = crypto.createHash("sha256").update(userImageBase64).digest("hex").slice(0, 24);
    return crypto.createHash("sha256").update(`${photoHash}_${garmentSkuId}`).digest("hex");
  }

  /**
   * 2. Checks if user still has their 1 Free Live GPU Try-On remaining
   */
  static getRemainingQuota(userId: string): { used: number; remaining: number; limit: number } {
    const used = userFreeQuotaUsed.get(userId) ?? 0;
    return {
      used,
      remaining: Math.max(0, MAX_FREE_TRYONS_PER_USER - used),
      limit: MAX_FREE_TRYONS_PER_USER,
    };
  }

  /**
   * 3. Uses free Gemini 2.5 Flash to classify if photo is a Close-up Selfie vs Waist-Up/Full-Body
   *    so we route selfies to Face-Swap and body shots to Garment VTO.
   */
  static async detectUserShotType(userImageBase64: string): Promise<ShotType> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return "FULL_OR_HALF_BODY";

    try {
      const cleanBase64 = userImageBase64.includes(",")
        ? userImageBase64.split(",")[1]
        : userImageBase64;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: "Classify this user photo for virtual clothing try-on. Reply with ONLY ONE WORD: either 'CLOSEUP_SELFIE' (if only head/neck/upper shoulders are visible) or 'FULL_OR_HALF_BODY' (if torso/waist/body is visible).",
                  },
                  {
                    inlineData: {
                      mimeType: "image/webp",
                      data: cleanBase64,
                    },
                  },
                ],
              },
            ],
          }),
        }
      );

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
      return text.includes("CLOSEUP_SELFIE") ? "CLOSEUP_SELFIE" : "FULL_OR_HALF_BODY";
    } catch {
      return "FULL_OR_HALF_BODY";
    }
  }

  /**
   * 4. Main Execution: Cache Check -> Quota Check -> Shot Detection -> Modal GPU Call
   */
  static async generateOrFetchCached(params: {
    userId: string;
    garmentSkuId: string;
    garmentImageUrl: string;
    userImageBase64: string;
    category?: string;
  }) {
    const { userId, garmentSkuId, garmentImageUrl, userImageBase64, category = "dresses" } = params;

    // A. Check Hash Cache First (0 GPU Cost, does NOT consume user's 1 free credit)
    const cacheKey = this.createCacheKey(userImageBase64, garmentSkuId);
    const cached = vtoResultCache.get(cacheKey);
    if (cached) {
      return {
        cached: true,
        imageUrl: cached.imageUrl,
        modeUsed: cached.modeUsed,
        quotaRemaining: this.getRemainingQuota(userId).remaining,
      };
    }

    // B. Enforce 1 Free Try-On Limit per User
    const quota = this.getRemainingQuota(userId);
    if (quota.remaining <= 0) {
      throw new Error(
        "FREE_QUOTA_EXHAUSTED: You have used your 1 Free Live AI Try-On! Use our instant Multi-Body Model Switcher or HI MAYA Size Match for free, or unlock VIP."
      );
    }

    // C. Detect Shot Type (Full Body -> Garment Transfer | Selfie -> Catalog Model Face Swap)
    const shotType = await this.detectUserShotType(userImageBase64);
    const mode = shotType === "CLOSEUP_SELFIE" ? "face_swap" : "garment_tryon";

    // D. Call Modal.com Serverless Endpoint
    const modalEndpoint = process.env.MODAL_VTO_ENDPOINT_URL || process.env.MODAL_VTO_URL;
    if (!modalEndpoint) {
      throw new Error("MODAL_NOT_CONFIGURED: Please set MODAL_VTO_ENDPOINT_URL in .env.local");
    }

    const modalResp = await fetch(modalEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MODAL_WEBHOOK_SECRET || ""}`,
      },
      body: JSON.stringify({
        mode,
        userImageBase64,
        garmentImageUrl,
        category,
        person_image_url: userImageBase64, // Compatible with modal_vto.py
      }),
    });

    if (!modalResp.ok) {
      const errText = await modalResp.text();
      throw new Error(`MODAL_GPU_ERROR (${modalResp.status}): ${errText}`);
    }

    const contentType = modalResp.headers.get("content-type") || "";
    let generatedImageUrl = "";

    if (contentType.includes("image/")) {
      // Direct binary WebP output (modal_vto.py)
      const buffer = Buffer.from(await modalResp.arrayBuffer());
      generatedImageUrl = `data:${contentType};base64,${buffer.toString("base64")}`;
    } else {
      // JSON response (modal_vto_app.py)
      const result = await modalResp.json();
      generatedImageUrl = result.imageUrl || result.imageBase64;
    }

    // E. Save to Cache & Deduct 1 Free Credit
    vtoResultCache.set(cacheKey, {
      cacheKey,
      imageUrl: generatedImageUrl,
      modeUsed: mode,
      createdAt: Date.now(),
    });
    userFreeQuotaUsed.set(userId, quota.used + 1);

    return {
      cached: false,
      imageUrl: generatedImageUrl,
      modeUsed: mode,
      quotaRemaining: Math.max(0, MAX_FREE_TRYONS_PER_USER - (quota.used + 1)),
    };
  }
}
