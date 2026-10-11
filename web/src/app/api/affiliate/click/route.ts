export const dynamic = "force-static";
import { NextResponse } from 'next/server';
import { trackAffiliateClick } from '@/lib/affiliate/affiliateAnalytics';
import { AffiliateNetworkType } from '@/lib/affiliate/affiliateConfig';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { network, productId, source, destinationDomain, affiliateConfigured, affiliateUrlVerified, devicePlatform } = body;

    const eventId = await trackAffiliateClick({
      sessionId: `sess-${Date.now()}`,
      network: (network || 'AMAZON') as AffiliateNetworkType,
      productId: productId || 'unknown',
      source: source || 'SEARCH',
      destinationDomain: destinationDomain || 'unknown',
      affiliateConfigured: Boolean(affiliateConfigured),
      affiliateUrlVerified: Boolean(affiliateUrlVerified),
      devicePlatform: devicePlatform || 'web',
    });

    return NextResponse.json({ success: true, eventId });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to record click' }, { status: 500 });
  }
}
