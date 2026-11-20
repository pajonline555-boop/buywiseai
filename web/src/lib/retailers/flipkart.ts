import { RetailerAdapter, RetailerSearchResult, StoreOffer } from './types';
import axios from 'axios';

export interface FlipkartProductItem {
  productBaseInfoV1?: {
    productId?: string;
    title?: string;
    productUrl?: string;
    productBrand?: string;
    inStock?: boolean;
    imageUrls?: Record<string, string>;
    attributes?: { size?: string; color?: string; sizes?: string[]; colors?: string[] };
    flipkartSellingPrice?: { amount?: number; currency?: string };
    flipkartSpecialPrice?: { amount?: number; currency?: string };
    maximumRetailPrice?: { amount?: number; currency?: string };
  };
  productShippingBaseInfoV1?: {
    shippingCharges?: { amount?: number };
    estimatedDeliveryTime?: string;
  };
}

export interface FlipkartConnectionVerification {
  credentialsConfigured: boolean;
  authSuccess: boolean;
  apiReachable: boolean;
  realProductReturned: boolean;
  productCount: number;
  sampleProduct?: {
    id: string;
    title: string;
    price?: number;
    currency?: string;
    imageUrl?: string;
    affiliateUrl?: string;
  };
  lastSuccessfulCheck?: string;
  safeErrorMessage?: string;
}

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

  /**
   * Performs real multi-step connection verification against Flipkart Affiliate API 1.0.
   * Tests: Configuration -> Auth & Reachability -> Real Product Return.
   */
  async verifyConnection(testQuery = 'kurta'): Promise<FlipkartConnectionVerification> {
    const affiliateId = process.env.FLIPKART_AFFILIATE_ID;
    const affiliateToken = process.env.FLIPKART_AFFILIATE_TOKEN;
    const isConfigured = Boolean(affiliateId && affiliateToken);

    if (!isConfigured) {
      return {
        credentialsConfigured: false,
        authSuccess: false,
        apiReachable: false,
        realProductReturned: false,
        productCount: 0,
        safeErrorMessage: 'BLOCKED — CREDENTIALS REQUIRED: Configure FLIPKART_AFFILIATE_ID and FLIPKART_AFFILIATE_TOKEN in web/.env.local (obtain from https://affiliate.flipkart.com).',
      };
    }

    const searchRes = await this.search(testQuery);
    if (!searchRes.success) {
      return {
        credentialsConfigured: true,
        authSuccess: false,
        apiReachable: false,
        realProductReturned: false,
        productCount: 0,
        safeErrorMessage: searchRes.error || 'Flipkart API request failed.',
      };
    }

    const firstOffer = searchRes.offers[0];
    return {
      credentialsConfigured: true,
      authSuccess: true,
      apiReachable: true,
      realProductReturned: searchRes.offers.length > 0,
      productCount: searchRes.offers.length,
      sampleProduct: firstOffer ? {
        id: firstOffer.id,
        title: firstOffer.title,
        price: firstOffer.price,
        currency: firstOffer.currency,
        imageUrl: firstOffer.imageUrl,
        affiliateUrl: firstOffer.affiliateUrl,
      } : undefined,
      lastSuccessfulCheck: new Date().toISOString(),
    };
  }

  /**
   * Search products using Flipkart Affiliate 1.0 Keyword Search API.
   * Official Documentation: https://affiliate.flipkart.com/api-docs/af_prod_ref.html
   * Endpoint: /affiliate/1.0/search.json?query={query}&resultCount={count}
   */
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

    const baseUrl = process.env.FLIPKART_AFFILIATE_BASE_URL || 'https://affiliate-api.flipkart.net';
    const searchUrl = `${baseUrl.replace(/\/$/, '')}/affiliate/1.0/search.json?query=${encodeURIComponent(cleanQuery)}&resultCount=5`;

    try {
      const { data } = await axios.get(searchUrl, {
        headers: {
          'Fk-Affiliate-Id': affiliateId,
          'Fk-Affiliate-Token': affiliateToken,
          'Accept': 'application/json',
        },
        timeout: 8000,
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

      const offers: StoreOffer[] = (products as FlipkartProductItem[]).map((item) => {
        const baseInfo = item.productBaseInfoV1 || {};
        const shippingInfo = item.productShippingBaseInfoV1 || {};
        const sellingPrice = baseInfo.flipkartSellingPrice?.amount || 0;
        const specialPrice = baseInfo.flipkartSpecialPrice?.amount || sellingPrice;
        const mrp = baseInfo.maximumRetailPrice?.amount || sellingPrice;
        const discount = mrp > specialPrice ? mrp - specialPrice : 0;
        const inStock = baseInfo.inStock !== false;
        const imageUrl = baseInfo.imageUrls?.['800x800'] || baseInfo.imageUrls?.['400x400'] || baseInfo.imageUrls?.['200x200'];
        
        // Extract multiple images from Flipkart baseInfo
        const additionalImages: string[] = [];
        if (baseInfo.imageUrls) {
          Object.values(baseInfo.imageUrls).forEach((val) => {
            if (typeof val === 'string' && val.startsWith('http') && val !== imageUrl) {
              additionalImages.push(val);
            }
          });
        }

        const productUrl = baseInfo.productUrl;
        const brand = baseInfo.productBrand;

        // Size & Color variants from Flipkart attributes
        const availableSizes: string[] = [];
        const availableColors: string[] = [];
        if (baseInfo.attributes?.size) availableSizes.push(baseInfo.attributes.size);
        if (baseInfo.attributes?.color) availableColors.push(baseInfo.attributes.color);

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
          additionalImages: additionalImages.length > 0 ? additionalImages : undefined,
          availableSizes: availableSizes.length > 0 ? availableSizes : undefined,
          availableColors: availableColors.length > 0 ? availableColors : undefined,
          logo: this.logo,
          availability: inStock ? 'in_stock' : 'out_of_stock',
          deliveryText: shippingInfo.shippingCharges?.amount === 0 ? 'Free Delivery' : undefined,
          checkedAt: timestamp,
          sourceType: 'api',
          verificationStatus: 'verified_live',
          brand,
          productId: baseInfo.productId,
          listedPrice: specialPrice,
          shippingFee: shippingInfo.shippingCharges?.amount || 0,
          effectivePayablePrice: specialPrice + (shippingInfo.shippingCharges?.amount || 0),
          priceBasis: 'effective_payable',
          dataFreshness: 'Live Flipkart Affiliate API Feed',
          provenance: {
            source: 'api',
            provider: 'Flipkart Affiliate API 1.0',
            rawListingId: baseInfo.productId,
            lastChecked: timestamp,
            isLiveFeed: true,
          },
          imageProvenance: {
            url: imageUrl || '',
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
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: unknown }; message?: string };
      const status = axiosErr?.response?.status;
      const errorMsg = status === 401 || status === 403 
        ? 'Flipkart Affiliate API authentication failed. Verify FLIPKART_AFFILIATE_ID and FLIPKART_AFFILIATE_TOKEN.' 
        : axiosErr?.message || 'Flipkart API request failed';

      return {
        retailer: { id: this.id, name: this.name, country: this.country, currency: this.currency, enabled: this.enabled, logo: this.logo },
        offers: [],
        success: false,
        error: errorMsg,
        checkedAt: timestamp,
      };
    }
  }

  /**
   * Lookup a single product by Flipkart Product ID / FSN.
   * Endpoint: /affiliate/1.0/product.json?id={id}
   */
  async lookupProduct(productId: string): Promise<FlipkartProductItem | null> {
    const affiliateId = process.env.FLIPKART_AFFILIATE_ID;
    const affiliateToken = process.env.FLIPKART_AFFILIATE_TOKEN;
    if (!affiliateId || !affiliateToken) return null;

    const baseUrl = process.env.FLIPKART_AFFILIATE_BASE_URL || 'https://affiliate-api.flipkart.net';
    const url = `${baseUrl.replace(/\/$/, '')}/affiliate/1.0/product.json?id=${encodeURIComponent(productId)}`;

    try {
      const { data } = await axios.get(url, {
        headers: {
          'Fk-Affiliate-Id': affiliateId,
          'Fk-Affiliate-Token': affiliateToken,
          'Accept': 'application/json',
        },
        timeout: 8000,
      });
      return data;
    } catch {
      return null;
    }
  }

  /**
   * Get category feed listing URLs for bulk catalog sync.
   * Endpoint: /affiliate/api/{affiliate-id}.json
   */
  async getCategoryFeeds(): Promise<Record<string, unknown> | null> {
    const affiliateId = process.env.FLIPKART_AFFILIATE_ID;
    const affiliateToken = process.env.FLIPKART_AFFILIATE_TOKEN;
    if (!affiliateId || !affiliateToken) return null;

    const baseUrl = process.env.FLIPKART_AFFILIATE_BASE_URL || 'https://affiliate-api.flipkart.net';
    const url = `${baseUrl.replace(/\/$/, '')}/affiliate/api/${encodeURIComponent(affiliateId)}.json`;

    try {
      const { data } = await axios.get(url, {
        headers: {
          'Fk-Affiliate-Id': affiliateId,
          'Fk-Affiliate-Token': affiliateToken,
          'Accept': 'application/json',
        },
        timeout: 8000,
      });
      return data;
    } catch {
      return null;
    }
  }
}

export const flipkartAdapter = new FlipkartAdapter();
