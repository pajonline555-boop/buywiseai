export const dynamic = "force-static";
import { NextResponse } from "next/server";
import { getVirtualTryOnProvider } from "@/lib/vto/provider";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userPhoto, product } = body;

    if (!userPhoto || !userPhoto.url) {
      return NextResponse.json({ error: "Missing user photo reference." }, { status: 400 });
    }

    if (!product || !product.id || !product.title) {
      return NextResponse.json({ error: "Missing product details for try-on." }, { status: 400 });
    }

    const provider = getVirtualTryOnProvider();
    const isConfigured = provider.isConfigured();

    const result = await provider.generateTryOn(
      {
        id: `img_${Date.now()}`,
        url: userPhoto.url,
        mimeType: userPhoto.mimeType || "image/jpeg",
        width: userPhoto.width || 800,
        height: userPhoto.height || 1200,
        sizeBytes: userPhoto.sizeBytes || 500000,
        uploadedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        inputMode: "full_body",
      },
      {
        id: product.id,
        title: product.title,
        price: product.price || 0,
        store: product.store || "Retailer Store",
        url: product.productUrl || "/search",
        imageUrl: product.imageUrl || userPhoto.url
      }
    );

    return NextResponse.json({
      success: true,
      job: result,
      providerConfigured: isConfigured,
      message: isConfigured 
        ? "AI Try-On preview generated successfully." 
        : "Virtual Try-On provider is currently being configured."
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process virtual try-on request." }, { status: 500 });
  }
}
