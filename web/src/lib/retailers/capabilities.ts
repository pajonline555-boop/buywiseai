export type ConnectionStatus = 
  | 'LIVE'
  | 'CONFIGURED'
  | 'CREDENTIALS_REQUIRED'
  | 'MOCK'
  | 'BLOCKED'
  | 'DISABLED'
  | 'RESTRICTED_INDIA';

export interface SupportedFields {
  price: boolean;
  rating: boolean;
  reviewCount: boolean;
  availability: boolean;
  sellerInfo: boolean;
  returnPolicy: boolean;
}

export interface RetailerCapability {
  id: string;
  name: string;
  enabled: boolean;
  configured: boolean;
  connectionStatus: ConnectionStatus;
  primaryMethod: 'official_api' | 'affiliate_feed' | 'scraper' | 'mock' | 'disabled';
  supportedFields: SupportedFields;
}

export function getRetailerCapabilities(): RetailerCapability[] {
  const isAmazonConfigured = Boolean(
    process.env.AMAZON_PAAPI_KEY &&
    process.env.AMAZON_PAAPI_SECRET &&
    process.env.AMAZON_ASSOCIATE_TAG
  );

  const isFlipkartConfigured = Boolean(
    process.env.FLIPKART_AFFILIATE_ID &&
    process.env.FLIPKART_AFFILIATE_TOKEN
  );

  const isEbayConfigured = Boolean(
    process.env.EBAY_CLIENT_ID &&
    process.env.EBAY_CLIENT_SECRET
  );

  const isCuelinksConfigured = Boolean(process.env.CUELINKS_API_KEY);
  const isVCommissionConfigured = Boolean(process.env.VCOMMISSION_API_KEY);

  return [
    {
      id: 'partner',
      name: 'BuyWise Partner Store',
      enabled: true,
      configured: true,
      connectionStatus: 'LIVE',
      primaryMethod: 'official_api',
      supportedFields: {
        price: true,
        rating: true,
        reviewCount: true,
        availability: true,
        sellerInfo: true,
        returnPolicy: true,
      },
    },
    {
      id: 'amazon',
      name: 'Amazon India',
      enabled: true,
      configured: isAmazonConfigured,
      connectionStatus: isAmazonConfigured ? 'LIVE' : 'CREDENTIALS_REQUIRED',
      primaryMethod: 'official_api',
      supportedFields: {
        price: true,
        rating: true,
        reviewCount: true,
        availability: true,
        sellerInfo: true,
        returnPolicy: true,
      },
    },
    {
      id: 'flipkart',
      name: 'Flipkart',
      enabled: true,
      configured: isFlipkartConfigured,
      connectionStatus: isFlipkartConfigured ? 'LIVE' : 'CREDENTIALS_REQUIRED',
      primaryMethod: 'affiliate_feed',
      supportedFields: {
        price: true,
        rating: false,
        reviewCount: false,
        availability: true,
        sellerInfo: true,
        returnPolicy: true,
      },
    },
    {
      id: 'meesho',
      name: 'Meesho',
      enabled: true,
      configured: false,
      connectionStatus: 'CREDENTIALS_REQUIRED',
      primaryMethod: 'affiliate_feed',
      supportedFields: {
        price: true,
        rating: true,
        reviewCount: true,
        availability: true,
        sellerInfo: true,
        returnPolicy: true,
      },
    },
    {
      id: 'myntra',
      name: 'Myntra',
      enabled: true,
      configured: false,
      connectionStatus: 'CREDENTIALS_REQUIRED',
      primaryMethod: 'affiliate_feed',
      supportedFields: {
        price: true,
        rating: true,
        reviewCount: true,
        availability: true,
        sellerInfo: true,
        returnPolicy: true,
      },
    },
    {
      id: 'nykaa',
      name: 'Nykaa',
      enabled: true,
      configured: false,
      connectionStatus: 'CREDENTIALS_REQUIRED',
      primaryMethod: 'affiliate_feed',
      supportedFields: {
        price: true,
        rating: true,
        reviewCount: true,
        availability: true,
        sellerInfo: true,
        returnPolicy: true,
      },
    },
    {
      id: 'ajio',
      name: 'AJIO',
      enabled: true,
      configured: false,
      connectionStatus: 'CREDENTIALS_REQUIRED',
      primaryMethod: 'affiliate_feed',
      supportedFields: {
        price: true,
        rating: true,
        reviewCount: true,
        availability: true,
        sellerInfo: true,
        returnPolicy: true,
      },
    },
    {
      id: 'tatacliq',
      name: 'Tata CLiQ',
      enabled: true,
      configured: false,
      connectionStatus: 'CREDENTIALS_REQUIRED',
      primaryMethod: 'affiliate_feed',
      supportedFields: {
        price: true,
        rating: true,
        reviewCount: true,
        availability: true,
        sellerInfo: true,
        returnPolicy: true,
      },
    },
    {
      id: 'etsy',
      name: 'Etsy',
      enabled: true,
      configured: false,
      connectionStatus: 'CREDENTIALS_REQUIRED',
      primaryMethod: 'affiliate_feed',
      supportedFields: {
        price: true,
        rating: true,
        reviewCount: true,
        availability: true,
        sellerInfo: true,
        returnPolicy: true,
      },
    },
    {
      id: 'cuelinks',
      name: 'Cuelinks Network',
      enabled: true,
      configured: isCuelinksConfigured,
      connectionStatus: isCuelinksConfigured ? 'LIVE' : 'CREDENTIALS_REQUIRED',
      primaryMethod: 'affiliate_feed',
      supportedFields: {
        price: true,
        rating: true,
        reviewCount: true,
        availability: true,
        sellerInfo: true,
        returnPolicy: true,
      },
    },
    {
      id: 'vcommission',
      name: 'vCommission Network',
      enabled: true,
      configured: isVCommissionConfigured,
      connectionStatus: isVCommissionConfigured ? 'LIVE' : 'CREDENTIALS_REQUIRED',
      primaryMethod: 'affiliate_feed',
      supportedFields: {
        price: true,
        rating: true,
        reviewCount: true,
        availability: true,
        sellerInfo: true,
        returnPolicy: true,
      },
    },
    {
      id: 'ebay',
      name: 'eBay',
      enabled: true,
      configured: isEbayConfigured,
      connectionStatus: isEbayConfigured ? 'LIVE' : 'CREDENTIALS_REQUIRED',
      primaryMethod: 'official_api',
      supportedFields: {
        price: true,
        rating: true,
        reviewCount: false,
        availability: true,
        sellerInfo: true,
        returnPolicy: false,
      },
    },
    {
      id: 'walmart',
      name: 'Walmart',
      enabled: true,
      configured: false,
      connectionStatus: 'CREDENTIALS_REQUIRED',
      primaryMethod: 'affiliate_feed',
      supportedFields: {
        price: true,
        rating: false,
        reviewCount: false,
        availability: true,
        sellerInfo: false,
        returnPolicy: false,
      },
    },
    {
      id: 'alibaba',
      name: 'Alibaba',
      enabled: false,
      configured: false,
      connectionStatus: 'RESTRICTED_INDIA',
      primaryMethod: 'disabled',
      supportedFields: {
        price: false,
        rating: false,
        reviewCount: false,
        availability: false,
        sellerInfo: false,
        returnPolicy: false,
      },
    },
  ];
}

export function getRetailerCapabilityById(id: string): RetailerCapability | undefined {
  return getRetailerCapabilities().find((r) => r.id.toLowerCase() === id.toLowerCase());
}
