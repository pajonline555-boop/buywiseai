import { PrimePlanId, PrimeProviderSource } from '../types';

export interface PrimePaymentOrderResult {
  orderId: string;
  paymentGatewayOrderId: string;
  amount: number;
  currency: 'INR';
  provider: PrimeProviderSource;
  keyId?: string;
  mockMode: boolean;
}

export interface PrimePaymentVerificationParams {
  orderId: string;
  paymentId: string;
  signature: string;
  planId: PrimePlanId;
  expectedAmount: number;
}

export interface PrimePaymentProviderAdapter {
  providerName: PrimeProviderSource;
  createPrimeOrder(planId: PrimePlanId, userId: string): Promise<PrimePaymentOrderResult>;
  verifyPayment(params: PrimePaymentVerificationParams): boolean;
  verifyWebhookSignature(body: string, signature: string): boolean;
}
