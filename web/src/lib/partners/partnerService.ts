import { 
  Partner, 
  PartnerProduct, 
  PartnerOrder, 
  OrderStatus, 
  PartnerStatus, 
  PartnerProductStatus 
} from './types';
import { validateProductPublication } from './partnerValidation';
import { BestsellerProduct } from '../categoryData';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  setDoc,
  getDocs, 
  query, 
  where, 
  doc, 
  updateDoc, 
  deleteDoc,
  orderBy 
} from 'firebase/firestore';

// ==========================================
// LOCAL STORAGE PERSISTENCE HELPERS
// ==========================================
const OVERRIDES_KEY = 'BUYWISE_PRODUCT_OVERRIDES_V2';
const DELETED_IDS_KEY = 'BUYWISE_DELETED_PRODUCT_IDS_V1';

export function getDeletedProductIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DELETED_IDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveDeletedProductId(productId: string) {
  if (typeof window === 'undefined') return;
  try {
    const ids = getDeletedProductIds();
    if (!ids.includes(productId)) {
      ids.push(productId);
      localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(ids));
    }
  } catch (e) {
    console.warn('LocalStorage deleted ids notice:', e);
  }
}

export function getLocalProductOverrides(): Record<string, Partial<PartnerProduct>> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function saveLocalProductOverride(productId: string, updates: Partial<PartnerProduct>) {
  if (typeof window === 'undefined') return;
  try {
    const overrides = getLocalProductOverrides();
    overrides[productId] = { ...(overrides[productId] || {}), ...updates };
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
  } catch (e) {
    console.warn('LocalStorage save notice:', e);
  }
}

export function saveAllLocalProductOverrides(overrides: Record<string, Partial<PartnerProduct>>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
  } catch (e) {
    console.warn('LocalStorage save notice:', e);
  }
}

export function getCategoryFallbackImage(category: string, title: string = ''): string {
  const lower = title.toLowerCase();
  
  if (lower.includes('kamarbandh') || lower.includes('gujarati') || lower.includes('etietnic') || lower.includes('waistband') || lower.includes('tagdi')) {
    return '/kamarbandh.png';
  }
  if (lower.includes('louis') || lower.includes('panty') || lower.includes('panties')) {
    return 'https://m.media-amazon.com/images/I/41DSHIr6S6L._AC_SL800_.jpg';
  }
  if (lower.includes('zivame') || lower.includes('bra')) {
    return 'https://m.media-amazon.com/images/I/714AcwEJC0L._AC_SL800_.jpg';
  }
  if (lower.includes('jockey') || lower.includes('trunk')) {
    return 'https://m.media-amazon.com/images/I/61W8YLsLmSL._AC_SL800_.jpg';
  }
  if (category === 'Jewellery' || lower.includes('jewel') || lower.includes('necklace') || lower.includes('earring') || lower.includes('ring') || lower.includes('choker') || lower.includes('bangle')) {
    return 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80';
  }
  if (category === 'Undergarments & Lingerie' || lower.includes('lingerie') || lower.includes('underwear')) {
    return 'https://m.media-amazon.com/images/I/41DSHIr6S6L._AC_SL800_.jpg';
  }
  if (category === 'Mobiles & Smartphones' || lower.includes('phone') || lower.includes('mobile') || lower.includes('iphone') || lower.includes('samsung')) {
    return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80';
  }
  if (category === 'Audio & Headphones' || lower.includes('headphone') || lower.includes('earphone') || lower.includes('audio') || lower.includes('sony') || lower.includes('airpods')) {
    return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80';
  }
  if (category === 'Home & Kitchen' || lower.includes('kitchen') || lower.includes('home') || lower.includes('cooker')) {
    return 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80';
  }
  // Default Fashion & Clothing
  return 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80';
}

export function resolveCorrectProductImage(product: Partial<PartnerProduct>): string {
  const rawImage = product.primaryImage || (product.images && product.images[0]) || '';
  const title = product.title || '';
  const category = product.category || '';
  const url = product.productUrl || '';
  const lowerTitle = title.toLowerCase();
  const lowerUrl = url.toLowerCase();

  // If user pasted/uploaded a custom image data URL, always preserve it directly
  if (rawImage.startsWith('data:image/')) {
    return rawImage;
  }

  // Detect broken Amazon /images/P/ link (which returns 43-byte transparent 1x1 GIF for non-books)
  const isBrokenAmazonPImage = rawImage.includes('/images/P/') || rawImage.includes('ssl-images-amazon.com/images/P');

  // Detect generic watch placeholder if product is not a watch
  const isGenericWatchImage = rawImage.includes('photo-1523275335684-37898b6baf30');
  const isWatchProduct = lowerTitle.includes('watch') || lowerTitle.includes('smartwatch');

  // Specific high-precision product matchers
  if (lowerTitle.includes('kamarbandh') || lowerTitle.includes('gujarati') || lowerTitle.includes('etietnic') || lowerUrl.includes('kamarbandh') || lowerUrl.includes('etietnic')) {
    if (rawImage && rawImage.includes('71gxwje9wqL')) {
      return 'https://m.media-amazon.com/images/I/71gxwje9wqL._SL800_.jpg';
    }
    if (rawImage && rawImage.includes('media-amazon.com/images/I/') && !isBrokenAmazonPImage && !rawImage.includes('41-pc98WkyL')) {
      return rawImage.replace(/\._[A-Za-z0-9_\-,]+_\.(jpg|png|webp)/i, '._SL800_.$1');
    }
    return '/kamarbandh.png';
  }

  if (lowerTitle.includes('louis') || lowerTitle.includes('panty') || lowerTitle.includes('panties')) {
    if (rawImage && rawImage.includes('media-amazon.com/images/I/') && !isBrokenAmazonPImage) {
      return rawImage.replace(/\._[A-Za-z0-9_\-,]+_\.(jpg|png|webp)/i, '._SL800_.$1');
    }
    return 'https://m.media-amazon.com/images/I/41DSHIr6S6L._AC_SL800_.jpg';
  }

  if (lowerTitle.includes('zivame') || lowerTitle.includes('bra')) {
    if (rawImage && rawImage.includes('media-amazon.com/images/I/') && !isBrokenAmazonPImage) {
      return rawImage.replace(/\._[A-Za-z0-9_\-,]+_\.(jpg|png|webp)/i, '._SL800_.$1');
    }
    return 'https://m.media-amazon.com/images/I/714AcwEJC0L._AC_SL800_.jpg';
  }

  if (lowerTitle.includes('jockey') || lowerTitle.includes('trunk')) {
    if (rawImage && rawImage.includes('media-amazon.com/images/I/') && !isBrokenAmazonPImage) {
      return rawImage.replace(/\._[A-Za-z0-9_\-,]+_\.(jpg|png|webp)/i, '._SL800_.$1');
    }
    return 'https://m.media-amazon.com/images/I/61W8YLsLmSL._AC_SL800_.jpg';
  }

  // Discard broken /images/P/ transparent GIFs, missing images, or generic watch images
  if (isBrokenAmazonPImage || !rawImage || (isGenericWatchImage && !isWatchProduct)) {
    return getCategoryFallbackImage(category, title);
  }

  // Optimize Amazon image to high-resolution format
  if (rawImage.includes('media-amazon.com/images/I/')) {
    return rawImage.replace(/\._[A-Za-z0-9_\-,]+_\.(jpg|png|webp)/i, '._SL800_.$1');
  }

  return rawImage;
}

