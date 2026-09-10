import { AuthoritativePaymentOrder, WebhookEventPayload, PaymentProvider } from '../types';

export interface PaymentGatewayOrderResponse {
  gatewayOrderId: string;
  provider: PaymentProvider;
  currency: string;
  amount: number;
  checkoutPayload: Record<string, any>;
}

export interface PaymentGatewayAdapter {
  provider: PaymentProvider;
  createGatewayOrder(order: AuthoritativePaymentOrder): Promise<PaymentGatewayOrderResponse>;
  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean;
  verifyWebhookSignature(payload: WebhookEventPayload, signatureHeader: string): boolean;
}
