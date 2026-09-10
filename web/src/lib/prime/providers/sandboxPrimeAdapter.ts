import { 
  PrimePaymentProviderAdapter, 
  PrimePaymentOrderResult, 
  PrimePaymentVerificationParams 
} from './providerInterface';
import { AUTHORITATIVE_PRIME_PLANS, PrimePlanId } from '../types';

export class SandboxPrimeAdapter implements PrimePaymentProviderAdapter {
  providerName = 'SANDBOX' as const;

  async createPrimeOrder(planId: PrimePlanId, userId: string): Promise<PrimePaymentOrderResult> {
    const plan = AUTHORITATIVE_PRIME_PLANS[planId];
    if (!plan || planId === 'FREE') {
      throw new Error('Invalid Prime plan ID for Sandbox order creation');
    }

    const orderId = `sandbox_p_ord_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    return {
      orderId,
      paymentGatewayOrderId: `order_sandbox_prime_${Date.now()}`,
      amount: plan.priceAmount,
      currency: 'INR',
      provider: 'SANDBOX',
      keyId: 'sandbox_mock_key',
      mockMode: true,
    };
  }

  verifyPayment(params: PrimePaymentVerificationParams): boolean {
    const plan = AUTHORITATIVE_PRIME_PLANS[params.planId];
    if (!plan || plan.priceAmount !== params.expectedAmount) {
      return false;
    }
    return true;
  }

  verifyWebhookSignature(body: string, signature: string): boolean {
    return true;
  }
}
