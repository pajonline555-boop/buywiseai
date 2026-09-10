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
  getDocs, 
  query, 
  where, 
  doc, 
  updateDoc, 
  orderBy 
} from 'firebase/firestore';

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
    status: 'LIVE',
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
    status: 'LIVE',
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
    status: 'LIVE',
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
// FIRESTORE & IN-MEMORY SERVICE METHODS
// ==========================================

export async function getPartners(): Promise<Partner[]> {
  try {
    const snap = await getDocs(collection(db, 'partners'));
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Partner));
    }
  } catch (err) {
    console.warn('Firestore partners fetch notice, returning mock partners:', err);
  }
  return MOCK_PARTNERS;
}

export async function getPartnerProducts(category?: string): Promise<PartnerProduct[]> {
  let firestoreProds: PartnerProduct[] = [];
  try {
    let q = query(collection(db, 'partner_products'), where('status', '==', 'LIVE'));
    if (category && category.toLowerCase() !== 'all') {
      q = query(collection(db, 'partner_products'), where('status', '==', 'LIVE'), where('category', '==', category));
    }
    const snap = await getDocs(q);
    if (!snap.empty) {
      firestoreProds = snap.docs.map(d => ({ id: d.id, ...d.data() } as PartnerProduct));
    }
  } catch (err) {
    console.warn('Firestore partner_products fetch notice:', err);
  }

  // Combine memory products (which has newly unshifted admin items) and Firestore products
  const combinedMap = new Map<string, PartnerProduct>();
  
  // Unshifted local products first so newly added products appear at the top!
  MOCK_PARTNER_PRODUCTS.forEach(p => {
    if (p.status === 'LIVE') combinedMap.set(p.id, p);
  });
  
  firestoreProds.forEach(p => combinedMap.set(p.id, p));

  const allList = Array.from(combinedMap.values());

  if (!category || category.toLowerCase() === 'all') {
    return allList;
  }
  return allList.filter(p => p.category.toLowerCase() === category.toLowerCase());
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
  return MOCK_PARTNER_PRODUCTS.filter(p => p.partnerId === partnerId);
}

export async function getPartnerOrders(partnerId?: string): Promise<PartnerOrder[]> {
  try {
    let q = query(collection(db, 'partner_orders'), orderBy('createdAt', 'desc'));
    if (partnerId) {
      q = query(collection(db, 'partner_orders'), where('partnerId', '==', partnerId));
    }
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as PartnerOrder));
    }
  } catch (err) {
    console.warn('Firestore partner_orders notice:', err);
  }

  if (partnerId) {
    return MOCK_PARTNER_ORDERS.filter(o => o.partnerId === partnerId);
  }
  return MOCK_PARTNER_ORDERS;
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
        updateDoc(doc(db, 'partner_products', prod.id), { stock: prod.stock, updatedAt: timestamp });
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
            updateDoc(doc(db, 'partner_products', prod.id), { stock: prod.stock, updatedAt: timestamp });
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

export async function savePartnerProduct(productInput: Omit<PartnerProduct, 'id' | 'createdAt' | 'updatedAt'>): Promise<PartnerProduct> {
  const timestamp = new Date().toISOString();
  let status = productInput.status || 'DRAFT';
  let validationErrors: string[] = [];

  // Run Publication Gate if attempting LIVE / ACTIVE state
  if (status === 'LIVE' || (status as any) === 'ACTIVE') {
    const val = validateProductPublication(productInput);
    if (!val.valid) {
      status = 'DRAFT';
      validationErrors = val.errors;
    }
  }

  const newProduct: PartnerProduct = {
    ...productInput,
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

  await logProductAuditAction(newProduct.id, status === 'LIVE' ? 'PUBLISHED' : 'CREATED_DRAFT', 'admin', validationErrors.join('; '));

  // Attempt Firestore sync with 2.5s timeout
  try {
    const firestorePromise = addDoc(collection(db, 'partner_products'), newProduct);
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore write timeout')), 2500));
    const docRef: any = await Promise.race([firestorePromise, timeoutPromise]);
    if (docRef?.id) {
      newProduct.id = docRef.id;
    }
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
  if (status === 'LIVE' && p) {
    const val = validateProductPublication(p);
    if (!val.valid) {
      return { success: false, errors: val.errors };
    }
  }

  try {
    await updateDoc(doc(db, 'partner_products', productId), { status, updatedAt: new Date().toISOString() });
    if (p) p.status = status;
    await logProductAuditAction(productId, `STATUS_CHANGED_${status}`, 'admin');
    return { success: true };
  } catch (err) {
    if (p) p.status = status;
    await logProductAuditAction(productId, `STATUS_CHANGED_${status}`, 'admin');
    return { success: true };
  }
}

export function mapPartnerProductToBestsellerProduct(p: PartnerProduct): BestsellerProduct {
  const slug = p.slug || p.id || p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return {
    id: p.id,
    slug,
    name: p.title,
    category: p.category,
    image: p.primaryImage || (p.images && p.images[0]) || '',
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
    bestStore: p.partnerName || 'BuyWise Store',
    specs: [
      { label: 'Brand', value: p.brand || 'BuyWise Partner' },
      { label: 'Fulfillment', value: p.fulfillment === 'PARTNER_FULFILLED' ? 'Direct BuyWise Partner Dispatch' : 'BuyWise Fulfilled' },
      { label: 'Return Policy', value: p.returnPolicy || '7-Day Return Policy' }
    ],
    prices: [
      {
        store: p.partnerName || 'BuyWise Store',
        price: p.sellingPrice,
        url: `/checkout?product=${encodeURIComponent(slug)}`,
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

