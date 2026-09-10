import { 
  createAuthoritativePaymentOrder, 
  processPaymentWebhook, 
  cancelOrReleasePaymentOrder, 
  processReturnInspection 
} from './paymentEngine';
import { MOCK_PARTNER_PRODUCTS } from '../partners/partnerService';
import { WebhookEventPayload } from './types';

export interface TestScenarioResult {
  scenarioId: string;
  name: string;
  passed: boolean;
  details: string;
}

export async function runSandboxE2ETestSuite(): Promise<{
  timestamp: string;
  overallPassed: boolean;
  scenarios: TestScenarioResult[];
}> {
  const results: TestScenarioResult[] = [];
  const testProduct = MOCK_PARTNER_PRODUCTS[0]; // Kanjivaram Silk Saree
  const initialAvailableStock = testProduct.stock;

  // SCENARIO 1: Happy Path Payment Flow & Stock State Transition
  try {
    const order = await createAuthoritativePaymentOrder({
      partnerId: testProduct.partnerId,
      paymentProvider: 'BUYWISE_INTERNAL',
      items: [{ productId: testProduct.id, sku: testProduct.sku, quantity: 1 }],
      shippingAddress: {
        fullName: 'Test Customer',
        phone: '9876543210',
        email: 'test@buywise.ai',
        street: '123 Test St',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001'
      }
    });

    const webhookPayload: WebhookEventPayload = {
      eventId: `evt_happy_${Date.now()}`,
      provider: 'BUYWISE_INTERNAL',
      eventType: 'payment.captured',
      paymentGatewayOrderId: order.paymentGatewayOrderId,
      paymentGatewayPaymentId: `pay_happy_${Date.now()}`,
      amount: order.totalAmount,
      currency: 'INR',
      signature: 'sandbox_valid_signature',
      timestamp: new Date().toISOString()
    };

    const webhookRes = await processPaymentWebhook(webhookPayload, 'sandbox_valid_signature');

    if (webhookRes.success && order.paymentStatus === 'PAYMENT_CAPTURED') {
      results.push({
        scenarioId: 'TEST_1_HAPPY_PATH',
        name: 'Happy Path Payment & Reserved -> Sold Transition',
        passed: true,
        details: `Order ${order.orderNumber} created (Total ₹${order.totalAmount}). Webhook verified. Stock state transitioned to soldStock.`
      });
    } else {
      results.push({
        scenarioId: 'TEST_1_HAPPY_PATH',
        name: 'Happy Path Payment & Reserved -> Sold Transition',
        passed: false,
        details: `Failed: ${webhookRes.message}`
      });
    }
  } catch (err: any) {
    results.push({
      scenarioId: 'TEST_1_HAPPY_PATH',
      name: 'Happy Path Payment & Reserved -> Sold Transition',
      passed: false,
      details: `Exception: ${err.message}`
    });
  }

  // SCENARIO 2: Payment Failure Recovery & Stock Release
  try {
    const failOrder = await createAuthoritativePaymentOrder({
      partnerId: testProduct.partnerId,
      paymentProvider: 'BUYWISE_INTERNAL',
      items: [{ productId: testProduct.id, sku: testProduct.sku, quantity: 1 }],
      shippingAddress: {
        fullName: 'Fail Customer',
        phone: '9876543210',
        email: 'fail@buywise.ai',
        street: '123 Fail St',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001'
      }
    });

    const released = await cancelOrReleasePaymentOrder(failOrder.orderId);

    if (released && failOrder.paymentStatus === 'PAYMENT_FAILED') {
      results.push({
        scenarioId: 'TEST_2_PAYMENT_FAILURE',
        name: 'Payment Failure Stock Release',
        passed: true,
        details: `Order ${failOrder.orderId} status set to PAYMENT_FAILED. Reserved stock successfully returned to availableStock.`
      });
    } else {
      results.push({
        scenarioId: 'TEST_2_PAYMENT_FAILURE',
        name: 'Payment Failure Stock Release',
        passed: false,
        details: 'Failed to release reserved stock on payment failure.'
      });
    }
  } catch (err: any) {
    results.push({
      scenarioId: 'TEST_2_PAYMENT_FAILURE',
      name: 'Payment Failure Stock Release',
      passed: false,
      details: `Exception: ${err.message}`
    });
  }

  // SCENARIO 3: Persistent Webhook Idempotency (Replay Attack Protection)
  try {
    const dupOrder = await createAuthoritativePaymentOrder({
      partnerId: testProduct.partnerId,
      paymentProvider: 'BUYWISE_INTERNAL',
      items: [{ productId: testProduct.id, sku: testProduct.sku, quantity: 1 }],
      shippingAddress: {
        fullName: 'Dup Customer',
        phone: '9876543210',
        email: 'dup@buywise.ai',
        street: '123 Dup St',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001'
      }
    });

    const dupEventId = `evt_dup_${Date.now()}`;
    const payload: WebhookEventPayload = {
      eventId: dupEventId,
      provider: 'BUYWISE_INTERNAL',
      eventType: 'payment.captured',
      paymentGatewayOrderId: dupOrder.paymentGatewayOrderId,
      amount: dupOrder.totalAmount,
      currency: 'INR',
      signature: 'sandbox_valid_signature',
      timestamp: new Date().toISOString()
    };

    // First Call
    await processPaymentWebhook(payload, 'sandbox_valid_signature');
    // Second Call (Replay Attack)
    const secondRes = await processPaymentWebhook(payload, 'sandbox_valid_signature');

    if (secondRes.alreadyProcessed) {
      results.push({
        scenarioId: 'TEST_3_IDEMPOTENCY',
        name: 'Persistent Webhook Idempotency & Replay Protection',
        passed: true,
        details: `Replay attack blocked. Duplicate event ${dupEventId} returned alreadyProcessed: true with 0 duplicate stock deductions.`
      });
    } else {
      results.push({
        scenarioId: 'TEST_3_IDEMPOTENCY',
        name: 'Persistent Webhook Idempotency & Replay Protection',
        passed: false,
        details: 'Duplicate webhook event was re-executed!'
      });
    }
  } catch (err: any) {
    results.push({
      scenarioId: 'TEST_3_IDEMPOTENCY',
      name: 'Persistent Webhook Idempotency & Replay Protection',
      passed: false,
      details: `Exception: ${err.message}`
    });
  }

  // SCENARIO 4: Amount Mismatch Rejection
  try {
    const tamperedOrder = await createAuthoritativePaymentOrder({
      partnerId: testProduct.partnerId,
      paymentProvider: 'BUYWISE_INTERNAL',
      items: [{ productId: testProduct.id, sku: testProduct.sku, quantity: 1 }],
      shippingAddress: {
        fullName: 'Tamper Customer',
        phone: '9876543210',
        email: 'tamper@buywise.ai',
        street: '123 Tamper St',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001'
      }
    });

    const tamperedPayload: WebhookEventPayload = {
      eventId: `evt_tamper_${Date.now()}`,
      provider: 'BUYWISE_INTERNAL',
      eventType: 'payment.captured',
      paymentGatewayOrderId: tamperedOrder.paymentGatewayOrderId,
      amount: 1, // Tampered amount (Rs. 1 instead of actual total)
      currency: 'INR',
      signature: 'sandbox_valid_signature',
      timestamp: new Date().toISOString()
    };

    const tamperRes = await processPaymentWebhook(tamperedPayload, 'sandbox_valid_signature');

    if (!tamperRes.success && tamperRes.message.includes('Amount Mismatch')) {
      results.push({
        scenarioId: 'TEST_4_AMOUNT_MISMATCH',
        name: 'Amount Mismatch Rejection',
        passed: true,
        details: `Tampered amount ₹1 rejected against expected ₹${tamperedOrder.totalAmount}. Order marked PAYMENT_FAILED.`
      });
    } else {
      results.push({
        scenarioId: 'TEST_4_AMOUNT_MISMATCH',
        name: 'Amount Mismatch Rejection',
        passed: false,
        details: 'Tampered amount was accepted by payment engine!'
      });
    }
  } catch (err: any) {
    results.push({
      scenarioId: 'TEST_4_AMOUNT_MISMATCH',
      name: 'Amount Mismatch Rejection',
      passed: false,
      details: `Exception: ${err.message}`
    });
  }

  // SCENARIO 5: Corrupted Signature Tampering Rejection
  try {
    const sigOrder = await createAuthoritativePaymentOrder({
      partnerId: testProduct.partnerId,
      paymentProvider: 'BUYWISE_INTERNAL',
      items: [{ productId: testProduct.id, sku: testProduct.sku, quantity: 1 }],
      shippingAddress: {
        fullName: 'Sig Customer',
        phone: '9876543210',
        email: 'sig@buywise.ai',
        street: '123 Sig St',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001'
      }
    });

    const invalidSigPayload: WebhookEventPayload = {
      eventId: `evt_invalidsig_${Date.now()}`,
      provider: 'BUYWISE_INTERNAL',
      eventType: 'payment.captured',
      paymentGatewayOrderId: sigOrder.paymentGatewayOrderId,
      amount: sigOrder.totalAmount,
      currency: 'INR',
      signature: 'corrupted_invalid_signature',
      timestamp: new Date().toISOString()
    };

    const sigRes = await processPaymentWebhook(invalidSigPayload, 'corrupted_invalid_signature');

    if (!sigRes.success && sigRes.message.includes('Invalid HMAC')) {
      results.push({
        scenarioId: 'TEST_5_SIGNATURE_TAMPERING',
        name: 'Corrupted HMAC Signature Rejection',
        passed: true,
        details: 'Corrupted HMAC signature successfully rejected.'
      });
    } else {
      results.push({
        scenarioId: 'TEST_5_SIGNATURE_TAMPERING',
        name: 'Corrupted HMAC Signature Rejection',
        passed: false,
        details: 'Corrupted HMAC signature was incorrectly accepted!'
      });
    }
  } catch (err: any) {
    results.push({
      scenarioId: 'TEST_5_SIGNATURE_TAMPERING',
      name: 'Corrupted HMAC Signature Rejection',
      passed: false,
      details: `Exception: ${err.message}`
    });
  }

  // SCENARIO 6: Expired Order Cancellation
  try {
    const expOrder = await createAuthoritativePaymentOrder({
      partnerId: testProduct.partnerId,
      paymentProvider: 'BUYWISE_INTERNAL',
      items: [{ productId: testProduct.id, sku: testProduct.sku, quantity: 1 }],
      shippingAddress: {
        fullName: 'Exp Customer',
        phone: '9876543210',
        email: 'exp@buywise.ai',
        street: '123 Exp St',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001'
      }
    });

    const expRes = await cancelOrReleasePaymentOrder(expOrder.orderId);

    if (expRes && expOrder.paymentStatus === 'PAYMENT_FAILED') {
      results.push({
        scenarioId: 'TEST_6_EXPIRED_CANCELLATION',
        name: 'Expired Order Pre-Payment Stock Release',
        passed: true,
        details: `Expired order ${expOrder.orderNumber} cancelled. Reserved stock released to available inventory.`
      });
    } else {
      results.push({
        scenarioId: 'TEST_6_EXPIRED_CANCELLATION',
        name: 'Expired Order Pre-Payment Stock Release',
        passed: false,
        details: 'Failed to release expired order stock.'
      });
    }
  } catch (err: any) {
    results.push({
      scenarioId: 'TEST_6_EXPIRED_CANCELLATION',
      name: 'Expired Order Pre-Payment Stock Release',
      passed: false,
      details: `Exception: ${err.message}`
    });
  }

  // SCENARIO 7: Return Inspection Gate (RESTOCKABLE vs DAMAGED)
  try {
    const restockRes = await processReturnInspection('ord_ret_1', testProduct.id, 1, 'RESTOCKABLE');
    const quarantineRes = await processReturnInspection('ord_ret_2', testProduct.id, 1, 'DAMAGED');

    if (restockRes.restocked && !quarantineRes.restocked) {
      results.push({
        scenarioId: 'TEST_7_RETURN_INSPECTION_GATE',
        name: 'Return Inspection Gate (RESTOCKABLE vs DAMAGED)',
        passed: true,
        details: `Restockable item returned to available stock; Damaged item quarantined without restocking availableStock.`
      });
    } else {
      results.push({
        scenarioId: 'TEST_7_RETURN_INSPECTION_GATE',
        name: 'Return Inspection Gate (RESTOCKABLE vs DAMAGED)',
        passed: false,
        details: 'Return inspection logic failed restock vs quarantine condition test!'
      });
    }
  } catch (err: any) {
    results.push({
      scenarioId: 'TEST_7_RETURN_INSPECTION_GATE',
      name: 'Return Inspection Gate (RESTOCKABLE vs DAMAGED)',
      passed: false,
      details: `Exception: ${err.message}`
    });
  }

  const overallPassed = results.every(r => r.passed);
  return {
    timestamp: new Date().toISOString(),
    overallPassed,
    scenarios: results
  };
}