export function applyLocalOverrides(products: PartnerProduct[]): PartnerProduct[] {
  const overrides = getLocalProductOverrides();
  let overridesMutated = false;
  
  const productMap = new Map<string, PartnerProduct>();
  products.forEach(p => productMap.set(p.id, p));

  // Add any newly created products stored in local overrides
  Object.keys(overrides).forEach(id => {
    const item = overrides[id] as PartnerProduct;
    if (item && item.title) {
      if (!productMap.has(id)) {
        productMap.set(id, item);
      }
    }
  });

  const mergedList = Array.from(productMap.values()).map(p => {
    let merged = { ...p };
    if (overrides[p.id]) {
      merged = { ...merged, ...overrides[p.id] };
    }
    // Clean up stale earrings image or broken Amazon P images in overrides
    if (merged.primaryImage && (merged.primaryImage.includes('41-pc98WkyL') || merged.primaryImage.includes('/images/P/'))) {
      const resolvedImg = resolveCorrectProductImage(merged);
      merged.primaryImage = resolvedImg;
      merged.images = [resolvedImg];
      if (overrides[p.id]) {
        overrides[p.id].primaryImage = resolvedImg;
        overrides[p.id].images = [resolvedImg];
        overridesMutated = true;
      }
    } else {
      const resolvedImg = resolveCorrectProductImage(merged);
      if (merged.primaryImage !== resolvedImg) {
        merged.primaryImage = resolvedImg;
        merged.images = [resolvedImg];
        if (overrides[p.id]) {
          overrides[p.id].primaryImage = resolvedImg;
          overrides[p.id].images = [resolvedImg];
          overridesMutated = true;
        }
      }
    }

    // Keep MOCK_PARTNER_PRODUCTS in sync
    const existingIdx = MOCK_PARTNER_PRODUCTS.findIndex(item => item.id === p.id);
    if (existingIdx >= 0) {
      MOCK_PARTNER_PRODUCTS[existingIdx] = merged;
    } else {
      MOCK_PARTNER_PRODUCTS.unshift(merged);
    }

    return merged;
  });

  if (overridesMutated && typeof window !== 'undefined') {
    saveAllLocalProductOverrides(overrides);
  }

  return mergedList;
}

// ==========================================
// MOCK PARTNERS SEED DATA
// ==========================================
export const MOCK_PARTNERS: Partner[] = [
  {
    id: 'partner_amazon_india',
    companyName: 'Amazon Retail India Pvt Ltd',
    brandName: 'Amazon India',
    email: 'affiliates@amazon.in',
    phone: '+91 1800 3000 9009',
    category: 'E-Commerce & Retail',
    gstNumber: '27AAACA05801Z4',
    address: 'World Trade Centre, Brigade Gateway',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560055',
    status: 'APPROVED',
    commissionType: 'PERCENTAGE',
    commissionValue: 15,
    totalProducts: 50,
    totalOrders: 450,
    totalRevenue: 1250000,
    buywiseCommissionEarned: 187500,
    netPayable: 1062500,
    createdAt: '2026-01-01T10:00:00Z',
    updatedAt: '2026-09-05T12:00:00Z',
  }
];

