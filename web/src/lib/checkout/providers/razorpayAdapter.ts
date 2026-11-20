import crypto from 'crypto';
import { PaymentGatewayAdapter, PaymentGatewayOrderResponse } from './types';
import { AuthoritativePaymentOrder, WebhookEventPayload, PaymentProvider } from '../types';

export class RazorpayAdapter implements PaymentGatewayAdapter {
  provider: PaymentProvider = 'RAZORPAY';

  /**
   * Evaluates whether Razorpay gateway is currently enabled by administration.
   * STRICT SECURITY RULE: Default is FALSE until keys and merchant KYC are verified.
   */
  static isEnabled(): boolean {
    return process.env.RAZORPAY_ENABLED === 'true';
  }

  async createGatewayOrder(order: AuthoritativePaymentOrder): Promise<PaymentGatewayOrderResponse> {
    if (!RazorpayAdapter.isEnabled()) {
      throw new Error(
        'Razorpay payment gateway is currently disabled (RAZORPAY_ENABLED=false) pending merchant account verification and webhook registration. Please proceed with official WhatsApp ordering at +91 8955438945.'
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error('Razorpay production credentials (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) are not configured on server.');
    }

    // Call Razorpay official Orders API server-side
    const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const amountInPaise = Math.round(order.totalAmount * 100);

    try {
      const res = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: order.currency || 'INR',
          receipt: order.orderNumber,
          notes: {
            orderId: order.orderId,
            merchant: 'BuyWise Partner Store',
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.id) {
        throw new Error(data.error?.description || 'Failed to create order on Razorpay servers');
      }

      return {
        gatewayOrderId: data.id,
        provider: this.provider,
        currency: data.currency || order.currency,
        amount: data.amount,
        checkoutPayload: {
          key: keyId,
          amount: data.amount,
          currency: data.currency,
          name: 'BuyWise AI Partner Store',
          description: `Order ${order.orderNumber}`,
          order_id: data.id,
          theme: { color: '#00ff88' },
        },
      };
    } catch (apiErr: unknown) {
      const msg = apiErr instanceof Error ? apiErr.message : 'Order initialization failed';
      console.error('[RazorpayAdapter] Live order creation error:', msg);
      throw new Error(`Razorpay gateway error: ${msg}`);
    }
  }

  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    const secretKey = process.env.RAZORPAY_KEY_SECRET;
    if (!secretKey) {
      console.error('[RazorpayAdapter] Verification failed: RAZORPAY_KEY_SECRET missing');
      return false;
    }

    const body = `${orderId}|${paymentId}`;
    const expected = crypto.createHmac('sha256', secretKey).update(body).digest('hex');

    // Secure timing-safe signature comparison
    try {
      const sigBuf = Buffer.from(signature, 'hex');
      const expBuf = Buffer.from(expected, 'hex');
      if (sigBuf.length !== expBuf.length) return false;
      return crypto.timingSafeEqual(sigBuf, expBuf);
    } catch {
      return false;
    }
  }

  verifyWebhookSignature(payload: WebhookEventPayload | string, signatureHeader: string): boolean {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.PAYMENT_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[RazorpayAdapter] Webhook verification failed: RAZORPAY_WEBHOOK_SECRET missing');
      return false;
    }

    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const expected = crypto.createHmac('sha256', webhookSecret).update(payloadString).digest('hex');

    try {
      const sigBuf = Buffer.from(signatureHeader, 'hex');
      const expBuf = Buffer.from(expected, 'hex');
      if (sigBuf.length !== expBuf.length) return false;
      return crypto.timingSafeEqual(sigBuf, expBuf);
    } catch {
      return false;
    }
  }
}
