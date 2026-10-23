import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { vtoProviderRouter } from '../src/lib/vto/providers/VtoProviderRouter';
import { fashnVtoProvider } from '../src/lib/vto/providers/FashnVtoProvider';
import { modalVtoProvider } from '../src/lib/vto/providers/ModalVtoProvider';
import { validateGeneratedImage } from '../src/lib/vto/vtoQualityGate';

// Load .env.local from web directory or cwd
const envCandidates = [
  path.join(process.cwd(), '.env.local'),
  path.join(process.cwd(), 'web', '.env.local'),
  path.join(__dirname, '..', '.env.local')
];
const envLocalPath = envCandidates.find(p => fs.existsSync(p));
if (envLocalPath) {
  const envText = fs.readFileSync(envLocalPath, 'utf8');
  for (const line of envText.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const k = trimmed.substring(0, idx).trim();
      const v = trimmed.substring(idx + 1).trim();
      if (!process.env[k]) {
        process.env[k] = v;
      }
    }
  }
}

async function runLiveRouterTest() {
  console.log("==================================================");
  console.log("BUYWISE AI — VTO PHASE 2 RUNTIME ROUTER TRACE");
  console.log("==================================================");

  // 1. Check Configuration States
  console.log("\n[STEP 1: PROVIDER CONFIGURATION DISCOVERY]");
  console.log(`FASHN Configured: ${fashnVtoProvider.isConfigured()} (FASHN_API_KEY present: ${Boolean(process.env.FASHN_API_KEY)})`);
  console.log(`Modal Configured: ${modalVtoProvider.isConfigured()} (MODAL_VTO_URL: ${process.env.MODAL_VTO_URL || "None"})`);
  console.log(`Environment: NODE_ENV=${process.env.NODE_ENV || "development"}`);

  // 2. Test Provider Selection
  console.log("\n[STEP 2: PROVIDER SELECTION LOGIC]");
  const primary = vtoProviderRouter.selectPrimaryProvider();
  console.log(`Primary Provider Selected: ${primary?.id} (${primary?.getProviderName()})`);
  if (primary) {
    const fallback = vtoProviderRouter.selectFallbackProvider(primary.id);
    console.log(`Fallback Provider for ${primary.id}: ${fallback?.id || "None"}`);
  }

  // 3. Test Quality Gate on Edge Cases
  console.log("\n[STEP 3: QUALITY GATE VALIDATION TESTS]");
  
  // Test 3A: White void corruption
  const whiteVoidBase64 = "data:image/jpeg;base64," + Buffer.alloc(10000, 255).toString('base64');
  const qgWhiteVoid = validateGeneratedImage(whiteVoidBase64);
  console.log(`Test 3A (White Void Rejection): ${qgWhiteVoid.isValid === false ? "PASSED (Rejected correctly)" : "FAILED"} [Code: ${qgWhiteVoid.code}]`);

  // Test 3B: Duplicate User Input
  const dummyUser = "data:image/jpeg;base64," + Buffer.from("mock_user_photo_data_bytes_12345").toString('base64');
  const qgDuplicate = validateGeneratedImage(dummyUser, dummyUser);
  console.log(`Test 3B (Duplicate User Rejection): ${qgDuplicate.isValid === false ? "PASSED (Rejected correctly)" : "FAILED"} [Code: ${qgDuplicate.code}]`);

  // Test 3C: Suspiciously small image (<5000 bytes)
  const tinyImage = "data:image/jpeg;base64," + Buffer.from("short").toString('base64');
  const qgTiny = validateGeneratedImage(tinyImage);
  console.log(`Test 3C (Payload Underflow Rejection): ${qgTiny.isValid === false ? "PASSED (Rejected correctly)" : "FAILED"} [Code: ${qgTiny.code}]`);

  // 4. Test Live Healthcheck on Modal Endpoint
  console.log("\n[STEP 4: MODAL GPU ENDPOINT HEALTH & CONNECTIVITY]");
  const modalEndpoint = process.env.MODAL_VTO_URL || process.env.MODAL_VTO_ENDPOINT_URL;
  if (modalEndpoint) {
    try {
      console.log(`Pinging Modal Endpoint: ${modalEndpoint}...`);
      const startTime = Date.now();
      const res = await axios.post(
        modalEndpoint,
        {
          mode: "FIT_ON_USER",
          person_image_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
          garment_image_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80",
          category: "dresses",
          title: "Banarasi Silk Saree"
        },
        {
          timeout: 45000,
          headers: { "Content-Type": "application/json" }
        }
      );
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`Modal Response: HTTP ${res.status} in ${elapsed}s`);
      console.log(`Response Type: ${typeof res.data}`);
      if (res.data?.success) {
        console.log(`Result Image Available: ${Boolean(res.data.imageBase64 || res.data.imageUrl)}`);
        console.log(`Mode Used: ${res.data.modeUsed}`);
      } else {
        console.log(`Response Data:`, typeof res.data === 'object' ? JSON.stringify(res.data).slice(0, 200) : res.data);
      }
    } catch (err: any) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail || err.response?.data || err.message;
      console.log(`Modal Call Outcome: HTTP ${status || "ERR"}: ${typeof detail === 'object' ? JSON.stringify(detail) : detail}`);
    }
  } else {
    console.log("Modal endpoint not configured in .env.local");
  }

  console.log("\n==================================================");
  console.log("TRACE COMPLETE");
  console.log("==================================================");
}

runLiveRouterTest().catch(console.error);
