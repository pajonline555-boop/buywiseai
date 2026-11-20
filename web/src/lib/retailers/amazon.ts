import { RetailerAdapter, RetailerSearchResult, StoreOffer } from './types';
import { generateAmazonPAAPIHeaders } from './amazon-auth';
import axios from 'axios';

export interface AmazonCreatorsItem {
  asin?: string;
  detailPageURL?: string;
  itemInfo?: {
    asin?: string;
    title?: { displayValue?: string };
    byLineInfo?: { brand?: { displayValue?: string } };
  };
  offersV2?: {
    listings?: Array<{
      price?: { amount?: number; currency?: string };
      savingBasis?: { amount?: number };
      availability?: { message?: string };
    }>;
  };
  offers?: {
    listings?: Array<{
      price?: { amount?: number; currency?: string };
      savingBasis?: { amount?: number };
      availability?: { message?: string };
    }>;
  };
  images?: {
    primary?: { large?: { url?: string }; url?: string };
    variants?: Array<{ large?: { url?: string }; url?: string }>;
  };
  variationSummary?: {
    variationDimensions?: Array<{
      name?: string;
      values?: string[];
    }>;
  };
  customerReviews?: {
    starRating?: { value?: string };
    count?: string;
  };
}

export interface AmazonPaApiItem {
  ASIN?: string;
  DetailPageURL?: string;
  ItemInfo?: {
    Title?: { DisplayValue?: string };
    ByLineInfo?: { Brand?: { DisplayValue?: string } };
  };
  Offers?: {
    Listings?: Array<{
      Price?: { Amount?: number; Currency?: string };
      SavingBasis?: { Amount?: number };
      Availability?: { Message?: string };
    }>;
  };
  Images?: {
    Primary?: { Large?: { URL?: string } };
    Variants?: Array<{ Large?: { URL?: string } }>;
  };
  CustomerReviews?: {
    StarRating?: { Value?: string };
    Count?: string;
  };
}

export interface RetailerConnectionVerification {
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
  eligibilityPrerequisite?: string;
}

// In-memory token cache for Login with Amazon (LWA) OAuth 2.0
interface LwaTokenCache {
  accessToken: string;
  expiresAt: number; // Unix ms
}

let cachedLwaToken: LwaTokenCache | null = null;

/**
 * Generates or retrieves a cached OAuth 2.0 access token via Login with Amazon (LWA).
 * Official Endpoint: https://api.amazon.com/auth/o2/token
 */
async function getLwaAccessToken(): Promise<{ token: string | null; error?: string }> {
  // 1. Direct bearer token override (if configured for manual testing)
  const manualToken = process.env.AMAZON_CREATORS_ACCESS_TOKEN;
  if (manualToken && !process.env.AMAZON_CREATORS_CLIENT_ID) {
    return { token: manualToken };
  }

  // 2. Return cached token if still valid (with 60-second safety buffer)
  if (cachedLwaToken && Date.now() < cachedLwaToken.expiresAt) {
    return { token: cachedLwaToken.accessToken };
  }

  const clientId = process.env.AMAZON_CREATORS_CLIENT_ID;
  const clientSecret = process.env.AMAZON_CREATORS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    if (manualToken) return { token: manualToken };
    return { token: null, error: 'AMAZON_CREATORS_CLIENT_ID and AMAZON_CREATORS_CLIENT_SECRET not configured.' };
  }

  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('scope', 'creatorsapi');

    const response = await axios.post('https://api.amazon.com/auth/o2/token', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 8000,
    });

    const data = response.data;
    if (data?.access_token) {
      const expiresInSec = typeof data.expires_in === 'number' ? data.expires_in : 3600;
      cachedLwaToken = {
        accessToken: data.access_token,
        expiresAt: Date.now() + Math.max(0, expiresInSec - 60) * 1000,
      };
      return { token: data.access_token };
    }

    return { token: null, error: 'Login with Amazon response did not return an access_token.' };
  } catch (err: unknown) {
    const axiosErr = err as { response?: { status?: number; data?: { error_description?: string; error?: string } }; message?: string };
    const safeError = axiosErr?.response?.data?.error_description || axiosErr?.response?.data?.error || axiosErr?.message || 'LWA OAuth token request failed.';
    return { token: null, error: safeError };
  }
}

export function sanitizeSearchQuery(query: string): string {
  let cleaned = query.trim().replace(/\s+/g, ' ');
  cleaned = cleaned.replace(/\bi\s*phone\b/gi, 'iPhone');
  cleaned = cleaned.replace(/\bi\s*pad\b/gi, 'iPad');
  cleaned = cleaned.replace(/\bmac\s*book\b/gi, 'MacBook');
  return cleaned;
}

