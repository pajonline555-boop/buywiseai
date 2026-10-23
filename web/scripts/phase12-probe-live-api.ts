import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

interface ProbeRecord {
  scenario: string;
  url: string;
  method: string;
  status: number;
  contentType: string | undefined;
  server: string | undefined;
  adapter: string | undefined;
  body: any;
  timestamp: string;
  notes: string;
}

async function probeLiveApi() {
  console.log('=== PHASE 12: PROBING LIVE PRODUCTION API ENDPOINT ===');
  const baseUrl = 'https://buywiseai.pajonline.co.in';
  const records: ProbeRecord[] = [];

  // Probe 1: /api/compare without parameters
  try {
    const res1 = await axios.get(`${baseUrl}/api/compare`, { validateStatus: () => true });
    records.push({
      scenario: '1. /api/compare without parameters',
      url: `${baseUrl}/api/compare`,
      method: 'GET',
      status: res1.status,
      contentType: res1.headers['content-type'],
      server: res1.headers['server'],
      adapter: res1.headers['x-fah-adapter'],
      body: res1.data,
      timestamp: new Date().toISOString(),
      notes: 'Expected 400 Bad Request since query is required.'
    });
  } catch (err: any) {
    console.error('Probe 1 failed:', err.message);
  }

  // Probe 2: /api/compare?q=sneakers
  try {
    const res2 = await axios.get(`${baseUrl}/api/compare?q=sneakers`, { validateStatus: () => true });
    records.push({
      scenario: '2. /api/compare?q=sneakers',
      url: `${baseUrl}/api/compare?q=sneakers`,
      method: 'GET',
      status: res2.status,
      contentType: res2.headers['content-type'],
      server: res2.headers['server'],
      adapter: res2.headers['x-fah-adapter'],
      body: res2.data,
      timestamp: new Date().toISOString(),
      notes: 'Live server fails with 400 {"error":"Search query is required."} due to legacy force-static build on Firebase App Hosting.'
    });
  } catch (err: any) {
    console.error('Probe 2 failed:', err.message);
  }

  // Probe 3: /api/compare?query=sneakers
  try {
    const res3 = await axios.get(`${baseUrl}/api/compare?query=sneakers`, { validateStatus: () => true });
    records.push({
      scenario: '3. /api/compare?query=sneakers',
      url: `${baseUrl}/api/compare?query=sneakers`,
      method: 'GET',
      status: res3.status,
      contentType: res3.headers['content-type'],
      server: res3.headers['server'],
      adapter: res3.headers['x-fah-adapter'],
      body: res3.data,
      timestamp: new Date().toISOString(),
      notes: 'Alternative query param also fails with 400 on legacy deployment.'
    });
  } catch (err: any) {
    console.error('Probe 3 failed:', err.message);
  }

  // Probe 4: POST /api/compare with CanonicalProduct body
  try {
    const res4 = await axios.post(`${baseUrl}/api/compare`, {
      canonical: {
        title: 'LANCER Mens Wonder-3 Running Shoes',
        brand: 'LANCER',
        model: 'Wonder-3'
      },
      mode: 'exact'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://buywiseai.pajonline.co.in'
      },
      validateStatus: () => true
    });
    records.push({
      scenario: '4. POST /api/compare with CanonicalProduct',
      url: `${baseUrl}/api/compare`,
      method: 'POST',
      status: res4.status,
      contentType: res4.headers['content-type'],
      server: res4.headers['server'],
      adapter: res4.headers['x-fah-adapter'],
      body: res4.data,
      timestamp: new Date().toISOString(),
      notes: 'Live server returns 500 because upstream retailer credentials are not configured in Firebase App Hosting environment.'
    });
  } catch (err: any) {
    console.error('Probe 4 failed:', err.message);
  }

  // Probe 5: Android request format simulation
  // Android Retrofit: @GET("/api/compare") compareProducts(@Query("q") query: String)
  // Headers: Accept: application/json, User-Agent: BuyWiseAI-Android/1.0
  try {
    const res5 = await axios.get(`${baseUrl}/api/compare`, {
      params: { q: 'Lancer Wonder-3' },
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'BuyWiseAI-Android/1.0'
      },
      validateStatus: () => true
    });
    records.push({
      scenario: '5. Android Retrofit GET /api/compare?q=Lancer+Wonder-3',
      url: `${baseUrl}/api/compare?q=Lancer+Wonder-3`,
      method: 'GET',
      status: res5.status,
      contentType: res5.headers['content-type'],
      server: res5.headers['server'],
      adapter: res5.headers['x-fah-adapter'],
      body: res5.data,
      timestamp: new Date().toISOString(),
      notes: 'Android client receives 400, triggering SmartCompareRepository fallback to offline mock.'
    });
  } catch (err: any) {
    console.error('Probe 5 failed:', err.message);
  }

  console.log('\n--- PROBE RESULTS ---');
  records.forEach(r => {
    console.log(`\nScenario: ${r.scenario}`);
    console.log(`Status: ${r.status} | Content-Type: ${r.contentType}`);
    console.log(`Server: ${r.server} | Adapter: ${r.adapter}`);
    console.log(`Body: ${JSON.stringify(r.body)}`);
  });

  const outPath = path.join(__dirname, '../scratch/live-probe-results.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(records, null, 2));
  console.log(`\nSaved live probe records to ${outPath}`);
}

probeLiveApi();
