import { PaymentProvider } from '../types';
import { PaymentGatewayAdapter } from './types';
import { RazorpayAdapter } from './razorpayAdapter';
import { CashfreeAdapter } from './cashfreeAdapter';
import { MockSandboxAdapter } from './sandboxAdapter';

const adapters: Record<PaymentProvider, PaymentGatewayAdapter> = {
  RAZORPAY: new RazorpayAdapter(),
  CASHFREE: new CashfreeAdapter(),
  BUYWISE_INTERNAL: new MockSandboxAdapter()
};

export function getPaymentGatewayAdapter(provider: PaymentProvider): PaymentGatewayAdapter {
  return adapters[provider] || adapters.BUYWISE_INTERNAL;
}