export class AmazonAdapter implements RetailerAdapter {
  readonly id = 'amazon';
  readonly name = 'Amazon India';
  readonly country = 'IN';
  readonly currency = 'INR';
  readonly enabled = true;
  readonly logo = 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg';

  /**
   * Performs real multi-step connection verification against Amazon Creators API.
   * Tests: Configuration -> LWA OAuth Auth -> API Reachability -> Real Product Return.
   */
  async verifyConnection(testQuery = 'kurta'): Promise<RetailerConnectionVerification> {
    const partnerTag = process.env.AMAZON_ASSOCIATE_TAG || 'pajonline-21';
    const hasClientId = Boolean(process.env.AMAZON_CREATORS_CLIENT_ID);
    const hasClientSecret = Boolean(process.env.AMAZON_CREATORS_CLIENT_SECRET);
    const hasManualToken = Boolean(process.env.AMAZON_CREATORS_ACCESS_TOKEN);
    const isConfigured = (hasClientId && hasClientSecret) || hasManualToken;

    const eligibilityNotice = 'Amazon Creators API Prerequisite: Active Amazon Associates account (Store ID: ' + partnerTag + ') with at least 10 qualifying referred sales within the past 30 days.';

    if (!isConfigured) {
      return {
        credentialsConfigured: false,
        authSuccess: false,
        apiReachable: false,
        realProductReturned: false,
        productCount: 0,
        safeErrorMessage: 'BLOCKED — CREDENTIALS REQUIRED: Configure AMAZON_CREATORS_CLIENT_ID and AMAZON_CREATORS_CLIENT_SECRET in web/.env.local.',
        eligibilityPrerequisite: eligibilityNotice,
      };
    }

    // Step 1: LWA OAuth Token
    const { token, error: authError } = await getLwaAccessToken();
    if (!token) {
      return {
        credentialsConfigured: true,
        authSuccess: false,
        apiReachable: false,
        realProductReturned: false,
        productCount: 0,
        safeErrorMessage: `Authentication Failed: ${authError || 'Could not obtain OAuth access token from Login with Amazon.'}`,
        eligibilityPrerequisite: eligibilityNotice,
      };
    }

    // Step 2: Live Creators API search request
    const searchRes = await this.search(testQuery);
    if (!searchRes.success) {
      return {
        credentialsConfigured: true,
        authSuccess: true,
        apiReachable: false,
        realProductReturned: false,
        productCount: 0,
        safeErrorMessage: `API Unreachable or Rejected: ${searchRes.error || 'Request to Creators API failed.'}`,
        eligibilityPrerequisite: eligibilityNotice,
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
      eligibilityPrerequisite: eligibilityNotice,
    };
  }

  async search(query: string): Promise<RetailerSearchResult> {
    const timestamp = new Date().toISOString();
    const cleanQuery = sanitizeSearchQuery(query);
    const partnerTag = process.env.AMAZON_ASSOCIATE_TAG || 'pajonline-21';

    // 1. Primary: Amazon Creators API (Official post-PA-API 5.0 standard)
    const { token: creatorsToken } = await getLwaAccessToken();
    const paApiKey = process.env.AMAZON_PAAPI_KEY;
    const paApiSecret = process.env.AMAZON_PAAPI_SECRET;

    if (creatorsToken) {
      try {
        const baseUrl = process.env.AMAZON_CREATORS_BASE_URL || 'https://creatorsapi.amazon';
        const endpoint = process.env.AMAZON_CREATORS_ENDPOINT || `${baseUrl.replace(/\/$/, '')}/v1/searchItems`;
        
        const payload = {
          keywords: cleanQuery,
          marketplace: 'www.amazon.in',
          partnerTag: partnerTag,
          itemCount: 10,
          resources: [
            'itemInfo.title',
            'itemInfo.byLineInfo',
            'itemInfo.classifications',
            'offersV2.listings.price',
            'offersV2.listings.savingBasis',
            'offersV2.listings.availability',
            'images.primary.large',
            'images.variants',
            'variationSummary.variationDimensions',
            'customerReviews',
          ],
        };

        const response = await axios.post(endpoint, payload, {
          headers: {
            'Authorization': `Bearer ${creatorsToken}`,
            'Content-Type': 'application/json',
            'x-amz-partner-tag': partnerTag,
          },
          timeout: 8000,
        });

        const items: AmazonCreatorsItem[] = response.data?.items || response.data?.searchResult?.items || [];
        const offers: StoreOffer[] = items.map((item) => {
          const listing = item.offersV2?.listings?.[0] || item.offers?.listings?.[0];
          const priceAmount = listing?.price?.amount || 0;
          const savingBasis = listing?.savingBasis?.amount || priceAmount;
          const discount = savingBasis > priceAmount ? savingBasis - priceAmount : 0;
          const rating = item.customerReviews?.starRating?.value ? parseFloat(item.customerReviews.starRating.value) : undefined;
          const reviewCount = item.customerReviews?.count ? parseInt(item.customerReviews.count, 10) : undefined;

          const asin = item.asin || item.itemInfo?.asin;
          const rawUrl = item.detailPageURL || (asin ? `https://www.amazon.in/dp/${asin}?tag=${partnerTag}` : '');
          const itemUrl = rawUrl.includes('?') ? (rawUrl.includes('tag=') ? rawUrl : `${rawUrl}&tag=${partnerTag}`) : `${rawUrl}?tag=${partnerTag}`;
          const primaryImageUrl = item.images?.primary?.large?.url || item.images?.primary?.url;
          const additionalImages: string[] = Array.isArray(item.images?.variants) 
            ? item.images.variants.map((v) => v.large?.url || v.url).filter((u): u is string => Boolean(u)) 
            : [];
          const brand = item.itemInfo?.byLineInfo?.brand?.displayValue;
          const title = item.itemInfo?.title?.displayValue || cleanQuery;

          // Variations / Sizes
          const availableSizes: string[] = [];
          const availableColors: string[] = [];
          if (Array.isArray(item.variationSummary?.variationDimensions)) {
            item.variationSummary.variationDimensions.forEach((dim) => {
              if (dim.name?.toLowerCase().includes('size') && Array.isArray(dim.values)) {
                availableSizes.push(...dim.values);
              }
              if (dim.name?.toLowerCase().includes('color') && Array.isArray(dim.values)) {
                availableColors.push(...dim.values);
              }
            });
          }

          return {
            id: `amz-${asin || Date.now()}`,
            retailerId: this.id,
            store: this.name,
            title,
            url: itemUrl,
            directProductUrl: itemUrl,
            affiliateUrl: itemUrl,
            isDirectProductLink: Boolean(asin),
            price: priceAmount,
            currency: listing?.price?.currency || this.currency,
            originalPrice: savingBasis,
            mrp: savingBasis,
            discount,
            imageUrl: primaryImageUrl,
            additionalImages: additionalImages.length > 0 ? additionalImages : undefined,
            availableSizes: availableSizes.length > 0 ? availableSizes : undefined,
            availableColors: availableColors.length > 0 ? availableColors : undefined,
            logo: this.logo,
            rating,
            reviewCount,
            availability: listing?.availability?.message?.toLowerCase().includes('in stock') ? 'in_stock' : 'unknown',
            checkedAt: timestamp,
            sourceType: 'api',
            verificationStatus: 'verified_live',
            brand,
            productId: asin,
            listedPrice: priceAmount,
            shippingFee: 0,
            effectivePayablePrice: priceAmount,
            priceBasis: 'listed',
            dataFreshness: 'Live Amazon Creators API Feed',
            provenance: {
              source: 'api',
              provider: 'Amazon India Creators API (2026)',
              rawListingId: asin,
              lastChecked: timestamp,
              isLiveFeed: true,
            },
            imageProvenance: {
              url: primaryImageUrl || '',
              isGenuineProductImage: Boolean(primaryImageUrl),
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
      } catch (cErr: unknown) {
        const axiosErr = cErr as { response?: { status?: number; data?: { message?: string; errors?: Array<{ message?: string }> } }; message?: string };
        const msg = axiosErr?.response?.data?.message || axiosErr?.response?.data?.errors?.[0]?.message || axiosErr?.message || 'Creators API request failed.';
        return {
          retailer: { id: this.id, name: this.name, country: this.country, currency: this.currency, enabled: this.enabled, logo: this.logo },
          offers: [],
          success: false,
          error: `Amazon Creators API Error: ${msg}`,
          checkedAt: timestamp,
        };
      }
    }

    // 2. Secondary / Legacy: PA-API 5.0 (with deprecation notice)
    if (!paApiKey || !paApiSecret) {
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
        error: 'Amazon India Creators API credentials required (AMAZON_CREATORS_CLIENT_ID / AMAZON_CREATORS_CLIENT_SECRET). Note: Older PA-API 5.0 was officially deprecated on May 15, 2026.',
        checkedAt: timestamp,
      };
    }

    try {
      const payload = {
        Keywords: cleanQuery,
        Resources: [
          'ItemInfo.Title',
          'ItemInfo.ByLineInfo',
          'ItemInfo.Classifications',
          'Offers.Listings.Price',
          'Offers.Listings.SavingBasis',
          'Offers.Listings.Availability.Message',
          'Images.Primary.Large',
          'Images.Variants.Large',
          'CustomerReviews.Count',
          'CustomerReviews.StarRating',
        ],
        PartnerTag: partnerTag,
        PartnerType: 'Associates',
        Marketplace: 'www.amazon.in',
      };

      const headers = generateAmazonPAAPIHeaders({ accessKey: paApiKey, secretKey: paApiSecret, partnerTag }, payload);
      const response = await axios.post('https://webservices.amazon.in/paapi5/searchitems', payload, {
        headers,
        timeout: 7000,
      });

      const searchResult = response.data?.SearchResult;
      const items: AmazonPaApiItem[] = searchResult?.Items || [];

      if (items.length === 0) {
        return {
          retailer: { id: this.id, name: this.name, country: this.country, currency: this.currency, enabled: this.enabled, logo: this.logo },
          offers: [],
          success: true,
          checkedAt: timestamp,
        };
      }

      const offers: StoreOffer[] = items.map((item) => {
        const listing = item.Offers?.Listings?.[0];
        const priceAmount = listing?.Price?.Amount || 0;
        const savingBasis = listing?.SavingBasis?.Amount || priceAmount;
        const discount = savingBasis > priceAmount ? savingBasis - priceAmount : 0;
        const rating = item.CustomerReviews?.StarRating?.Value ? parseFloat(item.CustomerReviews.StarRating.Value) : undefined;
        const reviewCount = item.CustomerReviews?.Count ? parseInt(item.CustomerReviews.Count, 10) : undefined;

        const rawUrl = item.DetailPageURL || `https://www.amazon.in/dp/${item.ASIN}?tag=${partnerTag}`;
        const itemUrl = rawUrl.includes('?') ? (rawUrl.includes('tag=') ? rawUrl : `${rawUrl}&tag=${partnerTag}`) : `${rawUrl}?tag=${partnerTag}`;
        const imageUrl = item.Images?.Primary?.Large?.URL;
        const additionalImages: string[] = Array.isArray(item.Images?.Variants)
          ? item.Images.Variants.map((v) => v.Large?.URL).filter((u): u is string => Boolean(u))
          : [];
        const brand = item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue;
        const title = item.ItemInfo?.Title?.DisplayValue || cleanQuery;

        return {
          id: `amz-${item.ASIN || Date.now()}`,
          retailerId: this.id,
          store: this.name,
          title,
          url: itemUrl,
          directProductUrl: itemUrl,
          affiliateUrl: itemUrl,
          isDirectProductLink: Boolean(item.ASIN),
          price: priceAmount,
          currency: listing?.Price?.Currency || this.currency,
          originalPrice: savingBasis,
          mrp: savingBasis,
          discount,
          imageUrl,
          additionalImages: additionalImages.length > 0 ? additionalImages : undefined,
          logo: this.logo,
          rating,
          reviewCount,
          availability: listing?.Availability?.Message?.toLowerCase().includes('in stock') ? 'in_stock' : 'unknown',
          checkedAt: timestamp,
          sourceType: 'api',
          verificationStatus: 'verified_live',
          brand,
          productId: item.ASIN,
          listedPrice: priceAmount,
          shippingFee: 0,
          effectivePayablePrice: priceAmount,
          priceBasis: 'listed',
          dataFreshness: 'Amazon Product Advertising API',
          provenance: {
            source: 'api',
            provider: 'Amazon India PA-API (Deprecated)',
            rawListingId: item.ASIN,
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
      const axiosErr = err as { response?: { status?: number; data?: { Errors?: Array<{ Message?: string }> } }; message?: string };
      const errorMsg = axiosErr?.response?.data?.Errors?.[0]?.Message || axiosErr?.message || 'Amazon API request failed';
      const isDeprecated = axiosErr?.response?.status === 410 || errorMsg.toLowerCase().includes('deprecated');

      return {
        retailer: { id: this.id, name: this.name, country: this.country, currency: this.currency, enabled: this.enabled, logo: this.logo },
        offers: [],
        success: false,
        error: isDeprecated
          ? 'Amazon India PA-API 5.0 was deprecated on May 15, 2026. Please configure Amazon Creators API credentials.'
          : errorMsg,
        checkedAt: timestamp,
      };
    }
  }
}

export const amazonAdapter = new AmazonAdapter();
