import { NextRequest, NextResponse } from 'next/server';
import { getPrimeEntitlement } from '@/lib/prime/primeEntitlementService';
import { AUTHORITATIVE_PRIME_PLANS } from '@/lib/prime/types';

export const dynamic = 'force-static';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const userEmail = searchParams.get('userEmail') || undefined;

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing userId parameter' 
      }, { status: 400 });
    }

    const entitlement = await getPrimeEntitlement(userId, userEmail);
    const planConfig = AUTHORITATIVE_PRIME_PLANS[entitlement.plan];

    return NextResponse.json({
      success: true,
      entitlement,
      planConfig,
      paymentsEnabled: process.env.PRIME_PAYMENTS_ENABLED === 'true',
      disclosure: 'COMMERCIAL PAYMENT GATEWAY NOT LIVE',
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to fetch Prime entitlement' 
    }, { status: 500 });
  }
}
