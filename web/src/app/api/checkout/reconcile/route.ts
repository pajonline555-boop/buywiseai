export const dynamic = 'force-static';
import { NextResponse } from 'next/server';
import { reconcilePaymentOrder, RECONCILIATION_QUEUE_STORE } from '@/lib/checkout/reconciliationEngine';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, gatewayStatus, gatewayAmount } = body;

    if (!orderId || !gatewayStatus || typeof gatewayAmount !== 'number') {
      return NextResponse.json(
        { success: false, error: 'orderId, gatewayStatus, and gatewayAmount are required' },
        { status: 400 }
      );
    }

    const result = await reconcilePaymentOrder(orderId, gatewayStatus, gatewayAmount);

    return NextResponse.json({
      success: true,
      result
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Reconciliation failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const queuedItems = Array.from(RECONCILIATION_QUEUE_STORE.values());
  return NextResponse.json({
    success: true,
    count: queuedItems.length,
    reconciliationQueue: queuedItems
  });
}
