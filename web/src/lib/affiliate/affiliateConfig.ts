export type AffiliateNetworkType =
  | 'AMAZON'
  | 'FLIPKART'
  | 'MEESHO'
  | 'EBAY'
  | 'AJIO'
  | 'MYNTRA'
  | 'OTHER';

export type AffiliateStatus =
  | 'ACTIVE'
  | 'DISABLED'
  | 'AMAZON_AFFILIATE_MOBILE_APPROVAL_REQUIRED'
  | 'TEST_MODE';

export interface AffiliateNetworkConfig {
  network: AffiliateNetworkType;
  enabled: boolean;
  affiliateId: string;
  trackingId: string;
  storeId: string;
  baseDomain: string;
  mobileDeepLinkSupport: boolean;
  linkFormat: string;
  status: AffiliateStatus;
  lastUpdatedAt: string;
}

const DEFAULT_AFFILIATE_NETWORKS: Record<AffiliateNetworkType, AffiliateNetworkConfig> = {
  AMAZON: {
    network: 'AMAZON',
    enabled: true,
    affiliateId: process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG || 'pajonline-21',
    trackingId: 'pajonline-21',
    storeId: 'pajonline-21',
    baseDomain: 'amazon.in',
    mobileDeepLinkSupport: true,
    linkFormat: 'https://www.amazon.in/dp/{ASIN}?tag={tag}',
    // Compliance Gate for Amazon Mobile App Approval
    status: process.env.AMAZON_MOBILE_APP_APPROVED === 'true' ? 'ACTIVE' : 'AMAZON_AFFILIATE_MOBILE_APPROVAL_REQUIRED',
    lastUpdatedAt: new Date().toISOString(),
  },
  FLIPKART: {
    network: 'FLIPKART',
    enabled: true,
    affiliateId: process.env.FLIPKART_AFFILIATE_ID || 'pajonline',
    trackingId: 'pajonline',
    storeId: 'pajonline',
    baseDomain: 'flipkart.com',
    mobileDeepLinkSupport: true,
    linkFormat: 'https://dl.flipkart.com/dl/product?pid={PID}&affid={affid}&subid={subid}',
    status: 'ACTIVE',
    lastUpdatedAt: new Date().toISOString(),
  },
  MEESHO: {
    network: 'MEESHO',
    enabled: true,
    affiliateId: process.env.NEXT_PUBLIC_MEESHO_AFFILIATE_ID || 'geng_store',
    trackingId: 'geng_store',
    storeId: 'geng_store',
    baseDomain: 'meesho.com',
    mobileDeepLinkSupport: false,
    linkFormat: '{url}?affId={affId}&utm_source={subid}',
    status: 'ACTIVE',
    lastUpdatedAt: new Date().toISOString(),
  },
  EBAY: {
    network: 'EBAY',
    enabled: true,
    affiliateId: process.env.EBAY_CAMPAIGN_ID || '',
    trackingId: process.env.EBAY_CUSTOM_ID || '',
    storeId: '',
    baseDomain: 'ebay.com',
    mobileDeepLinkSupport: true,
    linkFormat: '{url}',
    status: 'ACTIVE',
    lastUpdatedAt: new Date().toISOString(),
  },
  AJIO: {
    network: 'AJIO',
    enabled: true,
    affiliateId: process.env.NEXT_PUBLIC_CUELINKS_PUBLISHER_ID || 'cuelinks_ajio',
    trackingId: 'ajio_geng',
    storeId: '',
    baseDomain: 'ajio.com',
    mobileDeepLinkSupport: true,
    linkFormat: 'https://www.cuelinks.com/link?pub_id={pub_id}&url={url}',
    status: 'ACTIVE',
    lastUpdatedAt: new Date().toISOString(),
  },
  MYNTRA: {
    network: 'MYNTRA',
    enabled: true,
    affiliateId: process.env.NEXT_PUBLIC_CUELINKS_PUBLISHER_ID || 'cuelinks_myntra',
    trackingId: 'myntra_geng',
    storeId: '',
    baseDomain: 'myntra.com',
    mobileDeepLinkSupport: true,
    linkFormat: 'https://www.cuelinks.com/link?pub_id={pub_id}&url={url}',
    status: 'ACTIVE',
    lastUpdatedAt: new Date().toISOString(),
  },
  OTHER: {
    network: 'OTHER',
    enabled: false,
    affiliateId: '',
    trackingId: '',
    storeId: '',
    baseDomain: '',
    mobileDeepLinkSupport: false,
    linkFormat: '{url}',
    status: 'DISABLED',
    lastUpdatedAt: new Date().toISOString(),
  },
};

let currentConfigMap: Record<AffiliateNetworkType, AffiliateNetworkConfig> = { ...DEFAULT_AFFILIATE_NETWORKS };

export function getAffiliateConfigs(): AffiliateNetworkConfig[] {
  return Object.values(currentConfigMap);
}

export function getAffiliateConfigByNetwork(network: AffiliateNetworkType): AffiliateNetworkConfig {
  return currentConfigMap[network] || DEFAULT_AFFILIATE_NETWORKS.OTHER;
}

export function updateAffiliateConfig(network: AffiliateNetworkType, updates: Partial<AffiliateNetworkConfig>): AffiliateNetworkConfig {
  const existing = getAffiliateConfigByNetwork(network);
  const updated: AffiliateNetworkConfig = {
    ...existing,
    ...updates,
    lastUpdatedAt: new Date().toISOString(),
  };
  currentConfigMap[network] = updated;
  return updated;
}