// ==========================================
// MOCK PARTNER PRODUCTS SEED DATA
// ==========================================
export const MOCK_PARTNER_PRODUCTS: PartnerProduct[] = [
  {
    id: 'prod_partner_kamarbandh_1',
    partnerId: 'partner_amazon_india',
    partnerName: 'BUYWISE VERIFIED PARTNER NETWORK',
    title: 'Etietnic Gujarati Traditional Embroidered Kamarbandh',
    slug: 'etietnic-gujarati-traditional-embroidered-kamarbandh',
    description: 'Verified Amazon India product: Etietnic Gujarati Traditional Embroidered Kamarbandh. Authentic quality and fast delivery guaranteed across India.',
    productUrl: 'https://www.amazon.in/s?k=Etietnic+Gujarati+Traditional+Embroidered+Kamarbandh',
    category: 'Jewellery',
    brand: 'Amazon India',
    sku: 'AMZ-ETIETNIC-KAMAR-01',
    mrp: 1999,
    sellingPrice: 499,
    stock: 50,
    images: ['/kamarbandh.png'],
    primaryImage: '/kamarbandh.png',
    fulfillment: 'PARTNER_FULFILLED',
    source: 'PARTNER',
    tryOnEnabled: true,
    garmentCategory: 'accessories',
    returnPolicy: '7 Days Return & Refund Guaranteed',
    warranty: 'Amazon Fulfilled Guaranteed',
    gstPercent: 5,
    status: 'LIVE',
    commissionType: 'PERCENTAGE',
    commissionValue: 15,
    rating: 4.9,
    reviewCount: 24,
    youtubeUrl: 'https://youtube.com/shorts/LRIzcmOVWh0',
    createdAt: '2026-09-04T08:00:00Z',
    updatedAt: '2026-09-04T08:00:00Z',
  },
  {
    id: 'prod_partner_louiscraft_panties_1',
    partnerId: 'partner_amazon_india',
    partnerName: 'Amazon India',
    title: "Louis Craft Women's Cotton Printed Panties (Pack of 5)",
    description: 'Verified Amazon India Best Seller: 100% Super Soft Combed Cotton Panties with Anti-Bacterial Hipster Fit.',
    productUrl: 'https://www.amazon.in/Louis-Craft-Printed-Panties-Multicolour/dp/B0FNWFT4FB',
    category: 'Undergarments & Lingerie',
    brand: 'Amazon India',
    sku: 'AMZ-B0FNWFT4FB',
    mrp: 499,
    sellingPrice: 289,
    stock: 50,
    images: ['https://m.media-amazon.com/images/I/41DSHIr6S6L._AC_SL800_.jpg'],
    primaryImage: 'https://m.media-amazon.com/images/I/41DSHIr6S6L._AC_SL800_.jpg',
    fulfillment: 'PARTNER_FULFILLED',
    source: 'PARTNER',
    tryOnEnabled: true,
    garmentCategory: 'lower_body',
    returnPolicy: '7 Days Return & Refund Guaranteed',
    warranty: 'Amazon Fulfilled Guaranteed',
    gstPercent: 5,
    status: 'PAUSED',
    commissionType: 'PERCENTAGE',
    commissionValue: 15,
    rating: 4.9,
    reviewCount: 1420,
    createdAt: '2026-09-04T08:00:00Z',
    updatedAt: '2026-09-04T08:00:00Z',
  },
  {
    id: 'prod_partner_zivame_bra_1',
    partnerId: 'partner_amazon_india',
    partnerName: 'Amazon India',
    title: 'Zivame Padded Wirefree Seamless T-Shirt Bra',
    description: 'Amazon India Best Seller: Super Soft Polyamide Microfiber Stretch with 3/4th Coverage Seamless Moulded Padded Cups.',
    productUrl: 'https://www.amazon.in/s?k=Zivame+Padded+Wirefree+Seamless+T-Shirt+Bra',
    category: 'Undergarments & Lingerie',
    brand: 'Amazon India',
    sku: 'AMZ-ZIVAME-01',
    mrp: 1999,
    sellingPrice: 999,
    stock: 45,
    images: ['https://m.media-amazon.com/images/I/714AcwEJC0L._AC_SL800_.jpg'],
    primaryImage: 'https://m.media-amazon.com/images/I/714AcwEJC0L._AC_SL800_.jpg',
    fulfillment: 'PARTNER_FULFILLED',
    source: 'PARTNER',
    tryOnEnabled: true,
    garmentCategory: 'upper_body',
    returnPolicy: '7 Days Return & Exchange',
    warranty: 'Amazon Fulfilled Guaranteed',
    gstPercent: 5,
    status: 'PAUSED',
    commissionType: 'PERCENTAGE',
    commissionValue: 15,
    rating: 4.8,
    reviewCount: 3890,
    createdAt: '2026-09-04T08:00:00Z',
    updatedAt: '2026-09-04T08:00:00Z',
  },
  {
    id: 'prod_partner_jockey_trunk_1',
    partnerId: 'partner_amazon_india',
    partnerName: 'Amazon India',
    title: "Jockey Men's Super Combed Cotton Trunk (Pack of 3)",
    description: 'Amazon India Top Rated: 100% Super Combed Cotton Ribbed Fabric with Ultra-Soft Microfiber Elastic Waistband.',
    productUrl: 'https://www.amazon.in/s?k=Jockey+Men+Cotton+Trunk',
    category: 'Undergarments & Lingerie',
    brand: 'Amazon India',
    sku: 'AMZ-JOCKEY-03',
    mrp: 1199,
    sellingPrice: 899,
    stock: 60,
    images: ['https://m.media-amazon.com/images/I/61W8YLsLmSL._AC_SL800_.jpg'],
    primaryImage: 'https://m.media-amazon.com/images/I/61W8YLsLmSL._AC_SL800_.jpg',
    fulfillment: 'PARTNER_FULFILLED',
    source: 'PARTNER',
    tryOnEnabled: true,
    garmentCategory: 'lower_body',
    returnPolicy: '7 Days Return & Exchange',
    warranty: 'Amazon Fulfilled Guaranteed',
    gstPercent: 5,
    status: 'PAUSED',
    commissionType: 'PERCENTAGE',
    commissionValue: 15,
    rating: 4.9,
    reviewCount: 6120,
    createdAt: '2026-09-04T08:00:00Z',
    updatedAt: '2026-09-04T08:00:00Z',
  },
  {
    id: 'prod_partner_iphone17_1',
    partnerId: 'partner_amazon_india',
    partnerName: 'Amazon India',
    title: 'Apple iPhone 17 (256 GB) - Teal / Titanium',
    description: 'Amazon India Choice: 6.3-inch Super Retina XDR OLED 120Hz ProMotion with A18 Pro Bionic Chip and 48MP Dual Fusion Camera.',
    productUrl: 'https://www.amazon.in/s?k=Apple+iPhone+17',
    category: 'Mobiles & Smartphones',
    brand: 'Amazon India',
    sku: 'AMZ-IPHONE17-256',
    mrp: 89900,
    sellingPrice: 82900,
    stock: 25,
    images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80'],
    primaryImage: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80',
    fulfillment: 'PARTNER_FULFILLED',
    source: 'PARTNER',
    tryOnEnabled: true,
    garmentCategory: 'accessories',
    returnPolicy: '7 Days Replacement Guaranteed',
    warranty: '1 Year Apple India Warranty',
    gstPercent: 18,
    status: 'LIVE',
    commissionType: 'PERCENTAGE',
    commissionValue: 10,
    rating: 4.9,
    reviewCount: 3420,
    createdAt: '2026-09-04T08:00:00Z',
    updatedAt: '2026-09-04T08:00:00Z',
  },
  {
    id: 'prod_partner_levis_jeans_1',
    partnerId: 'partner_amazon_india',
    partnerName: 'Amazon India',
    title: "Levi's Men's 511 Slim Fit Stretchable Denim Jeans",
    description: 'Amazon India Fashion Bestseller: 99% Premium Cotton, 1% Elastane Stretch with Slim Fit Narrow Leg Opening.',
    productUrl: 'https://www.amazon.in/s?k=Levis+Slim+Fit+Jeans',
    category: 'Fashion & Clothing',
    brand: 'Amazon India',
    sku: 'AMZ-LEVIS-511',
    mrp: 3599,
    sellingPrice: 1899,
    stock: 40,
    images: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80'],
    primaryImage: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80',
    fulfillment: 'PARTNER_FULFILLED',
    source: 'PARTNER',
    tryOnEnabled: true,
    garmentCategory: 'lower_body',
    returnPolicy: '7 Days Easy Return',
    warranty: 'Authentic Levi’s Quality Guaranteed',
    gstPercent: 5,
    status: 'LIVE',
    commissionType: 'PERCENTAGE',
    commissionValue: 15,
    rating: 4.7,
    reviewCount: 5210,
    createdAt: '2026-09-04T08:00:00Z',
    updatedAt: '2026-09-04T08:00:00Z',
  },
  {
    id: 'prod_partner_sony_xm5_1',
    partnerId: 'partner_amazon_india',
    partnerName: 'Amazon India',
    title: 'Sony WH-1000XM5 Wireless ANC Headphones',
    description: 'Amazon India Audio Deal: Industry Leading Noise Cancellation with Dual Processor V1 & 30-Hour Battery Life.',
    productUrl: 'https://www.amazon.in/s?k=Sony+WH-1000XM5',
    category: 'Audio & Headphones',
    brand: 'Amazon India',
    sku: 'AMZ-SONY-XM5',
    mrp: 34990,
    sellingPrice: 24990,
    stock: 15,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'],
    primaryImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    fulfillment: 'PARTNER_FULFILLED',
    source: 'PARTNER',
    tryOnEnabled: true,
    garmentCategory: 'accessories',
    returnPolicy: '7 Days Replacement Guaranteed',
    warranty: '1 Year Sony India Warranty',
    gstPercent: 18,
    status: 'LIVE',
    commissionType: 'PERCENTAGE',
    commissionValue: 12,
    rating: 4.8,
    reviewCount: 4120,
    createdAt: '2026-09-04T08:00:00Z',
    updatedAt: '2026-09-04T08:00:00Z',
  },
  {
    id: 'prod_partner_flipkart_s24_1',
    partnerId: 'partner_flipkart',
    partnerName: 'Flipkart',
    title: 'Samsung Galaxy S24 5G (Onyx Black, 256 GB)',
    description: 'Flipkart Big Billion Deal: 8 GB RAM, Galaxy AI Features with Circle to Search, 50MP Pro-Grade Camera.',
    productUrl: 'https://www.flipkart.com/samsung-galaxy-s24-5g/p/itm12345',
    category: 'Mobiles & Smartphones',
    brand: 'Flipkart',
    sku: 'FK-S24-ONYX-256',
    mrp: 79999,
    sellingPrice: 64999,
    stock: 30,
    images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'],
    primaryImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    fulfillment: 'PARTNER_FULFILLED',
    source: 'PARTNER',
    tryOnEnabled: true,
    garmentCategory: 'accessories',
    returnPolicy: '7 Days Replacement Guaranteed',
    warranty: '1 Year Brand Warranty',
    gstPercent: 18,
    status: 'LIVE',
    commissionType: 'PERCENTAGE',
    commissionValue: 12,
    rating: 4.6,
    reviewCount: 2890,
    createdAt: '2026-09-04T08:00:00Z',
    updatedAt: '2026-09-04T08:00:00Z',
  },
  {
    id: 'prod_partner_meesho_georgette_1',
    partnerId: 'partner_meesho',
    partnerName: 'Meesho',
    title: 'Meesho Trending Heavy Georgette Sequence Saree with Unstitched Blouse',
    description: 'Meesho Verified Super Deal: Premium Bollywood style embroidered sequence work Georgette saree.',
    productUrl: 'https://www.meesho.com/s/p/trending-georgette-saree-1234',
    category: 'Fashion & Clothing',
    brand: 'Meesho',
    sku: 'MSH-GEO-SAREE-01',
    mrp: 2499,
    sellingPrice: 899,
    stock: 50,
    images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'],
    primaryImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    fulfillment: 'PARTNER_FULFILLED',
    source: 'PARTNER',
    tryOnEnabled: true,
    garmentCategory: 'upper_body',
    returnPolicy: '7 Days Easy Return & Refund Guaranteed',
    warranty: 'Meesho Quality Assured',
    gstPercent: 5,
    status: 'LIVE',
    commissionType: 'PERCENTAGE',
    commissionValue: 15,
    rating: 4.8,
    reviewCount: 8940,
    createdAt: '2026-09-04T08:00:00Z',
    updatedAt: '2026-09-04T08:00:00Z',
  }
];

