import { getAffiliateConfigs, AffiliateNetworkType } from './affiliateConfig';

export interface LinkValidationResult {
  isValid: boolean;
  network: AffiliateNetworkType;
  originalUrl: string;
  affiliateUrl: string;
  reason?: string;
}

const ALLOWED_DOMAINS: Record<string, AffiliateNetworkType> = {
  'amazon.in': 'AMAZON',
  'amazon.com': 'AMAZON',
  'amzn.to': 'AMAZON',
  'flipkart.com': 'FLIPKART',
  'fkrt.it': 'FLIPKART',
  'meesho.com': 'MEESHO',
  'ebay.com': 'EBAY',
  'ebay.in': 'EBAY',
  'ajio.com': 'AJIO',
  'myntra.com': 'MYNTRA',
  'cuelinks.com': 'OTHER',
};

/**
 * Validates a generated affiliate URL ensuring domain safety and expected tag presence.
 */
export function validateAffiliateUrl(url: string, network: AffiliateNetworkType): LinkValidationResult {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return {
      isValid: false,
      network,
      originalUrl: url,
      affiliateUrl: url,
      reason: 'Invalid URL scheme or format',
    };
  }

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');

    // 1. Domain verification
    const matchedDomain = Object.keys(ALLOWED_DOMAINS).find((d) => hostname.endsWith(d));
    if (!matchedDomain) {
      return {
        isValid: false,
        network,
        originalUrl: url,
        affiliateUrl: url,
        reason: `Domain ${hostname} is not an authorized retailer domain`,
      };
    }

    // 2. Tag presence validation for Amazon & Flipkart
    if (network === 'AMAZON') {
      const hasTag = parsed.searchParams.has('tag') || url.includes('tag=');
      if (!hasTag) {
        return {
          isValid: false,
          network,
          originalUrl: url,
          affiliateUrl: url,
          reason: 'Amazon URL missing associate tag parameter',
        };
      }
    }

    if (network === 'FLIPKART') {
      const hasAffId = parsed.searchParams.has('affid') || url.includes('affid=');
      if (!hasAffId) {
        return {
          isValid: false,
          network,
          originalUrl: url,
          affiliateUrl: url,
          reason: 'Flipkart URL missing affid parameter',
        };
      }
    }

    return {
      isValid: true,
      network,
      originalUrl: url,
      affiliateUrl: url,
    };
  } catch (err: any) {
    return {
      isValid: false,
      network,
      originalUrl: url,
      affiliateUrl: url,
      reason: err?.message || 'Malformed URL format',
    };
  }
}
