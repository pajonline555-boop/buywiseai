import { NextResponse } from 'next/server';
import { updateFulfillmentTracking } from '@/lib/partners/fulfillment/fulfillmentDispatcher';
import { updateOrderStatus } from '@/lib/partners/partnerService';

export const dynamic = 'force-static';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fulfillmentId, orderId, carrier, trackingNumber, trackingUrl, actorId } = body;

    if (!fulfillmentId || !carrier || !trackingNumber) {
      return NextResponse.json({ success: false, message: 'Missing fulfillmentId, carrier, or trackingNumber' }, { status: 400 });
    }

    const updatedRecord = await updateFulfillmentTracking(fulfillmentId, {
      carrier,
      trackingNumber,
      trackingUrl
    }, actorId || 'partner');

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
