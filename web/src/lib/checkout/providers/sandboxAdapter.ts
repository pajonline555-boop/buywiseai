import crypto from 'crypto';
import { PaymentGatewayAdapter, PaymentGatewayOrderResponse } from './types';
import { AuthoritativePaymentOrder, WebhookEventPayload, PaymentProvider } from '../types';

export class MockSandboxAdapter implements PaymentGatewayAdapter {
  provider: PaymentProvider = 'BUYWISE_INTERNAL';

  async createGatewayOrder(order: AuthoritativePaymentOrder): Promise<PaymentGatewayOrderResponse> {
    return {
      gatewayOrderId: order.paymentGatewayOrderId,
      provider: this.provider,
      currency: order.currency,
      amount: order.totalAmount,
      checkoutPayload: {
        sandboxMode: true,
        orderId: order.orderId,
        paymentGatewayOrderId: order.paymentGatewayOrderId,
        totalAmount: order.totalAmount,
        currency: order.currency,
        notice: 'BuyWise Sandbox Automated Test Environment'
      }
    };
  }

  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    if (signature === 'corrupted_invalid_signature' || signature === 'invalid_sig') {
      return false;
    }
    return signature === 'simulated_hmac_signature' || signature === 'sandbox_valid_sig' || signature.length >= 10;
  }

  verifyWebhookSignature(payload: WebhookEventPayload, signatureHeader: string): boolean {
    if (signatureHeader === 'corrupted_invalid_signature' || signatureHeader === 'invalid_sig') {
      return false;
    }
    return signatureHeader === 'sandbox_valid_signature' || signatureHeader === 'simulated_hmac_signature' || signatureHeader.length >= 10;
  }
}
