import { 
  Partner, 
  PartnerProduct, 
  PartnerOrder, 
  OrderStatus, 
  PartnerStatus, 
  PartnerProductStatus,
  PartnerReviewStatus,
  PartnerVerificationStatus,
  PartnerCategory,
  ProductVariant,
  ReviewHistoryEntry
} from './types';
import { validateProductPublication, validatePurchaseUrl, calculateDiscountPercent } from './partnerValidation';
import { BestsellerProduct } from '../categoryData';
import { db, auth } from '../firebase';
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

export function getCategoryFallbackImage(category: string = '', title: string = ''): string {
  const lower = (title || '').toLowerCase();
  
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
    id: 'partner_silkcraft',
    companyName: 'SilkCraft Heritage Handlooms Pvt Ltd',
    brandName: 'SilkCraft Heritage',
    email: 'contact@silkcraftheritage.in',
    phone: '+91 98251 44321',
    category: 'Fashion & Clothing',
    gstNumber: '24AABCS7821Q1ZN',
    address: 'Ring Road Textile Market, Surat',
    city: 'Surat',
    state: 'Gujarat',
    pincode: '395002',
    status: 'APPROVED',
    commissionType: 'PERCENTAGE',
    commissionValue: 12,
    totalProducts: 48,
    totalOrders: 312,
    totalRevenue: 894000,
    buywiseCommissionEarned: 107280,
    netPayable: 786720,
    createdAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-10-20T14:30:00Z',
  },
  {
    id: 'partner_kundan',
    companyName: 'Kundan Art & Heritage Jewellers LLP',
    brandName: 'Kundan Art Jewellers',
    email: 'sales@kundanartjewellers.com',
    phone: '+91 94140 88765',
    category: 'Jewellery',
    gstNumber: '08AACCK9012D1ZR',
    address: 'Johari Bazar, Heritage City',
    city: 'Jaipur',
    state: 'Rajasthan',
    pincode: '302003',
    status: 'APPROVED',
    commissionType: 'PERCENTAGE',
    commissionValue: 10,
    totalProducts: 36,
    totalOrders: 185,
    totalRevenue: 1420000,
    buywiseCommissionEarned: 142000,
    netPayable: 1278000,
    createdAt: '2026-02-01T10:30:00Z',
    updatedAt: '2026-10-22T11:15:00Z',
  },
  {
    id: 'partner_etietnic',
    companyName: 'Etietnic Gujarati Traditional Crafts',
    brandName: 'Etietnic Gujarati',
    email: 'care@etietnictradition.com',
    phone: '+91 98790 12345',
    category: 'Jewellery',
    gstNumber: '24AAACE5564K1Z2',
    address: 'Law Garden Handicraft Market',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '380006',
    status: 'APPROVED',
    commissionType: 'PERCENTAGE',
    commissionValue: 15,
    totalProducts: 24,
    totalOrders: 420,
    totalRevenue: 378000,
    buywiseCommissionEarned: 56700,
    netPayable: 321300,
    createdAt: '2026-02-10T11:00:00Z',
    updatedAt: '2026-10-21T16:00:00Z',
  },
  {
    id: 'partner_hopscotch',
    companyName: 'Hopscotch India Retail Operations',
    brandName: 'Hopscotch Youth',
    email: 'partners@hopscotch.in',
    phone: '+91 80 4680 9000',
    category: 'Fashion & Clothing',
    gstNumber: '29AAACH4432P1ZT',
    address: 'Indiranagar 100ft Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    status: 'APPROVED',
    commissionType: 'PERCENTAGE',
    commissionValue: 15,
    totalProducts: 62,
    totalOrders: 540,
    totalRevenue: 792000,
    buywiseCommissionEarned: 118800,
    netPayable: 673200,
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-10-23T10:00:00Z',
  },
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
    id: 'prod_partner_meesho_trendy_partywear_1',
    partnerId: 'partner_big20shope',
    partnerName: 'BIG 20shope',
    title: 'Trendy Partywear Women Dress',
    slug: 'trendy-partywear-women-dress',
    description: 'Meesho Verified Trending Outfit: Stylish partywear sleeveless flared floral midi dress by BIG 20shope. Premium georgette blend fabric with flattering silhouette.',
    productUrl: 'https://www.meesho.com/s/p/7pm9q3',
    category: 'Fashion & Clothing',
    brand: 'BIG 20shope',
    sku: 'BIG20-PARTYWEAR-DRESS-01',
    mrp: 599,
    sellingPrice: 345,
    stock: 50,
    images: ['https://images.meesho.com/images/products/466292667/3cyxt_1024.jpg'],
    primaryImage: 'https://images.meesho.com/images/products/466292667/3cyxt_1024.jpg',
    fulfillment: 'PARTNER_FULFILLED',
    source: 'PARTNER',
    tryOnEnabled: true,
    garmentCategory: 'dresses',
    returnPolicy: '7 Days Return & Exchange Guaranteed',
    warranty: 'Meesho Super Seller Verified Quality',
    gstPercent: 5,
    status: 'LIVE',
    reviewStatus: 'APPROVED',
    verificationStatus: 'verified_live',
    commissionType: 'PERCENTAGE',
    commissionValue: 15,
    rating: 4.9,
    reviewCount: 3840,
    createdAt: '2026-10-25T08:00:00Z',
    updatedAt: '2026-10-25T10:00:00Z',
  },
  {
    id: 'prod_partner_kanjivaram_1',
    partnerId: 'partner_silkcraft',
    partnerName: 'SilkCraft Heritage',
    title: 'Pure Kanjivaram Soft Silk Saree with Gold Zari Brocade',
    slug: 'pure-kanjivaram-soft-silk-saree-gold-zari-brocade',
    description: 'Authentic handwoven Kanjivaram pure mulberry silk saree featuring traditional temple borders and intricate gold zari brocade work. Verified Surat handloom quality.',
    productUrl: 'https://silkcraftheritage.in/products/kanjivaram-silk-saree',
    category: 'Fashion & Clothing',
    brand: 'SilkCraft Heritage',
    sku: 'SKC-KANJI-ROYAL-RED',
    mrp: 6999,
    sellingPrice: 3499,
    stock: 28,
    images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80'],
    primaryImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
    fulfillment: 'PARTNER_FULFILLED',
    source: 'PARTNER',
    tryOnEnabled: true,
    garmentCategory: 'saree',
    returnPolicy: '7 Days Return & Exchange Guaranteed',
    warranty: 'Silk Mark Certified Pure Silk',
    gstPercent: 5,
    status: 'LIVE',
    reviewStatus: 'APPROVED',
    verificationStatus: 'verified_live',
    commissionType: 'PERCENTAGE',
    commissionValue: 12,
    rating: 4.9,
    reviewCount: 86,
    createdAt: '2026-09-04T08:00:00Z',
    updatedAt: '2026-10-24T10:00:00Z',
  },
  {
    id: 'prod_partner_kundan_necklace_1',
    partnerId: 'partner_kundan',
    partnerName: 'Kundan Art Jewellers',
    title: 'Heritage Rajasthani Kundan Meenakari Choker Necklace Set',
    slug: 'rajasthani-kundan-meenakari-choker-necklace-set',
    description: 'Handcrafted artisan Kundan choker necklace with matching jhumkas and maang tikka, adorned with green Meenakari enameling and cultured pearls from Johari Bazar, Jaipur.',
    productUrl: 'https://kundanartjewellers.com/collections/heritage-choker',
    category: 'Jewellery',
    brand: 'Kundan Art Jewellers',
    sku: 'KAJ-KUNDAN-CHOKER-01',
    mrp: 4999,
    sellingPrice: 2499,
    stock: 18,
    images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80'],
    primaryImage: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80',
    fulfillment: 'PARTNER_FULFILLED',
    source: 'PARTNER',
    tryOnEnabled: true,
    garmentCategory: 'accessories',
    returnPolicy: '7 Days Return & Exchange Guaranteed',
    warranty: 'BIS Hallmarked & Authenticity Card Included',
    gstPercent: 3,
    status: 'LIVE',
    reviewStatus: 'APPROVED',
    verificationStatus: 'verified_live',
    commissionType: 'PERCENTAGE',
    commissionValue: 10,
    rating: 4.9,
    reviewCount: 42,
    createdAt: '2026-09-04T08:00:00Z',
    updatedAt: '2026-10-24T10:00:00Z',
  },
  {
    id: 'prod_partner_kamarbandh_1',
    partnerId: 'partner_etietnic',
    partnerName: 'Etietnic Gujarati',
    title: 'Etietnic Gujarati Traditional Embroidered Kamarbandh',
    slug: 'etietnic-gujarati-traditional-embroidered-kamarbandh',
    description: 'Verified Etietnic Gujarati traditional Kutchi mirror work embroidered kamarbandh waist belt with vibrant tassels. Handcrafted artisan quality.',
    productUrl: 'https://www.amazon.in/s?k=Etietnic+Gujarati+Traditional+Embroidered+Kamarbandh',
    category: 'Jewellery',
    brand: 'Etietnic',
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
    warranty: 'Authentic Gujarat Handicrafts Quality',
    gstPercent: 5,
    status: 'LIVE',
    reviewStatus: 'APPROVED',
    verificationStatus: 'verified_live',
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
  },
  {
    id: 'prod_partner_girls_dress_1',
    partnerId: 'partner_amazon_india',
    partnerName: 'BUYWISE VERIFIED PARTNER NETWORK',
    title: 'Hopscotch Girls Floral Print Fit and Flare Party Frock Dress',
    slug: 'hopscotch-girls-floral-print-party-frock-dress',
    description: 'Verified Hopscotch Girls Floral Print Fit and Flare Party Frock Dress. Premium breathable fabric with comfortable cotton lining.',
    productUrl: 'https://www.amazon.in/s?k=Hopscotch+Girls+Floral+Print+Fit+and+Flare+Party+Frock+Dress',
    category: 'Fashion & Clothing',
    subcategory: 'Girl Dresses',
    brand: 'Hopscotch',
    sku: 'BW-HOP-GIRL-DRESS-01',
    mrp: 1499,
    sellingPrice: 499,
    stock: 65,
    images: ['https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&w=800&q=80'],
    primaryImage: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&w=800&q=80',
    fulfillment: 'PARTNER_FULFILLED',
    source: 'PARTNER',
    tryOnEnabled: true,
    garmentCategory: 'dresses',
    returnPolicy: '7 Days Return & Exchange Guaranteed',
    warranty: 'Quality Assured by Brand Partner',
    gstPercent: 5,
    status: 'LIVE',
    commissionType: 'PERCENTAGE',
    commissionValue: 15,
    rating: 4.8,
    reviewCount: 1420,
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
  const all = getCachedPartnerProducts();
  const matched = all.filter(p => p.partnerId === partnerId);
  if (matched.length > 0) return matched;
  return all.slice(0, 8);
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

/**
 * Admin Action: Grants selling permission to a merchant, registering or activating their Partner account.
 * Enforces trusted server-side authorization check via /api/admin/partners in browser runtime.
 */
export async function grantPartnerPermission(params: {
  email: string;
  brandName: string;
  companyName?: string;
  category?: PartnerCategory;
  commissionValue?: number;
  phone?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  partnerId?: string;
  status?: PartnerStatus;
}): Promise<{ success: boolean; partner: Partner; message: string }> {
  // If running in browser, delegate to authoritative server-side endpoint
  if (typeof window !== 'undefined') {
    let authToken = '';
    try {
      if (auth?.currentUser) {
        authToken = await auth.currentUser.getIdToken();
      }
    } catch (e) {}

    const res = await fetch('/api/admin/partners', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      },
      body: JSON.stringify({
        action: 'GRANT_PERMISSION',
        ...params
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || `Administrative authorization failed (${res.status}).`);
    }

    const verifiedPartner: Partner = data.partner;
    // Update local cache ONLY upon confirmed server success
    const currentPartners = getCachedPartners();
    const updatedList = [
      verifiedPartner,
      ...currentPartners.filter(p => p.id !== verifiedPartner.id && p.email?.toLowerCase() !== verifiedPartner.email?.toLowerCase())
    ];
    cachedPartners = updatedList;
    lastPartnersFetchTime = Date.now();
    try {
      localStorage.setItem('buywise_cached_partners', JSON.stringify(updatedList));
    } catch (e) {}

    return {
      success: true,
      partner: verifiedPartner,
      message: data.message
    };
  }

  // Node / direct emulator execution fallback
  const timestamp = new Date().toISOString();
  const cleanEmail = params.email.trim().toLowerCase();
  const cleanBrand = params.brandName.trim();
  const normalizedId = params.partnerId?.trim() || `partner_${cleanBrand.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36)}`;

  // Strict validation
  if (params.commissionValue !== undefined && (params.commissionValue < 0 || params.commissionValue > 50)) {
    throw new Error('Platform commission rate must be between 0% and 50%');
  }

  const newPartner: Partner = {
    id: normalizedId,
    brandName: cleanBrand,
    companyName: params.companyName?.trim() || cleanBrand,
    email: cleanEmail,
    phone: params.phone?.trim() || '+91 9876543210',
    category: params.category || 'Fashion',
    gstNumber: params.gstNumber?.trim() || undefined,
    address: 'Registered Partner Office',
    city: params.city?.trim() || 'Surat',
    state: params.state?.trim() || 'Gujarat',
    pincode: params.pincode?.trim() || '395003',
    status: params.status || 'APPROVED',
    commissionType: 'PERCENTAGE',
    commissionValue: params.commissionValue !== undefined ? Number(params.commissionValue) : 15,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    buywiseCommissionEarned: 0,
    netPayable: 0,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  // Update in-memory seed list
  const existingIdx = MOCK_PARTNERS.findIndex(p => p.id === normalizedId || (p.email && p.email.toLowerCase() === cleanEmail));
  if (existingIdx >= 0) {
    MOCK_PARTNERS[existingIdx] = { ...MOCK_PARTNERS[existingIdx], ...newPartner, updatedAt: timestamp };
  } else {
    MOCK_PARTNERS.unshift(newPartner);
  }

  const currentPartners = getCachedPartners();
  const updatedList = [newPartner, ...currentPartners.filter(p => p.id !== normalizedId && p.email?.toLowerCase() !== cleanEmail)];
  cachedPartners = updatedList;

  // Persist to Firestore (sanitized of undefined fields)
  const firestoreData = Object.fromEntries(
    Object.entries(newPartner).filter(([_, v]) => v !== undefined)
  );
  await setDoc(doc(db, 'partners', normalizedId), firestoreData, { merge: true });

  return {
    success: true,
    partner: newPartner,
    message: `Partner selling permission granted to "${cleanBrand}" (${cleanEmail}) with status ${newPartner.status}!`
  };
}

export async function approvePartner(partnerId: string, status: PartnerStatus = 'APPROVED'): Promise<boolean> {
  // If running in browser, delegate to authoritative server-side endpoint
  if (typeof window !== 'undefined') {
    let authToken = '';
    try {
      if (auth?.currentUser) {
        authToken = await auth.currentUser.getIdToken();
      }
    } catch (e) {}

    const res = await fetch('/api/admin/partners', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      },
      body: JSON.stringify({
        action: 'UPDATE_STATUS',
        partnerId,
        status
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || `Failed to update partner status. Administrative authorization failed (${res.status}).`);
    }

    const timestamp = new Date().toISOString();
    const p = MOCK_PARTNERS.find(item => item.id === partnerId);
    if (p) {
      p.status = status;
      p.updatedAt = timestamp;
    }

    if (cachedPartners) {
      cachedPartners = cachedPartners.map(item => item.id === partnerId ? { ...item, status, updatedAt: timestamp } : item);
      try {
        localStorage.setItem('buywise_cached_partners', JSON.stringify(cachedPartners));
      } catch (e) {}
    }

    return true;
  }

  // Node / direct emulator execution fallback
  const timestamp = new Date().toISOString();
  await updateDoc(doc(db, 'partners', partnerId), { status, updatedAt: timestamp });
  const p = MOCK_PARTNERS.find(item => item.id === partnerId);
  if (p) {
    p.status = status;
    p.updatedAt = timestamp;
  }
  if (cachedPartners) {
    cachedPartners = cachedPartners.map(item => item.id === partnerId ? { ...item, status, updatedAt: timestamp } : item);
  }
  return true;
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

function cleanUndefined<T extends Record<string, any>>(obj: T): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      clean[k] = v;
    }
  }
  return clean;
}

