import { NextRequest, NextResponse } from 'next/server';
import { PRIME_ENTITLEMENTS_STORE } from '@/lib/prime/primeEntitlementService';

export const dynamic = 'force-static';

const ADMIN_EMAILS = ['pajonline555@gmail.com', 'akshayman224@gmail.com'];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const adminEmail = searchParams.get('adminEmail');

    if (!adminEmail || !ADMIN_EMAILS.includes(adminEmail.toLowerCase().trim())) {
      return NextResponse.json({ 
        success: false, 
        error: 'UNAUTHORIZED: Admin credentials required' 
      }, { status: 403 });
    }

    const allEntitlements = Array.from(PRIME_ENTITLEMENTS_STORE.values());
    const activeCount = allEntitlements.filter(e => e.status === 'ACTIVE' && e.plan !== 'FREE').length;
    const expiredCount = allEntitlements.filter(e => e.status === 'EXPIRED').length;
    const refundedCount = allEntitlements.filter(e => e.status === 'REFUNDED').length;

    return NextResponse.json({
      success: true,
      metrics: {
        totalTracked: allEntitlements.length,
        activePrimeMemberships: activeCount,
        expiredMemberships: expiredCount,
        refundedMemberships: refundedCount,
      },
      entitlements: allEntitlements,
      reconciliationStatus: 'HEALTHY',
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to fetch reconciliation metrics' 
    }, { status: 500 });
  }
}
