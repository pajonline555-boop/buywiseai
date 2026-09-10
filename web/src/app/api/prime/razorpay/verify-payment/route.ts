import { NextRequest, NextResponse } from 'next/server';
import { RazorpayPrimeAdapter } from '@/lib/prime/providers/razorpayPrimeAdapter';
import { SandboxPrimeAdapter } from '@/lib/prime/providers/sandboxPrimeAdapter';
import { activatePrime } from '@/lib/prime/primeEntitlementService';
import { AUTHORITATIVE_PRIME_PLANS, PrimePlanId } from '@/lib/prime/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, paymentId, signature, planId, userId, userEmail, provider = 'RAZORPAY_WEB' } = body;

    if (!userId || !planId || !orderId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required parameters for verification' 
      }, { status: 400 });
    }

    const plan = AUTHORITATIVE_PRIME_PLANS[planId as PrimePlanId];
    if (!plan || planId === 'FREE') {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid plan ID specified' 
      }, { status: 400 });
    }

    const adapter = (provider === 'SANDBOX' || process.env.PRIME_PAYMENTS_ENABLED !== 'true')
      ? new SandboxPrimeAdapter()
      : new RazorpayPrimeAdapter();

    const isValid = adapter.verifyPayment({
      orderId,
      paymentId: paymentId || 'pay_mock_sandbox',
      signature: signature || 'sandbox_sig_mock',
      planId: planId as PrimePlanId,
      expectedAmount: plan.priceAmount,
    });

    if (!isValid) {
      return NextResponse.json({ 
        success: false, 
        error: 'INVALID_SIGNATURE_OR_AMOUNT: Payment verification rejected by server.' 
      }, { status: 400 });
    }

    // Activate Prime Entitlement Server-Side
    const entitlement = await activatePrime(
      userId,
      planId as PrimePlanId,
      provider === 'SANDBOX' ? 'SANDBOX' : 'RAZORPAY_WEB',
      paymentId || orderId,
      userEmail,
      'RAZORPAY_PAYMENT_VERIFIER'
    );

    return NextResponse.json({
      success: true,
      entitlement,
      message: `Prime membership activated: ${plan.name}`,
      disclosure: 'COMMERCIAL PAYMENT GATEWAY NOT LIVE',
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Payment verification failed' 
    }, { status: 500 });
  }
}
