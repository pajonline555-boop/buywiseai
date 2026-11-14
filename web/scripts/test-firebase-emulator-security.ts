/**
 * BUYWISE AI: REAL FIREBASE EMULATOR SECURITY RULES TEST SUITE
 * 
 * Executes real HTTP operations with authenticated and unauthenticated test identities
 * against the actual running Google Cloud Firestore and Firebase Storage rules engines.
 */

import http from 'http';

const PROJECT_ID = 'pajonline-shopping';
const FIRESTORE_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
const STORAGE_HOST = process.env.FIREBASE_STORAGE_EMULATOR_HOST || '127.0.0.1:9199';

const [fsHost, fsPort] = FIRESTORE_HOST.split(':');
const [stHost, stPort] = STORAGE_HOST.split(':');

// Helper to create valid unsigned JWT for emulator auth
function createEmulatorToken(claims: {
  uid: string;
  email?: string;
  admin?: boolean;
  role?: string;
  partnerId?: string;
}): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: `https://securetoken.google.com/${PROJECT_ID}`,
    aud: PROJECT_ID,
    auth_time: Math.floor(Date.now() / 1000),
    user_id: claims.uid,
    sub: claims.uid,
    ...claims
  })).toString('base64url');
  return `Bearer ${header}.${payload}.`;
}

// Test identities
const AUTH_ADMIN = createEmulatorToken({
  uid: 'admin_user_1',
  email: 'pajonline555@gmail.com',
  admin: true,
  role: 'ADMIN'
});

const AUTH_PARTNER_A = createEmulatorToken({
  uid: 'partner_A',
  email: 'partner_A@merchant.com',
  partnerId: 'partner_A',
  role: 'partner'
});

const AUTH_PARTNER_B = createEmulatorToken({
  uid: 'partner_B',
  email: 'partner_B@competitor.com',
  partnerId: 'partner_B',
  role: 'partner'
});

const AUTH_SHOPPER = createEmulatorToken({
  uid: 'shopper_1',
  email: 'shopper@consumer.com'
});

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, suite: string, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${testName}${detail ? ' -> ' + detail : ''}`);
  }
}

// Helper: Firestore REST Request
function firestoreRequest(options: {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  authToken?: string;
  body?: any;
}): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = `/v1/projects/${PROJECT_ID}/databases/(default)/documents/${options.path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (options.authToken) {
      headers['Authorization'] = options.authToken;
    }

    const reqBody = options.body ? JSON.stringify(options.body) : undefined;
    if (reqBody) {
      headers['Content-Length'] = Buffer.byteLength(reqBody).toString();
    }

    const req = http.request({
      host: fsHost,
      port: Number(fsPort),
      path: url,
      method: options.method,
      headers
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(raw); } catch (_) { parsed = raw; }
        resolve({ status: res.statusCode || 500, data: parsed });
      });
    });

    req.on('error', reject);
    if (reqBody) req.write(reqBody);
    req.end();
  });
}

// Helper: Convert raw JS object to Firestore REST fields format
function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === null || val === undefined) {
      fields[key] = { nullValue: null };
    } else if (typeof val === 'string') {
      fields[key] = { stringValue: val };
    } else if (typeof val === 'number') {
      if (Number.isInteger(val)) {
        fields[key] = { integerValue: val.toString() };
      } else {
        fields[key] = { doubleValue: val };
      }
    } else if (typeof val === 'boolean') {
      fields[key] = { booleanValue: val };
    } else if (Array.isArray(val)) {
      fields[key] = {
        arrayValue: {
          values: val.map(item => ({ stringValue: String(item) }))
        }
      };
    } else if (typeof val === 'object') {
      fields[key] = {
        mapValue: {
          fields: toFirestoreFields(val)
        }
      };
    }
  }
  return fields;
}

// Helper: Storage REST Request
function storageRequest(options: {
  method: 'GET' | 'POST' | 'DELETE';
  path: string;
  authToken?: string;
  contentType?: string;
  customMetadata?: Record<string, string>;
  body?: Buffer;
}): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const encodedPath = encodeURIComponent(options.path);
    const url = `/v0/b/${PROJECT_ID}.appspot.com/o/${encodedPath}`;
    const headers: Record<string, string> = {};

    if (options.authToken) {
      headers['Authorization'] = options.authToken;
    }
    if (options.contentType) {
      headers['Content-Type'] = options.contentType;
    }
    if (options.customMetadata) {
      for (const [k, v] of Object.entries(options.customMetadata)) {
        headers[`x-goog-meta-${k}`] = v;
      }
    }

    const req = http.request({
      host: stHost,
      port: Number(stPort),
      path: url,
      method: options.method,
      headers
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(raw); } catch (_) { parsed = raw; }
        resolve({ status: res.statusCode || 500, data: parsed });
      });
    });

    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