// ==========================================
// MOCK ORDERS SEED DATA
// ==========================================
export const MOCK_PARTNER_ORDERS: PartnerOrder[] = [
  {
    id: 'ord_bw_9021',
    orderNumber: 'BW-ORD-2026-9021',
    partnerId: 'partner_silkcraft',
    partnerName: 'SilkCraft Heritage',
    customerUserId: 'usr_dev_123',
    shippingAddress: {
      fullName: 'Priya Sharma',
      phone: '+91 98112 34567',
      email: 'priya.sharma@example.com',
      street: 'Flat 402, Sunshine Heights, MG Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001'
    },
    items: [
      {
        productId: 'prod_partner_kanjivaram_1',
        title: 'Pure Kanjivaram Soft Silk Saree with Zari Brocade',
        sku: 'SKC-KANJI-ROYAL-RED',
        primaryImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
        quantity: 1,
        unitPrice: 3999,
        mrp: 6999,
        selectedColor: 'Royal Red'
      }
    ],
    subtotal: 3999,
    taxAmount: 200,
    shippingFee: 0,
    totalAmount: 4199,
    buywiseCommission: 600,
    partnerNetPayout: 3599,
    orderStatus: 'SHIPPED',
    courierCarrier: 'BlueDart Express',
    trackingNumber: 'BD-88991204',
    shippedAt: '2026-09-03T14:00:00Z',
    statusHistory: [
      { status: 'NEW_ORDER', updatedAt: '2026-09-02T10:15:00Z', note: 'Order placed by customer via BuyWise Partners' },
      { status: 'ACCEPTED', updatedAt: '2026-09-02T11:00:00Z', note: 'Order accepted by partner merchant' },
      { status: 'PACKING', updatedAt: '2026-09-02T16:30:00Z', note: 'Product packed in quality eco box' },
      { status: 'SHIPPED', updatedAt: '2026-09-03T14:00:00Z', note: 'Handed over to BlueDart courier. AWB: BD-88991204' }
    ],
    createdAt: '2026-09-02T10:15:00Z',
    updatedAt: '2026-09-03T14:00:00Z'
  },
  {
    id: 'ord_bw_9022',
    orderNumber: 'BW-ORD-2026-9022',
    partnerId: 'partner_royalgems',
    partnerName: 'RoyalGems Jaipur',
    customerUserId: 'usr_dev_456',
    shippingAddress: {
      fullName: 'Ananya Verma',
      phone: '+91 99201 55443',
      email: 'ananya.v@example.com',
      street: '12 Park Avenue, Koregaon Park',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001'
    },
    items: [
      {
        productId: 'prod_partner_kundanset_1',
        title: 'Royal Kundan & Pearl Choker Necklace Set',
        sku: 'RG-KUNDAN-SET-09',
        primaryImage: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80',
        quantity: 1,
        unitPrice: 7999,
        mrp: 12999,
        selectedColor: 'Gold Emerald'
      }
    ],
    subtotal: 7999,
    taxAmount: 240,
    shippingFee: 0,
    totalAmount: 8239,
    buywiseCommission: 1600,
    partnerNetPayout: 6639,
    orderStatus: 'PACKING',
    statusHistory: [
      { status: 'NEW_ORDER', updatedAt: '2026-09-03T18:20:00Z', note: 'Order placed by customer via BuyWise Partners' },
      { status: 'ACCEPTED', updatedAt: '2026-09-03T19:00:00Z', note: 'Merchant accepted order' },
      { status: 'PACKING', updatedAt: '2026-09-04T09:10:00Z', note: 'Jewellery authenticity box sealing' }
    ],
    createdAt: '2026-09-03T18:20:00Z',
    updatedAt: '2026-09-04T09:10:00Z'
  }
];

// ==========================================
// HIGH-PERFORMANCE SWR CACHE & SERVICE METHODS
// ==========================================

// In-Memory & Request Deduplication Singletons
let cachedPartnerProducts: PartnerProduct[] | null = null;
let lastProductsFetchTime = 0;
let productsInFlightPromise: Promise<PartnerProduct[]> | null = null;

let cachedPartners: Partner[] | null = null;
let lastPartnersFetchTime = 0;
let partnersInFlightPromise: Promise<Partner[]> | null = null;

let cachedPartnerOrders: PartnerOrder[] | null = null;
let lastOrdersFetchTime = 0;
let ordersInFlightPromise: Promise<PartnerOrder[]> | null = null;

