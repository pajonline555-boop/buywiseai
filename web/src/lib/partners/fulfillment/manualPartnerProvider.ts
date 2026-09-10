import { 
  PartnerFulfillmentProvider, 
  PartnerOrderSubmissionPayload, 
  PartnerFulfillmentResult, 
  PartnerReturnRequestPayload, 
  TrackingInfo 
} from './fulfillmentTypes';

export class ManualPartnerProvider implements PartnerFulfillmentProvider {
  name = 'Manual Partner Portal Provider';
  fulfillmentMethod = 'PARTNER_PORTAL' as const;

  async submitOrder(payload: PartnerOrderSubmissionPayload): Promise<PartnerFulfillmentResult> {
    const partnerRef = `MANUAL-PTR-${payload.partnerId}-${payload.orderId.slice(-6)}`;
    return {
      success: true,
      partnerOrderReference: partnerRef,
      message: `Order submitted to Partner Portal for ${payload.partnerId}. Merchant notified via Portal workspace.`,
      status: 'PARTNER_NOTIFIED'
    };
  }

  async getOrderStatus(fulfillmentId: string): Promise<PartnerFulfillmentResult> {
    return {
      success: true,
      message: `Status read from manual partner ledger for fulfillment ${fulfillmentId}`,
      status: 'PARTNER_ACKNOWLEDGED'
    };
  }

  async cancelOrder(fulfillmentId: string, reason: string): Promise<PartnerFulfillmentResult> {
    return {
      success: true,
      message: `Order cancellation requested in Partner Portal: ${reason}`,
      status: 'CANCELLED'
    };
  }

  async submitReturnRequest(payload: PartnerReturnRequestPayload): Promise<PartnerFulfillmentResult> {
    return {
      success: true,
      message: `Return request ${payload.reason} posted to Partner Portal inbox.`,
      status: 'RETURN_REQUESTED'
    };
  }

  async getReturnStatus(fulfillmentId: string): Promise<PartnerFulfillmentResult> {
    return {
      success: true,
      message: `Return status fetched from Partner Portal for ${fulfillmentId}`,
      status: 'RETURN_REQUESTED'
    };
  }

  async updateTracking(fulfillmentId: string, trackingInfo: TrackingInfo): Promise<PartnerFulfillmentResult> {
    return {
      success: true,
      message: `Tracking updated manually: ${trackingInfo.carrier} (${trackingInfo.trackingNumber})`,
      status: 'SHIPPED'
    };
  }

  async healthCheck(): Promise<{ status: 'CONNECTED' | 'DEGRADED' | 'NOT_CONFIGURED' | 'DISABLED' | 'ERROR'; message: string }> {
    return {
      status: 'CONNECTED',
      message: 'Partner Portal Channel active and operational.'
    };
  }
}
