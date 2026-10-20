export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import axios from "axios";

async function fetchAsBase64(url: string): Promise<string | undefined> {
  if (url.startsWith("data:")) return url;
  try {
    const res = await axios.get(url, { responseType: "arraybuffer", timeout: 15000 });
    const buffer = Buffer.from(res.data);
    const mime = res.headers["content-type"] || "image/jpeg";
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch (err) {
    console.warn("[VTO Route fetchAsBase64 Warn]:", err);
  }
  return undefined;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Resolve User Image & Garment Image from any supported payload format
    let userImageBase64 = body.userImageBase64 || body.person_image_url;
    let garmentImageUrl = body.garmentImageUrl || body.garment_image_url;
    const category = body.category || "dresses";

    if (!userImageBase64 && body.userPhoto) {
      const url = typeof body.userPhoto === "string" ? body.userPhoto : body.userPhoto?.url;
      if (url) {
        userImageBase64 = url.startsWith("data:") ? url : await fetchAsBase64(url);
      }
    }

    if (!garmentImageUrl && body.product) {
      garmentImageUrl = body.product?.imageUrl || body.product?.primaryImage || body.product?.image;
    }

    if (!userImageBase64 || !garmentImageUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide both a user photo and a garment image.",
        },
        { status: 400 }
      );
    }

    // 2. Execute VTO Generation via Canonical Provider Router
    const { vtoProviderRouter } = await import("@/lib/vto/providers/VtoProviderRouter");
    const { validateGeneratedImage } = await import("@/lib/vto/vtoQualityGate");

    const requestId = `vto_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const productTitle = body.title || body.product?.title || body.product?.name || "garment";

    console.log(`[VTO Route]: Delegating requestId ${requestId} to VtoProviderRouter...`);

    const result = await vtoProviderRouter.generate({
      requestId,
      userId: body.userId || "guest_user",
      personImage: userImageBase64,
      garmentImage: garmentImageUrl,
      garmentType: category,
      productTitle,
      productId: body.garmentSkuId || body.product?.id,
      preserveIdentity: true,
      preserveBackground: true,
    });

    if (!result.success || !result.image) {
      console.warn(`[VTO Route Failure]: Provider ${result.provider} failed: ${result.failureMessage}`);
      return NextResponse.json(
        {
          success: false,
          code: result.failureCode || "VTO_GENERATION_FAILED",
          message: result.failureMessage || "AI try-on generation failed. Please try again in a few moments.",
          provider: result.provider,
          fallbackUsed: result.fallbackUsed || false,
          canPublishToCommunity: false,
        },
        { status: 502 }
      );
    }

    // 3. Enforce Perceptual Quality Gate
    const qualityReport = validateGeneratedImage(result.image, userImageBase64, garmentImageUrl);

    if (!qualityReport.isValid) {
      console.warn(`[VTO Quality Gate Rejection]: ${qualityReport.code} - ${qualityReport.message}`);
      return NextResponse.json(
        {
          success: false,
          code: qualityReport.code,
          message: `Quality check failed: ${qualityReport.message}. Please select a clearer photo.`,
          provider: result.provider,
          canPublishToCommunity: false,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      imageBase64: result.image,
      imageUrl: result.image,
      resultImage: result.image,
      provider: result.provider,
      modelUsed: result.model,
      modeUsed: result.model,
      generationTimeMs: result.generationTimeMs,
      estimatedCost: result.estimatedCost,
      fallbackUsed: result.fallbackUsed || false,
      canPublishToCommunity: qualityReport.canPublishToCommunity,
      job: {
        status: "COMPLETED",
        resultImageUrl: result.image,
        provider: result.provider,
        mode: result.model,
      },
    });
  } catch (err: any) {
    console.error("[VTO Route Exception]:", err?.message || err);
    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        message: "AI Fitting Room encountered an unexpected error. Please retry.",
        canPublishToCommunity: false,
      },
      { status: 500 }
    );
  }
}
