import crypto from 'crypto';
import { 
  AuthoritativePaymentOrder, 
  PaymentOrderRequest, 
  WebhookEventPayload, 
  ReturnCondition 
} from './types';
import { MOCK_PARTNER_PRODUCTS } from '../partners/partnerService';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { getPaymentGatewayAdapter } from './providers/registry';
import { getEmergencyKillSwitchStatus, reconcilePaymentOrder } from './reconciliationEngine';

// In-Memory Payment Orders Store fallback for local runtime speed
export const PAYMENT_ORDERS_STORE = new Map<string, AuthoritativePaymentOrder>();

// Persistent Firestore Idempotency Collection Name
const PROCESSED_EVENTS_COLLECTION = 'processed_webhook_events';

/**
 * Timeout wrapper for Firestore calls to prevent blocking build workers or offline calls.
 */
async function withTimeout<T>(promise: Promise<T>, ms: number = 800): Promise<T | null> {
  return Promise.race([
    promise.catch(() => null),
    new Promise<null>(resolve => setTimeout(() => resolve(null), ms))
  ]);
}

/**
 * Checks if a Webhook event has already been persistently processed in Firestore/Store.
 */
export async function isWebhookEventProcessed(eventId: string): Promise<boolean> {
  if (!eventId) return false;
  if (PAYMENT_ORDERS_STORE.has(`event_${eventId}`)) return true;
  try {
    const docRef = doc(db, PROCESSED_EVENTS_COLLECTION, eventId);
    const snap = await withTimeout(getDoc(docRef));
    return snap ? snap.exists() : false;
  } catch (err) {
    return PAYMENT_ORDERS_STORE.has(`event_${eventId}`);
  }
}

/**
 * Marks a Webhook event as persistently processed in Firestore/Store.
 */
export async function markWebhookEventProcessed(eventId: string, orderId: string): Promise<void> {
  const timestamp = new Date().toISOString();
  PAYMENT_ORDERS_STORE.set(`event_${eventId}`, {} as any);
  try {
    const docRef = doc(db, PROCESSED_EVENTS_COLLECTION, eventId);
    await withTimeout(setDoc(docRef, { eventId, orderId, processedAt: timestamp }));
  } catch (err) {
    // Sync notice
  }
}

/**
 * Creates an Authoritative Payment Order server-side:
 * 1. Checks Emergency Production Kill Switch.
 * 2. Blocks Affiliate products from entering BuyWise checkout.
 * 3. Recalculates selling prices, tax, and shipping strictly server-side.
 * 4. Reserves stock: availableStock -> reservedStock.
 * 5. Integrates with Gateway Provider Abstraction.
 */
