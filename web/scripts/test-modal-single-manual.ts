import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import axios from 'axios';
import { modalVtoProvider } from '../src/lib/vto/providers/ModalVtoProvider';
import { validateGeneratedImage } from '../src/lib/vto/vtoQualityGate';

// Load .env.local
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
process.env.MODAL_TIMEOUT_MS = "120000";

const RESULTS_DIR = path.join(__dirname, '..', 'test-results', 'vto-phase2');
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

async function analyzePixels(imageBuffer: Buffer) {
  const image = sharp(imageBuffer);
  const meta = await image.metadata();
  const width = meta.width || 0;
  const height = meta.height || 0;
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  let whitePixelCount = 0;
  const rowWhiteCounts = new Array(height).fill(0);
  const totalPixels = width * height;
  const channels = info.channels;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      if (r > 248 && g > 248 && b > 248) {
        whitePixelCount++;
        rowWhiteCounts[y]++;
      }
    }
  }

  let maxRowWhiteFraction = 0;
  let hasHorizontalWhiteBand = false;
  for (let y = 0; y < height; y++) {
    const frac = rowWhiteCounts[y] / width;
    if (frac > maxRowWhiteFraction) {
      maxRowWhiteFraction = frac;
    }
    if (frac > 0.70) {
      hasHorizontalWhiteBand = true;
    }
  }

  // Calculate simple color variance
  let sumR = 0;
  for (let i = 0; i < totalPixels; i++) {
    sumR += data[i * channels];
  }
  const meanR = sumR / totalPixels;
  let varianceR = 0;
  for (let i = 0; i < totalPixels; i++) {
    const diff = data[i * channels] - meanR;
    varianceR += diff * diff;
  }
  const colorVariance = Math.sqrt(varianceR / totalPixels);

  return {
    width,
    height,
    whitePixelCount,
    totalPixels,
    whitePixelPercent: (whitePixelCount / totalPixels) * 100,
    maxRowWhiteFraction: maxRowWhiteFraction * 100,
    hasHorizontalWhiteBand,
    colorVariance
  };
}

async function runDirectModalVerification() {
  console.log("==========================================================================");
  console.log("BUYWISE AI — DIRECT MODAL VTO SINGLE REAL-IMAGE VERIFICATION");
  console.log("==========================================================================");

  // 1. Health Check
  console.log("\n[STEP 1: MODAL ENDPOINT HEALTH CHECK]");
  const modalUrl = process.env.MODAL_VTO_URL;
  console.log(`Endpoint URL: ${modalUrl}`);
  const healthStart = Date.now();
  const health = await modalVtoProvider.healthCheck();
  console.log(`Health Status: ${health.status.toUpperCase()} (healthy: ${health.healthy}) in ${Date.now() - healthStart}ms`);
  console.log(`Health Details: ${health.details}`);

  // 2. Prepare Single Real Image Pair
  console.log("\n[STEP 2: PREPARING SINGLE REAL IMAGE PAIR]");
  const humanPath = path.join(__dirname, '..', 'public', 'vto-tests', 'human-test.jpg');
  const sareePath = path.join(__dirname, '..', 'public', 'vto-tests', 'saree-test.jpg');

  const humanBuf = await sharp(humanPath)
    .resize(768, 1024, { fit: 'inside' })
    .jpeg({ quality: 85 })
    .toBuffer();
  const humanBase64 = `data:image/jpeg;base64,${humanBuf.toString('base64')}`;

  const sareeBuf = await sharp(sareePath)
    .resize(768, 1024, { fit: 'inside' })
    .jpeg({ quality: 85 })
    .toBuffer();
  const sareeBase64 = `data:image/jpeg;base64,${sareeBuf.toString('base64')}`;

  console.log(`User Photo Prepared: ${humanBuf.length} bytes (768x1024 normalized)`);
  console.log(`Garment Photo Prepared: ${sareeBuf.length} bytes (768x1024 normalized)`);

  // 3. Directly Call Modal Provider (NO Router, NO Fallback)
  console.log("\n[STEP 3: DIRECT MODAL GENERATION]");
  const requestId = `modal_direct_${Date.now()}`;
  console.log(`Request ID: ${requestId}`);
  console.log(`Dispatching DIRECTLY to ModalVtoProvider.generate() [No FASHN, No Fallback]...`);

  const genStart = Date.now();
  const result = await modalVtoProvider.generate({
    requestId,
    userId: "manual_tester",
    personImage: humanBase64,
    garmentImage: sareeBase64,
    garmentType: "sarees_ethnic",
    productTitle: "Banarasi Silk Saree with Rich Gold Zari Pallu",
    preserveIdentity: true,
    preserveBackground: true
  });

  const durationSec = Number(((Date.now() - genStart) / 1000).toFixed(1));
  console.log(`Modal Execution Complete in ${durationSec}s`);
  console.log(`Success: ${result.success}`);
  console.log(`Provider: ${result.provider}`);
  console.log(`Model: ${result.model}`);
  console.log(`License Status: ${result.licenseStatus}`);

  if (!result.success || !result.image) {
    console.error(`FAILURE: ${result.failureCode} - ${result.failureMessage}`);
    return;
  }

  // 4. Save and Process Output
  const rawBase64 = result.image.replace(/^data:image\/\w+;base64,/, '');
  const outBuf = Buffer.from(rawBase64, 'base64');
  const savePath = path.join(RESULTS_DIR, 'modal_direct_single_test.webp');
  fs.writeFileSync(savePath, outBuf);
  console.log(`Output Image Saved Locally: ${savePath} (${outBuf.length} bytes)`);

  // Also convert to JPEG in artifacts for visual inspection
  const artifactDir = "C:\\Users\\Pngag\\.gemini\\antigravity-ide\\brain\\4c57a618-94ab-4a29-9964-59db32b565a0";
  const artifactJpg = path.join(artifactDir, 'modal_direct_single_test.jpg');
  await sharp(outBuf).jpeg({ quality: 90 }).toFile(artifactJpg);
  console.log(`Converted to JPEG in artifacts: ${artifactJpg}`);

  // 5. Automated Quality Gate
  console.log("\n[STEP 4: QUALITY GATE VALIDATION]");
  const qg = validateGeneratedImage(result.image, humanBase64, sareeBase64);
  console.log(`Quality Gate Valid: ${qg.isValid}`);
  console.log(`Quality Code: ${qg.code}`);
  console.log(`Quality Message: ${qg.message}`);
  console.log(`Can Publish To Community: ${qg.canPublishToCommunity}`);

  // 6. Deep Pixel Forensics
  console.log("\n[STEP 5: DEEP PIXEL FORENSICS]");
  const forensics = await analyzePixels(outBuf);
  console.log(`Dimensions: ${forensics.width} × ${forensics.height}`);
  console.log(`Total Pixels: ${forensics.totalPixels}`);
  console.log(`White Pixel Ratio: ${forensics.whitePixelPercent.toFixed(2)}%`);
  console.log(`Max Row White Fraction: ${forensics.maxRowWhiteFraction.toFixed(2)}%`);
  console.log(`Horizontal White Band Detected (>70% row): ${forensics.hasHorizontalWhiteBand ? "YES (DEFECTIVE)" : "NO (CLEAN)"}`);
  console.log(`Color Variance (StdDev): ${forensics.colorVariance.toFixed(2)}`);

  console.log("\n==========================================================================");
  console.log("DIRECT MODAL VERIFICATION COMPLETE");
  console.log("==========================================================================");
}

runDirectModalVerification().catch(console.error);
