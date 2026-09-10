export const dynamic = "force-static";

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getSubmissions, adminModerateSubmission } from "@/lib/competition/store";
import { logSecurityEvent } from "@/lib/auth/roleMiddleware";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  const url = new URL(request.url);
  const competitionId = url.searchParams.get("competitionId") || undefined;

  const submissions = getSubmissions(competitionId);

  logSecurityEvent({
    eventType: "MEDIA_REVIEW",
    userId: auth.adminContext.uid,
    email: auth.adminContext.email,
    route: "/api/admin/competition-submissions",
    reason: `Admin reviewed ${submissions.length} authorized competition submission images.`
  });

  return NextResponse.json({
    success: true,
    admin: auth.adminContext.email,
    count: submissions.length,
    submissions,
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const { submissionId, action, reason } = body;

    if (!submissionId || !action) {
      return NextResponse.json(
        { success: false, code: "BAD_REQUEST", message: "submissionId and action ('APPROVE' | 'REJECT') required." },
        { status: 400 }
      );
    }

    const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";
    adminModerateSubmission(submissionId, newStatus, reason);

    logSecurityEvent({
      eventType: "ROLE_CHANGE",
      userId: auth.adminContext.uid,
      email: auth.adminContext.email,
      route: "/api/admin/competition-submissions",
      reason: `Admin ${action} submission ${submissionId} (Status: ${newStatus})`
    });

    return NextResponse.json({
      success: true,
      message: `Submission ${submissionId} updated to ${newStatus}.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, code: "SERVER_ERROR", message: err.message || "Failed to moderate submission." },
      { status: 500 }
    );
  }
}
