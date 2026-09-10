export const dynamic = 'force-static';
import { NextResponse } from 'next/server';
import { initiateServerRefund, REFUNDS_STORE } from '@/lib/checkout/reconciliationEngine';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, reason, amount } = body;

    if (!orderId || !reason) {
      return NextResponse.json(
        { success: false, error: 'orderId and refund reason are required' },
        { status: 400 }
      );
    }

    const result = await initiateServerRefund(orderId, reason, amount);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        refund: result.refund
      });
    }

    return NextResponse.json(
      { success: false, error: result.message },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Refund processing failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const refunds = Array.from(REFUNDS_STORE.values());
  return NextResponse.json({
    success: true,
    count: refunds.length,
    refunds
  });
}
