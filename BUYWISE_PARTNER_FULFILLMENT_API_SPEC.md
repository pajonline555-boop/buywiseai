# BuyWise AI — Partner Fulfillment API Specification

**Version**: Phase 9.8  
**Authentication**: Server-to-Server HMAC SHA-256 / Bearer Token  

---

## 1. REST Endpoints Summary

### `POST /api/fulfillment/submit`
Triggered by server-side dispatcher post-payment confirmation or retry worker.
- **Headers**:
  - `Content-Type: application/json`
  - `X-Correlation-Id: BW-FUL-YYYYMMDD-XXXXXXXX`
- **Request Body**:
  ```json
  {
    "fulfillmentId": "ful_1789021000_123",
    "orderId": "ord_pay_1789021000",
    "partnerId": "partner_silkcraft",
    "correlationId": "BW-FUL-20260910-84920193",
    "partnerSku": "SKC-KANJI-RED",
    "productId": "prod_kanjivaram_1",
    "productTitle": "Pure Kanjivaram Silk Saree",
    "quantity": 1,
    "shippingAddress": {
      "recipientName": "Priya Sharma",
      "phone": "+91 98112 34567",
      "addressLine1": "Flat 402, Sunshine Heights",
      "city": "Bengaluru",
      "state": "Karnataka",
      "postalCode": "560001",
      "country": "India"
    },
    "createdAt": "2026-09-10T08:00:00Z"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "partnerOrderReference": "MANUAL-PTR-partner_silkcraft-021000",
    "message": "Order submitted to Partner Portal workspace.",
    "status": "PARTNER_NOTIFIED"
  }
  ```

---

### `POST /api/fulfillment/tracking`
Submitted by partner merchant or carrier webhook when shipment is dispatched.
- **Request Body**:
  ```json
  {
    "fulfillmentId": "ful_1789021000_123",
    "orderId": "ord_pay_1789021000",
    "carrier": "BlueDart Express",
    "trackingNumber": "BD-88991204",
    "trackingUrl": "https://www.bluedart.com/tracking?awb=BD-88991204",
    "actorId": "partner_silkcraft"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Tracking updated for fulfillment ful_1789021000_123: BlueDart Express (BD-88991204)"
  }
  ```

---

### `POST /api/webhooks/partner-fulfillment`
Partner webhook listener for asynchronous event delivery. Enforces persistent idempotency (`eventId`).
- **Supported Events**: `ORDER_ACCEPTED`, `ORDER_REJECTED`, `PACKING`, `SHIPPED`, `OUT_FOR_DELIVERY`, `DELIVERED`, `RETURN_REQUESTED`, `INSPECTED`.
