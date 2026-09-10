import { NextResponse } from "next/server";
import { vtoBudgetGovernor, VtoProviderMode } from "@/lib/vto/vtoBudgetGovernor";

export const dynamic = "force-static";

export async function GET(req: Request) {
  try {
    const metrics = vtoBudgetGovernor.getMetrics();
    const config = vtoBudgetGovernor.getConfig();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      config,
      metrics
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || "Failed to retrieve VTO budget metrics."
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      providerMode, 
      emergencyStop, 
      perUserMonthlyLimit, 
      perUserDailyLimit, 
      globalDailyLimit, 
      globalMonthlyLimit,
      maxConcurrentPerUser
    } = body;

    const updates: any = {};
    if (providerMode && ["DISABLED", "CONTROLLED", "PRODUCTION"].includes(providerMode)) {
      updates.providerMode = providerMode as VtoProviderMode;
    }
    if (typeof emergencyStop === "boolean") {
      updates.emergencyStop = emergencyStop;
    }
    if (typeof perUserMonthlyLimit === "number") {
      updates.perUserMonthlyLimit = perUserMonthlyLimit;
    }
    if (typeof perUserDailyLimit === "number") {
      updates.perUserDailyLimit = perUserDailyLimit;
    }
    if (typeof globalDailyLimit === "number") {
      updates.globalDailyLimit = globalDailyLimit;
    }
    if (typeof globalMonthlyLimit === "number") {
      updates.globalMonthlyLimit = globalMonthlyLimit;
    }
    if (typeof maxConcurrentPerUser === "number") {
      updates.maxConcurrentPerUser = maxConcurrentPerUser;
    }

    vtoBudgetGovernor.updateConfig(updates);

    return NextResponse.json({
      success: true,
      message: "VTO Budget Governor configuration updated successfully.",
      updatedConfig: vtoBudgetGovernor.getConfig(),
      metrics: vtoBudgetGovernor.getMetrics()
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || "Failed to update VTO budget configuration."
    }, { status: 500 });
  }
}
