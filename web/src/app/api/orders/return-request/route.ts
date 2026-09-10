import { NextResponse } from 'next/server';
import { updateOrderStatus, getPartnerOrders } from '@/lib/partners/partnerService';
import { recordFulfillmentAuditLog, generateCorrelationId } from '@/lib/partners/fulfillment/fulfillmentDispatcher';

export const dynamic = 'force-static';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, userId, reason, details } = body;

    if (!orderId || !userId || !reason) {
      return NextResponse.json({ success: false, message: 'Missing orderId, userId, or return reason' }, { status: 400 });
    }

    const orders = await getPartnerOrders();
    const order = orders.find(o => o.id === orderId);

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    // Access Security Check: Customer can access ONLY their own orders
    if (order.customerUserId && order.customerUserId !== userId) {
      return NextResponse.json({ success: false, message: 'UNAUTHORIZED: You do not have permission to return this order' }, { status: 403 });
    }

    // Return Window & Status Eligibility Check
    if (order.orderStatus !== 'DELIVERED' && order.orderStatus !== 'SHIPPED') {
      return NextResponse.json({ success: false, message: `Order in state '${order.orderStatus}' is not eligible for return` }, { status: 400 });
    }

    const correlationId = generateCorrelationId(orderId);
    await updateOrderStatus(orderId, 'RETURNED', { note: `Customer Return Requested: ${reason} (${details || 'No details provided'})` });

    await recordFulfillmentAuditLog({
      orderId,
      fulfillmentId: `ful_ret_${Date.now()}`,
      partnerId: order.partnerId,
      actorType: 'CUSTOMER',
      actorId: userId,
      action: 'RETURN_REQUESTED',
      previousStatus: order.orderStatus,
      newStatus: 'RETURN_REQUESTED',
      correlationId,
      metadata: { reason, details }
    });

    return NextResponse.json({
      success: true,
      message: `Return request submitted successfully for order ${order.orderNumber}. Sent to partner for pickup coordination.`,
      orderId,
      correlationId,
      status: 'RETURN_REQUESTED'
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
