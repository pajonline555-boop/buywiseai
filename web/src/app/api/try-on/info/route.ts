export const dynamic = "force-static";
import { NextResponse } from "next/server";
import { getVirtualTryOnProviderStatus } from "@/lib/vto/provider";

export async function GET() {
  const status = getVirtualTryOnProviderStatus();
  return NextResponse.json({
    status,
    timestamp: new Date().toISOString()
  });
}