function filterPartnerProducts(list: PartnerProduct[], category?: string, includeAllStatuses: boolean = false): PartnerProduct[] {
  if (includeAllStatuses) {
    if (!category || category.toLowerCase() === 'all') {
      return list;
    }
    return list.filter(p => (p.category || '').toLowerCase() === category.toLowerCase());
  }

  const live = list.filter(p => p.status === 'LIVE' || (p.status as any) === 'ACTIVE');
  if (!category || category.toLowerCase() === 'all') {
    return live;
  }
  return live.filter(p => (p.category || '').toLowerCase() === category.toLowerCase());
}

/**
 * Returns partner products instantly (0ms) from memory cache, localStorage, or base catalog.
 * Eliminates the delay when rendering Admin Inventory tables and dashboards.
 */
export function getCachedPartnerProducts(category?: string, includeAllStatuses: boolean = false): PartnerProduct[] {
  if (cachedPartnerProducts && cachedPartnerProducts.length > 0) {
    return filterPartnerProducts(cachedPartnerProducts, category, includeAllStatuses);
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('buywise_cached_partner_products');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cachedPartnerProducts = parsed;
          return filterPartnerProducts(parsed, category, includeAllStatuses);
        }
      }
    } catch (e) {}
  }

  // Fast baseline fallback merged with local overrides
  const combinedMap = new Map<string, PartnerProduct>();
  MOCK_PARTNER_PRODUCTS.forEach(p => combinedMap.set(p.id, p));
  if (typeof window !== 'undefined') {
    try {
      const overrides = getLocalProductOverrides();
      for (const [id, prod] of Object.entries(overrides)) {
        if (prod && (prod as any).title) {
          combinedMap.set(id, { ...(combinedMap.get(id) || {}), ...prod } as PartnerProduct);
        }
      }
    } catch (e) {}
  }
  const deletedIds = new Set(getDeletedProductIds());
  const fallback = applyLocalOverrides(Array.from(combinedMap.values())).filter(p => !deletedIds.has(p.id) && !(p as any).isDeleted);
  return filterPartnerProducts(fallback, category, includeAllStatuses);
}

/**
 * Synchronous instant getter for Partners
 */
export function getCachedPartners(): Partner[] {
  if (cachedPartners && cachedPartners.length > 0) return cachedPartners;
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('buywise_cached_partners');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cachedPartners = parsed;
          return parsed;
        }
      }
    } catch (e) {}
  }
  return MOCK_PARTNERS;
}

/**
 * Synchronous instant getter for Partner Orders
 */
export function getCachedPartnerOrders(partnerId?: string): PartnerOrder[] {
  let list = cachedPartnerOrders;
  if (!list && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('buywise_cached_orders');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cachedPartnerOrders = parsed;
          list = parsed;
        }
      }
    } catch (e) {}
  }
  const orders = list || MOCK_PARTNER_ORDERS;
  if (partnerId) {
    return orders.filter(o => o.partnerId === partnerId);
  }
  return orders;
}

export async function getPartners(forceRefresh: boolean = false): Promise<Partner[]> {
  const isFresh = cachedPartners && cachedPartners.length > 0 && (Date.now() - lastPartnersFetchTime < 60000);
  if (!forceRefresh && isFresh) {
    return cachedPartners!;
  }

  if (partnersInFlightPromise) {
    return partnersInFlightPromise;
  }

  partnersInFlightPromise = (async () => {
    try {
      const fetchPromise = getDocs(collection(db, 'partners'));
      const timeoutPromise = new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000));
      const snap: any = await Promise.race([fetchPromise, timeoutPromise]);
      if (snap && !snap.empty) {
        const list = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Partner));
        cachedPartners = list;
        lastPartnersFetchTime = Date.now();
        if (typeof window !== 'undefined') {
          try { localStorage.setItem('buywise_cached_partners', JSON.stringify(list)); } catch (e) {}
        }
        return list;
      }
    } catch (err) {
      console.warn('Firestore partners fetch notice, using cached/mock partners:', err);
    } finally {
      partnersInFlightPromise = null;
    }
    const fallback = getCachedPartners();
    cachedPartners = fallback;
    return fallback;
  })();

  return partnersInFlightPromise;
}

export async function getPartnerProducts(
  category?: string, 
  includeAllStatuses: boolean = false,
  forceRefresh: boolean = false
): Promise<PartnerProduct[]> {
  const isFresh = cachedPartnerProducts && cachedPartnerProducts.length > 0 && (Date.now() - lastProductsFetchTime < 45000);
  if (!forceRefresh && isFresh) {
    return filterPartnerProducts(cachedPartnerProducts!, category, includeAllStatuses);
  }

  if (productsInFlightPromise) {
    return productsInFlightPromise.then(prods => filterPartnerProducts(prods, category, includeAllStatuses));
  }

  productsInFlightPromise = (async () => {
    let firestoreProds: PartnerProduct[] = [];
    try {
      const fetchPromise = getDocs(collection(db, 'partner_products'));
      const timeoutPromise = new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3500));
      const snap: any = await Promise.race([fetchPromise, timeoutPromise]);
      if (snap && !snap.empty) {
        firestoreProds = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as PartnerProduct));
      }
    } catch (err) {
      console.warn('Firestore partner_products fetch notice, using instant fallback/cache:', err);
    } finally {
      productsInFlightPromise = null;
    }

    // Safety fallback: if Firestore returned 0, ensure baseline partner products exist
    if (firestoreProds.length === 0) {
      firestoreProds = [...MOCK_PARTNER_PRODUCTS];
    }

    // Combine baseline catalog and Firestore products so no items are missing
    const combinedMap = new Map<string, PartnerProduct>();
    MOCK_PARTNER_PRODUCTS.forEach(p => combinedMap.set(p.id, p));
    firestoreProds.forEach(p => {
      const existing = combinedMap.get(p.id) || ({} as PartnerProduct);
      combinedMap.set(p.id, { ...existing, ...p });
    });

    // Auto-sync recovery: if localStorage has onboarded partner products not yet in Firestore, sync them
    if (typeof window !== 'undefined') {
      try {
        const overrides = getLocalProductOverrides();
        for (const [id, prod] of Object.entries(overrides)) {
          if (prod && (prod as any).title) {
            const merged = { ...(combinedMap.get(id) || {}), ...prod } as PartnerProduct;
            combinedMap.set(id, merged);
            setDoc(doc(db, 'partner_products', id), merged, { merge: true }).catch(() => {});
          }
        }
      } catch (e) {}
    }

    const deletedIds = new Set(getDeletedProductIds());
    const allList = applyLocalOverrides(Array.from(combinedMap.values())).filter(p => !deletedIds.has(p.id) && !(p as any).isDeleted);

    // Update in-memory and persistent cache
    cachedPartnerProducts = allList;
    lastProductsFetchTime = Date.now();
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('buywise_cached_partner_products', JSON.stringify(allList));
      } catch (e) {}
    }

    return allList;
  })();

  const list = await productsInFlightPromise;
  return filterPartnerProducts(list, category, includeAllStatuses);
}

