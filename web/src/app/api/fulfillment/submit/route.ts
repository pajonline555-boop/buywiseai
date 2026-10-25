import { NextResponse, NextRequest } from 'next/server';
import { dispatchPartnerFulfillment } from '@/lib/partners/fulfillment/fulfillmentDispatcher';
import { PartnerOrderSubmissionPayload } from '@/lib/partners/fulfillment/fulfillmentTypes';
import { logSecurityEvent } from '@/lib/auth/roleMiddleware';

export const dynamic = 'force-dynamic';

export async function POST(req: Request | NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization') || req.headers.get('x-admin-authorization');
    if (!authHeader) {
      logSecurityEvent({
        eventType: 'AUTHORIZATION_FAILURE',
        route: '/api/fulfillment/submit',
        reason: 'Unauthenticated fulfillment order submission attempt'
      });
      return NextResponse.json({ success: false, code: 'UNAUTHORIZED', message: 'Authentication required' }, { status: 401 });
    }

    const body: PartnerOrderSubmissionPayload = await req.json();

    if (!body.orderId || !body.partnerId || !body.partnerSku) {
      return NextResponse.json({ success: false, message: 'Missing required fulfillment order fields' }, { status: 400 });
    }

    const result = await dispatchPartnerFulfillment(body);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
