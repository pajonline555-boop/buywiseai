export const dynamic = "force-static";
import { NextRequest, NextResponse } from 'next/server';

function createSvgPlaceholder(title: string = 'Product Image Unavailable') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0c0a1a" />
        <stop offset="50%" stop-color="#15102a" />
        <stop offset="100%" stop-color="#070510" />
      </linearGradient>
    </defs>
    <rect width="600" height="400" fill="url(#bgGrad)" />
    <rect x="24" y="24" width="552" height="352" rx="24" fill="rgba(255,255,255,0.02)" stroke="rgba(255, 255, 255, 0.1)" stroke-width="2" />
    <text x="300" y="180" font-family="system-ui, -apple-system, sans-serif" font-size="42" text-anchor="middle" fill="rgba(255,255,255,0.4)">🖼️</text>
    <text x="300" y="240" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700" text-anchor="middle" fill="rgba(255,255,255,0.6)">Product Image Unavailable</text>
    <text x="300" y="268" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="500" text-anchor="middle" fill="rgba(255,255,255,0.4)">Live Retailer Offer &amp; Details Available</text>
  </svg>`;
  
  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    let rawUrl = '';
    try {
      rawUrl = req?.url || '';
    } catch {
      return createSvgPlaceholder('Product Item');
    }
    let imageUrl = '';

    // Extract 'url=' parameter from raw URL to preserve '+' if unencoded
    const urlParamIndex = rawUrl.indexOf('url=');
    if (urlParamIndex !== -1) {
      const rawParam = rawUrl.substring(urlParamIndex + 4);
      const ampIndex = rawParam.indexOf('&');
      const paramVal = ampIndex !== -1 ? rawParam.substring(0, ampIndex) : rawParam;
      
      try {
        imageUrl = decodeURIComponent(paramVal);
      } catch {
        imageUrl = paramVal;
      }
    } else if (rawUrl) {
      try {
        const { searchParams } = new URL(rawUrl);
        imageUrl = searchParams.get('url') || '';
      } catch {}
    }

    if (!imageUrl || !imageUrl.startsWith('http')) {
      return createSvgPlaceholder('Product Item');
    }

    // Server-side fetch bypasses browser referrer blocking
    let res = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site',
      },
      cache: 'force-cache'
    });

    if (!res.ok) {
      // Retry without custom headers
      res = await fetch(imageUrl, { cache: 'no-store' });
    }

    if (!res.ok) {
      console.warn(`[ProxyImage] Image fetch returned ${res.status} for ${imageUrl}`);
      return createSvgPlaceholder('Product Item');
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    console.error('Error in proxy-image route:', err);
    return createSvgPlaceholder('Product Item');
  }
}
