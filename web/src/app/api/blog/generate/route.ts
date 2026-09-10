export const dynamic = "force-static";
import { NextResponse } from "next/server";
import { generateAIBlogPost } from "@/lib/aiBlogGenerator";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const topic = body.topic || "Best Tech & Mobile Shopping Deals in India";
    const post = await generateAIBlogPost(topic);
    return NextResponse.json({ success: true, post });
  } catch (error: any) {
    console.error("API Blog Generate error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
