import { getAffiliateConfigByNetwork, AffiliateNetworkType } from './affiliateConfig';
import { validateAffiliateUrl, LinkValidationResult } from './affiliateValidation';
import { AffiliateSourceContext } from './affiliateAnalytics';

export interface FlipkartProductTarget {
  url?: string;
  productId?: string;
  pid?: string;
  title?: string;
}

/**
 * Builds an official Flipkart deep-link affiliate URL.
 * Uses Flipkart's supported mobile deep-link format and context tracking parameters.
 */
export function buildFlipkartAffiliateUrl(
  product: FlipkartProductTarget,
  trackingContext: AffiliateSourceContext = 'GEN_G_STORE',
  isMobile: boolean = false
): string {
  const config = getAffiliateConfigByNetwork('FLIPKART');
  const affid = config.affiliateId || 'pajonline';
  const pid = product.pid || product.productId || '';
  const rawUrl = product.url || `https://www.flipkart.com/search?q=${encodeURIComponent(product.title || 'flipkart')}`;

  if (!process.env.FLIPKART_AFFILIATE_ID) {
    return rawUrl;
  }

  if (isMobile && pid) {
    // Official Flipkart Mobile Deep-Link format
    return `https://dl.flipkart.com/dl/product?pid=${encodeURIComponent(pid)}&affid=${encodeURIComponent(affid)}&subid=${encodeURIComponent(trackingContext.toLowerCase())}`;
  }

  try {
    const urlObj = new URL(rawUrl);
    urlObj.searchParams.set('affid', affid);
    urlObj.searchParams.set('affExtParam1', trackingContext);
    return urlObj.toString();
  } catch {
    const separator = rawUrl.includes('?') ? '&' : '?';
    return `${rawUrl}${separator}affid=${encodeURIComponent(affid)}&affExtParam1=${encodeURIComponent(trackingContext)}`;
  }
}

/**
 * Builds an outbound affiliate link for a given retailer URL using central server configuration.
 */
export function buildAffiliateUrl(
  rawUrl: string,
  storeName: string = '',
  trackingContext: AffiliateSourceContext = 'SEARCH',
  isMobileApp: boolean = false
): string {
  if (!rawUrl || !rawUrl.startsWith('http')) {
    return rawUrl;
  }

  const lowerUrl = rawUrl.toLowerCase();
  const lowerStore = storeName.toLowerCase();

  // 1. AMAZON AFFILIATE LINK
  if (lowerUrl.includes('amazon.') || lowerStore.includes('amazon')) {
    const config = getAffiliateConfigByNetwork('AMAZON');
    
    // Check mobile app compliance gate if on mobile app
    if (isMobileApp && config.status === 'AMAZON_AFFILIATE_MOBILE_APPROVAL_REQUIRED') {
      console.warn('[AffiliateEngine] Amazon Mobile App Approval Gate active. Serving raw destination URL.');
      return rawUrl;
    }

    const tag = process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG || process.env.AMAZON_ASSOCIATE_TAG;
    if (!tag) {
      return rawUrl;
    }
    try {
      const urlObj = new URL(rawUrl);
      urlObj.searchParams.set('tag', tag);
      if (trackingContext) {
        urlObj.searchParams.set('ascsubtag', `bw_${trackingContext.toLowerCase()}`);
      }
      return urlObj.toString();
    } catch {
      const separator = rawUrl.includes('?') ? '&' : '?';
      return `${rawUrl}${separator}tag=${encodeURIComponent(tag)}`;
    }
  }

  // 2. FLIPKART AFFILIATE LINK
  if (lowerUrl.includes('flipkart.') || lowerStore.includes('flipkart')) {
    return buildFlipkartAffiliateUrl({ url: rawUrl }, trackingContext, isMobileApp);
  }

  // 3. MEESHO AFFILIATE LINK
  if (lowerUrl.includes('meesho.') || lowerStore.includes('meesho')) {
    const config = getAffiliateConfigByNetwork('MEESHO');
    const affId = config.affiliateId || 'geng_store';
    try {
      const urlObj = new URL(rawUrl);
      urlObj.searchParams.set('affId', affId);
      urlObj.searchParams.set('utm_source', `buywise_${trackingContext.toLowerCase()}`);
      return urlObj.toString();
    } catch {
      const separator = rawUrl.includes('?') ? '&' : '?';
      return `${rawUrl}${separator}affId=${encodeURIComponent(affId)}&utm_source=buywise_${trackingContext.toLowerCase()}`;
    }
  }

  // 4. MYNTRA / AJIO via Cuelinks if publisher ID exists
  if (lowerUrl.includes('myntra.') || lowerStore.includes('myntra')) {
    const config = getAffiliateConfigByNetwork('MYNTRA');
    if (config.affiliateId && config.enabled) {
      return `https://www.cuelinks.com/link?pub_id=${config.affiliateId}&url=${encodeURIComponent(rawUrl)}`;
    }
  }

  if (lowerUrl.includes('ajio.') || lowerStore.includes('ajio')) {
    const config = getAffiliateConfigByNetwork('AJIO');
    if (config.affiliateId && config.enabled) {
      return `https://www.cuelinks.com/link?pub_id=${config.affiliateId}&url=${encodeURIComponent(rawUrl)}`;
    }
  }

  return rawUrl;
}

/**
 * Validates any generated affiliate link before presenting to user.
 */
export function verifyAffiliateLink(url: string, network: AffiliateNetworkType): LinkValidationResult {
  return validateAffiliateUrl(url, network);
}

/**
 * Generates the full BuyWise Gen G Store Shareable Landing Page Link for a product.
 */
export function generateBuyWiseShareUrl(slugOrId: string, origin?: string): string {
  const baseUrl = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://buywise.ai');
  return `${baseUrl}/product/${encodeURIComponent(slugOrId)}`;
}

/**
 * Generates a dynamic BuyWise Gen G Store link for external product URL.
 */
export function generateBuyWiseDynamicUrl(externalUrl: string, origin?: string): string {
  const baseUrl = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://buywise.ai');
  return `${baseUrl}/product?url=${encodeURIComponent(externalUrl)}`;
}
