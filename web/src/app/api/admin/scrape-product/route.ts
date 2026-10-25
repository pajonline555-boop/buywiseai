export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { scrapeProductUrl } from "@/lib/scrapers/productScraper";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');

    if (!url || !url.trim()) {
      return NextResponse.json(
        { success: false, error: 'Product URL parameter is required.' },
        { status: 400 }
      );
    }

    const data = await scrapeProductUrl(url.trim());
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error in scrape-product GET API:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to scrape product URL.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = body?.url;

    if (!url || typeof url !== 'string' || !url.trim()) {
      return NextResponse.json(
        { success: false, error: 'Product URL is required in request body.' },
        { status: 400 }
      );
    }

    const data = await scrapeProductUrl(url.trim());
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error in scrape-product POST API:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to scrape product URL.' },
      { status: 500 }
    );
  }
}
