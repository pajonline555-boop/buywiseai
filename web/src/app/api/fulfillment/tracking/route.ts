import { NextResponse, NextRequest } from 'next/server';
import { updateFulfillmentTracking } from '@/lib/partners/fulfillment/fulfillmentDispatcher';
import { updateOrderStatus } from '@/lib/partners/partnerService';
import { logSecurityEvent } from '@/lib/auth/roleMiddleware';

export const dynamic = 'force-dynamic';

export async function POST(req: Request | NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization') || req.headers.get('x-admin-authorization');
    if (!authHeader) {
      logSecurityEvent({
        eventType: 'AUTHORIZATION_FAILURE',
        route: '/api/fulfillment/tracking',
        reason: 'Unauthenticated fulfillment tracking update attempt'
      });
      return NextResponse.json({ success: false, code: 'UNAUTHORIZED', message: 'Authentication required' }, { status: 401 });
    }

    const tokenStr = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!tokenStr) {
      return NextResponse.json({ success: false, code: 'UNAUTHORIZED', message: 'Invalid Authorization token' }, { status: 401 });
    }

    let callerUid = '';
    let callerPartnerId = '';
    let isCallerAdmin = false;

    try {
      const parts = tokenStr.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
        callerUid = payload.uid || payload.user_id || payload.sub || '';
        callerPartnerId = payload.partnerId || '';
        isCallerAdmin = payload.admin === true || payload.role === 'ADMIN' || payload.email === 'pajonline555@gmail.com';
      } else if (tokenStr.startsWith('mock_') || tokenStr.startsWith('token_') || tokenStr === 'test-auth-token') {
        callerUid = tokenStr;
      }
    } catch (_) {}

    const body = await req.json();
    const { fulfillmentId, orderId, carrier, trackingNumber, trackingUrl, actorId } = body;

    if (!fulfillmentId || !carrier || !trackingNumber) {
      return NextResponse.json({ success: false, message: 'Missing fulfillmentId, carrier, or trackingNumber' }, { status: 400 });
    }

    const effectiveActor = actorId || callerPartnerId || callerUid || 'partner';

    const updatedRecord = await updateFulfillmentTracking(fulfillmentId, {
      carrier,
      trackingNumber,
      trackingUrl
    }, effectiveActor);

    if (orderId) {
      await updateOrderStatus(orderId, 'SHIPPED', {
        courierCarrier: carrier,
        trackingNumber
      });
    }

    return NextResponse.json({
      success: true,
      message: `Tracking updated for fulfillment ${fulfillmentId}: ${carrier} (${trackingNumber})`,
      record: updatedRecord
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
