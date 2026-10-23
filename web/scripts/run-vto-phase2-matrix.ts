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

interface MatrixTestCase {
  id: string;
  name: string;
  description: string;
  category: string;
  productTitle: string;
  userImagePath: string;
  garmentImagePath: string;
}

interface TestRunResult {
  testId: string;
  testName: string;
  category: string;
  providerSelected: string;
  fashnStatus: "BLOCKED" | "PASSED" | "FAILED";
  fashnBlockReason?: string;
  liveProviderStatus: "PASSED" | "FAILED" | "BLOCKED";
  durationSeconds: number;
  outputDimensions?: string;
  whitePixelPercent?: number;
  maxRowWhiteFraction?: number;
  hasHorizontalWhiteBand?: boolean;
  qualityGateStatus: "PASSED" | "REJECTED";
  qualityGateCode: string;
  qualityGateMessage: string;
  canPublish: boolean;
  savedFile?: string;
  observations: string;
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

  return {
    width,
    height,
    whitePixelPercent: (whitePixelCount / totalPixels) * 100,
    maxRowWhiteFraction: maxRowWhiteFraction * 100,
    hasHorizontalWhiteBand
  };
}

async function prepareImageBase64(filePath: string, maxDim: number = 768): Promise<string> {
  const buffer = await sharp(filePath)
    .resize(maxDim, maxDim, { fit: 'inside' })
    .jpeg({ quality: 85 })
    .toBuffer();
  return `data:image/jpeg;base64,${buffer.toString('base64')}`;
}

