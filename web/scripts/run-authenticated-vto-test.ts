import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import axios from 'axios';
import sharp from 'sharp';

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
    throw new Error(`Upload to ${spaceHost} failed: status ${res.status}`);
  }

  const data = await res.json();
  const first = data?.[0];
  return typeof first === 'string' ? { path: first } : first;
}

async function runAuthenticatedTest() {
  console.log("==================================================");
  console.log("PHASE VTO-1.6 — AUTHENTICATED FREE ZERO-GPU TEST");
  console.log("==================================================");

  // Load .env.local manually if process.env.HF_TOKEN not set
  let hfToken = process.env.HF_TOKEN;
  const envLocalPath = path.join(process.cwd(), '.env.local');
  if (!hfToken && fs.existsSync(envLocalPath)) {
    const envText = fs.readFileSync(envLocalPath, 'utf8');
    const match = envText.match(/^HF_TOKEN=(.+)$/m);
    if (match) {
      hfToken = match[1].trim();
    }
  }

  const hfTokenPresent = Boolean(hfToken && hfToken.length > 0);
  console.log(`HF_TOKEN_PRESENT: ${hfTokenPresent}`);

  const spaceHost = "yisol-idm-vton.hf.space";
  const spaceName = "yisol/IDM-VTON";
  const endpoint = `https://${spaceHost}/call/tryon`;

  console.log(`HF_SPACE: ${spaceName}`);
  console.log(`HF_ENDPOINT: ${endpoint}`);

  const humanPath = path.join(process.cwd(), 'public', 'vto-tests', 'human-test.jpg');
  const sareePath = path.join(process.cwd(), 'public', 'vto-tests', 'saree-test.jpg');

  if (!fs.existsSync(humanPath) || !fs.existsSync(sareePath)) {
    console.error("FAIL TEST: Fixture files human-test.jpg or saree-test.jpg missing.");
    process.exit(1);
  }

  const humanBuf = fs.readFileSync(humanPath);
  const sareeBuf = fs.readFileSync(sareePath);

  const humanHash = computeHash(humanBuf);
  const garmentHash = computeHash(sareeBuf);

  console.log(`USER_IMAGE_HASH: ${humanHash}`);
  console.log(`GARMENT_IMAGE_HASH: ${garmentHash}`);

  if (humanHash === garmentHash) {
    console.error("FAIL TEST: USER_IMAGE_HASH and GARMENT_IMAGE_HASH are identical!");
    process.exit(1);
  }

  console.log("HASHES_DISTINCT: true");

  console.log("\nSubmitting ONE VTO request to yisol/IDM-VTON...");
  const startTime = Date.now();

  try {
    const humanObj = await uploadToSpace(spaceHost, humanBuf, 'human.jpg', hfToken);
    const garmentObj = await uploadToSpace(spaceHost, sareeBuf, 'saree.jpg', hfToken);

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (hfToken) headers["Authorization"] = `Bearer ${hfToken}`;

    const submitRes = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        data: [
          { background: humanObj, layers: [], composite: null },
          garmentObj,
          "Manyavar Crimson Silk Saree with Gold Zari Border",
          true, // is_checked
          true,  // is_checked_crop
          30,
          Math.floor(Math.random() * 100000)
        ]
      })
    });

    if (submitRes.status === 429) {
      console.log("REQUEST_RESULT: 429 Quota Exhausted");
      console.log("AUTHENTICATED_ZERO_GPU_TEST = FAILED (429 Rate Limit)");
      process.exit(0);
    }

    if (submitRes.status === 503) {
      console.log("REQUEST_RESULT: 503 Service Unavailable");
      console.log("AUTHENTICATED_ZERO_GPU_TEST = FAILED (503 Space Asleep / Unavailable)");
      process.exit(0);
    }

    if (!submitRes.ok) {
      console.log(`REQUEST_RESULT: HTTP ${submitRes.status} ${submitRes.statusText}`);
      console.log(`AUTHENTICATED_ZERO_GPU_TEST = FAILED (HTTP ${submitRes.status})`);
      process.exit(0);
    }

    const { event_id } = await submitRes.json();
    console.log(`REQUEST_SUBMITTED: true (event_id=${event_id})`);

    console.log("Listening to SSE stream for completion...");
    const sseRes = await fetch(`https://${spaceHost}/call/tryon/${event_id}`, { headers });
    if (!sseRes.ok || !sseRes.body) {
      console.log(`SSE_STREAM_FAILED: HTTP ${sseRes.status}`);
      console.log("AUTHENTICATED_ZERO_GPU_TEST = FAILED (SSE stream error)");
      process.exit(0);
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

    if (errorMsg) {
      console.log(`SSE_COMPLETED: false (Gradio Error: ${errorMsg})`);
      console.log("AUTHENTICATED_ZERO_GPU_TEST = FAILED (Gradio runtime error)");
      process.exit(0);
    }

    if (!resultUrl) {
      console.log("SSE_COMPLETED: false (No output URL)");
      console.log("AUTHENTICATED_ZERO_GPU_TEST = FAILED (No output URL returned)");
      process.exit(0);
    }

    console.log("SSE_COMPLETED: true");
    console.log(`REAL_OUTPUT_RETURNED: true (${resultUrl.substring(0, 70)}...)`);

    if (!resultUrl.startsWith("http://") && !resultUrl.startsWith("https://") && !resultUrl.startsWith("data:")) {
      resultUrl = `https://${spaceHost}/file=${resultUrl}`;
    }

    const axiosRes = await axios.get(resultUrl, {
      responseType: 'arraybuffer',
      headers: hfToken ? { "Authorization": `Bearer ${hfToken}` } : {},
      timeout: 20000
    });

    const outBuf = Buffer.from(axiosRes.data);
    const outHash = computeHash(outBuf);

    const outPath = path.join(process.cwd(), 'public', 'vto-tests', 'results', 'authenticated-vto-result.jpg');
    const resultsDir = path.dirname(outPath);
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

    fs.writeFileSync(outPath, outBuf);
    console.log(`Saved output image to ${outPath}`);

    // Decode image dimensions with sharp
    const metadata = await sharp(outBuf).metadata();

    console.log(`OUTPUT_BYTES: ${outBuf.length}`);
    console.log(`OUTPUT_MIME: image/${metadata.format || 'png'}`);
    console.log(`OUTPUT_WIDTH: ${metadata.width}`);
    console.log(`OUTPUT_HEIGHT: ${metadata.height}`);
    console.log(`OUTPUT_HASH: ${outHash}`);
    console.log(`DURATION_SEC: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

  } catch (err: any) {
    console.log(`AUTHENTICATED_ZERO_GPU_TEST = FAILED (${err?.message || err})`);
  }
}

runAuthenticatedTest().catch((err) => {
  console.error("Test Exception:", err);
});
