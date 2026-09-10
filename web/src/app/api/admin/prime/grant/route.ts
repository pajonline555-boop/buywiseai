import { NextRequest, NextResponse } from 'next/server';
import { grantPrimeByAdmin } from '@/lib/prime/primeEntitlementService';
import { PrimePlanId } from '@/lib/prime/types';

const ADMIN_EMAILS = ['pajonline555@gmail.com', 'akshayman224@gmail.com'];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, planId, adminEmail, customExpiresAt } = body;

    if (!userId || !adminEmail || !planId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: userId, planId, and adminEmail' 
      }, { status: 400 });
    }

    if (!ADMIN_EMAILS.includes(adminEmail.toLowerCase().trim())) {
      return NextResponse.json({ 
        success: false, 
        error: 'UNAUTHORIZED: Only authorized administrators can perform manual Prime grants.' 
      }, { status: 403 });
    }

    const entitlement = await grantPrimeByAdmin(
      userId,
      planId as PrimePlanId,
      adminEmail,
      customExpiresAt
    );

    return NextResponse.json({
      success: true,
      entitlement,
      message: `Admin granted ${planId} to ${userId} until ${entitlement.expiresAt}`,
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Admin grant error' 
    }, { status: 500 });
  }
}
