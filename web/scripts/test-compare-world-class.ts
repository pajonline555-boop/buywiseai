import { executeComparison } from '../src/lib/comparison/compare';

async function testAll() {
  const queries = [
    'samsung tv',
    'iPhone 16',
    'macbook air',
    'sony xm5',
    'banarasi saree',
    'aluminium foil'
  ];

  console.log('=== TESTING WORLD CLASS COMPARE MATRIX ===\n');

  for (const q of queries) {
    console.log(`QUERY: "${q}"`);
    const res = await executeComparison(q);
    console.log(`  Summary: Lowest = ₹${res.summary.lowestPrice}, Highest = ₹${res.summary.highestPrice}, Savings = ₹${res.summary.maximumSavings}`);
    res.stores.forEach(s => {
      console.log(`  [${s.store}] - ${s.title.slice(0, 60)}... : ₹${s.price} (MRP: ₹${s.mrp})`);
    });
    console.log(`  Recommendation: ${res.recommendation}\n`);
  }
}

testAll();
