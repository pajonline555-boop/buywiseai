import { NextResponse } from 'next/server';
import { dispatchPartnerFulfillment } from '@/lib/partners/fulfillment/fulfillmentDispatcher';
import { PartnerOrderSubmissionPayload } from '@/lib/partners/fulfillment/fulfillmentTypes';

export const dynamic = 'force-static';

export async function POST(req: Request) {
  try {
    const body: PartnerOrderSubmissionPayload = await req.json();

    if (!body.orderId || !body.partnerId || !body.partnerSku) {
      return NextResponse.json({ success: false, message: 'Missing required fulfillment order fields' }, { status: 400 });
    }

    const result = await dispatchPartnerFulfillment(body);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
