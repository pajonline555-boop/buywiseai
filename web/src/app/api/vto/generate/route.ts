export const dynamic = "force-static";
import { NextResponse } from "next/server";
import { vtoProviderRouter } from "@/lib/vto/providers/VtoProviderRouter";
import { vtoBudgetGovernor } from "@/lib/vto/vtoBudgetGovernor";
import { garmentPreparationPipeline } from "@/lib/vto/garmentPreparation";
import { validateGeneratedImage } from "@/lib/vto/vtoQualityGate";
import { reserveVtoCredit, refundVtoCredit } from "@/lib/vto/vtoEntitlementService";
import axios from 'axios';

async function fetchAsBase64(url: string): Promise<string | undefined> {
  if (url.startsWith("data:")) return url;
  try {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
    const buffer = Buffer.from(res.data);
    const base64 = buffer.toString("base64");
    const mime = res.headers["content-type"] || "image/jpeg";
    return `data:${mime};base64,${base64}`;
  } catch (err) {
    console.warn("[VTO API Route fetchAsBase64 Note]:", err);
  }
  return undefined;
}

export async function POST(req: Request) {
  let reservedUserId: string | null = null;
  let reservationId: string | null = null;
  let budgetReserved = false;

  try {
    const body = await req.json();
    const { userPhoto, product, drapeStyle, userId } = body;

    if (!userPhoto || !userPhoto.url) {
      return NextResponse.json({
        success: false,
        code: "INVALID_USER_PHOTO",
        message: "Missing user photo for Virtual Try-On."
      }, { status: 400 });
    }

    if (!product || !product.id || !product.title || !product.imageUrl) {
      return NextResponse.json({
        success: false,
        code: "INVALID_PRODUCT_DATA",
        message: "Missing selected product image and details."
      }, { status: 400 });
    }

    const targetUserId = userId || "guest_demo_user";

    // Step 0A: Atomic Entitlement Check
    const reservation = reserveVtoCredit(targetUserId);
    if (!reservation.success) {
      return NextResponse.json({
        success: false,
        code: "ENTITLEMENT_EXHAUSTED",
        message: reservation.reason || "You've used your free Try-Ons for now. 🎉",
        remainingCredits: reservation.remainingCredits
      }, { status: 402 });
    }

    reservedUserId = targetUserId;
    reservationId = reservation.reservationId || null;

    // Step 0B: Financial & Budget Governor Check
    const budgetCheck = vtoBudgetGovernor.checkAndReserveSlot(targetUserId);
    if (!budgetCheck.allowed) {
      // Refund credit entitlement if budget governor denies request
      if (reservedUserId && reservationId) {
        refundVtoCredit(reservedUserId, reservationId);
      }
      return NextResponse.json({
        success: false,
        code: budgetCheck.code || "BUDGET_LIMIT_REACHED",
        message: budgetCheck.message || "Free Try-On limit reached. Please try again later.",
        userMonthlyRemaining: budgetCheck.userMonthlyRemaining,
        userDailyRemaining: budgetCheck.userDailyRemaining,
        globalDailyRemaining: budgetCheck.globalDailyRemaining
      }, { status: 429 });
    }

    budgetReserved = true;

    // Step 1: Garment Preparation Pipeline
    const preparedGarment = await garmentPreparationPipeline.prepareGarmentImage(
      product.id,
      product.imageUrl,
      product.category || "sarees_ethnic",
      product.title
    );

    // Step 2: Fetch Base64 representations
    const userPhotoBase64 = userPhoto.url.startsWith("data:") 
      ? userPhoto.url 
      : await fetchAsBase64(userPhoto.url);

    const garmentBase64 = product.imageUrl.startsWith("data:")
      ? product.imageUrl
      : await fetchAsBase64(product.imageUrl);

    // Step 3: Execute VTO Provider Router Pipeline
    const requestId = `vto_req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const routerResult = await vtoProviderRouter.generate({
      requestId,
      userId: targetUserId,
      personImage: userPhotoBase64 || userPhoto.url,
      garmentImage: garmentBase64 || product.imageUrl,
      garmentType: product.category || "sarees_ethnic",
      productTitle: product.title,
      productId: product.id,
      storeName: product.store || "Retailer Store",
      requestedStyle: drapeStyle || product.drapeStyle
    });

    // Step 4: Provider Failure Handling
    if (!routerResult.success || !routerResult.image) {
      console.log(`[VTO API Route]: Provider Router execution returned FAILED. Error: ${routerResult.failureMessage}`);
      
      if (budgetReserved && reservedUserId) {
        vtoBudgetGovernor.releaseSlot(reservedUserId);
      }
      if (reservedUserId && reservationId) {
        refundVtoCredit(reservedUserId, reservationId);
      }

      return NextResponse.json({
        success: false,
        code: routerResult.failureCode || "VTO_GENERATION_FAILED",
        message: "Virtual Try-On is temporarily unavailable. Your credit was not consumed.",
        provider: routerResult.provider
      }, { status: 502 });
    }

    // Step 5: Quality Gate Validation
    const validation = validateGeneratedImage(routerResult.image, userPhotoBase64, garmentBase64);

    if (!validation.isValid) {
      console.warn(`[VTO API Route]: Quality Gate rejected generation (${validation.code}: ${validation.message}). Refunding credit...`);
      
      if (budgetReserved && reservedUserId) {
        vtoBudgetGovernor.releaseSlot(reservedUserId);
      }
      if (reservedUserId && reservationId) {
        refundVtoCredit(reservedUserId, reservationId);
      }

      return NextResponse.json({
        success: false,
        code: validation.code || "QUALITY_GATE_FAILED",
        message: "Virtual Try-On result did not meet quality standards. Your credit was refunded.",
        validation
      }, { status: 422 });
    }

    // SUCCESS: Commit budget slot
    vtoBudgetGovernor.commitSlot(targetUserId, routerResult.estimatedCost);

    return NextResponse.json({
      success: true,
      job: {
        jobId: routerResult.requestId,
        status: "COMPLETED",
        userPhotoUrl: userPhoto.url,
        productId: product.id,
        productTitle: product.title,
        productStore: product.store || "Retailer Store",
        productPrice: product.price || 0,
        resultImageUrl: routerResult.image,
        providerId: routerResult.provider,
        model: routerResult.model,
        licenseStatus: routerResult.licenseStatus,
        fallbackUsed: routerResult.fallbackUsed || false,
        estimatedCost: routerResult.estimatedCost
      },
      preparedGarment,
      validation,
      providerConfigured: true,
      budgetRemaining: {
        userMonthlyRemaining: budgetCheck.userMonthlyRemaining,
        userDailyRemaining: budgetCheck.userDailyRemaining
      }
    });

  } catch (error: any) {
    if (budgetReserved && reservedUserId) {
      vtoBudgetGovernor.releaseSlot(reservedUserId);
    }
    if (reservedUserId && reservationId) {
      refundVtoCredit(reservedUserId, reservationId);
    }
    return NextResponse.json({
      success: false,
      code: "VTO_SYSTEM_ERROR",
      message: "Virtual Try-On is temporarily unavailable. Your credit was not consumed."
    }, { status: 500 });
  }
}