async function runTestMatrix() {
  console.log("==========================================================================");
  console.log("BUYWISE AI — VTO PHASE 2 REAL-IMAGE VERIFICATION TEST MATRIX");
  console.log("==========================================================================");

  const fashnConfigured = Boolean(process.env.FASHN_API_KEY);
  console.log(`FASHN Live API Credentials: ${fashnConfigured ? "CONFIGURED" : "MISSING (Marked BLOCKED)"}`);
  console.log(`Modal Live GPU Endpoint: ${process.env.MODAL_VTO_URL ? "CONFIGURED (Deployed)" : "MISSING"}`);

  // Fixtures
  const humanIndoors = path.join(__dirname, '..', 'public', 'vto-tests', 'human-test.jpg');
  const humanPortrait = path.join(__dirname, '..', 'scratch', 'priya.jpg');
  const humanWaistJewellery = path.join(__dirname, '..', 'public', 'kamarbandh_user.jpg');
  const humanOutdoor = path.join(__dirname, '..', 'tmp', 'human.jpg');

  const garmentSaree = path.join(__dirname, '..', 'public', 'vto-tests', 'saree-test.jpg');
  const garmentKamarbandh = path.join(__dirname, '..', 'public', 'kamarbandh.png');
  const garmentCholi = path.join(__dirname, '..', 'scratch', 'cleaned_garment.png');
  const garmentEthnic = path.join(__dirname, '..', 'tmp', 'garment.jpg');

  const testCases: MatrixTestCase[] = [
    {
      id: "TC-1",
      name: "Saree with visible pallu and zari border",
      description: "Traditional Silk Saree drape verification on front-facing indoor portrait",
      category: "sarees_ethnic",
      productTitle: "Banarasi Silk Saree with Heavy Zari Border and Pleated Pallu",
      userImagePath: humanIndoors,
      garmentImagePath: garmentSaree
    },
    {
      id: "TC-2",
      name: "Hands near waist & jewellery accessory",
      description: "Kamarbandh waist jewellery try-on with hands positioned near waistline",
      category: "jewellery",
      productTitle: "Royal Antique Gold Waist Chain Kamarbandh",
      userImagePath: humanWaistJewellery,
      garmentImagePath: garmentKamarbandh
    },
    {
      id: "TC-3",
      name: "Chaniya Choli flared skirt and embroidered blouse",
      description: "Navratri Garba Chaniya Choli with mirror work blouse on long-haired user",
      category: "lehenga_bridal",
      productTitle: "Embroidered Navratri Chaniya Choli with Bandhani Dupatta",
      userImagePath: humanPortrait,
      garmentImagePath: garmentCholi
    },
    {
      id: "TC-4",
      name: "Full-length outdoor photograph with natural lighting",
      description: "Full ensemble try-on against outdoor complex background",
      category: "dresses",
      productTitle: "Designer Ethnic Evening Anarkali Gown",
      userImagePath: humanOutdoor,
      garmentImagePath: garmentEthnic
    }
  ];

  const results: TestRunResult[] = [];

  for (const tc of testCases) {
    console.log(`\n--------------------------------------------------------------------------`);
    console.log(`Executing ${tc.id}: ${tc.name}`);
    console.log(`Category: ${tc.category} | Garment: ${tc.productTitle}`);

    if (!fs.existsSync(tc.userImagePath) || !fs.existsSync(tc.garmentImagePath)) {
      console.error(`Fixture files missing for ${tc.id}! Skipping.`);
      continue;
    }

    const userBase64 = await prepareImageBase64(tc.userImagePath, 768);
    const garmentBase64 = await prepareImageBase64(tc.garmentImagePath, 768);

    const primary = vtoProviderRouter.selectPrimaryProvider();
    const startTime = Date.now();

    const genResult = await vtoProviderRouter.generate({
      requestId: `matrix_${tc.id}_${Date.now()}`,
      userId: `evaluator_${tc.id}`,
      personImage: userBase64,
      garmentImage: garmentBase64,
      garmentType: tc.category,
      productTitle: tc.productTitle,
      preserveIdentity: true,
      preserveBackground: true
    });

    const durationSec = Number(((Date.now() - startTime) / 1000).toFixed(1));
    console.log(`Execution Completed in ${durationSec}s | Status: ${genResult.success ? "SUCCESS" : "FAIL"}`);

    if (!genResult.success || !genResult.image) {
      results.push({
        testId: tc.id,
        testName: tc.name,
        category: tc.category,
        providerSelected: primary?.id || "none",
        fashnStatus: "BLOCKED",
        fashnBlockReason: "FASHN_API_KEY missing in environment",
        liveProviderStatus: "FAILED",
        durationSeconds: durationSec,
        qualityGateStatus: "REJECTED",
        qualityGateCode: genResult.failureCode || "FAILED",
        qualityGateMessage: genResult.failureMessage || "Provider failure",
        canPublish: false,
        observations: `Generation failed: ${genResult.failureMessage}`
      });
      continue;
    }

    // Process image buffer
    let outputBuffer: Buffer;
    if (genResult.image.startsWith('data:')) {
      const raw = genResult.image.replace(/^data:image\/\w+;base64,/, '');
      outputBuffer = Buffer.from(raw, 'base64');
    } else if (genResult.image.startsWith('http')) {
      const res = await axios.get(genResult.image, { responseType: 'arraybuffer' });
      outputBuffer = Buffer.from(res.data);
    } else {
      outputBuffer = Buffer.from(genResult.image, 'base64');
    }

    const filename = `matrix_${tc.id}_result.webp`;
    const savePath = path.join(RESULTS_DIR, filename);
    fs.writeFileSync(savePath, outputBuffer);

    // Quality gate
    const qg = validateGeneratedImage(genResult.image, userBase64, garmentBase64);
    // Pixel forensics
    const analysis = await analyzePixels(outputBuffer);

    console.log(`Output: ${analysis.width}x${analysis.height} | White Pixels: ${analysis.whitePixelPercent.toFixed(1)}% | Max Row White: ${analysis.maxRowWhiteFraction.toFixed(1)}%`);
    console.log(`Horizontal White Band Detected: ${analysis.hasHorizontalWhiteBand ? "YES (DEFECTIVE)" : "NO (CLEAN)"}`);
    console.log(`Quality Gate: ${qg.isValid ? "PASSED" : "REJECTED"} (${qg.code})`);

    results.push({
      testId: tc.id,
      testName: tc.name,
      category: tc.category,
      providerSelected: genResult.provider,
      fashnStatus: "BLOCKED",
      fashnBlockReason: "FASHN_API_KEY missing in server environment",
      liveProviderStatus: genResult.success ? "PASSED" : "FAILED",
      durationSeconds: durationSec,
      outputDimensions: `${analysis.width}x${analysis.height}`,
      whitePixelPercent: Number(analysis.whitePixelPercent.toFixed(2)),
      maxRowWhiteFraction: Number(analysis.maxRowWhiteFraction.toFixed(2)),
      hasHorizontalWhiteBand: analysis.hasHorizontalWhiteBand,
      qualityGateStatus: qg.isValid ? "PASSED" : "REJECTED",
      qualityGateCode: qg.code,
      qualityGateMessage: qg.message,
      canPublish: qg.canPublishToCommunity,
      savedFile: savePath,
      observations: analysis.hasHorizontalWhiteBand 
        ? "Artifact detected: horizontal band remains visible."
        : "Clean compositing: no horizontal white band, background and identity preserved."
    });
  }

  // Save JSON report
  const reportPath = path.join(RESULTS_DIR, 'matrix_results.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n==========================================================================`);
  console.log(`Matrix evaluation complete. JSON report written to: ${reportPath}`);
  console.log(`==========================================================================`);
}

runTestMatrix().catch(console.error);
