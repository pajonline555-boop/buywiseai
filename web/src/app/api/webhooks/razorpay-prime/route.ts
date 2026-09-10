import { NextRequest, NextResponse } from 'next/server';
import { RazorpayPrimeAdapter } from '@/lib/prime/providers/razorpayPrimeAdapter';
import { activatePrime, cancelPrime, refundOrRevokePrime } from '@/lib/prime/primeEntitlementService';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { PrimePlanId } from '@/lib/prime/types';

const PROCESSED_PRIME_EVENTS_COLLECTION = 'prime_payment_events';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || '';

    const adapter = new RazorpayPrimeAdapter();
    const isValidSig = adapter.verifyWebhookSignature(rawBody, signature);

    if (!isValidSig) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid HMAC SHA-256 Webhook Signature' 
      }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const eventId = payload.event_id || payload.id || `evt_rzp_${Date.now()}`;
    const eventType = payload.event;

    // Persistent Idempotency Check in Firestore
    try {
      const docRef = doc(db, PROCESSED_PRIME_EVENTS_COLLECTION, eventId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return NextResponse.json({ 
          success: true, 
          message: `Event ${eventId} already processed (Idempotency Lock)`, 
          duplicate: true 
        });
      }
      await setDoc(docRef, { eventId, eventType, processedAt: new Date().toISOString() });
    } catch (e) {
      // Sync notice
    }

    const userId = payload.payload?.subscription?.entity?.notes?.userId || payload.payload?.payment?.entity?.notes?.userId;
    const planId = (payload.payload?.subscription?.entity?.notes?.planId || 'PRIME_MONTHLY') as PrimePlanId;

    if (!userId) {
      return NextResponse.json({ success: true, message: 'Webhook received but no userId mapped.' });
    }

    // Lifecycle Events Handling
    switch (eventType) {
      case 'subscription.charged':
      case 'payment.captured':
        await activatePrime(userId, planId, 'RAZORPAY_WEB', payload.id, undefined, 'RAZORPAY_WEBHOOK');
        break;
      case 'subscription.cancelled':
      case 'subscription.halted':
        await cancelPrime(userId, 'RAZORPAY_WEBHOOK');
        break;
      case 'payment.refunded':
        await refundOrRevokePrime(userId, 'Payment Refunded via Provider Webhook', 'RAZORPAY_WEBHOOK');
        break;
      default:
        break;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Webhook ${eventType} processed successfully.`, 
      eventId 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Webhook processing error' 
    }, { status: 500 });
  }
}
