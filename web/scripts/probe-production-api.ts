import axios from 'axios';

async function probeProduction() {
  console.log('=== PROBING LIVE PRODUCTION BACKEND: https://buywiseai.pajonline.co.in ===\n');

  // Test 1: GET /api/compare?q=shoes
  try {
    console.log('Test 1: GET /api/compare?q=shoes');
    const res1 = await axios.get('https://buywiseai.pajonline.co.in/api/compare', {
      params: { q: 'shoes' },
      validateStatus: () => true,
    });
    console.log(`Status: ${res1.status}`);
    console.log('Content-Type:', res1.headers['content-type']);
    console.log('Headers:', {
      'x-fah-adapter': res1.headers['x-fah-adapter'],
      'server': res1.headers['server'],
      'x-correlation-id': res1.headers['x-correlation-id']
    });
    console.log('Body:', JSON.stringify(res1.data).slice(0, 300));
  } catch (err: any) {
    console.log('Test 1 failed:', err.message);
  }

  // Test 2: GET /api/compare?query=shoes
  try {
    console.log('\nTest 2: GET /api/compare?query=shoes');
    const res2 = await axios.get('https://buywiseai.pajonline.co.in/api/compare?query=shoes', {
      validateStatus: () => true,
    });
    console.log(`Status: ${res2.status}`);
    console.log('Body:', JSON.stringify(res2.data).slice(0, 300));
  } catch (err: any) {
    console.log('Test 2 failed:', err.message);
  }

  // Test 3: POST /api/compare with canonical
  try {
    console.log('\nTest 3: POST /api/compare with canonical product');
    const res3 = await axios.post('https://buywiseai.pajonline.co.in/api/compare', {
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
      validateStatus: () => true,
    });
    console.log(`Status: ${res3.status}`);
    console.log('Body:', JSON.stringify(res3.data).slice(0, 300));
  } catch (err: any) {
    console.log('Test 3 failed:', err.message);
  }

  // Test 4: Root homepage
  try {
    console.log('\nTest 4: GET /');
    const res4 = await axios.get('https://buywiseai.pajonline.co.in/', {
      validateStatus: () => true,
    });
    console.log(`Status: ${res4.status}`);
    console.log('Content-Type:', res4.headers['content-type']);
    console.log('HTML Title snippet:', String(res4.data).slice(0, 200));
  } catch (err: any) {
    console.log('Test 4 failed:', err.message);
  }
}

probeProduction();
