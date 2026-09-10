export type PaymentProvider = 'RAZORPAY' | 'CASHFREE' | 'BUYWISE_INTERNAL';

export type PaymentStatus = 
  | 'CHECKOUT_PENDING'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_AUTHORIZED'
  | 'PAYMENT_CAPTURED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_REFUNDED';

export type RefundStatus = 
  | 'REFUND_REQUESTED'
  | 'REFUND_PROCESSING'
  | 'REFUND_COMPLETED'
  | 'REFUND_FAILED';

export type ReconciliationStatus = 
  | 'MATCHED'
  | 'MISMATCH_PENDING'
  | 'RECONCILED';

export type ReturnCondition = 'RESTOCKABLE' | 'DAMAGED' | 'DEFECTIVE' | 'NON_RETURNABLE';

export interface InventoryStockState {
  availableStock: number;
  reservedStock: number;
  soldStock: number;
}

export interface PaymentOrderRequest {
  partnerId: string;
  items: {
    productId: string;
    sku: string;
    quantity: number;
  }[];
  shippingAddress: {
    fullName: string;
    phone: string;
    email: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  paymentProvider: PaymentProvider;
}

export interface AuthoritativePaymentOrder {
  orderId: string;
  orderNumber: string;
  paymentGatewayOrderId: string;
  paymentProvider: PaymentProvider;
  currency: string;
  subtotal: number;
  taxAmount: number;
  shippingFee: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  refundStatus?: RefundStatus;
  reconciliationStatus?: ReconciliationStatus;
  createdAt: string;
  expiresAt: string;
  items: {
    productId: string;
    title: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
}

export interface WebhookEventPayload {
  eventId: string;
  provider: PaymentProvider;
  eventType: string;
  paymentGatewayOrderId: string;
  paymentGatewayPaymentId?: string;
  amount: number;
  currency: string;
  signature: string;
  timestamp: string;
}

export interface RefundRecord {
  refundId: string;
  orderId: string;
  paymentGatewayPaymentId: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  createdAt: string;
  completedAt?: string;
}

export interface ReconciliationQueueItem {
  id: string;
  orderId: string;
  paymentGatewayOrderId: string;
  buywiseStatus: PaymentStatus;
  gatewayStatus: string;
  buywiseAmount: number;
  gatewayAmount: number;
  discrepancyReason: string;
  reconciliationStatus: ReconciliationStatus;
  flaggedAt: string;
  resolvedAt?: string;
}

export interface PaymentKillSwitchConfig {
  paymentsEnabled: boolean;
  disabledReason?: string;
  updatedBy: string;
  updatedAt: string;
}
