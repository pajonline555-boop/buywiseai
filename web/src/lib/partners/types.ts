export type ProductSource = 'AFFILIATE' | 'PARTNER' | 'DIRECT';

export type FulfillmentType = 'EXTERNAL_RETAILER' | 'PARTNER_FULFILLED' | 'BUYWISE_FULFILLED';

export type PartnerStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'SUSPENDED' | 'REJECTED';

export type PartnerProductStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'LIVE' | 'OUT_OF_STOCK' | 'PAUSED' | 'ARCHIVED' | 'SUSPENDED';

export type OrderStatus = 
  | 'PENDING'
  | 'PAYMENT_CONFIRMED'
  | 'FULFILLMENT_PENDING'
  | 'PARTNER_NOTIFIED'
  | 'PARTNER_NOTIFICATION_FAILED'
  | 'PARTNER_ACKNOWLEDGED'
  | 'NEW_ORDER' 
  | 'ACCEPTED' 
  | 'PARTNER_REJECTED'
  | 'PROCESSING'
  | 'PACKING' 
  | 'SHIPPED' 
  | 'OUT_FOR_DELIVERY' 
  | 'DELIVERED' 
  | 'CANCELLED' 
  | 'RETURN_REQUESTED'
  | 'RETURN_APPROVED'
  | 'RETURNED'
  | 'INSPECTED'
  | 'RESTOCKED';

export type CommissionType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export type PartnerCategory = 
  | 'Fashion'
  | 'Fashion & Clothing'
  | 'Undergarments & Lingerie'
  | 'Jewellery' 
  | 'Home & Living' 
  | 'Electronics' 
  | 'Mobiles & Smartphones'
  | 'Audio & Headphones'
  | 'E-Commerce & Retail'
  | 'Beauty & Personal Care' 
  | 'Local Brands' 
  | 'Exclusive Offers';

export interface Partner {
  id: string;
  companyName: string;
  brandName: string;
  email: string;
  phone: string;
  category: PartnerCategory;
  gstNumber?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  status: PartnerStatus;
  commissionType: CommissionType;
  commissionValue: number; // e.g. 20 for 20%
  bankDetails?: {
    accountHolder: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  buywiseCommissionEarned: number;
  netPayable: number;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerProduct {
  id: string;
  partnerId: string;
  partnerName: string;
  title: string;
  description: string;
  category: PartnerCategory;
  subcategory?: string;
  brand: string;
  sku: string;
  mrp: number;
  sellingPrice: number;
  stock: number;
  weightGrams?: number;
  sizes?: string[];
  colors?: string[];
  images: string[];
  primaryImage: string;
  fulfillment: FulfillmentType;
  source: ProductSource;
  tryOnEnabled: boolean;
  garmentCategory?: 'upper_body' | 'lower_body' | 'dresses' | 'saree' | 'accessories';
  returnPolicy: string;
  warranty: string;
  gstPercent: number;
  status: PartnerProductStatus;
  commissionType: CommissionType;
  commissionValue: number;
  productUrl?: string;
  rating?: number;
  reviewCount?: number;
  slug?: string;
  smartValueScore?: number;
  shoppingTrustScore?: number;
  shippingEstimate?: string;
  isIndexable?: boolean;
  fulfillmentMethod?: 'PARTNER_API' | 'PARTNER_PORTAL' | 'SECURE_EMAIL' | 'MANUAL_ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  title: string;
  sku: string;
  primaryImage: string;
  quantity: number;
  unitPrice: number;
  mrp: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  updatedAt: string;
  note?: string;
}

export interface PartnerOrder {
  id: string;
  orderNumber: string;
  partnerId: string;
  partnerName: string;
  customerUserId?: string;
  shippingAddress: ShippingAddress;
  shippingAddressSnapshot?: ShippingAddress;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  shippingFee: number;
  totalAmount: number;
  buywiseCommission: number;
  partnerNetPayout: number;
  orderStatus: OrderStatus;
  fulfillmentStatus?: string;
  correlationId?: string;
  fulfillmentRecordId?: string;
  courierCarrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippedAt?: string;
  deliveredAt?: string;
  returnReason?: string;
  returnCondition?: string;
  refundStatus?: string;
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}
