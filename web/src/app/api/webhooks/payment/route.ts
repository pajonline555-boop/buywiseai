import { NextResponse } from 'next/server';
import { processPaymentWebhook } from '@/lib/checkout/paymentEngine';
import { WebhookEventPayload } from '@/lib/checkout/types';

export async function POST(req: Request) {
  try {
    const signatureHeader = req.headers.get('x-buywise-signature') || req.headers.get('x-razorpay-signature') || req.headers.get('x-cashfree-signature') || '';
    const body: WebhookEventPayload = await req.json();

    if (!body || !body.eventId || !body.paymentGatewayOrderId) {
      return NextResponse.json(
        { success: false, error: 'Invalid webhook payload structure' },
        { status: 400 }
      );
    }

    // Process Webhook with Persistent Firestore Idempotency & Provider Signature Verification
    const result = await processPaymentWebhook(body, signatureHeader);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        orderId: result.orderId,
        alreadyProcessed: result.alreadyProcessed || false
      });
    }

    return NextResponse.json(
      { success: false, error: result.message },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Error processing payment webhook:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error processing webhook' },
      { status: 500 }
    );
  }
}
