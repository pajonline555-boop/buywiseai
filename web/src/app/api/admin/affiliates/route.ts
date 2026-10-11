export const dynamic = "force-static";
import { NextResponse } from 'next/server';
import { getAffiliateConfigs, updateAffiliateConfig, AffiliateNetworkType } from '@/lib/affiliate/affiliateConfig';
import { buildAffiliateUrl, verifyAffiliateLink } from '@/lib/affiliate/affiliateLinkBuilder';

export async function GET() {
  const configs = getAffiliateConfigs();
  return NextResponse.json({ success: true, configs });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, network, updates, testUrl } = body;

    if (action === 'TEST_LINK') {
      const netType = (network || 'AMAZON') as AffiliateNetworkType;
      const targetUrl = testUrl || (netType === 'FLIPKART' ? 'https://www.flipkart.com/dp/12345' : 'https://www.amazon.in/dp/B0CHX1W1XY');
      const generated = buildAffiliateUrl(targetUrl, netType, 'SEARCH', false);
      const validation = verifyAffiliateLink(generated, netType);

      return NextResponse.json({
        success: true,
        network: netType,
        originalUrl: targetUrl,
        generatedAffiliateUrl: generated,
        validation,
      });
    }

    if (action === 'UPDATE' && network) {
      const updated = updateAffiliateConfig(network as AffiliateNetworkType, updates || {});
      return NextResponse.json({ success: true, updated });
    }

    return NextResponse.json({ error: 'Invalid action or network parameter' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