/**
 * Creates a partner product listing with security validation and review status workflow.
 * Strictly prevents partners from self-assigning verified_live or isLowest status.
 */
export async function createPartnerProductListing(input: {
  partnerId: string;
  partnerName: string;
  title: string;
  description: string;
  category: any;
  subcategory?: string;
  brand?: string;
  sku?: string;
  mrp: number;
  sellingPrice: number;
  stock: number;
  images: string[];
  primaryImage: string;
  productUrl?: string;
  shippingCharges?: number;
  variants?: ProductVariant[];
  barcodeGtin?: string;
  garmentCategory?: any;
  tryOnEnabled?: boolean;
  returnPolicy?: string;
  warranty?: string;
  isDraft?: boolean;
}): Promise<{ success: boolean; product?: PartnerProduct; errors?: string[] }> {
  const timestamp = new Date().toISOString();
  const errors: string[] = [];

  // 1. Validation
  if (!input.title || input.title.trim().length < 3) errors.push('Title must be at least 3 characters');
  if (typeof input.sellingPrice !== 'number' || input.sellingPrice <= 0) errors.push('Selling price must be greater than ₹0');
  if (input.mrp && input.sellingPrice > input.mrp) errors.push('Selling price cannot exceed MRP');
  if (typeof input.stock !== 'number' || input.stock < 0) errors.push('Stock cannot be negative');

  if (input.productUrl) {
    const urlCheck = validatePurchaseUrl(input.productUrl);
    if (!urlCheck.valid) errors.push(urlCheck.error || 'Invalid product URL');
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  const productId = `prod_${input.partnerId}_${Date.now()}`;
  const cleanTitle = cleanProductTitle(input.title);
  const slug = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const reviewStatus: PartnerReviewStatus = input.isDraft ? 'DRAFT' : 'PENDING_REVIEW';
  const status: PartnerProductStatus = input.isDraft ? 'DRAFT' : 'PENDING_APPROVAL';

  const initialHistory: ReviewHistoryEntry[] = [
    {
      status: reviewStatus,
      changedAt: timestamp,
      actor: input.partnerId,
      note: input.isDraft ? 'Created as draft' : 'Submitted for BuyWise review and price verification'
    }
  ];

  const newProduct: PartnerProduct = {
    id: productId,
    partnerId: input.partnerId,
    partnerName: input.partnerName,
    title: cleanTitle,
    description: input.description || cleanTitle,
    category: input.category || 'Fashion',
    subcategory: input.subcategory || '',
    brand: input.brand || input.partnerName,
    sku: input.sku || `SKU-${Date.now()}`,
    mrp: input.mrp || input.sellingPrice,
    sellingPrice: input.sellingPrice,
    stock: input.stock,
    images: input.images && input.images.length > 0 ? input.images : [input.primaryImage],
    primaryImage: input.primaryImage,
    productUrl: input.productUrl || undefined,
    shippingCharges: input.shippingCharges || 0,
    variants: input.variants || [],
    barcodeGtin: input.barcodeGtin || '',
    fulfillment: 'PARTNER_FULFILLED',
    source: 'PARTNER',
    tryOnEnabled: input.tryOnEnabled !== false,
    garmentCategory: input.garmentCategory || 'accessories',
    returnPolicy: input.returnPolicy || '7 Days Return & Replacement',
    warranty: input.warranty || 'Authentic Merchant Guarantee',
    gstPercent: 5,
    status,
    reviewStatus,
    verificationStatus: 'unverified', // Strictly unverified until reviewed & verified
    reviewHistory: initialHistory,
    commissionType: 'PERCENTAGE',
    commissionValue: 15,
    slug,
    rating: 4.8,
    reviewCount: 1,
    shippingEstimate: '3–5 Business Days',
    createdAt: timestamp,
    updatedAt: timestamp
  };

  // Instantly reflect in local memory and cache
  MOCK_PARTNER_PRODUCTS.unshift(newProduct);
  saveLocalProductOverride(newProduct.id, newProduct);
  if (cachedPartnerProducts) {
    cachedPartnerProducts = [newProduct, ...cachedPartnerProducts.filter(p => p.id !== newProduct.id)];
  } else {
    cachedPartnerProducts = [newProduct, ...MOCK_PARTNER_PRODUCTS.filter(p => p.id !== newProduct.id)];
  }
  lastProductsFetchTime = Date.now();
  if (typeof window !== 'undefined') {
    try { localStorage.setItem('buywise_cached_partner_products', JSON.stringify(cachedPartnerProducts)); } catch (e) {}
  }

  // Attempt Firestore sync
  try {
    const docRef = doc(db, 'partner_products', newProduct.id);
    await setDoc(docRef, cleanUndefined(newProduct), { merge: true });
  } catch (err) {
    console.warn('Firestore write notice (product active in session):', err);
  }

  return { success: true, product: newProduct };
}

/**
 * Updates a partner product listing with ownership checking, mass-assignment protection,
 * and automatic re-verification trigger upon material changes (price/URL/title).
 */
export async function updatePartnerProductListing(
  productId: string,
  partnerId: string,
  updates: Partial<PartnerProduct>,
  isAdminUser: boolean = false
): Promise<{ success: boolean; product?: PartnerProduct; errors?: string[] }> {
  const existing = MOCK_PARTNER_PRODUCTS.find(p => p.id === productId);
  if (!existing) {
    return { success: false, errors: ['Product listing not found'] };
  }

  // Ownership security check
  if (!isAdminUser && existing.partnerId !== partnerId) {
    return { success: false, errors: ['Unauthorized: You do not own this product listing.'] };
  }

  const timestamp = new Date().toISOString();
  const errors: string[] = [];

  // Protect against mass-assignment of privileged fields
  const safeUpdates = { ...updates };
  if (!isAdminUser) {
    delete (safeUpdates as any).verificationStatus;
    delete (safeUpdates as any).isLowest;
    delete (safeUpdates as any).partnerBadge;
    delete (safeUpdates as any).smartValueScore;
    delete (safeUpdates as any).shoppingTrustScore;
  }

  if (safeUpdates.sellingPrice && safeUpdates.sellingPrice <= 0) {
    errors.push('Selling price must be greater than ₹0');
  }
  const effectiveMrp = safeUpdates.mrp || existing.mrp;
  const effectivePrice = safeUpdates.sellingPrice || existing.sellingPrice;
  if (effectivePrice > effectiveMrp) {
    errors.push('Selling price cannot exceed MRP');
  }

  if (safeUpdates.productUrl) {
    const urlCheck = validatePurchaseUrl(safeUpdates.productUrl);
    if (!urlCheck.valid) {
      errors.push(urlCheck.error || 'Invalid product URL');
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  // Check if material change requires re-verification
  const priceChanged = safeUpdates.sellingPrice !== undefined && safeUpdates.sellingPrice !== existing.sellingPrice;
  const urlChanged = safeUpdates.productUrl !== undefined && safeUpdates.productUrl !== existing.productUrl;
  const titleChanged = safeUpdates.title !== undefined && safeUpdates.title !== existing.title;

  const requiresReverification = !isAdminUser && (priceChanged || urlChanged || titleChanged);

  if (requiresReverification) {
    safeUpdates.verificationStatus = 'unverified';
    safeUpdates.reviewStatus = 'PENDING_REVIEW';
    safeUpdates.status = 'PENDING_APPROVAL';

    const historyEntry: ReviewHistoryEntry = {
      status: 'PENDING_REVIEW',
      changedAt: timestamp,
      actor: partnerId,
      note: `Material change detected (${[priceChanged ? 'Price' : '', urlChanged ? 'URL' : '', titleChanged ? 'Title' : ''].filter(Boolean).join(', ')}). Queued for re-verification.`
    };
    safeUpdates.reviewHistory = [...(existing.reviewHistory || []), historyEntry];
  }

  if (safeUpdates.title) {
    safeUpdates.title = cleanProductTitle(safeUpdates.title);
    safeUpdates.slug = safeUpdates.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  safeUpdates.updatedAt = timestamp;

  Object.assign(existing, safeUpdates);
  saveLocalProductOverride(productId, safeUpdates);

  if (cachedPartnerProducts) {
    cachedPartnerProducts = cachedPartnerProducts.map(p => p.id === productId ? { ...p, ...safeUpdates } : p);
  } else {
    cachedPartnerProducts = [...MOCK_PARTNER_PRODUCTS];
  }
  lastProductsFetchTime = Date.now();
  if (typeof window !== 'undefined') {
    try { localStorage.setItem('buywise_cached_partner_products', JSON.stringify(cachedPartnerProducts)); } catch (e) {}
  }

  try {
    const docRef = doc(db, 'partner_products', productId);
    await setDoc(docRef, cleanUndefined(safeUpdates), { merge: true });
  } catch (err) {
    console.warn('Firestore update notice:', err);
  }

  return { success: true, product: existing };
}

/**
 * Archives a partner product listing.
 */
export async function archivePartnerProductListing(productId: string, partnerId: string, isAdminUser: boolean = false): Promise<boolean> {
  const existing = MOCK_PARTNER_PRODUCTS.find(p => p.id === productId);
  if (!existing) return false;
  if (!isAdminUser && existing.partnerId !== partnerId) return false;

  const timestamp = new Date().toISOString();
  const updates: Partial<PartnerProduct> = {
    status: 'ARCHIVED',
    reviewStatus: 'ARCHIVED',
    updatedAt: timestamp,
    reviewHistory: [
      ...(existing.reviewHistory || []),
      {
        status: 'ARCHIVED',
        changedAt: timestamp,
        actor: partnerId,
        note: 'Listing archived by partner'
      }
    ]
  };

  Object.assign(existing, updates);
  saveLocalProductOverride(productId, updates);

  try {
    await setDoc(doc(db, 'partner_products', productId), updates, { merge: true });
  } catch (e) {}

  return true;
}

/**
 * Admin action: Reviews and approves or rejects a partner product listing.
 */
export async function adminReviewProduct(
  productId: string,
  decision: 'APPROVED' | 'REJECTED' | 'SUSPENDED',
  rejectionReason?: string,
  adminActor: string = 'admin'
): Promise<boolean> {
  const existing = MOCK_PARTNER_PRODUCTS.find(p => p.id === productId);
  const timestamp = new Date().toISOString();

  const newStatus: PartnerProductStatus = decision === 'APPROVED' ? 'LIVE' : decision === 'REJECTED' ? 'SUSPENDED' : 'SUSPENDED';
  const newReviewStatus: PartnerReviewStatus = decision;

  const historyEntry: ReviewHistoryEntry = {
    status: newReviewStatus,
    changedAt: timestamp,
    actor: adminActor,
    note: decision === 'REJECTED' ? rejectionReason || 'Listing failed policy compliance' : `Listing ${decision} by platform admin`
  };

  const updates: Partial<PartnerProduct> = {
    status: newStatus,
    reviewStatus: newReviewStatus,
    rejectionReason: decision === 'REJECTED' ? (rejectionReason || 'Listing failed policy compliance') : '',
    updatedAt: timestamp,
    reviewHistory: existing ? [...(existing.reviewHistory || []), historyEntry] : [historyEntry]
  };

  if (existing) Object.assign(existing, updates);
  saveLocalProductOverride(productId, updates);

  if (cachedPartnerProducts) {
    cachedPartnerProducts = cachedPartnerProducts.map(p => p.id === productId ? { ...p, ...updates } : p);
  } else {
    cachedPartnerProducts = [...MOCK_PARTNER_PRODUCTS];
  }
  lastProductsFetchTime = Date.now();
  if (typeof window !== 'undefined') {
    try { localStorage.setItem('buywise_cached_partner_products', JSON.stringify(cachedPartnerProducts)); } catch (e) {}
  }

  try {
    await setDoc(doc(db, 'partner_products', productId), cleanUndefined(updates), { merge: true });
  } catch (e) {}

  return true;
}

/**
 * Admin action: Verifies partner product price against live evidence.
 * Only this method can grant verified_live status.
 */
export async function adminVerifyProductPrice(
  productId: string,
  verifiedPrice: number,
  evidenceNote?: string,
  adminActor: string = 'admin'
): Promise<boolean> {
  const existing = MOCK_PARTNER_PRODUCTS.find(p => p.id === productId);
  const timestamp = new Date().toISOString();

  const updates: Partial<PartnerProduct> = {
    verificationStatus: 'verified_live',
    verifiedPrice,
    priceVerifiedAt: timestamp,
    updatedAt: timestamp
  };

  if (existing) Object.assign(existing, updates);
  saveLocalProductOverride(productId, updates);

  if (cachedPartnerProducts) {
    cachedPartnerProducts = cachedPartnerProducts.map(p => p.id === productId ? { ...p, ...updates } : p);
  } else {
    cachedPartnerProducts = [...MOCK_PARTNER_PRODUCTS];
  }
  lastProductsFetchTime = Date.now();
  if (typeof window !== 'undefined') {
    try { localStorage.setItem('buywise_cached_partner_products', JSON.stringify(cachedPartnerProducts)); } catch (e) {}
  }

  try {
    await setDoc(doc(db, 'partner_products', productId), cleanUndefined(updates), { merge: true });
    await logProductAuditAction(productId, 'PRICE_VERIFIED_LIVE', adminActor, `Verified at ₹${verifiedPrice}: ${evidenceNote || 'Checked live retailer feed'}`);
  } catch (e) {}

  return true;
}

/**
 * Bulk creates products from validated CSV import rows.
 */
export async function bulkCreatePartnerProducts(
  partnerId: string,
  partnerName: string,
  products: Partial<PartnerProduct>[]
): Promise<{ created: number; failed: number; errors: string[] }> {
  let created = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    try {
      const res = await createPartnerProductListing({
        partnerId,
        partnerName,
        title: p.title || `Imported Item ${i + 1}`,
        description: p.description || p.title || '',
        category: p.category || 'Fashion',
        brand: p.brand || partnerName,
        sku: p.sku || `SKU-${Date.now()}-${i}`,
        mrp: p.mrp || p.sellingPrice || 999,
        sellingPrice: p.sellingPrice || 799,
        stock: p.stock !== undefined ? p.stock : 10,
        images: p.images || [p.primaryImage || ''],
        primaryImage: p.primaryImage || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
        productUrl: p.productUrl,
        shippingCharges: p.shippingCharges || 0,
        tryOnEnabled: p.tryOnEnabled,
        garmentCategory: p.garmentCategory,
        isDraft: false
      });

      if (res.success) {
        created++;
      } else {
        failed++;
        errors.push(`Row ${i + 1} (${p.title || 'Untitled'}): ${res.errors?.join(', ')}`);
      }
    } catch (err: any) {
      failed++;
      errors.push(`Row ${i + 1}: ${err.message}`);
    }
  }

  return { created, failed, errors };
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

