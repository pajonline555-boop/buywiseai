import { RetailerAdapter, RetailerSearchResult, StoreOffer } from './types';
import { calculateLowestPriceForQuery } from './amazon';
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
        retailer: { id: this.id, name: this.name, country: this.country, currency: this.currency, enabled: this.enabled, logo: this.logo },
        offers: [],
        success: false,
        error: 'Flipkart live API credentials required (FLIPKART_AFFILIATE_ID / FLIPKART_AFFILIATE_TOKEN). Connection status: CREDENTIALS_REQUIRED.',
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

        return {
          id: `fk-${baseInfo.productId || Date.now()}`,
          retailerId: this.id,
          store: this.name,
          title: baseInfo.title || cleanQuery,
          url: baseInfo.productUrl || `https://www.flipkart.com/search?q=${encodeURIComponent(cleanQuery)}`,
          price: specialPrice,
          currency: baseInfo.flipkartSellingPrice?.currency || this.currency,
          originalPrice: mrp,
          mrp,
          discount,
          imageUrl: baseInfo.imageUrls?.['400x400'] || baseInfo.imageUrls?.['200x200'],
          logo: this.logo,
          availability: inStock ? 'in_stock' : 'out_of_stock',
          checkedAt: timestamp,
          sourceType: 'api',
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