export async function getPartnerProductsByPartnerId(partnerId: string): Promise<PartnerProduct[]> {
  try {
    const q = query(collection(db, 'partner_products'), where('partnerId', '==', partnerId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as PartnerProduct));
    }
  } catch (err) {
    console.warn('Firestore partner_products by partnerId notice:', err);
  }
  return [];
}

export async function getPartnerOrders(partnerId?: string, forceRefresh: boolean = false): Promise<PartnerOrder[]> {
  const isFresh = cachedPartnerOrders && cachedPartnerOrders.length > 0 && (Date.now() - lastOrdersFetchTime < 45000);
  if (!forceRefresh && isFresh) {
    return getCachedPartnerOrders(partnerId);
  }

  if (ordersInFlightPromise) {
    return ordersInFlightPromise.then(ords => partnerId ? ords.filter(o => o.partnerId === partnerId) : ords);
  }

  ordersInFlightPromise = (async () => {
    try {
      const q = query(collection(db, 'partner_orders'), orderBy('createdAt', 'desc'));
      const fetchPromise = getDocs(q);
      const timeoutPromise = new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000));
      const snap: any = await Promise.race([fetchPromise, timeoutPromise]);
      if (snap && !snap.empty) {
        const list = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as PartnerOrder));
        cachedPartnerOrders = list;
        lastOrdersFetchTime = Date.now();
        if (typeof window !== 'undefined') {
          try { localStorage.setItem('buywise_cached_orders', JSON.stringify(list)); } catch (e) {}
        }
        return list;
      }
    } catch (err) {
      console.warn('Firestore partner_orders notice, using cached/mock:', err);
    } finally {
      ordersInFlightPromise = null;
    }
    const fallback = getCachedPartnerOrders();
    cachedPartnerOrders = fallback;
    return fallback;
  })();

  return ordersInFlightPromise.then(ords => partnerId ? ords.filter(o => o.partnerId === partnerId) : ords);
}

export async function logProductAuditAction(productId: string, action: string, userId: string = 'admin', details?: string): Promise<void> {
  const timestamp = new Date().toISOString();
  const entry = { productId, action, userId, details, timestamp };
  try {
    await addDoc(collection(db, 'partner_product_audit_logs'), entry);
  } catch (err) {
    console.warn('Audit log notice:', err);
  }
}

export async function createPartnerOrder(orderInput: Omit<PartnerOrder, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'statusHistory'>): Promise<PartnerOrder> {
  const timestamp = new Date().toISOString();
  const orderNumber = `BW-ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const correlationId = `BW-FUL-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(10000000 + Math.random() * 90000000)}`;

  // Server-side Authoritative Item & Inventory Revalidation
  const validatedItems = orderInput.items.map(item => {
    const prod = MOCK_PARTNER_PRODUCTS.find(p => p.id === item.productId || p.sku === item.sku);
    if (prod) {
      if (prod.stock < item.quantity) {
        throw new Error(`Insufficient inventory for product: ${item.title}. Available stock: ${prod.stock}`);
      }

      // Reserve Inventory (Decrement Stock)
      prod.stock = Math.max(0, prod.stock - item.quantity);
      try {
        setDoc(doc(db, 'partner_products', prod.id), { stock: prod.stock, updatedAt: timestamp }, { merge: true });
      } catch (e) {
        // Firestore sync notice
      }

      return {
        ...item,
        unitPrice: prod.sellingPrice,
        mrp: prod.mrp || item.mrp
      };
    }
    return item;
  });

  const subtotal = validatedItems.reduce((acc, it) => acc + (it.unitPrice * it.quantity), 0);
  const taxAmount = Math.round(subtotal * 0.05);
  const totalAmount = subtotal + taxAmount + (orderInput.shippingFee || 0);

  // Immutable Order Shipping Snapshot
  const shippingAddressSnapshot = {
    ...orderInput.shippingAddress,
    country: orderInput.shippingAddress.country || 'India'
  };

  const newOrder: PartnerOrder = {
    ...orderInput,
    shippingAddressSnapshot,
    correlationId,
    fulfillmentStatus: 'FULFILLMENT_PENDING',
    items: validatedItems,
    subtotal,
    taxAmount,
    totalAmount,
    id: `ord_${Date.now()}`,
    orderNumber,
    orderStatus: orderInput.orderStatus || 'PENDING',
    statusHistory: [
      { status: orderInput.orderStatus || 'PENDING', updatedAt: timestamp, note: 'Order placed by customer via BuyWise Partners' }
    ],
    createdAt: timestamp,
    updatedAt: timestamp
  };

  try {
    const docRef = await addDoc(collection(db, 'partner_orders'), newOrder);
    newOrder.id = docRef.id;
  } catch (err) {
    console.warn('Firestore order creation notice, saved in-memory:', err);
    MOCK_PARTNER_ORDERS.unshift(newOrder);
  }

  return newOrder;
}

export async function updateOrderStatus(
  orderId: string, 
  newStatus: OrderStatus, 
  trackingDetails?: { courierCarrier?: string; trackingNumber?: string; note?: string }
): Promise<boolean> {
  const timestamp = new Date().toISOString();

  // Auto-Release Inventory on Cancellation or Return
  if (newStatus === 'CANCELLED' || newStatus === 'RETURNED') {
    const ord = MOCK_PARTNER_ORDERS.find(o => o.id === orderId);
    if (ord) {
      ord.items.forEach(item => {
        const prod = MOCK_PARTNER_PRODUCTS.find(p => p.id === item.productId || p.sku === item.sku);
        if (prod) {
          prod.stock += item.quantity;
          try {
            setDoc(doc(db, 'partner_products', prod.id), { stock: prod.stock, updatedAt: timestamp }, { merge: true });
          } catch (e) {
            // Firestore sync notice
          }
        }
      });
    }
  }

  try {
    const updateObj: Record<string, unknown> = {
      orderStatus: newStatus,
      updatedAt: timestamp
    };
    if (trackingDetails?.courierCarrier) updateObj.courierCarrier = trackingDetails.courierCarrier;
    if (trackingDetails?.trackingNumber) updateObj.trackingNumber = trackingDetails.trackingNumber;
    if (newStatus === 'SHIPPED') updateObj.shippedAt = timestamp;
    if (newStatus === 'DELIVERED') updateObj.deliveredAt = timestamp;

    await updateDoc(doc(db, 'partner_orders', orderId), updateObj);
    return true;
  } catch (err) {
    console.warn('Firestore update order notice, updating memory:', err);
    const ord = MOCK_PARTNER_ORDERS.find(o => o.id === orderId);
    if (ord) {
      ord.orderStatus = newStatus;
      ord.updatedAt = timestamp;
      if (trackingDetails?.courierCarrier) ord.courierCarrier = trackingDetails.courierCarrier;
      if (trackingDetails?.trackingNumber) ord.trackingNumber = trackingDetails.trackingNumber;
      ord.statusHistory.push({
        status: newStatus,
        updatedAt: timestamp,
        note: trackingDetails?.note || `Status updated to ${newStatus}`
      });
      return true;
    }
  }
  return false;
}

export function cleanProductTitle(rawTitle: string): string {
  if (!rawTitle) return "BuyWise Featured Product";
  let t = rawTitle.trim();

  // If a full URL was accidentally entered/pasted into title field:
  if (t.startsWith("http://") || t.startsWith("https://") || t.includes("amazon.in/") || t.includes("flipkart.com/") || t.includes("meesho.com/") || t.includes(".com/") || t.includes(".in/")) {
    try {
      const urlObj = new URL(t.startsWith("http") ? t : `https://${t}`);
      const segments = urlObj.pathname.split("/").filter(Boolean);
      let slugSegment = segments.find(s => s !== "dp" && s !== "gp" && s !== "product" && s !== "p" && !s.match(/^[A-Z0-9]{10}$/i));
      if (!slugSegment && segments.length > 0) slugSegment = segments[0];

      if (slugSegment) {
        t = decodeURIComponent(slugSegment)
          .replace(/-/g, " ")
          .replace(/_/g, " ")
          .replace(/\.(html|php|aspx)$/i, "");
        t = t.split(" ")
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ")
          .trim();
      }
    } catch (e) {
      t = t.replace(/https?:\/\/[^\/]+\//g, "").split("?")[0].replace(/-/g, " ");
    }
  }

  // Sanitize HTML entities
  t = t
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();

  return t || "BuyWise Featured Product";
}

