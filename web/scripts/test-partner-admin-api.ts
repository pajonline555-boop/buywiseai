import assert from 'assert';
import { NextRequest } from 'next/server';
import { POST } from '../src/app/api/admin/partners/route';

function createMockToken(claims: {
  uid: string;
  email?: string;
  admin?: boolean;
  role?: string;
}): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(JSON.stringify({
    iss: 'https://securetoken.google.com/pajonline-shopping',
    aud: 'pajonline-shopping',
    auth_time: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    user_id: claims.uid,
    sub: claims.uid,
    ...claims
  })).toString('base64');
  return `Bearer ${header}.${payload}.signature`;
}

const ADMIN_TOKEN = createMockToken({
  uid: 'admin_user_root',
  email: 'pajonline555@gmail.com',
  admin: true,
  role: 'ADMIN'
});

const SHOPPER_TOKEN = createMockToken({
  uid: 'shopper_user_99',
  email: 'shopper@consumer.com',
  admin: false,
  role: 'SHOPPER'
});

async function runTests() {
  console.log('--- TESTING /api/admin/partners SERVER AUTHORIZATION & VALIDATION ---');

  // Test 1: Unauthenticated request must return 401
  const req1 = new NextRequest('http://localhost:3000/api/admin/partners', {
    method: 'POST',
    body: JSON.stringify({ action: 'GRANT_PERMISSION', email: 'test@brand.com', brandName: 'Test' })
  });
  const res1 = await POST(req1);
  assert.strictEqual(res1.status, 401, 'Unauthenticated request must return 401');
  console.log('  [PASS] 1. Unauthenticated request rejected with 401');

  // Test 2: Non-admin request must return 403
  const req2 = new NextRequest('http://localhost:3000/api/admin/partners', {
    method: 'POST',
    headers: { 'Authorization': SHOPPER_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'GRANT_PERMISSION', email: 'test@brand.com', brandName: 'Test' })
  });
  const res2 = await POST(req2);
  assert.strictEqual(res2.status, 403, 'Non-admin request must return 403');
  console.log('  [PASS] 2. Non-admin request rejected with 403');

  // Test 3: Invalid email rejected with 400
  const req3 = new NextRequest('http://localhost:3000/api/admin/partners', {
    method: 'POST',
    headers: { 'Authorization': ADMIN_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'GRANT_PERMISSION', email: 'not-an-email', brandName: 'Valid Brand' })
  });
  const res3 = await POST(req3);
  assert.strictEqual(res3.status, 400, 'Invalid email must return 400');
  const data3 = await res3.json();
  assert.strictEqual(data3.code, 'INVALID_EMAIL');
  console.log('  [PASS] 3. Invalid email rejected with 400 INVALID_EMAIL');

  // Test 4: Commission out of bounds (< 0 or > 50) rejected with 400
  const req4 = new NextRequest('http://localhost:3000/api/admin/partners', {
    method: 'POST',
    headers: { 'Authorization': ADMIN_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'GRANT_PERMISSION', email: 'seller@brand.com', brandName: 'Valid Brand', commissionValue: 75 })
  });
  const res4 = await POST(req4);
  assert.strictEqual(res4.status, 400, 'Commission out of bounds must return 400');
  const data4 = await res4.json();
  assert.strictEqual(data4.code, 'INVALID_COMMISSION');
  console.log('  [PASS] 4. Excessive commission (75%) rejected with 400 INVALID_COMMISSION');

  // Test 5: Invalid status transition rejected with 400
  const req5 = new NextRequest('http://localhost:3000/api/admin/partners', {
    method: 'POST',
    headers: { 'Authorization': ADMIN_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'GRANT_PERMISSION', email: 'seller@brand.com', brandName: 'Valid Brand', commissionValue: 15, status: 'INVALID_STATUS' })
  });
  const res5 = await POST(req5);
  assert.strictEqual(res5.status, 400, 'Invalid status must return 400');
  const data5 = await res5.json();
  assert.strictEqual(data5.code, 'INVALID_STATUS');
  console.log('  [PASS] 5. Unsupported partner status rejected with 400 INVALID_STATUS');

  console.log('\nALL 5 /api/admin/partners SERVER VALIDATION TESTS PASSED');
}

runTests().catch(err => {
  console.error('Test failure:', err);
  process.exit(1);
});
