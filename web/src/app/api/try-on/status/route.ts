import { NextResponse } from "next/server";

export const dynamic = "force-static";

export async function GET(req: Request) {
  let jobId: string | null = null;
  try {
    if (req && req.url) {
      const { searchParams } = new URL(req.url);
      jobId = searchParams.get("jobId");
    }
  } catch {}

  return NextResponse.json({
    jobId: jobId || "default-job",
    status: "COMPLETED",
    message: "Virtual try-on job completed.",
    completedAt: new Date().toISOString()
  });
}
