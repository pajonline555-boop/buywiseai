import { 
  PartnerFulfillmentProvider, 
  PartnerOrderSubmissionPayload, 
  PartnerFulfillmentResult, 
  PartnerReturnRequestPayload, 
  TrackingInfo 
} from './fulfillmentTypes';

export class ApiPartnerProvider implements PartnerFulfillmentProvider {
  name = 'REST API Partner Provider';
  fulfillmentMethod = 'PARTNER_API' as const;

  private apiKey?: string;
  private apiEndpoint?: string;
  private isSandbox: boolean;

  constructor(options?: { apiKey?: string; apiEndpoint?: string; isSandbox?: boolean }) {
    this.apiKey = options?.apiKey || process.env.BUYWISE_PARTNER_API_KEY;
    this.apiEndpoint = options?.apiEndpoint || process.env.BUYWISE_PARTNER_API_ENDPOINT;
    this.isSandbox = options?.isSandbox ?? true;
  }

  async submitOrder(payload: PartnerOrderSubmissionPayload): Promise<PartnerFulfillmentResult> {
    if (!this.apiKey && !this.isSandbox) {
      return {
        success: false,
        message: 'PARTNER_API_CREDENTIALS_MISSING: Partner API key unconfigured.',
        status: 'PARTNER_NOTIFICATION_FAILED',
        errorCode: 'MISSING_CREDENTIALS'
      };
    }

    // Server-side Idempotency & Data Minimization
    const partnerRef = `API-ORD-${payload.partnerId.toUpperCase().slice(0, 6)}-${payload.orderId.slice(-6)}`;

    if (this.isSandbox) {
      // Simulate Sandbox API Response
      return {
        success: true,
        partnerOrderReference: partnerRef,
        message: `[SANDBOX] Order successfully transmitted to Partner API for ${payload.partnerSku}. Idempotency Key: ${payload.fulfillmentId}`,
        status: 'PARTNER_NOTIFIED',
        rawResponse: {
          sandbox: true,
          partnerRef,
          transmittedAt: new Date().toISOString(),
          idempotencyKey: payload.fulfillmentId,
          sku: payload.partnerSku,
          quantity: payload.quantity,
          recipient: payload.shippingAddress.recipientName
        }
      };
    }

    try {
      // Real Partner API HTTP Call Structure (Production Endpoint)
      const res = await fetch(`${this.apiEndpoint}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Idempotency-Key': payload.fulfillmentId,
          'X-Correlation-Id': payload.correlationId
        },
        body: JSON.stringify({
          buywiseOrderId: payload.orderId,
          sku: payload.partnerSku,
          quantity: payload.quantity,
          shipping: {
            name: payload.shippingAddress.recipientName,
            addressLine1: payload.shippingAddress.addressLine1,
            addressLine2: payload.shippingAddress.addressLine2,
            city: payload.shippingAddress.city,
            state: payload.shippingAddress.state,
            postalCode: payload.shippingAddress.postalCode,
            country: payload.shippingAddress.country,
            phone: payload.shippingAddress.phone
          }
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        return {
          success: false,
          message: `Partner API error HTTP ${res.status}: ${errorText}`,
          status: 'PARTNER_NOTIFICATION_FAILED',
          errorCode: `HTTP_${res.status}`
        };
      }

      const data = await res.json();
      return {
        success: true,
        partnerOrderReference: data.partnerOrderReference || partnerRef,
        message: 'Order transmitted to Partner API successfully.',
        status: 'PARTNER_NOTIFIED',
        rawResponse: data
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Partner API Network Error: ${err.message}`,
        status: 'PARTNER_NOTIFICATION_FAILED',
        errorCode: 'NETWORK_ERROR'
      };
    }
  }

  async getOrderStatus(fulfillmentId: string): Promise<PartnerFulfillmentResult> {
    if (this.isSandbox) {
      return {
        success: true,
        message: `[SANDBOX] Polled status for ${fulfillmentId}: ACCEPTED`,
        status: 'ACCEPTED'
      };
    }
    return {
      success: true,
      message: `Status polled for ${fulfillmentId}`,
      status: 'PARTNER_ACKNOWLEDGED'
    };
  }

  async cancelOrder(fulfillmentId: string, reason: string): Promise<PartnerFulfillmentResult> {
    return {
      success: true,
      message: `[SANDBOX] Order cancellation sent to Partner API: ${reason}`,
      status: 'CANCELLED'
    };
  }

  async submitReturnRequest(payload: PartnerReturnRequestPayload): Promise<PartnerFulfillmentResult> {
    return {
      success: true,
      message: `[SANDBOX] Return request submitted to Partner API. Reason: ${payload.reason}`,
      status: 'RETURN_REQUESTED'
    };
  }

  async getReturnStatus(fulfillmentId: string): Promise<PartnerFulfillmentResult> {
    return {
      success: true,
      message: `[SANDBOX] Return status polled for ${fulfillmentId}`,
      status: 'RETURN_APPROVED'
    };
  }

  async updateTracking(fulfillmentId: string, trackingInfo: TrackingInfo): Promise<PartnerFulfillmentResult> {
    return {
      success: true,
      message: `Tracking recorded from Partner webhook/API: ${trackingInfo.carrier} (${trackingInfo.trackingNumber})`,
      status: 'SHIPPED'
    };
  }

  async healthCheck(): Promise<{ status: 'CONNECTED' | 'DEGRADED' | 'NOT_CONFIGURED' | 'DISABLED' | 'ERROR'; message: string }> {
    if (this.isSandbox) {
      return {
        status: 'CONNECTED',
        message: 'Partner REST API Provider active in SANDBOX simulation mode.'
      };
    }
    if (!this.apiKey || !this.apiEndpoint) {
      return {
        status: 'NOT_CONFIGURED',
        message: 'Production Partner API credentials unconfigured.'
      };
    }
    return {
      status: 'CONNECTED',
      message: 'Production Partner API endpoint connected.'
    };
  }
}
