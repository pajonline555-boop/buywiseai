import { NextRequest, NextResponse } from 'next/server';
import { RazorpayPrimeAdapter } from '@/lib/prime/providers/razorpayPrimeAdapter';
import { SandboxPrimeAdapter } from '@/lib/prime/providers/sandboxPrimeAdapter';
import { AUTHORITATIVE_PRIME_PLANS, PrimePlanId } from '@/lib/prime/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planId, userId, provider = 'RAZORPAY_WEB' } = body;

    if (!userId || !planId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: userId and planId' 
      }, { status: 400 });
    }

    if (!AUTHORITATIVE_PRIME_PLANS[planId as PrimePlanId] || planId === 'FREE') {
      return NextResponse.json({ 
        success: false, 
        error: `Invalid Prime plan ID: ${planId}` 
      }, { status: 400 });
    }

    // Kill switch check
    const isPaymentsEnabled = process.env.PRIME_PAYMENTS_ENABLED === 'true';
    const adapter = (provider === 'SANDBOX' || !isPaymentsEnabled)
      ? new SandboxPrimeAdapter()
      : new RazorpayPrimeAdapter();

    const orderResult = await adapter.createPrimeOrder(planId as PrimePlanId, userId);

    return NextResponse.json({
      success: true,
      order: orderResult,
      disclosure: 'COMMERCIAL PAYMENT GATEWAY NOT LIVE. Operating in Sandbox/Readiness Mode.',
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to create Prime order' 
    }, { status: 500 });
  }
}