export async function savePartnerProduct(productInput: Omit<PartnerProduct, 'id' | 'createdAt' | 'updatedAt'>): Promise<PartnerProduct> {
  const timestamp = new Date().toISOString();
  let status = productInput.status || 'LIVE';
  let validationErrors: string[] = [];

  const cleanedTitle = cleanProductTitle(productInput.title);
  const description = (productInput.description && productInput.description.trim().length >= 3)
    ? productInput.description
    : `Verified BuyWise AI curated product: ${cleanedTitle}. Quality guaranteed.`;
  const primaryImage = productInput.primaryImage || (productInput.images && productInput.images[0]) || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80";

  const sanitizedInput = {
    ...productInput,
    title: cleanedTitle,
    description,
    primaryImage,
    images: [primaryImage],
    shippingEstimate: productInput.shippingEstimate || "4–7 Business Days",
    returnPolicy: productInput.returnPolicy || "7-Day Easy Return Policy",
    fulfillment: productInput.fulfillment || "PARTNER_FULFILLED",
    partnerId: productInput.partnerId || "partner_buywise_network",
    partnerName: productInput.partnerName || "BuyWise Verified Partner Network",
    sellingPrice: Number(productInput.sellingPrice) || 1299,
    mrp: Number(productInput.mrp) || Math.round((Number(productInput.sellingPrice) || 1299) * 1.4),
    stock: typeof productInput.stock === 'number' ? productInput.stock : 50
  };

  // Run Publication Gate if attempting LIVE / ACTIVE state
  if (status === 'LIVE' || (status as any) === 'ACTIVE') {
    const val = validateProductPublication(sanitizedInput);
    if (!val.valid) {
      status = 'DRAFT';
      validationErrors = val.errors;
    }
  }

  const computedSlug = productInput.slug && !productInput.slug.includes("http")
    ? productInput.slug 
    : cleanedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const newProduct: PartnerProduct = {
    ...sanitizedInput,
    slug: computedSlug,
    id: productInput.sku ? `prod_${productInput.sku.toLowerCase().replace(/[^a-z0-9]+/g, '_')}` : `prod_partner_${Date.now()}`,
    status,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  if (validationErrors.length > 0) {
    (newProduct as any).validationErrors = validationErrors;
  }

  // Instantly unshift into active state for immediate UI feedback
  MOCK_PARTNER_PRODUCTS.unshift(newProduct);
  saveLocalProductOverride(newProduct.id, newProduct);
  if (cachedPartnerProducts) {
    cachedPartnerProducts = [newProduct, ...cachedPartnerProducts.filter(p => p.id !== newProduct.id)];
  } else {
    cachedPartnerProducts = [newProduct];
  }
  if (typeof window !== 'undefined') {
    try { localStorage.setItem('buywise_cached_partner_products', JSON.stringify(cachedPartnerProducts)); } catch (e) {}
  }

  await logProductAuditAction(newProduct.id, status === 'LIVE' ? 'PUBLISHED' : 'CREATED_DRAFT', 'admin', validationErrors.join('; '));

  // Attempt Firestore sync with setDoc merge
  try {
    const docRef = doc(db, 'partner_products', newProduct.id);
    await setDoc(docRef, newProduct, { merge: true });
  } catch (err) {
    console.warn('Firestore product write notice, product active in local state:', err);
  }

  return newProduct;
}

export async function approvePartner(partnerId: string, status: PartnerStatus = 'APPROVED'): Promise<boolean> {
  try {
    await updateDoc(doc(db, 'partners', partnerId), { status, updatedAt: new Date().toISOString() });
    return true;
  } catch (err) {
    const p = MOCK_PARTNERS.find(item => item.id === partnerId);
    if (p) p.status = status;
    return true;
  }
}

export async function approvePartnerProduct(productId: string, status: PartnerProductStatus = 'LIVE'): Promise<{ success: boolean; errors?: string[] }> {
  const p = MOCK_PARTNER_PRODUCTS.find(item => item.id === productId);
  if (p) {
    p.status = status;
    if (!p.description || p.description.trim().length < 3) p.description = `Verified BuyWise AI product: ${p.title}`;
    if (!p.shippingEstimate) p.shippingEstimate = "4–7 Business Days";
    if (!p.returnPolicy) p.returnPolicy = "7-Day Easy Return Policy";
    if (!p.fulfillment) p.fulfillment = "PARTNER_FULFILLED";
    if (!p.partnerId) p.partnerId = "partner_buywise_network";

    if (status === 'LIVE') {
      const val = validateProductPublication(p);
      if (!val.valid) {
        return { success: false, errors: val.errors };
      }
    }
  }

  // Save status change locally so it persists across refreshes!
  saveLocalProductOverride(productId, { status });
  if (cachedPartnerProducts) {
    cachedPartnerProducts = cachedPartnerProducts.map(item => item.id === productId ? { ...item, status } : item);
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('buywise_cached_partner_products', JSON.stringify(cachedPartnerProducts)); } catch (e) {}
    }
  }

  try {
    const fullDoc = p ? { ...p, status, updatedAt: new Date().toISOString() } : { status, updatedAt: new Date().toISOString() };
    await setDoc(doc(db, 'partner_products', productId), fullDoc, { merge: true });
    await logProductAuditAction(productId, `STATUS_CHANGED_${status}`, 'admin');
    return { success: true };
  } catch (err) {
    await logProductAuditAction(productId, `STATUS_CHANGED_${status}`, 'admin');
    return { success: true };
  }
}

