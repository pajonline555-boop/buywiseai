export const dynamic = "force-static";
import { NextResponse } from 'next/server';
import { getGenGCarouselSlides } from '@/lib/genG/GenGCarouselService';
import { getCachedGenGSlides, setCachedGenGSlides } from '@/lib/genG/GenGProductCache';

export async function GET() {
  const cached = getCachedGenGSlides();
  if (cached) {
    return NextResponse.json({ success: true, source: 'cache', slides: cached });
  }

  const slides = getGenGCarouselSlides();
  setCachedGenGSlides(slides);

  return NextResponse.json({ success: true, source: 'live_feed', slides });
}
