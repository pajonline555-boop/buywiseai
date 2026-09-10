import { NextRequest, NextResponse } from 'next/server';
import { GooglePlayPrimeAdapter } from '@/lib/prime/providers/googlePlayPrimeAdapter';
import { activatePrime } from '@/lib/prime/primeEntitlementService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { purchaseToken, productId, userId, userEmail } = body;

    if (!userId || !purchaseToken || !productId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required parameters: userId, purchaseToken, and productId' 
      }, { status: 400 });
    }

    const adapter = new GooglePlayPrimeAdapter();
    const verification = await adapter.verifyPurchaseToken({
      purchaseToken,
      productId,
      userId,
    });

    if (!verification.valid || verification.planId === 'FREE') {
      return NextResponse.json({ 
        success: false, 
        error: verification.reason || 'Google Play purchase verification failed' 
      }, { status: 400 });
    }

    // Activate backend entitlement for Android purchase
    const entitlement = await activatePrime(
      userId,
      verification.planId,
      'GOOGLE_PLAY',
      purchaseToken,
      userEmail,
      'GOOGLE_PLAY_VERIFIER'
    );

    return NextResponse.json({
      success: true,
      entitlement,
      message: 'Google Play Purchase verified. Prime entitlement granted.',
      disclosure: 'COMMERCIAL PAYMENT GATEWAY NOT LIVE',
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Google Play verification error' 
    }, { status: 500 });
  }
}
