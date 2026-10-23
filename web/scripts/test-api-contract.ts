import { executeComparison, executeCanonicalComparison } from '../src/lib/comparison/compare';
import { normalizeTextQueryToCanonical } from '../src/lib/query/normalize';
import { isValidQuery } from '../src/lib/comparison/validation';
import { selectRetailerQuery } from '../src/lib/comparison/planner';

async function runApiContractTests() {
  console.log('--- BUYWISE AI PHASE 12: API CONTRACT VERIFICATION ---');
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

  // 1. Validation logic for queries
  assert(isValidQuery('sneakers') === true, 'isValidQuery accepts valid string');
  assert(isValidQuery('   ') === false, 'isValidQuery rejects blank spaces');
  assert(isValidQuery('') === false, 'isValidQuery rejects empty string');
  assert(isValidQuery(null) === false, 'isValidQuery rejects null');
  assert(isValidQuery(undefined) === false, 'isValidQuery rejects undefined');
  assert(isValidQuery('a'.repeat(251)) === false, 'isValidQuery rejects queries exceeding max length 250');

  // 2. Query Planner resilience with partial canonical object (Android CanonicalQuery)
  const androidCanonical = {
    id: 'canon-1',
    sourceType: 'text' as const,
    rawInput: 'Lancer Wonder-3',
    title: 'Lancer Wonder-3',
    category: 'Footwear',
    subcategory: null,
    brand: 'Lancer',
    model: 'Wonder-3',
    productName: 'Lancer Wonder-3 Shoes',
    gender: null,
    colors: [],
    materials: [],
    styles: [],
    visualFeatures: [],
    observedAttributes: {},
    inferredAttributes: {},
    visibleText: [],
    confidence: { category: 0.9, brand: 0.9, model: 0.9, overall: 0.9 },
    exactSearchQueries: ['Lancer Wonder-3'],
    similarSearchQueries: ['Lancer Wonder-3 sneakers'],
    broadSearchQueries: ['Lancer shoes'],
    budgetSearchQueries: [],
    createdAt: new Date().toISOString(),
  };

  const amazonQuery = selectRetailerQuery(androidCanonical, 'amazon', 'exact');
  assert(amazonQuery === 'Lancer Wonder-3', 'Planner selects exact query for Amazon');

  const flipkartQuery = selectRetailerQuery(androidCanonical, 'flipkart', 'exact');
  assert(flipkartQuery === 'Lancer Wonder-3', 'Planner selects fallback exact query for Flipkart when index 1 is undefined');

  // 3. Robustness when query arrays are completely missing or empty
  const sparseCanonical: any = {
    title: 'Test Sneaker',
    rawInput: 'Test Sneaker',
  };
  const sparseQuery = selectRetailerQuery(sparseCanonical, 'amazon', 'exact');
  assert(sparseQuery === 'Test Sneaker', 'Planner falls back to title without throwing TypeError');

  // 4. Contract execution via executeComparison
  console.log('Testing executeComparison("sneakers")...');
  const compResult = await executeComparison('sneakers');
  assert(typeof compResult === 'object', 'executeComparison returns an object');
  assert(typeof compResult.product === 'string', 'compResult has product field');
  assert(typeof compResult.query === 'string', 'compResult has query field');
  assert(Array.isArray(compResult.stores), 'compResult.stores is an Array');
  assert(typeof compResult.summary === 'object', 'compResult.summary is an object');
  assert(typeof compResult.summary.lowestPrice === 'number', 'summary.lowestPrice is a number');
  assert(Array.isArray(compResult.providerStatuses), 'providerStatuses is an Array');

  // 5. Verification that missing credentials never fabricate fake live listings
  const unauthRetailer = compResult.providerStatuses?.find(p => p.retailerId === 'flipkart');
  if (unauthRetailer) {
    assert(
      unauthRetailer.status === 'CREDENTIALS_REQUIRED' || unauthRetailer.status === 'API_UNAVAILABLE',
      'Flipkart without configured credentials reports CREDENTIALS_REQUIRED or API_UNAVAILABLE'
    );
  }

  // 6. Canonical Comparison contract
  console.log('Testing executeCanonicalComparison with Android payload...');
  const canonResult = await executeCanonicalComparison(androidCanonical, 'exact');
  assert(typeof canonResult === 'object', 'executeCanonicalComparison returns response object');
  assert(Array.isArray(canonResult.stores), 'stores array returned');

  console.log(`\nAPI Contract Test Summary: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

runApiContractTests().catch(err => {
  console.error('API Contract test failed with error:', err);
  process.exit(1);
});
