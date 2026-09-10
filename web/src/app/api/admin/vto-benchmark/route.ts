import { NextResponse } from "next/server";
import { runPodVtoProvider } from "@/lib/vto/providers/RunPodVtoProvider";
import { falVtoProvider } from "@/lib/vto/providers/FalVtoProvider";
import { huggingFaceVtoProvider } from "@/lib/vto/huggingface-vto";
import { NormalizedVtoGenerationRequest } from "@/lib/vto/providers/VtoProviderTypes";

export const dynamic = "force-static";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { personImage, garmentImage, garmentType, productTitle } = body;

    if (!personImage || !garmentImage) {
      return NextResponse.json({
        success: false,
        message: "Benchmark requires both personImage and garmentImage URLs/base64."
      }, { status: 400 });
    }

    const benchmarkReq: NormalizedVtoGenerationRequest = {
      requestId: `bm_${Date.now()}`,
      userId: "admin_benchmark",
      personImage,
      garmentImage,
      garmentType: garmentType || "sarees_ethnic",
      productTitle: productTitle || "Benchmark Garment"
    };

    console.log("[Admin VTO Benchmark]: Executing parallel benchmark across providers...");

    const [runpodResult, falResult, hfResult] = await Promise.all([
      runPodVtoProvider.generate(benchmarkReq),
      falVtoProvider.generate(benchmarkReq),
      huggingFaceVtoProvider.generate(benchmarkReq)
    ]);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      benchmarkResults: [
        {
          provider: "RunPod",
          configured: runPodVtoProvider.isConfigured(),
          licenseStatus: runPodVtoProvider.getLicenseStatus(),
          result: runpodResult
        },
        {
          provider: "fal.ai",
          configured: falVtoProvider.isConfigured(),
          licenseStatus: falVtoProvider.getLicenseStatus(),
          result: falResult
        },
        {
          provider: "Hugging Face",
          configured: huggingFaceVtoProvider.isConfigured(),
          licenseStatus: huggingFaceVtoProvider.getLicenseStatus(),
          result: hfResult
        }
      ]
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || "Failed to execute VTO benchmark."
    }, { status: 500 });
  }
}
