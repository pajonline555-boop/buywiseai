import { NextResponse } from 'next/server';
import { verifyPaymentSignature, PAYMENT_ORDERS_STORE } from '@/lib/checkout/paymentEngine';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, paymentId, signature, paymentGatewayOrderId, provider } = body;

    if (!orderId || !signature) {
      return NextResponse.json(
        { success: false, error: 'Missing required signature or order verification parameters' },
        { status: 400 }
      );
    }

    const paymentOrder = PAYMENT_ORDERS_STORE.get(orderId) || PAYMENT_ORDERS_STORE.get(paymentGatewayOrderId || '');

    // Persistent Order Lock Check: Prevent double stock capture if already captured
    if (paymentOrder && paymentOrder.paymentStatus === 'PAYMENT_CAPTURED') {
      return NextResponse.json({
        success: true,
        message: 'Payment already captured and stock finalized (Order Lock Protection)',
        orderId: paymentOrder.orderId,
        alreadyProcessed: true,
        paymentStatus: paymentOrder.paymentStatus,
        totalAmount: paymentOrder.totalAmount
      });
    }

    // Verify HMAC Signature via Provider Abstraction
    const isValid = verifyPaymentSignature(
      orderId, 
      paymentId || 'pay_simulated', 
      signature, 
      provider || (paymentOrder ? paymentOrder.paymentProvider : 'RAZORPAY')
    );

    if (isValid && paymentOrder) {
      paymentOrder.paymentStatus = 'PAYMENT_CAPTURED';

      return NextResponse.json({
        success: true,
        message: 'Payment verified & status set to PAYMENT_CAPTURED',
        orderId: paymentOrder.orderId,
        paymentStatus: paymentOrder.paymentStatus,
        totalAmount: paymentOrder.totalAmount
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid payment signature or order verification failed'
    }, { status: 400 });

  } catch (error: any) {
    console.error('Error in verify-payment route:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Payment signature verification failed' },
      { status: 500 }
    );
  }
}