export async function updatePartnerProduct(productId: string, updates: Partial<PartnerProduct>): Promise<PartnerProduct | null> {
  const timestamp = new Date().toISOString();
  let existing = MOCK_PARTNER_PRODUCTS.find(p => p.id === productId);
  
  const sanitizedUpdates = { ...updates };
  if (sanitizedUpdates.title) {
    sanitizedUpdates.title = cleanProductTitle(sanitizedUpdates.title);
    sanitizedUpdates.slug = sanitizedUpdates.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  if (existing) {
    Object.assign(existing, { ...sanitizedUpdates, updatedAt: timestamp });
  }

  saveLocalProductOverride(productId, sanitizedUpdates);
  if (cachedPartnerProducts) {
    cachedPartnerProducts = cachedPartnerProducts.map(item => item.id === productId ? { ...item, ...sanitizedUpdates, updatedAt: timestamp } : item);
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('buywise_cached_partner_products', JSON.stringify(cachedPartnerProducts)); } catch (e) {}
    }
  }

  try {
    const docRef = doc(db, 'partner_products', productId);
    await setDoc(docRef, { ...sanitizedUpdates, updatedAt: timestamp }, { merge: true });
  } catch (err) {
    console.warn('Firestore update notice:', err);
  }

  return existing || null;
}

export async function deletePartnerProduct(productId: string): Promise<boolean> {
  const timestamp = new Date().toISOString();

  // 1. Remove from in-memory baseline catalog
  const idx = MOCK_PARTNER_PRODUCTS.findIndex(p => p.id === productId);
  if (idx !== -1) {
    MOCK_PARTNER_PRODUCTS.splice(idx, 1);
  }

  // 2. Persist deletion in localStorage so it never reappears on reload
  saveDeletedProductId(productId);
  if (typeof window !== 'undefined') {
    try {
      const overrides = getLocalProductOverrides();
      delete overrides[productId];
      saveAllLocalProductOverrides(overrides);
    } catch (e) {
      console.warn('LocalStorage delete override notice:', e);
    }
  }

  if (cachedPartnerProducts) {
    cachedPartnerProducts = cachedPartnerProducts.filter(p => p.id !== productId);
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('buywise_cached_partner_products', JSON.stringify(cachedPartnerProducts)); } catch (e) {}
    }
  }

  // 3. Delete from Firestore collection 'partner_products'
  try {
    const docRef = doc(db, 'partner_products', productId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Firestore delete notice:', err);
  }

  // 4. Audit log
  await logProductAuditAction(productId, 'PRODUCT_DELETED', 'admin', `Deleted from inventory workspace at ${timestamp}`);
  return true;
}

export function mapPartnerProductToBestsellerProduct(p: PartnerProduct): BestsellerProduct {
  const slug = p.slug || p.id || p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return {
    id: p.id,
    slug,
    name: p.title,
    category: p.category,
    image: p.primaryImage || (p.images && p.images[0]) || '',
    youtubeUrl: p.youtubeUrl,
    productUrl: p.productUrl,
    productSource: p.source || 'PARTNER',
    fulfillmentType: p.fulfillment || 'PARTNER_FULFILLED',
    environment: (p as any).environment || 'PRODUCTION',
    smartValueScore: p.smartValueScore || 90,
    shoppingTrustScore: p.shoppingTrustScore || 92,
    isTryOnEligible: p.tryOnEnabled !== false,
    shippingEstimate: p.shippingEstimate || '4–7 Business Days',
    returnPolicy: p.returnPolicy || '7-Day Return Policy',
    rating: p.rating || 4.8,
    reviewsCount: p.reviewCount || 100,
    lowestPrice: p.sellingPrice,
    originalPrice: p.mrp || p.sellingPrice,
    bestStore: p.partnerName || 'Amazon India',
    specs: [
      { label: 'Brand', value: p.brand || 'Amazon India' },
      { label: 'Fulfillment', value: p.fulfillment === 'PARTNER_FULFILLED' ? 'Direct BuyWise Partner Dispatch' : 'BuyWise Fulfilled' },
      { label: 'Return Policy', value: p.returnPolicy || '7-Day Return Policy' }
    ],
    prices: [
      {
        store: p.partnerName || 'Amazon India',
        price: p.sellingPrice,
        url: p.productUrl || `/checkout?product=${encodeURIComponent(slug)}`,
        inStock: p.stock > 0 && (p.status === 'LIVE' || (p.status as any) === 'ACTIVE'),
        productSource: p.source || 'PARTNER',
        fulfillmentType: p.fulfillment || 'PARTNER_FULFILLED'
      }
    ],
    highlights: [
      `Direct BuyWise Partner Fulfillment`,
      `Smart Value Score ${p.smartValueScore || 90}/100`,
      `Shopping Trust Score ${p.shoppingTrustScore || 92}/100`
    ]
  };
}

export async function getPartnerProductBySlug(slug: string): Promise<PartnerProduct | null> {
  const normalizedSlug = slug.toLowerCase().trim();

  // First check in-memory list
  const local = MOCK_PARTNER_PRODUCTS.find(p => {
    const pSlug = p.slug || p.id || p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return pSlug.toLowerCase() === normalizedSlug || p.id.toLowerCase() === normalizedSlug;
  });
  if (local) return local;

  // Query Firestore collection partner_products by slug or id
  try {
    const qBySlug = query(collection(db, 'partner_products'), where('slug', '==', normalizedSlug));
    const snapBySlug = await getDocs(qBySlug);
    if (!snapBySlug.empty) {
      const d = snapBySlug.docs[0];
      return { id: d.id, ...d.data() } as PartnerProduct;
    }

    const qById = query(collection(db, 'partner_products'), where('id', '==', normalizedSlug));
    const snapById = await getDocs(qById);
    if (!snapById.empty) {
      const d = snapById.docs[0];
      return { id: d.id, ...d.data() } as PartnerProduct;
    }
  } catch (err) {
    console.warn('Firestore fetch partner product by slug notice:', err);
  }

  return null;
}

export function getYoutubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();
  try {
    let videoId = '';
    if (cleanUrl.includes('youtu.be/')) {
      videoId = cleanUrl.split('youtu.be/')[1]?.split(/[?#&]/)[0] || '';
    } else if (cleanUrl.includes('youtube.com/watch')) {
      const u = new URL(cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`);
      videoId = u.searchParams.get('v') || '';
    } else if (cleanUrl.includes('youtube.com/shorts/')) {
      videoId = cleanUrl.split('youtube.com/shorts/')[1]?.split(/[?#&]/)[0] || '';
    } else if (cleanUrl.includes('youtube.com/live/')) {
      videoId = cleanUrl.split('youtube.com/live/')[1]?.split(/[?#&]/)[0] || '';
    } else if (cleanUrl.includes('youtube.com/embed/')) {
      const match = cleanUrl.match(/embed\/([a-zA-Z0-9_-]{11})/);
      if (match && match[1]) return `https://www.youtube.com/embed/${match[1]}`;
      return cleanUrl;
    }
    // Direct 11-char video ID fallback
    if (!videoId && /^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) {
      videoId = cleanUrl;
    }
    if (videoId) return `https://www.youtube.com/embed/${videoId}`;
  } catch (e) {}
  return null;
}

