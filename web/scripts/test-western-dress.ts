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
  console.log(`Submitting payload for: "${garmentDescription}"...`);

  const submitRes = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      data: [
        { background: humanObj, layers: [], composite: null },
        garmentObj,
        garmentDescription,
        true,
        true,
        30,
        Math.floor(Math.random() * 100000)
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

  console.log(`Downloading generated result...`);
  const axiosRes = await axios.get(resultUrl, {
    responseType: 'arraybuffer',
    headers: hfToken ? { "Authorization": `Bearer ${hfToken}` } : {},
    timeout: 20000
  });
  return Buffer.from(axiosRes.data);
}

async function runCategoryTests() {
  console.log("==================================================");
  console.log("TESTING ADDITIONAL CATEGORIES (WESTERN DRESS)");
  console.log("==================================================");

  let hfToken = process.env.HF_TOKEN;
  const envLocalPath = path.join(process.cwd(), '.env.local');
  if (!hfToken && fs.existsSync(envLocalPath)) {
    const envText = fs.readFileSync(envLocalPath, 'utf8');
    const match = envText.match(/^HF_TOKEN=(.+)$/m);
    if (match) hfToken = match[1].trim();
  }

  const humanSrc = path.join(process.cwd(), 'public', 'vto-tests', 'human-test.jpg');
  const humanBuf = fs.readFileSync(humanSrc);

  // Fetch Western Dress sample image
  console.log("Fetching Western Dress sample image...");
  const westernDressUrl = "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80";
  const dressRes = await fetch(westernDressUrl);
  const dressBuf = Buffer.from(await dressRes.arrayBuffer());

  const spaceHost = "yisol-idm-vton.hf.space";
  const dressOutBuf = await generateVto(
    spaceHost,
    humanBuf,
    dressBuf,
    "Elegant Red Floral Evening Dress",
    hfToken
  );

  const resultsDir = path.join(process.cwd(), 'public', 'vto-tests', 'results');
  if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });
  const dressOutPath = path.join(resultsDir, 'western-dress-result.jpg');
  fs.writeFileSync(dressOutPath, dressOutBuf);

  const metadata = await sharp(dressOutBuf).metadata();
  console.log(`WESTERN_DRESS_TEST_COMPLETED: ${dressOutPath}`);
  console.log(`BYTES: ${dressOutBuf.length}, FORMAT: ${metadata.format}, HASH: ${computeHash(dressOutBuf)}`);
}

runCategoryTests().catch((err) => {
  console.error("CATEGORY TEST EXCEPTION:", err);
});
