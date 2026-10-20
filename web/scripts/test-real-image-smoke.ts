import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import axios from 'axios';
import { vtoProviderRouter } from '../src/lib/vto/providers/VtoProviderRouter';
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

const RESULTS_DIR = path.join(__dirname, '..', 'test-results', 'vto-phase2');
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

interface PixelAnalysis {
  width: number;
  height: number;
  channels: number;
  whitePixelCount: number;
  totalPixels: number;
  whitePixelPercent: number;
  hasHorizontalWhiteBand: boolean;
  maxRowWhiteFraction: number;
  colorVariance: number;
}

async function analyzeImagePixels(imageBuffer: Buffer): Promise<PixelAnalysis> {
  const image = sharp(imageBuffer);
  const meta = await image.metadata();
  const width = meta.width || 0;
  const height = meta.height || 0;
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  let whitePixelCount = 0;
  const rowWhiteCounts = new Array(height).fill(0);
  let sumR = 0, sumG = 0, sumB = 0;
  const totalPixels = width * height;

  const channels = info.channels;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      sumR += r;
      sumG += g;
      sumB += b;

      // Pure or near pure white
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
    // If more than 75% of a single row is solid white, a horizontal white band exists
    if (frac > 0.75) {
      hasHorizontalWhiteBand = true;
    }
  }

  // Calculate simple color variance
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
    channels,
    whitePixelCount,
    totalPixels,
    whitePixelPercent: (whitePixelCount / totalPixels) * 100,
    hasHorizontalWhiteBand,
    maxRowWhiteFraction: maxRowWhiteFraction * 100,
    colorVariance
  };
}

async function runRealImageSmokeTest() {
  console.log("================================================================");
  console.log("BUYWISE AI — REAL IMAGE TEST & PIXEL FORENSICS SMOKE TEST");
  console.log("================================================================");

  // 1. Prepare Test Fixtures
  const userPhotoPath = path.join(__dirname, '..', 'scratch', 'user_raw_photo.jpg');
  const garmentPhotoPath = path.join(__dirname, '..', 'public', 'vto-tests', 'saree-test.jpg');

  if (!fs.existsSync(userPhotoPath) || !fs.existsSync(garmentPhotoPath)) {
    console.error("Test fixtures missing!", { userPhotoPath, garmentPhotoPath });
    return;
  }

  // Resize user photo to reasonable 768x1024 for network/payload safety
  const userBuffer = await sharp(userPhotoPath)
    .resize(768, 1024, { fit: 'inside' })
    .jpeg({ quality: 85 })
    .toBuffer();
  const userBase64 = `data:image/jpeg;base64,${userBuffer.toString('base64')}`;

  const garmentBuffer = await sharp(garmentPhotoPath)
    .resize(768, 1024, { fit: 'inside' })
    .jpeg({ quality: 85 })
    .toBuffer();
  const garmentBase64 = `data:image/jpeg;base64,${garmentBuffer.toString('base64')}`;

  console.log(`User Photo Prepared: ${userBuffer.length} bytes`);
  console.log(`Garment Photo Prepared: ${garmentBuffer.length} bytes`);

  // 2. Dispatch Through Canonical Router
  const requestId = `test_smoke_${Date.now()}`;
  console.log(`\nDispatching request ${requestId} through Canonical VtoProviderRouter...`);

  const primary = vtoProviderRouter.selectPrimaryProvider();
  console.log(`Primary Provider Chosen: ${primary?.id} (${primary?.name})`);
  console.log(`FASHN Configured: ${process.env.FASHN_API_KEY ? "YES" : "NO (Blocked: missing FASHN_API_KEY)"}`);

  const startTime = Date.now();
  const result = await vtoProviderRouter.generate({
    requestId,
    userId: "smoke_test_runner",
    personImage: userBase64,
    garmentImage: garmentBase64,
    garmentType: "sarees_ethnic",
    productTitle: "Traditional Banarasi Silk Saree with Rich Zari Pallu",
    preserveIdentity: true,
    preserveBackground: true
  });

  const durationMs = Date.now() - startTime;
  console.log(`\n[GENERATION RESULT]`);
  console.log(`Success: ${result.success}`);
  console.log(`Provider: ${result.provider}`);
  console.log(`Model: ${result.model}`);
  console.log(`Duration: ${(durationMs / 1000).toFixed(1)}s`);
  console.log(`Fallback Used: ${result.fallbackUsed || false}`);
  if (!result.success) {
    console.error(`Failure: ${result.failureCode} - ${result.failureMessage}`);
    return;
  }

  // 3. Process Result Image
  let outputBuffer: Buffer;
  if (result.image && result.image.startsWith('data:')) {
    const raw = result.image.replace(/^data:image\/\w+;base64,/, '');
    outputBuffer = Buffer.from(raw, 'base64');
  } else if (result.image && result.image.startsWith('http')) {
    const downloadRes = await axios.get(result.image, { responseType: 'arraybuffer' });
    outputBuffer = Buffer.from(downloadRes.data);
  } else if (result.image) {
    outputBuffer = Buffer.from(result.image, 'base64');
  } else {
    throw new Error("No image data returned.");
  }

  const outFilename = `smoke_test_result_${result.provider}.webp`;
  const outPath = path.join(RESULTS_DIR, outFilename);
  fs.writeFileSync(outPath, outputBuffer);
  console.log(`Result saved locally to: ${outPath} (${outputBuffer.length} bytes)`);

  // 4. Quality Gate Check
  const qgReport = validateGeneratedImage(result.image, userBase64, garmentBase64);
  console.log(`\n[AUTOMATED QUALITY GATE]`);
  console.log(`Valid: ${qgReport.isValid}`);
  console.log(`Code: ${qgReport.code}`);
  console.log(`Message: ${qgReport.message}`);
  console.log(`Can Publish To Community: ${qgReport.canPublishToCommunity}`);

  // 5. Deep Pixel Forensics
  console.log(`\n[DEEP PIXEL FORENSICS]`);
  const analysis = await analyzeImagePixels(outputBuffer);
  console.log(`Dimensions: ${analysis.width} x ${analysis.height}`);
  console.log(`White Pixel Ratio: ${analysis.whitePixelPercent.toFixed(2)}%`);
  console.log(`Max Row White Fraction: ${analysis.maxRowWhiteFraction.toFixed(2)}%`);
  console.log(`Horizontal White Band Detected: ${analysis.hasHorizontalWhiteBand ? "YES (DEFECTIVE)" : "NO (CLEAN)"}`);
  console.log(`Color Variance (StdDev): ${analysis.colorVariance.toFixed(2)}`);

  console.log("\n================================================================");
  console.log("SMOKE TEST COMPLETE");
  console.log("================================================================");
}

runRealImageSmokeTest().catch(console.error);
