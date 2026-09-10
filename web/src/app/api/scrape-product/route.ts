export const dynamic = "force-static";
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 });
    }

    let detectedStore = 'Online Retailer';
    if (url.includes('amazon.')) detectedStore = 'Amazon India';
    else if (url.includes('flipkart.')) detectedStore = 'Flipkart';
    else if (url.includes('meesho.')) detectedStore = 'Meesho';
    else if (url.includes('myntra.')) detectedStore = 'Myntra';
    else if (url.includes('croma.')) detectedStore = 'Croma';
    else if (url.includes('ebay.')) detectedStore = 'eBay';

    let extractedTitle = '';
    let extractedImage = '';
    let extractedPrice = 0;
    let extractedMrp = 0;

    // 1. Try to extract ASIN if Amazon
    let amazonAsin = '';
    const asinMatch = url.match(/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
    if (asinMatch && asinMatch[1]) {
      amazonAsin = asinMatch[1];
    }

    // 2. Fetch the target URL with User-Agent
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        next: { revalidate: 3600 }
      });

      if (response.ok) {
        const html = await response.text();

        // Extract og:image
        const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                             html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i) ||
                             html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
        if (ogImageMatch && ogImageMatch[1]) {
          extractedImage = ogImageMatch[1];
        }

        // Amazon specific image tags if og:image wasn't found or was default logo
        if (!extractedImage || extractedImage.includes('amazon_logo') || extractedImage.includes('PK_logo')) {
          const hiresMatch = html.match(/data-old-hires=["']([^"']+)["']/i) ||
                             html.match(/id=["']landingImage["'][^>]*src=["']([^"']+)["']/i) ||
                             html.match(/["']hiRes["']:\s*["']([^"']+)["']/i) ||
                             html.match(/["']large["']:\s*["']([^"']+)["']/i);
          if (hiresMatch && hiresMatch[1]) {
            extractedImage = hiresMatch[1];
          }
        }

        // Extract og:title or title tag
        const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                             html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (ogTitleMatch && ogTitleMatch[1]) {
          extractedTitle = ogTitleMatch[1].replace(/\|.*/, '').replace(/ - Amazon.*/i, '').replace(/:\s*Buy.*/i, '').trim();
        }

        // Extract Price if possible
        const priceMatch = html.match(/class=["']a-price-whole["'][^>]*>([\d,]+)/i) ||
                           html.match(/["']price["']:\s*["']?(\d+)/i);
        if (priceMatch && priceMatch[1]) {
          extractedPrice = parseInt(priceMatch[1].replace(/,/g, ''), 10);
          extractedMrp = Math.round(extractedPrice * 1.4);
        }
      }
    } catch (fetchErr) {
      console.warn('Scraper fetch notice:', fetchErr);
    }

    // 3. Amazon ASIN Image Fallbacks if image not scraped
    if (!extractedImage && amazonAsin) {
      extractedImage = `https://images-na.ssl-images-amazon.com/images/P/${amazonAsin}.01._SCLZZZZZZZ_.jpg`;
    }

    return NextResponse.json({
      success: true,
      store: detectedStore,
      title: extractedTitle,
      image: extractedImage,
      price: extractedPrice,
      mrp: extractedMrp,
      asin: amazonAsin
    });

  } catch (err: any) {
    console.error('Error in product scraper route:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
