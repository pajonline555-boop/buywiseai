export type FulfillmentMethod = 'PARTNER_API' | 'PARTNER_PORTAL' | 'SECURE_EMAIL' | 'MANUAL_ADMIN';

export type OperationalFulfillmentStatus = 
  | 'PENDING'
  | 'PAYMENT_CONFIRMED'
  | 'FULFILLMENT_PENDING'
  | 'PARTNER_NOTIFIED'
  | 'PARTNER_NOTIFICATION_FAILED'
  | 'PARTNER_ACKNOWLEDGED'
  | 'PARTNER_ACK_TIMEOUT'
  | 'ACCEPTED'
  | 'PARTNER_REJECTED'
  | 'PROCESSING'
  | 'PACKING'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCEL_REQUESTED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURN_APPROVED'
  | 'RETURN_PICKUP_SCHEDULED'
  | 'RETURN_IN_TRANSIT'
  | 'ITEM_RECEIVED'
  | 'INSPECTED';

export type ReturnCondition = 
  | 'RESTOCKABLE'
  | 'DAMAGED'
  | 'DEFECTIVE'
  | 'WRONG_ITEM'
  | 'MISSING_PARTS'
  | 'UNSELLABLE';

export type RefundStatus = 
  | 'NOT_APPLICABLE'
  | 'REFUND_PENDING'
  | 'REFUND_APPROVED'
  | 'REFUND_PROCESSING'
  | 'REFUNDED'
  | 'REFUND_FAILED';

export interface ShippingAddressSnapshot {
  recipientName: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  locality?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  deliveryInstructions?: string;
  shippingAddressId?: string;
}

export interface PartnerFulfillmentRecord {
  fulfillmentId: string;
  orderId: string;
  partnerId: string;
  partnerOrderReference?: string;
  fulfillmentMethod: FulfillmentMethod;
  status: OperationalFulfillmentStatus;
  notificationStatus: 'PENDING' | 'SENT' | 'FAILED' | 'ACKNOWLEDGED';
  notificationAttempts: number;
  maxAttempts: number;
  lastNotificationAttemptAt?: string;
  nextRetryAt?: string;
  acknowledgedAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippedAt?: string;
  deliveredAt?: string;
  returnStatus?: OperationalFulfillmentStatus;
  returnReason?: string;
  inspectionCondition?: ReturnCondition;
  inspectionNotes?: string;
  refundStatus?: RefundStatus;
  lastError?: string;
  correlationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerFulfillmentAuditLog {
  id: string;
  orderId: string;
  fulfillmentId: string;
  partnerId: string;
  actorType: 'SYSTEM' | 'PARTNER' | 'ADMIN' | 'CUSTOMER';
  actorId: string;
  action: string;
  previousStatus?: string;
  newStatus?: string;
  timestamp: string;
  metadata?: Record<string, any>;
  correlationId: string;
}

export interface PartnerOrderSubmissionPayload {
  fulfillmentId: string;
  orderId: string;
  partnerId: string;
  correlationId: string;
  partnerSku: string;
  productId: string;
  productTitle: string;
  variantId?: string;
  quantity: number;
  shippingAddress: ShippingAddressSnapshot;
  shippingMethod?: string;
  customerInstructions?: string;
  returnPolicyRef?: string;
  createdAt: string;
}

export interface PartnerReturnRequestPayload {
  fulfillmentId: string;
  orderId: string;
  partnerId: string;
  customerUserId: string;
  reason: 'DAMAGED' | 'WRONG_ITEM' | 'WRONG_SIZE' | 'NOT_AS_EXPECTED' | 'DEFECTIVE' | 'OTHER';
  details?: string;
  requestedAt: string;
  correlationId: string;
}

export interface TrackingInfo {
  carrier: string;
  trackingNumber: string;
  trackingUrl?: string;
  shippedAt?: string;
  estimatedDeliveryDate?: string;
}

export interface PartnerFulfillmentResult {
  success: boolean;
  partnerOrderReference?: string;
  message: string;
  status: OperationalFulfillmentStatus;
  errorCode?: string;
  rawResponse?: any;
}

export interface PartnerFulfillmentProvider {
  name: string;
  fulfillmentMethod: FulfillmentMethod;

  submitOrder(payload: PartnerOrderSubmissionPayload): Promise<PartnerFulfillmentResult>;
  getOrderStatus(fulfillmentId: string): Promise<PartnerFulfillmentResult>;
  cancelOrder(fulfillmentId: string, reason: string): Promise<PartnerFulfillmentResult>;
  submitReturnRequest(payload: PartnerReturnRequestPayload): Promise<PartnerFulfillmentResult>;
  getReturnStatus(fulfillmentId: string): Promise<PartnerFulfillmentResult>;
  updateTracking(fulfillmentId: string, trackingInfo: TrackingInfo): Promise<PartnerFulfillmentResult>;
  healthCheck(): Promise<{ status: 'CONNECTED' | 'DEGRADED' | 'NOT_CONFIGURED' | 'DISABLED' | 'ERROR'; message: string }>;
}
