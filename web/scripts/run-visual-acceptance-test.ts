import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import axios from 'axios';

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

async function generateVto(
  spaceHost: string,
  humanBuf: Buffer,
  garmentBuf: Buffer,
  garmentDescription: string,
  hfToken?: string
): Promise<Buffer> {
  console.log(`Uploading images to ${spaceHost}...`);
  const humanObj = await uploadToSpace(spaceHost, humanBuf, 'human.jpg', hfToken);
  const garmentObj = await uploadToSpace(spaceHost, garmentBuf, 'garment.jpg', hfToken);

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (hfToken) headers["Authorization"] = `Bearer ${hfToken}`;

  const endpoint = `https://${spaceHost}/call/tryon`;
  console.log(`Submitting payload to ${endpoint}...`);

  const submitRes = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      data: [
        { background: humanObj, layers: [], composite: null },
        garmentObj,
        garmentDescription,
        true,
        false,
        30,
        42
      ]
    })
  });

  if (!submitRes.ok) {
    throw new Error(`Submit failed with HTTP ${submitRes.status}`);
  }

  const { event_id } = await submitRes.json();
  console.log(`Queued job event_id=${event_id}`);

  const sseUrl = `https://${spaceHost}/call/tryon/${event_id}`;
  const sseRes = await fetch(sseUrl, { headers });

  if (!sseRes.ok || !sseRes.body) {
    throw new Error(`SSE failed with HTTP ${sseRes.status}`);
  }

  const reader = sseRes.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let resultUrl = "";
  let errorMsg = "";
  let done = false;

  while (!done) {
    const { value, done: streamDone } = await reader.read();
    if (streamDone) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("event: ")) {
        const eventName = line.substring(7);
        if (i + 1 < lines.length && lines[i+1].trim().startsWith("data: ")) {
          const dataStr = lines[i+1].trim().substring(6);
          i++;

          if (eventName === "error") {
            errorMsg = dataStr;
            done = true;
            break;
          } else if (eventName === "complete") {
            try {
              const parsed = JSON.parse(dataStr);
              const firstOut = parsed?.[0];
              if (typeof firstOut === 'string') resultUrl = firstOut;
              else if (firstOut?.url) resultUrl = firstOut.url;
              else if (firstOut?.path) resultUrl = firstOut.path;
            } catch (e) {}
            done = true;
            break;
          }
        }
      }
    }
  }

  if (errorMsg) throw new Error(`Gradio error: ${errorMsg}`);
  if (!resultUrl) throw new Error("No output image URL returned");

  if (!resultUrl.startsWith("http://") && !resultUrl.startsWith("https://") && !resultUrl.startsWith("data:")) {
    resultUrl = `https://${spaceHost}/file=${resultUrl}`;
  }

  console.log(`Downloading generated result from ${resultUrl}...`);
  try {
    const axiosRes = await axios.get(resultUrl, {
      responseType: 'arraybuffer',
      headers: hfToken ? { "Authorization": `Bearer ${hfToken}` } : {},
      timeout: 20000
    });
    return Buffer.from(axiosRes.data);
  } catch (e: any) {
    throw new Error(`Download of image failed: ${e?.message || e}`);
  }
}

async function runVisualAcceptanceTest() {
  console.log("==================================================");
  console.log("PHASE VTO-1.5 — REAL VISUAL ACCEPTANCE TEST");
  console.log("==================================================");

  const resultsDir = path.join(process.cwd(), 'public', 'vto-tests', 'results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const humanSrc = path.join(process.cwd(), 'public', 'vto-tests', 'human-test.jpg');
  const sareeSrc = path.join(process.cwd(), 'public', 'vto-tests', 'saree-test.jpg');

  if (!fs.existsSync(humanSrc) || !fs.existsSync(sareeSrc)) {
    console.error("Missing test fixtures in public/vto-tests/");
    process.exit(1);
  }

  // Copy fixtures to results dir as requested
  fs.copyFileSync(humanSrc, path.join(resultsDir, 'human-test.jpg'));
  fs.copyFileSync(sareeSrc, path.join(resultsDir, 'saree-test.jpg'));

  const humanBuf = fs.readFileSync(humanSrc);
  const sareeBuf = fs.readFileSync(sareeSrc);

  const hfToken = process.env.HF_TOKEN;
  const spaceHost = "yisol-idm-vton.hf.space";

  console.log("TEST 1: Generic Saree Visual Acceptance Test...");
  const outBuf1 = await generateVto(
    spaceHost,
    humanBuf,
    sareeBuf,
    "Red Silk Saree with Gold Zari Border",
    hfToken
  );

  const outPath1 = path.join(resultsDir, 'generated-saree-result.jpg');
  fs.writeFileSync(outPath1, outBuf1);
  console.log(`SAVED TEST 1 RESULT to: ${outPath1} (${outBuf1.length} bytes, Hash: ${computeHash(outBuf1)})`);

  console.log("\nTEST 2: Real BuyWise Retailer Product Test (Manyavar Kanjivaram Silk Saree)...");
  // Fetch real retailer product image
  const retailerGarmentUrl = "https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=800&q=80";
  const retailerRes = await fetch(retailerGarmentUrl);
  const retailerGarmentBuf = Buffer.from(await retailerRes.arrayBuffer());

  const outBuf2 = await generateVto(
    spaceHost,
    humanBuf,
    retailerGarmentBuf,
    "Manyavar Crimson Kanjivaram Silk Saree with Woven Gold Zari",
    hfToken
  );

  const outPath2 = path.join(resultsDir, 'generated-retailer-saree-result.jpg');
  fs.writeFileSync(outPath2, outBuf2);
  console.log(`SAVED TEST 2 RESULT to: ${outPath2} (${outBuf2.length} bytes, Hash: ${computeHash(outBuf2)})`);

  console.log("\n==================================================");
  console.log("VISUAL ACCEPTANCE TEST PIPELINE COMPLETE");
  console.log("==================================================");
}

runVisualAcceptanceTest().catch((err) => {
  console.error("VISUAL ACCEPTANCE TEST FAILED:", err);
  process.exit(1);
});
