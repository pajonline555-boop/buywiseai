import { NextRequest } from 'next/server';
import { GET, POST } from '../src/app/api/compare/route';

async function runLocalApiSmoke() {
  console.log('--- LOCAL PRODUCTION-MODE API SMOKE TESTS ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] ${desc}`);
      failed++;
    }
  }

  // 1. GET without parameters -> 400 JSON
  console.log('Testing GET /api/compare without parameters...');
  const req1 = new NextRequest('http://localhost:3000/api/compare');
  const res1 = await GET(req1);
  assert(res1.status === 400, 'GET /api/compare returns HTTP 400 when query is missing');
  const body1 = await res1.json();
  assert(body1.error === 'Search query is required.', 'GET /api/compare returns clear error message');
  assert(res1.headers.get('content-type')?.includes('application/json') === true, 'Response is application/json');

  // 2. GET with ?q=sneakers -> 200 JSON
  console.log('Testing GET /api/compare?q=sneakers...');
  const req2 = new NextRequest('http://localhost:3000/api/compare?q=sneakers');
  const res2 = await GET(req2);
  assert(res2.status === 200, 'GET /api/compare?q=sneakers returns HTTP 200');
  const body2 = await res2.json();
  assert(typeof body2 === 'object' && Array.isArray(body2.stores), 'Returns JSON with stores array');
  assert(typeof body2.summary === 'object', 'Returns JSON with summary');

  // 3. GET with ?query=sneakers -> 200 JSON
  console.log('Testing GET /api/compare?query=sneakers...');
  const req3 = new NextRequest('http://localhost:3000/api/compare?query=sneakers');
  const res3 = await GET(req3);
  assert(res3.status === 200, 'GET /api/compare?query=sneakers returns HTTP 200');

  // 4. POST with string query { "q": "sneakers" } -> 200 JSON
  console.log('Testing POST /api/compare with { "q": "sneakers" }...');
  const req4 = new Request('http://localhost:3000/api/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: 'sneakers' }),
  });
  const res4 = await POST(req4);
  assert(res4.status === 200, 'POST /api/compare with { q: "sneakers" } returns HTTP 200');
  const body4 = await res4.json();
  assert(Array.isArray(body4.stores), 'POST returns stores array');

  // 5. POST with Android CanonicalQuery { "canonical": { "title": "Lancer Wonder-3", "rawInput": "Lancer Wonder-3" } }
  console.log('Testing POST /api/compare with Android CanonicalQuery...');
  const req5 = new Request('http://localhost:3000/api/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      canonical: {
        rawInput: 'Lancer Wonder-3',
        title: 'Lancer Wonder-3',
        category: 'Footwear',
      },
      mode: 'exact',
    }),
  });
  const res5 = await POST(req5);
  assert(res5.status === 200, 'POST /api/compare with Android CanonicalQuery returns HTTP 200 without TypeError');
  const body5 = await res5.json();
  assert(Array.isArray(body5.stores), 'POST returns valid comparison response for Android payload');

  // 6. POST with empty body -> 400 JSON
  console.log('Testing POST /api/compare with empty body...');
  const req6 = new Request('http://localhost:3000/api/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const res6 = await POST(req6);
  assert(res6.status === 400, 'POST /api/compare with empty body returns HTTP 400');
  const body6 = await res6.json();
  assert(body6.error?.includes('required') === true, 'Returns descriptive 400 error');

  console.log(`\nLocal API Smoke Test Summary: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

runLocalApiSmoke().catch(err => {
  console.error('Smoke test failed:', err);
  process.exit(1);
});
