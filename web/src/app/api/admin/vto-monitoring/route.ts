import { NextResponse } from "next/server";
import { vtoProviderRouter } from "@/lib/vto/providers/VtoProviderRouter";
import { runPodVtoProvider } from "@/lib/vto/providers/RunPodVtoProvider";
import { falVtoProvider } from "@/lib/vto/providers/FalVtoProvider";
import { huggingFaceVtoProvider } from "@/lib/vto/huggingface-vto";

export const dynamic = "force-static";

export async function GET(req: Request) {
  try {
    const [runpodHealth, falHealth, hfHealth] = await Promise.all([
      runPodVtoProvider.healthCheck(),
      falVtoProvider.healthCheck(),
      huggingFaceVtoProvider.healthCheck()
    ]);

    const primary = vtoProviderRouter.selectPrimaryProvider();
    const metrics = vtoProviderRouter.getMetrics();

    const providerStatus = [
      {
        provider: "RunPod Primary",
        id: runPodVtoProvider.id,
        configured: runPodVtoProvider.isConfigured(),
        licenseStatus: runPodVtoProvider.getLicenseStatus(),
        health: runpodHealth
      },
      {
        provider: "fal.ai Secondary/Fallback",
        id: falVtoProvider.id,
        configured: falVtoProvider.isConfigured(),
        licenseStatus: falVtoProvider.getLicenseStatus(),
        health: falHealth
      },
      {
        provider: "Hugging Face ZeroGPU",
        id: huggingFaceVtoProvider.id,
        configured: huggingFaceVtoProvider.isConfigured(),
        licenseStatus: huggingFaceVtoProvider.getLicenseStatus(),
        health: hfHealth
      }
    ];

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      activePrimaryProvider: primary ? primary.id : "NONE",
      metrics: {
        totalRequests: metrics.totalRequests,
        primarySuccessCount: metrics.primarySuccessCount,
        fallbackSuccessCount: metrics.fallbackSuccessCount,
        totalFailures: metrics.totalFailures,
        totalCostEstimatedUsd: metrics.totalCostEstimated
      },
      providers: providerStatus
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || "Failed to query VTO provider monitoring."
    }, { status: 500 });
  }
}
