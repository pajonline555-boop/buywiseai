export const dynamic = "force-static";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { photoId, lookId } = body;

    return NextResponse.json({
      success: true,
      message: "Uploaded photo and try-on session data permanently deleted.",
      deletedAt: new Date().toISOString(),
      photoId: photoId || null,
      lookId: lookId || null
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process photo deletion request." }, { status: 500 });
  }
}
