import { RetailerAdapter, RetailerSearchResult, StoreOffer } from './types';
import axios from 'axios';

function sanitizeSearchQuery(query: string): string {
  let cleaned = query.trim().replace(/\s+/g, ' ');
  cleaned = cleaned.replace(/\bi\s*phone\b/gi, 'iPhone');
  cleaned = cleaned.replace(/\bi\s*pad\b/gi, 'iPad');
  cleaned = cleaned.replace(/\bmac\s*book\b/gi, 'MacBook');
  return cleaned;
}

export class FlipkartAdapter implements RetailerAdapter {
  readonly id = 'flipkart';
  readonly name = 'Flipkart';
  readonly country = 'IN';
  readonly currency = 'INR';
  readonly enabled = true;
  readonly logo = 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_2023_Flipkart.png';

  async search(query: string): Promise<RetailerSearchResult> {
    const timestamp = new Date().toISOString();
    const cleanQuery = sanitizeSearchQuery(query);
    const affiliateId = process.env.FLIPKART_AFFILIATE_ID;
    const affiliateToken = process.env.FLIPKART_AFFILIATE_TOKEN;

    if (!affiliateId || !affiliateToken) {
      return {
        retailer: {
          id: this.id,
          name: this.name,
          country: this.country,
          currency: this.currency,
          enabled: this.enabled,
          logo: this.logo,
        },
        offers: [],
        success: false,
        error: 'Flipkart official Affiliate API credentials required (FLIPKART_AFFILIATE_ID / FLIPKART_AFFILIATE_TOKEN). Live product verification requires authorized API access.',
        checkedAt: timestamp,
      };
    }

    const searchUrl = `https://affiliate-api.flipkart.net/affiliate/1.0/search.json?query=${encodeURIComponent(cleanQuery)}&resultCount=5`;

    try {
      const { data } = await axios.get(searchUrl, {
        headers: {
          'Fk-Affiliate-Id': affiliateId,
          'Fk-Affiliate-Token': affiliateToken,
        },
        timeout: 7000,
      });

      const products = data?.productInfoList || [];

      if (products.length === 0) {
        return {
          retailer: { id: this.id, name: this.name, country: this.country, currency: this.currency, enabled: this.enabled, logo: this.logo },
          offers: [],
          success: true,
          checkedAt: timestamp,
        };
      }

      const offers: StoreOffer[] = products.map((item: any) => {
        const baseInfo = item.productBaseInfoV1 || {};
        const sellingPrice = baseInfo.flipkartSellingPrice?.amount || 0;
        const specialPrice = baseInfo.flipkartSpecialPrice?.amount || sellingPrice;
        const mrp = baseInfo.maximumRetailPrice?.amount || sellingPrice;
        const discount = mrp > specialPrice ? mrp - specialPrice : 0;
        const inStock = baseInfo.inStock !== false;
        const imageUrl = baseInfo.imageUrls?.['400x400'] || baseInfo.imageUrls?.['200x200'];
        const productUrl = baseInfo.productUrl;

        return {
          id: `fk-${baseInfo.productId || Date.now()}`,
          retailerId: this.id,
          store: this.name,
          title: baseInfo.title || cleanQuery,
          url: productUrl || `https://www.flipkart.com/search?q=${encodeURIComponent(cleanQuery)}`,
          directProductUrl: productUrl,
          affiliateUrl: productUrl,
          isDirectProductLink: Boolean(productUrl && productUrl.includes('/p/')),
          price: specialPrice,
          currency: baseInfo.flipkartSellingPrice?.currency || this.currency,
          originalPrice: mrp,
          mrp,
          discount,
          imageUrl,
          logo: this.logo,
          availability: inStock ? 'in_stock' : 'out_of_stock',
          checkedAt: timestamp,
          sourceType: 'api',
          verificationStatus: 'verified_live',
          brand: baseInfo.productBrand,
          productId: baseInfo.productId,
          listedPrice: specialPrice,
          shippingFee: 0,
          effectivePayablePrice: specialPrice,
          priceBasis: 'listed',
          dataFreshness: 'Live Flipkart Affiliate API 1.0 Feed',
          provenance: {
            source: 'api',
            provider: 'Flipkart Affiliate API 1.0',
            rawListingId: baseInfo.productId,
            lastChecked: timestamp,
            isLiveFeed: true,
          },
          imageProvenance: {
            url: imageUrl,
            isGenuineProductImage: Boolean(imageUrl),
            isFallback: false,
          },
        };
      });

      return {
        retailer: { id: this.id, name: this.name, country: this.country, currency: this.currency, enabled: this.enabled, logo: this.logo },
        offers,
        success: true,
        checkedAt: timestamp,
      };
    } catch (err: any) {
      return {
        retailer: { id: this.id, name: this.name, country: this.country, currency: this.currency, enabled: this.enabled, logo: this.logo },
        offers: [],
        success: false,
        error: err?.response?.data?.message || err?.message || 'Flipkart Affiliate API request failed',
        checkedAt: timestamp,
      };
    }
  }
}

export const flipkartAdapter = new FlipkartAdapter();
