export const dynamic = "force-static";
import { NextResponse } from 'next/server';
import { getRawGenGProductCandidates } from '@/lib/genG/GenGFeedService';
import { getGenGCarouselSlides } from '@/lib/genG/GenGCarouselService';
import { clearGenGCache } from '@/lib/genG/GenGProductCache';
import { validateGenGProduct } from '@/lib/genG/GenGProductValidator';

export async function GET() {
  const candidates = getRawGenGProductCandidates();
  const selectedSlides = getGenGCarouselSlides();

  const candidateAudit = candidates.map((p) => {
    const val = validateGenGProduct(p);
    const isSelected = selectedSlides.some((s) => s.id === p.id);
    return {
      product: p,
      validation: val,
      isSelected,
    };
  });

  return NextResponse.json({
    success: true,
    totalCandidates: candidates.length,
    selectedSlidesCount: selectedSlides.length,
    selectedSlides,
    candidateAudit,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'REFRESH') {
      clearGenGCache();
      const newSlides = getGenGCarouselSlides();
      return NextResponse.json({ success: true, message: 'Gen-G Feed cache refreshed', newSlides });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
