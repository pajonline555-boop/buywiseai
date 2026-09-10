import { NextResponse } from 'next/server';
import { createAuthoritativePaymentOrder } from '@/lib/checkout/paymentEngine';
import { PaymentOrderRequest } from '@/lib/checkout/types';
import { getPaymentGatewayAdapter } from '@/lib/checkout/providers/registry';

export async function POST(req: Request) {
  try {
    const body: PaymentOrderRequest = await req.json();

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Checkout request must contain at least one item' },
        { status: 400 }
      );
    }

    if (!body.shippingAddress || !body.shippingAddress.fullName || !body.shippingAddress.pincode) {
      return NextResponse.json(
        { success: false, error: 'Complete shipping address is required' },
        { status: 400 }
      );
    }

    // 1. Authoritative Server-Side Order Creation & Stock Reservation
    const order = await createAuthoritativePaymentOrder(body);

    // 2. Gateway Provider Abstraction Payload Generation
    const adapter = getPaymentGatewayAdapter(body.paymentProvider || 'RAZORPAY');
    const gatewayPayload = await adapter.createGatewayOrder(order);

    return NextResponse.json({
      success: true,
      message: 'Authoritative payment order created & stock reserved',
      order: {
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        paymentGatewayOrderId: order.paymentGatewayOrderId,
        paymentProvider: order.paymentProvider,
        currency: order.currency,
        subtotal: order.subtotal,
        taxAmount: order.taxAmount,
        shippingFee: order.shippingFee,
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus,
        expiresAt: order.expiresAt,
        items: order.items
      },
      gatewayCheckout: gatewayPayload,
      liveGatewayStatus: {
        isLiveGateway: false,
        gatewayNotice: 'COMMERCIAL PAYMENT GATEWAY NOT LIVE. Provider abstraction & sandbox E2E transaction engine active.'
      }
    });

  } catch (error: any) {
    console.error('Error in create-order route:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create payment order' },
      { status: 400 }
    );
  }
}
