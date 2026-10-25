import { NextResponse, NextRequest } from 'next/server';
import { processReturnInspection } from '@/lib/partners/fulfillment/fulfillmentDispatcher';
import { ReturnCondition } from '@/lib/partners/fulfillment/fulfillmentTypes';
import { logSecurityEvent } from '@/lib/auth/roleMiddleware';

export const dynamic = 'force-dynamic';

export async function POST(req: Request | NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization') || req.headers.get('x-admin-authorization');
    if (!authHeader) {
      logSecurityEvent({
        eventType: 'AUTHORIZATION_FAILURE',
        route: '/api/fulfillment/return-inspection',
        reason: 'Unauthenticated return inspection submission attempt'
      });
      return NextResponse.json({ success: false, code: 'UNAUTHORIZED', message: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { fulfillmentId, productId, quantity, condition, notes, actorId } = body;

    if (!fulfillmentId || !productId || !quantity || !condition) {
      return NextResponse.json({ success: false, message: 'Missing fulfillmentId, productId, quantity, or condition' }, { status: 400 });
    }

    const validConditions: ReturnCondition[] = ['RESTOCKABLE', 'DAMAGED', 'DEFECTIVE', 'WRONG_ITEM', 'MISSING_PARTS', 'UNSELLABLE'];
    if (!validConditions.includes(condition as ReturnCondition)) {
      return NextResponse.json({ success: false, message: `Invalid condition '${condition}'. Must be one of: ${validConditions.join(', ')}` }, { status: 400 });
    }

    const result = await processReturnInspection(
      fulfillmentId,
      productId,
      Number(quantity),
      condition as ReturnCondition,
      notes,
      actorId || 'partner'
    );

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
