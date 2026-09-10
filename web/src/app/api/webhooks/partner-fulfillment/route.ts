import { NextResponse } from 'next/server';
import { updateFulfillmentTracking, recordFulfillmentAuditLog } from '@/lib/partners/fulfillment/fulfillmentDispatcher';
import { updateOrderStatus } from '@/lib/partners/partnerService';
import { isWebhookEventProcessed, markWebhookEventProcessed } from '@/lib/checkout/paymentEngine';

export const dynamic = 'force-static';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const eventId = body.eventId || `evt_${body.fulfillmentId}_${body.event}`;
    const { fulfillmentId, orderId, partnerId, event, trackingNumber, carrier, rejectionReason } = body;

    if (!fulfillmentId || !event) {
      return NextResponse.json({ success: false, message: 'Missing fulfillmentId or event type' }, { status: 400 });
    }

    // 1. Persistent Idempotency Protection
    const alreadyProcessed = await isWebhookEventProcessed(eventId);
    if (alreadyProcessed) {
      return NextResponse.json({
        success: true,
        message: `Partner Webhook Event ${eventId} already processed (Persistent Idempotency Protection)`,
        alreadyProcessed: true
      });
    }

    await markWebhookEventProcessed(eventId, orderId || fulfillmentId);

    // 2. Process Webhook Event Type
    let statusMessage = `Webhook event '${event}' processed for ${fulfillmentId}`;

    if (event === 'SHIPPED' && carrier && trackingNumber) {
      await updateFulfillmentTracking(fulfillmentId, { carrier, trackingNumber }, partnerId || 'partner_webhook');
      if (orderId) {
        await updateOrderStatus(orderId, 'SHIPPED', { courierCarrier: carrier, trackingNumber });
      }
    } else if (event === 'DELIVERED') {
      if (orderId) {
        await updateOrderStatus(orderId, 'DELIVERED', { note: 'Delivered notification from partner webhook' });
      }
    } else if (event === 'ORDER_REJECTED') {
      await recordFulfillmentAuditLog({
        orderId: orderId || fulfillmentId,
        fulfillmentId,
        partnerId: partnerId || 'partner',
        actorType: 'PARTNER',
        actorId: 'partner_webhook',
        action: 'ORDER_REJECTED',
        newStatus: 'PARTNER_REJECTED',
        correlationId: body.correlationId || `BW-FUL-WH-${Date.now()}`,
        metadata: { rejectionReason }
      });
    }

    return NextResponse.json({
      success: true,
      message: statusMessage,
      eventId,
      processedAt: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
