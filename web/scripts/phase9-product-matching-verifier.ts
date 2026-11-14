import { isSameProductAndVariant, groupSameProductsAcrossRetailers } from '../src/lib/comparison/matcher';
import { StoreOffer } from '../src/lib/retailers/types';

function runMatchingAudit() {
  console.log('=== BUYWISE AI PHASE 9 PRODUCT MATCHING & SEPARATION AUDIT ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail: string = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} - ${detail}`);
      failed++;
    }
  }

  // 1. Same Brand & Model across stores (Should MATCH)
  console.log('1. Testing Same Brand & Model across stores:');
  {
    const amz: StoreOffer = {
      store: 'Amazon India',
      price: 119999,
      title: 'Samsung Galaxy S24 Ultra 5G (12GB RAM, 256GB Titanium Gray)',
      brand: 'Samsung',
      model: 'Galaxy S24 Ultra',
      url: 'https://amazon.in/dp/example1',
    };
    const fk: StoreOffer = {
      store: 'Flipkart',
      price: 120499,
      title: 'Samsung Galaxy S24 Ultra 5G (12GB RAM, 256GB Titanium Gray)',
      brand: 'Samsung',
      model: 'Galaxy S24 Ultra',
      url: 'https://flipkart.com/dp/example2',
    };
    assert(isSameProductAndVariant(amz, fk), 'Identical brand & model across Amazon and Flipkart matched successfully');
  }

  // 2. Same Dress in Different Colors (Should NOT MATCH under same variant)
  console.log('\n2. Testing Same Dress in Different Colors:');
  {
    const pinkDress: StoreOffer = {
      store: 'Amazon India',
      price: 599,
      title: 'Hopscotch Girls Cotton Tiered Frock Dress (Pink)',
      brand: 'Hopscotch',
      url: 'https://amazon.in/dp/pink',
      variant: { color: 'Pink' },
      fabric: 'Cotton',
    };
    const blueDress: StoreOffer = {
      store: 'Flipkart',
      price: 599,
      title: 'Hopscotch Girls Cotton Tiered Frock Dress (Navy Blue)',
      brand: 'Hopscotch',
      url: 'https://flipkart.com/dp/blue',
      variant: { color: 'Navy Blue' },
      fabric: 'Cotton',
    };
    assert(!isSameProductAndVariant(pinkDress, blueDress), 'Different colors (Pink vs Navy Blue) are NOT merged into the same variant');
  }

  // 3. Cotton vs Polyester / Crepe (Should NOT MATCH)
  console.log('\n3. Testing Fabric Mismatch (Cotton vs Polyester):');
  {
    const cotton: StoreOffer = {
      store: 'Amazon India',
      price: 699,
      title: 'Sugar Swizzle Girls A-Line Summer Dress',
      brand: 'Sugar Swizzle',
      url: 'https://amazon.in/dp/cotton',
      fabric: '100% Cotton',
    };
    const poly: StoreOffer = {
      store: 'Meesho',
      price: 299,
      title: 'Sugar Swizzle Girls A-Line Summer Dress',
      brand: 'Sugar Swizzle',
      url: 'https://meesho.com/dp/poly',
      fabric: 'Polyester',
    };
    assert(!isSameProductAndVariant(cotton, poly), 'Cotton vs Polyester dress correctly prevented from false match');
  }

  // 4. Single Item vs Multi-Pack (Should NOT MATCH)
  console.log('\n4. Testing Pack Quantity Conflict (Single vs Pack of 5):');
  {
    const singleFrock: StoreOffer = {
      store: 'Amazon India',
      price: 399,
      title: 'Zeyo Girls Cotton Frock (Pack of 1)',
      brand: 'Zeyo',
      url: 'https://amazon.in/dp/single',
      packQty: 1,
    };
    const pack5Frock: StoreOffer = {
      store: 'Meesho',
      price: 799,
      title: 'Zeyo Girls Cotton Frock (Pack of 5)',
      brand: 'Zeyo',
      url: 'https://meesho.com/dp/pack5',
      packQty: 5,
    };
    assert(!isSameProductAndVariant(singleFrock, pack5Frock), 'Pack of 1 vs Pack of 5 correctly prevented from false match');
  }

  // 5. Similar Titles for Different Products (Should NOT MATCH)
  console.log('\n5. Testing Similar Titles for Distinct Products:');
  {
    const pinkAline: StoreOffer = {
      store: 'Amazon India',
      price: 599,
      title: 'Girls Pink Cotton A-Line Dress for Casual Summer Party',
      brand: 'Hopscotch',
      url: 'https://amazon.in/dp/1',
      fabric: 'Cotton',
    };
    const floralFrock: StoreOffer = {
      store: 'Flipkart',
      price: 449,
      title: 'Girls Floral Summer Frock with Ruffle Sleeves',
      brand: 'Little Bansi',
      url: 'https://flipkart.com/dp/2',
      fabric: 'Cotton',
    };
    assert(!isSameProductAndVariant(pinkAline, floralFrock), 'Different brands and cuts with generic title words are NOT matched');
  }

  // 6. Duplicate Retailer Listings (Should Group Properly)
  console.log('\n6. Testing Duplicate Retailer Listing Handling:');
  {
    const offer1: StoreOffer = {
      store: 'Amazon India',
      price: 499,
      title: 'Hopscotch Girls Pink Cotton A-Line Dress',
      brand: 'Hopscotch',
      url: 'https://amazon.in/dp/1',
      fabric: 'Cotton',
    };
    const offer2: StoreOffer = {
      store: 'Amazon India',
      price: 489,
      title: 'Hopscotch Girls Pink Cotton A-Line Dress',
      brand: 'Hopscotch',
      url: 'https://amazon.in/dp/1_seller2',
      fabric: 'Cotton',
    };
    const groups = groupSameProductsAcrossRetailers([offer1, offer2]);
    assert(groups.length === 1, 'Duplicate listings of the same product grouped into 1 comparison group');
    assert(groups[0].lowestPrice === 489, 'Group correctly selects lowest seller price (₹489)');
  }

  // 7. Grouping & Separation (Best Matches vs Same Product)
  console.log('\n7. Testing Separation between Best Matches and Same Product:');
  {
    const item1_amz: StoreOffer = {
      store: 'Amazon India',
      price: 499,
      title: 'Hopscotch Girls Pink Cotton Dress',
      brand: 'Hopscotch',
      url: 'https://amazon.in/dp/hopscotch1',
      fabric: 'Cotton',
    };
    const item1_fk: StoreOffer = {
      store: 'Flipkart',
      price: 479,
      title: 'Hopscotch Girls Pink Cotton Dress',
      brand: 'Hopscotch',
      url: 'https://flipkart.com/dp/hopscotch1',
      fabric: 'Cotton',
    };
    const item2_meesho: StoreOffer = {
      store: 'Meesho',
      price: 299,
      title: 'KidStudio Girls Crepe Dress',
      brand: 'KidStudio',
      url: 'https://meesho.com/dp/kidstudio1',
      fabric: 'Crepe',
    };
    const all = [item1_amz, item1_fk, item2_meesho];
    const grouped = groupSameProductsAcrossRetailers(all);

    assert(grouped.length === 2, 'Result partitioned into 2 distinct product groups');
    const multiStoreGroup = grouped.find(g => g.storeCount >= 2);
    assert(!!multiStoreGroup, 'Hopscotch identified as a multi-store Same Product group');
    assert(multiStoreGroup?.brand === 'Hopscotch', 'Multi-store group brand is Hopscotch');
  }

  console.log(`\nTOTAL MATCHING AUDIT: ${passed} PASSED, ${failed} FAILED\n`);
  if (failed > 0) process.exit(1);
}

runMatchingAudit();
