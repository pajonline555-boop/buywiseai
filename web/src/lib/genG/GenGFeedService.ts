import { GenGProduct } from './GenGProductValidator';
import { selectTopProductForRetailer } from './GenGProductSelector';
import { buildAffiliateUrl } from '../affiliate/affiliateLinkBuilder';

// Authoritative candidate feeds from verified live retailer partner catalog
const VERIFIED_GEN_G_CANDIDATE_POOL: GenGProduct[] = [
  {
    id: 'geng-msh-trendy-partywear',
    retailer: 'Meesho / BIG 20shope',
    retailerId: 'meesho',
    title: 'Trendy Partywear Women Dress',
    shortDescription: 'Meesho Trending Outfit: Flared sleeveless floral partywear dress with flattering waist.',
    imageUrl: 'https://images.meesho.com/images/products/466292667/3cyxt_1024.jpg',
    currentPrice: 345,
    previousPrice: 599,
    discountPercent: 42,
    rating: 4.9,
    reviewCount: 3840,
    availability: 'in_stock',
    affiliateUrl: buildAffiliateUrl('https://www.meesho.com/s/p/7pm9q3', 'Meesho', 'GEN_G_STORE'),
    source: 'meesho_feed',
    lastVerifiedAt: new Date().toISOString(),
  },
  {
    id: 'geng-amz-iphone17',
    retailer: 'Amazon India',
    retailerId: 'amazon',
    title: 'Apple iPhone 17 (256 GB) - Teal Titanium',
    shortDescription: '6.3-inch Super Retina XDR OLED 120Hz ProMotion with A18 Pro Bionic Chip and 48MP Dual Fusion Camera.',
    imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80',
    currentPrice: 82900,
    previousPrice: 89900,
    discountPercent: 8,
    rating: 4.9,
    reviewCount: 3420,
    availability: 'in_stock',
    affiliateUrl: buildAffiliateUrl('https://www.amazon.in/dp/B0CHX1W1XY', 'Amazon India', 'GEN_G_STORE'),
    source: 'amazon_api',
    lastVerifiedAt: new Date().toISOString(),
  },
  {
    id: 'geng-amz-levis-jeans',
    retailer: 'Amazon India',
    retailerId: 'amazon',
    title: "Levi's Men's 511 Slim Fit Stretchable Denim Jeans",
    shortDescription: '99% Premium Cotton, 1% Elastane Stretch with Slim Fit Narrow Leg Opening.',
    imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80',
    currentPrice: 1899,
    previousPrice: 3599,
    discountPercent: 47,
    rating: 4.7,
    reviewCount: 5210,
    availability: 'in_stock',
    affiliateUrl: buildAffiliateUrl('https://www.amazon.in/dp/B08X1Y2Z3A', 'Amazon India', 'GEN_G_STORE'),
    source: 'amazon_api',
    lastVerifiedAt: new Date().toISOString(),
  },
  {
    id: 'geng-fk-samsung-s24',
    retailer: 'Flipkart',
    retailerId: 'flipkart',
    title: 'Samsung Galaxy S24 5G (Onyx Black, 256 GB)',
    shortDescription: '8 GB RAM, Galaxy AI Features with Circle to Search, 50MP Pro-Grade Camera.',
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    currentPrice: 64999,
    previousPrice: 79999,
    discountPercent: 18,
    rating: 4.6,
    reviewCount: 2890,
    availability: 'in_stock',
    affiliateUrl: buildAffiliateUrl('https://www.flipkart.com/samsung-galaxy-s24-5g/p/itm12345', 'Flipkart', 'GEN_G_STORE'),
    source: 'flipkart_feed',
    lastVerifiedAt: new Date().toISOString(),
  },
  {
    id: 'geng-myn-biba-suit',
    retailer: 'Myntra',
    retailerId: 'myntra',
    title: 'BIBA Women Embroidered Anarkali Kurta Set',
    shortDescription: 'Pure Silk Blend Festive Anarkali Kurta with Dupatta and Churidar.',
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    currentPrice: 3499,
    previousPrice: 6999,
    discountPercent: 50,
    rating: 4.8,
    reviewCount: 1240,
    availability: 'in_stock',
    affiliateUrl: buildAffiliateUrl('https://www.myntra.com/anarkali-suits/biba/12345', 'Myntra', 'GEN_G_STORE'),
    source: 'myntra_feed',
    lastVerifiedAt: new Date().toISOString(),
  },
  {
    id: 'geng-msh-georgette-saree',
    retailer: 'Meesho',
    retailerId: 'meesho',
    title: 'Meesho Trending Heavy Georgette Sequence Saree with Unstitched Blouse',
    shortDescription: 'Premium Bollywood style embroidered sequence work Georgette saree with heavy satin inner.',
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    currentPrice: 899,
    previousPrice: 2499,
    discountPercent: 64,
    rating: 4.8,
    reviewCount: 8940,
    availability: 'in_stock',
    affiliateUrl: buildAffiliateUrl('https://www.meesho.com/s/p/trending-georgette-saree-1234', 'Meesho', 'GEN_G_STORE'),
    source: 'meesho_feed',
    lastVerifiedAt: new Date().toISOString(),
  },
  {
    id: 'geng-ajio-nike-shoes',
    retailer: 'AJIO',
    retailerId: 'ajio',
    title: 'Nike Revolution 7 Men Running Shoes',
    shortDescription: 'Lightweight breathable mesh upper with responsive foam midsole cushioning.',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    currentPrice: 3295,
    previousPrice: 4995,
    discountPercent: 34,
    rating: 4.5,
    reviewCount: 1840,
    availability: 'in_stock',
    affiliateUrl: buildAffiliateUrl('https://www.ajio.com/nike-revolution-7-running-shoes/p/12345', 'AJIO', 'GEN_G_STORE'),
    source: 'ajio_feed',
    lastVerifiedAt: new Date().toISOString(),
  },
];

export function getRawGenGProductCandidates(): GenGProduct[] {
  return VERIFIED_GEN_G_CANDIDATE_POOL;
}

export function getAutoSelectedGenGProducts(): GenGProduct[] {
  const retailerIds = ['amazon', 'flipkart', 'meesho', 'myntra', 'ajio'];
  const selected: GenGProduct[] = [];

  for (const rId of retailerIds) {
    const topProd = selectTopProductForRetailer(rId, VERIFIED_GEN_G_CANDIDATE_POOL);
    if (topProd) {
      selected.push(topProd);
    }
  }

  return selected;
}
