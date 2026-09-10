export const dynamic = "force-static";

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import {
  fetchCompetitionsFromDb,
  saveCompetitionToDb,
  adminCreateCompetition,
  validateStateTransition,
  Competition,
  CompetitionStatus
} from "@/lib/competition/store";
import { logSecurityEvent } from "@/lib/auth/roleMiddleware";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  const competitions = await fetchCompetitionsFromDb();
  return NextResponse.json({
    success: true,
    admin: auth.adminContext.email,
    count: competitions.length,
    competitions,
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    if (!body.title || !body.featuredProductTitle) {
      return NextResponse.json(
        { success: false, code: "BAD_REQUEST", message: "Title and featured product title are required." },
        { status: 400 }
      );
    }

    const requestedStatus: CompetitionStatus = body.status || 'LIVE';
    if (!validateStateTransition('DRAFT', requestedStatus)) {
      return NextResponse.json(
        { success: false, code: "BAD_REQUEST", message: `Invalid state transition from DRAFT to ${requestedStatus}` },
        { status: 400 }
      );
    }

    const created: Competition = adminCreateCompetition({
      title: body.title,
      description: body.description,
      featuredProductId: body.featuredProductId,
      featuredProductTitle: body.featuredProductTitle,
      featuredProductImage: body.featuredProductImage,
      featuredProductPrice: body.featuredProductPrice,
      retailer: body.retailer,
      startDate: body.startDate,
      endDate: body.endDate,
      prizeDescription: body.prizeDescription,
      eligibility: body.eligibility,
      rules: body.rules,
      status: requestedStatus,
      createdBy: auth.adminContext.email, // STRICT SERVER-SUPPLIED ADMIN IDENTITY
    });

    await saveCompetitionToDb(created);

    logSecurityEvent({
      eventType: "ROLE_CHANGE",
      userId: auth.adminContext.uid,
      email: auth.adminContext.email,
      route: "/api/admin/competitions",
      reason: `Admin created competition "${created.title}" (ID: ${created.id})`
    });

    return NextResponse.json({
      success: true,
      message: "🏆 Competition created and recorded in Firestore successfully.",
      competition: created,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, code: "SERVER_ERROR", message: err.message || "Failed to create competition." },
      { status: 500 }
    );
  }
}