// Helper: Storage Upload to Emulator via Firebase v0 API
function storageUpload(options: {
  storagePath: string;
  authToken?: string;
  contentType: string;
  customMetadata?: Record<string, string>;
  content: Buffer;
}): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const encodedPath = encodeURIComponent(options.storagePath);
    const url = `/v0/b/${PROJECT_ID}.appspot.com/o?name=${encodedPath}`;

    const headers: Record<string, string> = {
      'Content-Type': options.contentType,
      'Content-Length': options.content.length.toString()
    };
    if (options.authToken) {
      headers['Authorization'] = options.authToken;
    }
    if (options.customMetadata) {
      for (const [k, v] of Object.entries(options.customMetadata)) {
        headers[`x-goog-meta-${k}`] = v;
      }
    }

    const req = http.request({
      host: stHost,
      port: Number(stPort),
      path: url,
      method: 'POST',
      headers
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(raw); } catch (_) { parsed = raw; }
        resolve({ status: res.statusCode || 500, data: parsed });
      });
    });

    req.on('error', reject);
    req.write(options.content);
    req.end();
  });
}

async function runTestSuite() {
  console.log('===============================================================================');
  console.log('BUYWISE AI: REAL FIREBASE EMULATOR SECURITY RULES TEST SUITE');
  console.log('===============================================================================');
  console.log(`Firestore Emulator: http://${FIRESTORE_HOST}`);
  console.log(`Storage Emulator:   http://${STORAGE_HOST}`);
  console.log(`Target Project:     ${PROJECT_ID}\n`);

  // =========================================================================
  // SUITE 1: FIRESTORE DEFAULT DENY & CATCH-ALL REMOVAL
  // =========================================================================
  console.log('--- SUITE 1: FIRESTORE STRICT DEFAULT DENY & CATCH-ALL REMOVAL ---');

  // 1.1 Unauthenticated write to undefined collection must be rejected (403)
  const r1_1 = await firestoreRequest({
    method: 'PATCH',
    path: 'unlisted_malicious_collection/doc1',
    body: { fields: toFirestoreFields({ hacked: true }) }
  });
  assert(r1_1.status === 403, 'SUITE 1', 'Unauthenticated write to unlisted collection blocked with 403 PERMISSION_DENIED', `Got: ${r1_1.status}`);

  // 1.2 Unauthenticated read from undefined collection must be rejected (403)
  const r1_2 = await firestoreRequest({
    method: 'GET',
    path: 'unlisted_malicious_collection/doc1'
  });
  assert(r1_2.status === 403, 'SUITE 1', 'Unauthenticated read from unlisted collection blocked with 403 PERMISSION_DENIED', `Got: ${r1_2.status}`);

  // 1.3 Authenticated normal user write to undefined collection must be rejected (403)
  const r1_3 = await firestoreRequest({
    method: 'PATCH',
    path: 'internal_secret_data/doc1',
    authToken: AUTH_SHOPPER,
    body: { fields: toFirestoreFields({ payload: 'exploit' }) }
  });
  assert(r1_3.status === 403, 'SUITE 1', 'Authenticated non-admin write to unlisted collection blocked with 403', `Got: ${r1_3.status}`);

  // 1.4 Unauthenticated read to admin_settings must be rejected (403)
  const r1_4 = await firestoreRequest({
    method: 'GET',
    path: 'admin_settings/global_config'
  });
  assert(r1_4.status === 403, 'SUITE 1', 'Unauthenticated read to admin_settings blocked with 403', `Got: ${r1_4.status}`);

  // 1.5 Authenticated non-admin write to admin_settings must be rejected (403)
  const r1_5 = await firestoreRequest({
    method: 'PATCH',
    path: 'admin_settings/global_config',
    authToken: AUTH_PARTNER_A,
    body: { fields: toFirestoreFields({ feePercentage: 0 }) }
  });
  assert(r1_5.status === 403, 'SUITE 1', 'Partner write to admin_settings blocked with 403', `Got: ${r1_5.status}`);

  // 1.6 Admin write to admin_settings must succeed (200)
  const r1_6 = await firestoreRequest({
    method: 'PATCH',
    path: 'admin_settings/global_config',
    authToken: AUTH_ADMIN,
    body: { fields: toFirestoreFields({ feePercentage: 10, maintenanceMode: false }) }
  });
  assert(r1_6.status === 200, 'SUITE 1', 'Admin write to admin_settings succeeds with 200 OK', `Got: ${r1_6.status}`);

  // =========================================================================
  // SUITE 2: PARTNER PRODUCTS CREATION & PRIVILEGE ESCALATION BLOCK
  // =========================================================================
  console.log('\n--- SUITE 2: PARTNER PRODUCTS & PRIVILEGE ESCALATION SAFEGUARDS ---');

  // 2.0 Admin authorizes Partner A with APPROVED selling permission
  const r2_0 = await firestoreRequest({
    method: 'PATCH',
    path: 'partners/partner_A',
    authToken: AUTH_ADMIN,
    body: {
      fields: toFirestoreFields({
        id: 'partner_A',
        brandName: 'Partner A Store',
        email: 'partner_A@merchant.com',
        status: 'APPROVED',
        commissionValue: 12
      })
    }
  });
  assert(r2_0.status === 200, 'SUITE 2', 'Admin grants and initializes Partner A approved permission -> 200 OK', `Got: ${r2_0.status}`);

  // 2.1 Partner A creates a valid new product listing (DRAFT, unverified) -> 200
  const validProductA = {
    id: 'prod_valid_A1',
    partnerId: 'partner_A',
    title: 'Partner A Handloom Cotton Saree',
    mrp: 2999,
    sellingPrice: 1499,
    status: 'DRAFT',
    reviewStatus: 'DRAFT',
    verificationStatus: 'unverified',
    stock: 25
  };
  const r2_1 = await firestoreRequest({
    method: 'PATCH',
    path: 'partner_products/prod_valid_A1',
    authToken: AUTH_PARTNER_A,
    body: { fields: toFirestoreFields(validProductA) }
  });
  assert(r2_1.status === 200, 'SUITE 2', 'Partner A creates valid unverified DRAFT listing -> 200 OK', `Got: ${r2_1.status}`);

  // 2.2 Malicious Partner B attempts to create listing claiming to be Partner A -> 403
  const spoofProduct = {
    ...validProductA,
    id: 'prod_spoof_A2',
    partnerId: 'partner_A'
  };
  const r2_2 = await firestoreRequest({
    method: 'PATCH',
    path: 'partner_products/prod_spoof_A2',
    authToken: AUTH_PARTNER_B,
    body: { fields: toFirestoreFields(spoofProduct) }
  });
  assert(r2_2.status === 403, 'SUITE 2', 'Cross-partner spoofing (Partner B creating for Partner A) blocked -> 403', `Got: ${r2_2.status}`);

  // 2.3 Partner A attempts to self-verify listing price -> 403
  const selfVerifyAttempt = {
    ...validProductA,
    id: 'prod_self_verify',
    verificationStatus: 'verified_live',
    verifiedPrice: 1499
  };
  const r2_3 = await firestoreRequest({
    method: 'PATCH',
    path: 'partner_products/prod_self_verify',
    authToken: AUTH_PARTNER_A,
    body: { fields: toFirestoreFields(selfVerifyAttempt) }
  });
  assert(r2_3.status === 403, 'SUITE 2', 'Partner A self-assigning verificationStatus=verified_live blocked -> 403', `Got: ${r2_3.status}`);

  // 2.4 Partner A attempts to self-award partnerBadge -> 403
  const badgeAttempt = {
    ...validProductA,
    id: 'prod_badge_attempt',
    partnerBadge: true
  };
  const r2_4 = await firestoreRequest({
    method: 'PATCH',
    path: 'partner_products/prod_badge_attempt',
    authToken: AUTH_PARTNER_A,
    body: { fields: toFirestoreFields(badgeAttempt) }
  });
  assert(r2_4.status === 403, 'SUITE 2', 'Partner A self-awarding partnerBadge=true blocked -> 403', `Got: ${r2_4.status}`);

  // 2.5 Partner A attempts to self-approve reviewStatus=APPROVED -> 403
  const approveAttempt = {
    ...validProductA,
    id: 'prod_approve_attempt',
    reviewStatus: 'APPROVED'
  };
  const r2_5 = await firestoreRequest({
    method: 'PATCH',
    path: 'partner_products/prod_approve_attempt',
    authToken: AUTH_PARTNER_A,
    body: { fields: toFirestoreFields(approveAttempt) }
  });
  assert(r2_5.status === 403, 'SUITE 2', 'Partner A self-approving reviewStatus=APPROVED blocked -> 403', `Got: ${r2_5.status}`);

  // 2.6 Partner A attempts to publish directly to status=LIVE -> 403
  const publishAttempt = {
    ...validProductA,
    id: 'prod_live_attempt',
    status: 'LIVE'
  };
  const r2_6 = await firestoreRequest({
    method: 'PATCH',
    path: 'partner_products/prod_live_attempt',
    authToken: AUTH_PARTNER_A,
    body: { fields: toFirestoreFields(publishAttempt) }
  });
  assert(r2_6.status === 403, 'SUITE 2', 'Partner A publishing directly to LIVE status blocked -> 403', `Got: ${r2_6.status}`);

  // 2.7 Partner B attempts to update Partner A's existing product -> 403
  const r2_7 = await firestoreRequest({
    method: 'PATCH',
    path: 'partner_products/prod_valid_A1',
    authToken: AUTH_PARTNER_B,
    body: { fields: toFirestoreFields({ title: 'Defaced by Competitor', sellingPrice: 1 }) }
  });
  assert(r2_7.status === 403, 'SUITE 2', 'Cross-partner update (Partner B modifying Partner A product) blocked -> 403', `Got: ${r2_7.status}`);

  // 2.8 Partner B attempts to delete Partner A's product -> 403
  const r2_8 = await firestoreRequest({
    method: 'DELETE',
    path: 'partner_products/prod_valid_A1',
    authToken: AUTH_PARTNER_B
  });
  assert(r2_8.status === 403, 'SUITE 2', 'Cross-partner delete (Partner B deleting Partner A product) blocked -> 403', `Got: ${r2_8.status}`);

  // 2.9 Admin approves product and sets verified_live status -> 200
  const r2_9 = await firestoreRequest({
    method: 'PATCH',
    path: 'partner_products/prod_valid_A1',
    authToken: AUTH_ADMIN,
    body: {
      fields: toFirestoreFields({
        ...validProductA,
        status: 'LIVE',
        reviewStatus: 'APPROVED',
        verificationStatus: 'verified_live',
        verifiedPrice: 1499,
        partnerBadge: true
      })
    }
  });
  assert(r2_9.status === 200, 'SUITE 2', 'Admin successfully reviews and verifies partner product -> 200 OK', `Got: ${r2_9.status}`);

  // =========================================================================
  // SUITE 3: PARTNER ORDERS & FULFILLMENT INTEGRITY
  // =========================================================================
  console.log('\n--- SUITE 3: PARTNER ORDERS & FULFILLMENT TRACKING INTEGRITY ---');

  // 3.1 Unauthenticated client attempts to create order -> 403
  const orderPayload = {
    orderId: 'ord_test_101',
    partnerId: 'partner_A',
    userId: 'shopper_1',
    totalAmount: 1499,
    paymentStatus: 'PAID',
    orderStatus: 'PENDING_FULFILLMENT',
    items: ['prod_valid_A1']
  };
  const r3_1 = await firestoreRequest({
    method: 'PATCH',
    path: 'partner_orders/ord_test_101',
    body: { fields: toFirestoreFields(orderPayload) }
  });
  assert(r3_1.status === 403, 'SUITE 3', 'Unauthenticated client cannot create partner orders -> 403', `Got: ${r3_1.status}`);

  // 3.2 Authenticated shopper creates order for themselves -> 200
  const r3_2 = await firestoreRequest({
    method: 'PATCH',
    path: 'partner_orders/ord_test_101',
    authToken: AUTH_SHOPPER,
    body: { fields: toFirestoreFields(orderPayload) }
  });
  assert(r3_2.status === 200, 'SUITE 3', 'Authenticated shopper creates their own order -> 200 OK', `Got: ${r3_2.status}`);

  // 3.3 Partner A attempts to tamper with totalAmount / paymentStatus -> 403
  const r3_3 = await firestoreRequest({
    method: 'PATCH',
    path: 'partner_orders/ord_test_101',
    authToken: AUTH_PARTNER_A,
    body: { fields: toFirestoreFields({ ...orderPayload, totalAmount: 9999, paymentStatus: 'UNPAID' }) }
  });
  assert(r3_3.status === 403, 'SUITE 3', 'Partner A altering financial balance / paymentStatus blocked -> 403', `Got: ${r3_3.status}`);

  // 3.4 Partner A updates allowed fulfillment tracking fields -> 200
  const r3_4 = await firestoreRequest({
    method: 'PATCH',
    path: 'partner_orders/ord_test_101',
    authToken: AUTH_PARTNER_A,
    body: {
      fields: toFirestoreFields({
        ...orderPayload,
        orderStatus: 'SHIPPED',
        courierCarrier: 'BlueDart',
        trackingNumber: 'BD-98213812',
        updatedAt: new Date().toISOString()
      })
    }
  });
  assert(r3_4.status === 200, 'SUITE 3', 'Partner A updates fulfillment tracking fields -> 200 OK', `Got: ${r3_4.status}`);

  // 3.5 Competitor Partner B attempts to update Partner A's order tracking -> 403
  const r3_5 = await firestoreRequest({
    method: 'PATCH',
    path: 'partner_orders/ord_test_101',
    authToken: AUTH_PARTNER_B,
    body: {
      fields: toFirestoreFields({
        ...orderPayload,
        orderStatus: 'CANCELLED',
        courierCarrier: 'Malicious',
        trackingNumber: 'HACKED'
      })
    }
  });
  assert(r3_5.status === 403, 'SUITE 3', 'Competitor Partner B updating Partner A order tracking blocked -> 403', `Got: ${r3_5.status}`);

  // =========================================================================
  // SUITE 4: PARTNER ANALYTICS IMMUTABILITY & ISOLATION
  // =========================================================================
  console.log('\n--- SUITE 4: PARTNER ANALYTICS IMMUTABILITY & ISOLATION ---');

  // 4.1 Ingestion of consumer product impression event -> 200
  const eventPayload = {
    eventId: 'evt_imp_01',
    partnerId: 'partner_A',
    eventType: 'product_detail_view',
    productId: 'prod_valid_A1',
    timestamp: new Date().toISOString()
  };
  const r4_1 = await firestoreRequest({
    method: 'PATCH',
    path: 'partner_analytics_events/evt_imp_01',
    body: { fields: toFirestoreFields(eventPayload) }
  });
  assert(r4_1.status === 200, 'SUITE 4', 'Consumer telemetry impression event created -> 200 OK', `Got: ${r4_1.status}`);

  // 4.2 Client attempts to modify recorded analytics event -> 403
  const r4_2 = await firestoreRequest({
    method: 'PATCH',
    path: 'partner_analytics_events/evt_imp_01',
    authToken: AUTH_PARTNER_A,
    body: { fields: toFirestoreFields({ ...eventPayload, count: 5000 }) }
  });
  assert(r4_2.status === 403, 'SUITE 4', 'Client cannot update recorded analytics event -> 403', `Got: ${r4_2.status}`);

  // 4.3 Client attempts to delete analytics event -> 403
  const r4_3 = await firestoreRequest({
    method: 'DELETE',
    path: 'partner_analytics_events/evt_imp_01',
    authToken: AUTH_PARTNER_A
  });
  assert(r4_3.status === 403, 'SUITE 4', 'Client cannot delete analytics event -> 403', `Got: ${r4_3.status}`);

  // 4.4 Partner B attempts to read Partner A's analytics -> 403
  const r4_4 = await firestoreRequest({
    method: 'GET',
    path: 'partner_analytics_events/evt_imp_01',
    authToken: AUTH_PARTNER_B
  });
  assert(r4_4.status === 403, 'SUITE 4', 'Partner B reading Partner A analytics blocked -> 403', `Got: ${r4_4.status}`);

  // 4.5 Partner A reads their own analytics -> 200
  const r4_5 = await firestoreRequest({
    method: 'GET',
    path: 'partner_analytics_events/evt_imp_01',
    authToken: AUTH_PARTNER_A
  });
  assert(r4_5.status === 200, 'SUITE 4', 'Partner A reads their own analytics event -> 200 OK', `Got: ${r4_5.status}`);

  // =========================================================================
  // SUITE 5: STORAGE RULES — EXACT PARTNER OWNERSHIP & UPLOADS
  // =========================================================================
  console.log('\n--- SUITE 5: STORAGE RULES — EXACT PARTNER OWNERSHIP ---');

  const validImageBytes = Buffer.from('GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;');

  // 5.1 Partner A uploads valid image to their own path -> 200
  const r5_1 = await storageUpload({
    storagePath: 'partner-uploads/partner_A/product_a.jpg',
    authToken: AUTH_PARTNER_A,
    contentType: 'image/jpeg',
    customMetadata: { partnerId: 'partner_A', published: 'false', status: 'PENDING_REVIEW' },
    content: validImageBytes
  });
  assert(r5_1.status === 200, 'SUITE 5', 'Partner A uploads image to /partner-uploads/partner_A/ -> 200 OK', `Got: ${r5_1.status}`);

  // 5.2 Competitor Partner B attempts to upload into Partner A folder -> 403
  const r5_2 = await storageUpload({
    storagePath: 'partner-uploads/partner_A/hacked_by_b.jpg',
    authToken: AUTH_PARTNER_B,
    contentType: 'image/jpeg',
    customMetadata: { partnerId: 'partner_A' },
    content: validImageBytes
  });
  assert(r5_2.status === 403, 'SUITE 5', 'Cross-partner storage upload (Partner B into partner_A/) blocked -> 403', `Got: ${r5_2.status}`);

  // 5.3 Competitor Partner B attempts to delete Partner A file -> 403
  const r5_3 = await storageRequest({
    method: 'DELETE',
    path: 'partner-uploads/partner_A/product_a.jpg',
    authToken: AUTH_PARTNER_B
  });
  assert(r5_3.status === 403, 'SUITE 5', 'Cross-partner storage delete (Partner B deleting partner_A file) blocked -> 403', `Got: ${r5_3.status}`);

  // 5.4 Unauthenticated user attempts to upload into Partner A folder -> 403
  const r5_4 = await storageUpload({
    storagePath: 'partner-uploads/partner_A/unauth_hack.jpg',
    contentType: 'image/jpeg',
    content: validImageBytes
  });
  assert(r5_4.status === 403, 'SUITE 5', 'Unauthenticated upload into partner-uploads/ blocked -> 403', `Got: ${r5_4.status}`);

  // 5.5 Partner A uploads non-image executable -> 403
  const r5_5 = await storageUpload({
    storagePath: 'partner-uploads/partner_A/malware.exe',
    authToken: AUTH_PARTNER_A,
    contentType: 'application/x-msdownload',
    content: Buffer.from('MZ\x90\x00')
  });
  assert(r5_5.status === 403, 'SUITE 5', 'Executable / non-image upload blocked -> 403', `Got: ${r5_5.status}`);

  // 5.6 Partner A uploads file exceeding 5MB -> 403
  const hugeBuffer = Buffer.alloc(5.5 * 1024 * 1024);
  const r5_6 = await storageUpload({
    storagePath: 'partner-uploads/partner_A/huge_file.jpg',
    authToken: AUTH_PARTNER_A,
    contentType: 'image/jpeg',
    content: hugeBuffer
  });
  assert(r5_6.status === 403, 'SUITE 5', 'File exceeding 5MB limit blocked -> 403', `Got: ${r5_6.status}`);

  // =========================================================================
  // SUITE 6: STORAGE RULES — UNPUBLISHED MEDIA PROTECTION
  // =========================================================================
  console.log('\n--- SUITE 6: STORAGE RULES — UNPUBLISHED MEDIA PROTECTION ---');

  // 6.1 Partner A uploads draft image with published: 'false' -> 200
  const r6_1 = await storageUpload({
    storagePath: 'partner-uploads/partner_A/draft_secret.jpg',
    authToken: AUTH_PARTNER_A,
    contentType: 'image/jpeg',
    customMetadata: { partnerId: 'partner_A', published: 'false', status: 'DRAFT' },
    content: validImageBytes
  });
  assert(r6_1.status === 200, 'SUITE 6', 'Upload of unpublished draft image -> 200 OK', `Got: ${r6_1.status}`);

  // 6.2 Public unauthenticated consumer attempts to download unpublished draft image -> 403
  const r6_2 = await storageRequest({
    method: 'GET',
    path: 'partner-uploads/partner_A/draft_secret.jpg'
  });
  assert(r6_2.status === 403, 'SUITE 6', 'Public unauthenticated access to unpublished image blocked -> 403', `Got: ${r6_2.status}`);

  // 6.3 Owning Partner A reads their own unpublished draft image -> 200
  const r6_3 = await storageRequest({
    method: 'GET',
    path: 'partner-uploads/partner_A/draft_secret.jpg',
    authToken: AUTH_PARTNER_A
  });
  assert(r6_3.status === 200, 'SUITE 6', 'Owning Partner A can access their own unpublished image -> 200 OK', `Got: ${r6_3.status}`);

  // 6.4 Platform Admin reads unpublished draft image -> 200
  const r6_4 = await storageRequest({
    method: 'GET',
    path: 'partner-uploads/partner_A/draft_secret.jpg',
    authToken: AUTH_ADMIN
  });
  assert(r6_4.status === 200, 'SUITE 6', 'Platform Admin can inspect unpublished image -> 200 OK', `Got: ${r6_4.status}`);

  // 6.5 Partner uploads approved / published image -> 200
  const r6_5_upload = await storageUpload({
    storagePath: 'partner-uploads/partner_A/published/approved_catalog.jpg',
    authToken: AUTH_PARTNER_A,
    contentType: 'image/jpeg',
    customMetadata: { partnerId: 'partner_A', published: 'true', status: 'APPROVED' },
    content: validImageBytes
  });
  assert(r6_5_upload.status === 200, 'SUITE 6', 'Upload of approved/published image -> 200 OK', `Got: ${r6_5_upload.status}`);

  // 6.6 Public unauthenticated consumer reads approved/published image -> 200
  const r6_6 = await storageRequest({
    method: 'GET',
    path: 'partner-uploads/partner_A/published/approved_catalog.jpg'
  });
  assert(r6_6.status === 200, 'SUITE 6', 'Public consumer can display approved/published catalog image -> 200 OK', `Got: ${r6_6.status}`);

  // 6.7 Partner A deletes their own file -> 200
  const r6_7 = await storageRequest({
    method: 'DELETE',
    path: 'partner-uploads/partner_A/draft_secret.jpg',
    authToken: AUTH_PARTNER_A
  });
  assert(r6_7.status === 200 || r6_7.status === 204, 'SUITE 6', 'Partner A deletes their own file -> 200/204 OK', `Got: ${r6_7.status}`);

  // =========================================================================
  // SUITE 7: PARTNER PERMISSIONS & MERCHANT SELLING AUTHORIZATION RULES
  // =========================================================================
  console.log('\n--- SUITE 7: PARTNER PERMISSION SECURITY & SELLING AUTHORIZATION ---');

  // 7.1 Admin grants selling permission to a new merchant -> 200 OK
  const r7_1 = await firestoreRequest({
    method: 'PATCH',
    path: 'partners/partner_royal_silks',
    authToken: AUTH_ADMIN,
    body: {
      fields: toFirestoreFields({
        id: 'partner_royal_silks',
        brandName: 'Royal Silks Boutique',
        email: 'seller@royalsilks.com',
        status: 'APPROVED',
        commissionValue: 10,
        city: 'Surat',
        state: 'Gujarat'
      })
    }
  });
  assert(r7_1.status === 200, 'SUITE 7', 'Admin grants selling permission to new merchant -> 200 OK', `Got: ${r7_1.status}`);

  // 7.2 Non-admin (shopper) attempts to grant selling permission / create approved partner -> 403 Forbidden
  const r7_2 = await firestoreRequest({
    method: 'PATCH',
    path: 'partners/partner_attacker_store',
    authToken: AUTH_SHOPPER,
    body: {
      fields: toFirestoreFields({
        id: 'partner_attacker_store',
        brandName: 'Attacker Fake Store',
        status: 'APPROVED',
        commissionValue: 0
      })
    }
  });
  assert(r7_2.status === 403, 'SUITE 7', 'Non-admin attempt to grant permission / create approved partner blocked -> 403', `Got: ${r7_2.status}`);

  // 7.3 Unauthenticated user attempts to create partner record -> 403 Forbidden
  const r7_3 = await firestoreRequest({
    method: 'PATCH',
    path: 'partners/partner_anon_hacker',
    body: {
      fields: toFirestoreFields({
        id: 'partner_anon_hacker',
        status: 'APPROVED'
      })
    }
  });
  assert(r7_3.status === 403, 'SUITE 7', 'Unauthenticated partner creation attempt blocked -> 403', `Got: ${r7_3.status}`);

  // 7.4 Merchant A attempts to modify or approve Merchant B -> 403 Forbidden
  const r7_4 = await firestoreRequest({
    method: 'PATCH',
    path: 'partners/partner_B',
    authToken: AUTH_PARTNER_A,
    body: {
      fields: toFirestoreFields({
        status: 'SUSPENDED',
        brandName: 'Vandalized by Competitor'
      })
    }
  });
  assert(r7_4.status === 403, 'SUITE 7', 'Cross-merchant modification attempt blocked -> 403', `Got: ${r7_4.status}`);

  // 7.5 Merchant A attempts to elevate own status or self-approve -> 403 Forbidden
  const r7_5 = await firestoreRequest({
    method: 'PATCH',
    path: 'partners/partner_A',
    authToken: AUTH_PARTNER_A,
    body: {
      fields: toFirestoreFields({
        status: 'APPROVED'
      })
    }
  });
  assert(r7_5.status === 403, 'SUITE 7', 'Merchant self-approval / status tampering blocked -> 403', `Got: ${r7_5.status}`);

  // 7.6 Merchant A attempts to change their own platform commission rate -> 403 Forbidden
  const r7_6 = await firestoreRequest({
    method: 'PATCH',
    path: 'partners/partner_A',
    authToken: AUTH_PARTNER_A,
    body: {
      fields: toFirestoreFields({
        commissionValue: 0
      })
    }
  });
  assert(r7_6.status === 403, 'SUITE 7', 'Merchant commission rate tampering blocked -> 403', `Got: ${r7_6.status}`);

  // 7.7 Admin suspends an existing merchant -> 200 OK
  const r7_7 = await firestoreRequest({
    method: 'PATCH',
    path: 'partners/partner_suspended_merchant',
    authToken: AUTH_ADMIN,
    body: {
      fields: toFirestoreFields({
        id: 'partner_suspended_merchant',
        brandName: 'Suspended Merchant Store',
        email: 'suspended@merchant.com',
        status: 'SUSPENDED',
        commissionValue: 15
      })
    }
  });
  assert(r7_7.status === 200, 'SUITE 7', 'Admin suspends merchant selling permission -> 200 OK', `Got: ${r7_7.status}`);

  // 7.8 Suspended merchant attempts to submit a product listing -> 403 Forbidden
  const AUTH_SUSPENDED_PARTNER = createEmulatorToken({
    uid: 'partner_suspended_merchant',
    email: 'suspended@merchant.com',
    partnerId: 'partner_suspended_merchant',
    role: 'partner'
  });
  const r7_8 = await firestoreRequest({
    method: 'PATCH',
    path: 'partner_products/prod_suspended_attempt',
    authToken: AUTH_SUSPENDED_PARTNER,
    body: {
      fields: toFirestoreFields({
        id: 'prod_suspended_attempt',
        partnerId: 'partner_suspended_merchant',
        title: 'Listing by Suspended Seller',
        mrp: 1999,
        sellingPrice: 999,
        status: 'DRAFT',
        reviewStatus: 'DRAFT',
        verificationStatus: 'unverified'
      })
    }
  });
  assert(r7_8.status === 403, 'SUITE 7', 'Suspended merchant blocked from submitting product listings -> 403', `Got: ${r7_8.status}`);

  // 7.9 Stale cache simulation: Client presents stale APPROVED cache, but Firestore rules block unapproved partner listing -> 403
  const r7_9 = await firestoreRequest({
    method: 'PATCH',
    path: 'partner_products/prod_stale_cache_attempt',
    authToken: AUTH_SHOPPER,
    body: {
      fields: toFirestoreFields({
        id: 'prod_stale_cache_attempt',
        partnerId: 'partner_non_existent',
        title: 'Listing by Unapproved Stale Account',
        mrp: 1999,
        sellingPrice: 999,
        status: 'DRAFT',
        reviewStatus: 'DRAFT',
        verificationStatus: 'unverified'
      })
    }
  });
  assert(r7_9.status === 403, 'SUITE 7', 'Stale cache submission blocked by Firestore rules -> 403', `Got: ${r7_9.status}`);

  // 7.10 Legitimate partner updating allowed non-privileged profile fields (phone, city, gstNumber) -> 200 OK
  const r7_10 = await firestoreRequest({
    method: 'PATCH',
    path: 'partners/partner_A',
    authToken: AUTH_PARTNER_A,
    body: {
      fields: toFirestoreFields({
        id: 'partner_A',
        brandName: 'Partner A Store',
        email: 'partner_A@merchant.com',
        status: 'APPROVED',
        commissionValue: 12,
        phone: '+91 9998887776',
        city: 'Ahmedabad',
        gstNumber: '24AAACR1234M1Z5'
      })
    }
  });
  assert(r7_10.status === 200, 'SUITE 7', 'Partner updating permitted profile fields succeeds -> 200 OK', `Got: ${r7_10.status}`);

  console.log('\n===============================================================================');
  console.log(`REAL EMULATOR SECURITY TEST RESULTS: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
  console.log('===============================================================================');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