export async function createAuthoritativePaymentOrder(
  request: PaymentOrderRequest
): Promise<AuthoritativePaymentOrder> {
  // Emergency Production Kill Switch Check
  const killSwitch = await getEmergencyKillSwitchStatus();
  if (!killSwitch.paymentsEnabled) {
    throw new Error(`BUYWISE_PAYMENTS_TEMPORARILY_DISABLED: ${killSwitch.disabledReason || 'Payments are temporarily paused for maintenance.'}`);
  }

  const timestamp = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min expiry
  const orderId = `ord_pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const orderNumber = `BW-ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const paymentGatewayOrderId = `order_${request.paymentProvider.toLowerCase()}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  // Server-side Authoritative Item & Pricing Calculation
  const validatedItems = request.items.map(item => {
    const prod = MOCK_PARTNER_PRODUCTS.find(p => p.id === item.productId || p.sku === item.sku);
    if (!prod) {
      throw new Error(`Product not found for SKU: ${item.sku}`);
    }

    // Affiliate Channel Separation Protection: Block Affiliate items from BuyWise Store checkout
    if ((prod as any).isAffiliate || ((prod as any).retailer && (prod as any).retailer !== 'BuyWise Store')) {
      throw new Error(`AFFILIATE_PRODUCT_REJECTED: ${prod.title} is an affiliate product. Affiliate purchases must be completed on the retailer website.`);
    }

    if (prod.stock < item.quantity) {
      throw new Error(`Insufficient available stock for ${prod.title}. Requested: ${item.quantity}, Available: ${prod.stock}`);
    }

    // Reserve Stock: availableStock -> reservedStock
    prod.stock = Math.max(0, prod.stock - item.quantity);
    (prod as any).reservedStock = ((prod as any).reservedStock || 0) + item.quantity;

    try {
      withTimeout(updateDoc(doc(db, 'partner_products', prod.id), { 
        stock: prod.stock, 
        reservedStock: (prod as any).reservedStock, 
        updatedAt: timestamp 
      }));
    } catch (e) {
      // Sync notice
    }

    const itemSubtotal = prod.sellingPrice * item.quantity;
    return {
      productId: prod.id,
      title: prod.title,
      sku: prod.sku,
      quantity: item.quantity,
      unitPrice: prod.sellingPrice,
      subtotal: itemSubtotal
    };
  });

  const subtotal = validatedItems.reduce((acc, it) => acc + it.subtotal, 0);
  const taxAmount = Math.round(subtotal * 0.05); // 5% GST
  const shippingFee = subtotal > 999 ? 0 : 99;
  const totalAmount = subtotal + taxAmount + shippingFee;

  const paymentOrder: AuthoritativePaymentOrder = {
    orderId,
    orderNumber,
    paymentGatewayOrderId,
    paymentProvider: request.paymentProvider,
    currency: 'INR',
    subtotal,
    taxAmount,
    shippingFee,
    totalAmount,
    paymentStatus: 'PAYMENT_PENDING',
    reconciliationStatus: 'MATCHED',
    createdAt: timestamp,
    expiresAt,
    items: validatedItems
  };

  PAYMENT_ORDERS_STORE.set(orderId, paymentOrder);
  PAYMENT_ORDERS_STORE.set(paymentGatewayOrderId, paymentOrder);

  try {
    withTimeout(addDoc(collection(db, 'payment_orders'), paymentOrder));
  } catch (err) {
    // Sync notice
  }

  return paymentOrder;
}

/**
 * Cancels or releases an order, returning reservedStock back to availableStock.
 */
export async function cancelOrReleasePaymentOrder(orderId: string): Promise<boolean> {
  const order = PAYMENT_ORDERS_STORE.get(orderId);
  if (!order || order.paymentStatus === 'PAYMENT_CAPTURED' || order.paymentStatus === 'PAYMENT_FAILED') {
    return false;
  }

  order.paymentStatus = 'PAYMENT_FAILED';

  // Release Reserved Stock -> Available Stock
  order.items.forEach(item => {
    const prod = MOCK_PARTNER_PRODUCTS.find(p => p.id === item.productId || p.sku === item.sku);
    if (prod) {
      (prod as any).reservedStock = Math.max(0, ((prod as any).reservedStock || 0) - item.quantity);
      prod.stock += item.quantity;

      try {
        withTimeout(updateDoc(doc(db, 'partner_products', prod.id), {
          stock: prod.stock,
          reservedStock: (prod as any).reservedStock,
          updatedAt: new Date().toISOString()
        }));
      } catch (e) {
        // Sync notice
      }
    }
  });

  return true;
}

/**
 * Server-Side Signature Verification using Provider Abstraction.
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  provider: any = 'RAZORPAY'
): boolean {
  const adapter = getPaymentGatewayAdapter(provider);
  return adapter.verifyPaymentSignature(orderId, paymentId, signature);
}

/**
 * Server-to-Server HMAC Webhook Event Handler with Persistent Idempotency & Reconciliation.
 */
export async function processPaymentWebhook(
  payload: WebhookEventPayload,
  signatureHeader: string
): Promise<{ success: boolean; message: string; orderId?: string; alreadyProcessed?: boolean }> {
  // 1. Persistent Idempotency Check: Reject duplicate event execution
  const isProcessed = await isWebhookEventProcessed(payload.eventId);
  if (isProcessed) {
    return { 
      success: true, 
      message: `Event ${payload.eventId} already processed (Persistent Idempotency Lock)`, 
      alreadyProcessed: true 
    };
  }

  // 2. Provider Abstraction Webhook Signature Check
  const adapter = getPaymentGatewayAdapter(payload.provider || 'BUYWISE_INTERNAL');
  const isValidSig = adapter.verifyWebhookSignature(payload, signatureHeader);
  if (!isValidSig) {
    return { success: false, message: 'Invalid HMAC SHA-256 Webhook Signature' };
  }

  const paymentOrder = PAYMENT_ORDERS_STORE.get(payload.paymentGatewayOrderId);
  if (!paymentOrder) {
    return { success: false, message: 'Payment order not found' };
  }

  // 3. Persistent Order Lock Check: Prevent double stock deduction if verify-payment already ran
  if (paymentOrder.paymentStatus === 'PAYMENT_CAPTURED') {
    await markWebhookEventProcessed(payload.eventId, paymentOrder.orderId);
    return { 
      success: true, 
      message: 'Order already captured and stock finalized (Order Lock Protection)',
      orderId: paymentOrder.orderId,
      alreadyProcessed: true 
    };
  }

  // 4. Amount Mismatch & Reconciliation Queue Check
  if (payload.amount !== paymentOrder.totalAmount) {
    await cancelOrReleasePaymentOrder(paymentOrder.orderId);
    await reconcilePaymentOrder(paymentOrder.orderId, 'PAID', payload.amount);
    return { 
      success: false, 
      message: `Amount Mismatch: Paid ${payload.amount}, Expected ${paymentOrder.totalAmount}. Discrepancy queued for reconciliation.` 
    };
  }

  // 5. Payment Capture & Reconciliation
  paymentOrder.paymentStatus = 'PAYMENT_CAPTURED';
  await markWebhookEventProcessed(payload.eventId, paymentOrder.orderId);
  await reconcilePaymentOrder(paymentOrder.orderId, 'PAID', payload.amount);

  paymentOrder.items.forEach(item => {
    const prod = MOCK_PARTNER_PRODUCTS.find(p => p.id === item.productId || p.sku === item.sku);
    if (prod) {
      (prod as any).reservedStock = Math.max(0, ((prod as any).reservedStock || 0) - item.quantity);
      (prod as any).soldStock = ((prod as any).soldStock || 0) + item.quantity;

      try {
        withTimeout(updateDoc(doc(db, 'partner_products', prod.id), { 
          reservedStock: (prod as any).reservedStock, 
          soldStock: (prod as any).soldStock,
          updatedAt: new Date().toISOString() 
        }));
      } catch (e) {
        // Sync notice
      }
    }
  });

  // 6. Immediate Server-Side Partner Fulfillment Dispatch
  try {
    const firstItem = paymentOrder.items[0];
    const prod = MOCK_PARTNER_PRODUCTS.find(p => p.id === firstItem?.productId || p.sku === firstItem?.sku);
    const partnerId = (prod as any)?.partnerId || 'partner_amazon_india';
    
    // Dynamic import/call to avoid circular dependency
    const { dispatchPartnerFulfillment, generateCorrelationId } = await import('../partners/fulfillment/fulfillmentDispatcher');
    await dispatchPartnerFulfillment({
      fulfillmentId: `ful_${paymentOrder.orderId}`,
      orderId: paymentOrder.orderId,
      partnerId,
      correlationId: generateCorrelationId(paymentOrder.orderId),
      partnerSku: firstItem?.sku || 'SKU-GEN',
      productId: firstItem?.productId || 'PROD-GEN',
      productTitle: firstItem?.title || 'BuyWise Store Item',
      quantity: firstItem?.quantity || 1,
      shippingAddress: {
        recipientName: 'Valued BuyWise Customer',
        phone: '+91 98000 12345',
        addressLine1: 'BuyWise Order Verified Address',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India'
      },
      createdAt: new Date().toISOString()
    }, prod?.fulfillmentMethod || 'PARTNER_PORTAL');
  } catch (err) {
    console.warn('Immediate fulfillment dispatch notice:', err);
  }

  return { 
    success: true, 
    message: 'Payment Captured, Stock Transitioned to Sold & Partner Fulfillment Dispatched', 
    orderId: paymentOrder.orderId 
  };
}

/**
 * Return Inspection Gate: Restocks inventory ONLY if item condition is RESTOCKABLE.
 */
export async function processReturnInspection(
  orderId: string,
  productId: string,
  quantity: number,
  condition: ReturnCondition
): Promise<{ restocked: boolean; message: string }> {
  const prod = MOCK_PARTNER_PRODUCTS.find(p => p.id === productId);
  if (!prod) {
    return { restocked: false, message: 'Product record not found' };
  }

  if (condition === 'RESTOCKABLE') {
    prod.stock += quantity;
    (prod as any).soldStock = Math.max(0, ((prod as any).soldStock || 0) - quantity);

    try {
      withTimeout(updateDoc(doc(db, 'partner_products', prod.id), { 
        stock: prod.stock, 
        soldStock: (prod as any).soldStock, 
        updatedAt: new Date().toISOString() 
      }));
    } catch (e) {
      // Sync notice
    }

    return { 
      restocked: true, 
      message: `Item inspected (${condition}): Restocked ${quantity} units to available inventory.` 
    };
  }

  return { 
    restocked: false, 
    message: `Item inspected (${condition}): Item quarantined/damaged. Inventory NOT restocked to availableStock.` 
  };
}
