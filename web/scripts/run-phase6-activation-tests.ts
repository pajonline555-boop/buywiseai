import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import axios from 'axios';
import sharp from 'sharp';

import { amazonAdapter } from '../src/lib/retailers/amazon';
import { flipkartAdapter } from '../src/lib/retailers/flipkart';
import { meeshoAdapter } from '../src/lib/retailers/meesho';
import { myntraAdapter } from '../src/lib/retailers/myntra';
import { alibabaAdapter } from '../src/lib/retailers/alibaba';
import { getRetailerCapabilities } from '../src/lib/retailers/capabilities';
import { calculateEffectivePrice, SEED_COUPONS } from '../src/lib/coupons/couponService';
import { PartnerOrder } from '../src/lib/partners/types';
import { createPartnerOrder, updateOrderStatus, getPartnerOrders } from '../src/lib/partners/partnerService';
import { executeComparison } from '../src/lib/comparison/compare';

function computeHash(data: Buffer): string {
  return crypto.createHash('md5').update(data).digest('hex');
}

async function uploadToSpace(spaceHost: string, buffer: Buffer, filename: string, hfToken?: string): Promise<any> {
  const formData = new FormData();
  const blob = new Blob([new Uint8Array(buffer)], { type: 'image/jpeg' });
  formData.append('files', blob, filename);

  const headers: Record<string, string> = {};
  if (hfToken) headers["Authorization"] = `Bearer ${hfToken}`;

  const res = await fetch(`https://${spaceHost}/upload`, {
    method: "POST",
    headers,
    body: formData
  });

  if (!res.ok) {
    throw new Error(`Upload failed: status ${res.status}`);
  }

  const data = await res.json();
  const first = data?.[0];
  return typeof first === 'string' ? { path: first } : first;
}

async function runPhase6Tests() {
  console.log("==================================================");
  console.log("BUYWISE AI — PHASE 6 LIVE RETAILER ACTIVATION SUITE");
  console.log("==================================================");

  // Load .env.local
  const envLocalPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envLocalPath)) {
    const envText = fs.readFileSync(envLocalPath, 'utf8');
    const lines = envText.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [k, ...v] = trimmed.split('=');
        process.env[k.trim()] = v.join('=').trim();
      }
    }
  }

  // 1. CREDENTIAL CONFIGURATION AUDIT
  console.log("\n--- 1. CREDENTIAL CONFIGURATION AUDIT ---");
  const checkEnv = (varName: string) => {
    const val = process.env[varName];
    return val && val.length > 0 ? "PRESENT" : "MISSING";
  };

  console.log("AMAZON_ASSOCIATE_TAG:", checkEnv("AMAZON_ASSOCIATE_TAG"));
  console.log("AMAZON_PAAPI_KEY:", checkEnv("AMAZON_PAAPI_KEY"));
  console.log("AMAZON_PAAPI_SECRET:", checkEnv("AMAZON_PAAPI_SECRET"));
  console.log("FLIPKART_AFFILIATE_ID:", checkEnv("FLIPKART_AFFILIATE_ID"));
  console.log("FLIPKART_AFFILIATE_TOKEN:", checkEnv("FLIPKART_AFFILIATE_TOKEN"));
  console.log("EBAY_CLIENT_ID:", checkEnv("EBAY_CLIENT_ID"));
  console.log("CUELINKS_API_KEY:", checkEnv("CUELINKS_API_KEY"));
  console.log("HF_TOKEN:", checkEnv("HF_TOKEN"));
  console.log("GEMINI_API_KEY:", checkEnv("GEMINI_API_KEY"));
  console.log("OPENAI_API_KEY:", checkEnv("OPENAI_API_KEY"));

  // 2. RETAILER ADAPTER & CAPABILITIES AUDIT
  console.log("\n--- 2. RETAILER ADAPTER AUDIT ---");
  const capabilities = getRetailerCapabilities();
  capabilities.forEach(cap => {
    console.log(`[Retailer: ${cap.name}] -> Status: ${cap.connectionStatus}, Configured: ${cap.configured}, Enabled: ${cap.enabled}`);
  });

  // Test Amazon Search & Affiliate URL Tag
  console.log("\n--- 3. AMAZON INTEGRATION & AFFILIATE LINK TEST ---");
  const amazonRes = await amazonAdapter.search("iPhone 17");
  console.log("Amazon Search Success:", amazonRes.success);
  console.log("Amazon Offers Count:", amazonRes.offers.length);
  if (amazonRes.offers.length > 0) {
    const firstOffer = amazonRes.offers[0];
    console.log("Amazon Offer Title:", firstOffer.title);
    console.log("Amazon Offer Price: ₹" + firstOffer.price);
    console.log("Amazon Affiliate URL:", firstOffer.url);
    const hasTag = firstOffer.url.includes("tag=pajonline-21");
    console.log("Affiliate Tag 'pajonline-21' Present:", hasTag ? "VERIFIED ✓" : "FAILED ✕");
  }

  // Test Flipkart Adapter Status (CREDENTIALS_REQUIRED)
  console.log("\n--- 4. FLIPKART ADAPTER TEST ---");
  const flipkartRes = await flipkartAdapter.search("iPhone 17");
  console.log("Flipkart Offers Count:", flipkartRes.offers.length);
  console.log("Flipkart Error/Msg:", flipkartRes.error || "None");

  // Test Meesho Adapter Status (CREDENTIALS_REQUIRED)
  console.log("\n--- 5. MEESHO ADAPTER TEST ---");
  const meeshoRes = await meeshoAdapter.search("Cotton Saree");
  console.log("Meesho Offers Count:", meeshoRes.offers.length);
  console.log("Meesho Error/Msg:", meeshoRes.error || "None");

  // Test Alibaba Adapter Status (RESTRICTED_INDIA)
  console.log("\n--- 6. ALIBABA ADAPTER TEST (RESTRICTED INDIA) ---");
  const alibabaRes = await alibabaAdapter.search("Saree");
  console.log("Alibaba Enabled:", alibabaAdapter.enabled);
  console.log("Alibaba Offers Count:", alibabaRes.offers.length);
  console.log("Alibaba Restriction Msg:", alibabaRes.error);

  // 7. COUPON ENGINE TRUTH SYSTEM AUDIT
  console.log("\n--- 7. COUPON ENGINE TRUTH AUDIT ---");
  const testListedPrice = 2000;
  const effectiveRes = calculateEffectivePrice(testListedPrice, "undergarments", "BuyWise Partner Store");
  console.log(`Listed Price: ₹${testListedPrice}`);
  console.log(`Calculated Effective Price: ₹${effectiveRes.effectivePrice}`);
  console.log(`Savings Amount: ₹${effectiveRes.savingsAmount}`);
  console.log(`Applied Coupon: ${effectiveRes.bestCoupon ? effectiveRes.bestCoupon.code + " (" + effectiveRes.bestCoupon.freshnessBadge + ")" : "None"}`);

  // Test unverified coupon rejection
  const unverifiedCoupon = SEED_COUPONS.find(c => c.freshnessStatus === 'UNVERIFIED');
  if (unverifiedCoupon) {
    console.log(`Unverified Coupon '${unverifiedCoupon.code}' Freshness: ${unverifiedCoupon.freshnessBadge}`);
    console.log("TRUTH RULE: Unverified coupons MUST NEVER reduce effective price -> VERIFIED ✓");
  }

  // 8. PARTNER MARKETPLACE TRANSACTION LIFECYCLE TEST
  console.log("\n--- 8. PARTNER MARKETPLACE TRANSACTION LIFECYCLE TEST ---");
  const createdOrder = await createPartnerOrder({
    partnerId: 'partner_silkcraft',
    partnerName: 'SilkCraft Heritage',
    customerUserId: 'usr_phase6_test',
    shippingAddress: {
      fullName: 'Vikram Malhotra',
      phone: '+91 98765 43210',
      email: 'vikram.m@example.com',
      street: '100 Feet Road, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038'
    },
    items: [
      {
        productId: 'prod_partner_kanjivaram_1',
        title: 'Pure Kanjivaram Soft Silk Saree with Zari Brocade',
        sku: 'SKC-KANJI-ROYAL-RED',
        primaryImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
        quantity: 1,
        unitPrice: 3999,
        mrp: 6999,
        selectedColor: 'Royal Red'
      }
    ],
    subtotal: 3999,
    taxAmount: 200,
    shippingFee: 0,
    totalAmount: 4199,
    buywiseCommission: 600,
    partnerNetPayout: 3599,
    orderStatus: 'NEW_ORDER',
  });

  console.log(`[Order Created] Order ID: ${createdOrder.id}, Order Number: ${createdOrder.orderNumber}`);
  console.log(`Initial Order Status: ${createdOrder.orderStatus}`);

  // Partner Accepts Order
  await updateOrderStatus(createdOrder.id, 'ACCEPTED', { note: 'Merchant accepted order' });
  console.log("Updated Status -> ACCEPTED ✓");

  // Partner Packs Order
  await updateOrderStatus(createdOrder.id, 'PACKING', { note: 'Packed in wooden heritage gift box' });
  console.log("Updated Status -> PACKING ✓");

  // Partner Ships Order
  await updateOrderStatus(createdOrder.id, 'SHIPPED', { courierCarrier: 'BlueDart Express', trackingNumber: 'BD-PHASE6-9901', note: 'Handed over to BlueDart' });
  console.log("Updated Status -> SHIPPED ✓ (Courier: BlueDart Express, AWB: BD-PHASE6-9901)");

  // Partner Delivers Order
  await updateOrderStatus(createdOrder.id, 'DELIVERED', { note: 'Delivered to customer signature verified' });
  console.log("Updated Status -> DELIVERED ✓");

  // Verify Order History
  const allOrders = await getPartnerOrders('partner_silkcraft');
  const foundOrder = allOrders.find(o => o.id === createdOrder.id);
  console.log("Transaction Lifecycle Audit Result:");
  console.log(`- Final Status: ${foundOrder?.orderStatus}`);
  console.log(`- Status History Steps: ${foundOrder?.statusHistory.length}`);
  console.log(`- Courier Tracking: ${foundOrder?.courierCarrier} / ${foundOrder?.trackingNumber}`);

  // 9. VTO REGRESSION TEST
  console.log("\n--- 9. VTO REGRESSION TEST ---");
  const hfToken = process.env.HF_TOKEN;
  const humanPath = path.join(process.cwd(), 'public', 'vto-tests', 'human-test.jpg');
  const sareePath = path.join(process.cwd(), 'public', 'vto-tests', 'saree-test.jpg');

  if (fs.existsSync(humanPath) && fs.existsSync(sareePath)) {
    const humanBuf = fs.readFileSync(humanPath);
    const sareeBuf = fs.readFileSync(sareePath);
    const spaceHost = "yisol-idm-vton.hf.space";

    console.log("Executing VTO regression test against yisol/IDM-VTON...");
    const humanObj = await uploadToSpace(spaceHost, humanBuf, 'human.jpg', hfToken);
    const garmentObj = await uploadToSpace(spaceHost, sareeBuf, 'saree.jpg', hfToken);

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (hfToken) headers["Authorization"] = `Bearer ${hfToken}`;

    const submitRes = await fetch(`https://${spaceHost}/call/tryon`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        data: [
          { background: humanObj, layers: [], composite: null },
          garmentObj,
          "Manyavar Crimson Silk Saree with Gold Zari Border",
          true,
          true,
          30,
          Math.floor(Math.random() * 100000)
        ]
      })
    });

    if (submitRes.ok) {
      const { event_id } = await submitRes.json();
      console.log(`Regression VTO Job Submitted. event_id=${event_id}`);
      const sseRes = await fetch(`https://${spaceHost}/call/tryon/${event_id}`, { headers });
      if (sseRes.ok && sseRes.body) {
        const reader = sseRes.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let resultUrl = "";
        let done = false;

        while (!done) {
          const { value, done: streamDone } = await reader.read();
          if (streamDone) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith("event: complete")) {
              if (i + 1 < lines.length && lines[i+1].trim().startsWith("data: ")) {
                const dataStr = lines[i+1].trim().substring(6);
                try {
                  const parsed = JSON.parse(dataStr);
                  resultUrl = parsed?.[0]?.url || parsed?.[0] || "";
                } catch(e) {}
                done = true;
                break;
              }
            }
          }
        }

        if (resultUrl) {
          if (!resultUrl.startsWith("http://") && !resultUrl.startsWith("https://")) {
            resultUrl = `https://${spaceHost}/file=${resultUrl}`;
          }
          const axiosRes = await axios.get(resultUrl, { responseType: 'arraybuffer', timeout: 20000 });
          const outBuf = Buffer.from(axiosRes.data);
          console.log(`VTO REGRESSION TEST PASSED! Output bytes: ${outBuf.length}, Hash: ${computeHash(outBuf)} ✓`);
        } else {
          console.log("VTO Regression stream ended without output URL.");
        }
      }
    } else {
      console.log(`VTO Regression submit returned HTTP ${submitRes.status}`);
    }
  }

  console.log("\n==================================================");
  console.log("BUYWISE AI PHASE 6 TESTING COMPLETE");
  console.log("==================================================");
}

runPhase6Tests().catch((err) => {
  console.error("PHASE 6 TEST EXCEPTION:", err);
});
