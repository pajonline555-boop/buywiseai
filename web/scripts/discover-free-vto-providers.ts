import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

function computeHash(data: Buffer): string {
  return crypto.createHash('md5').update(data).digest('hex');
}

interface ProviderTestResult {
  space: string;
  endpoint: string;
  submitted: boolean;
  eventId?: string;
  completed: boolean;
  error?: string;
  durationMs: number;
  outputHash?: string;
  outputBytes?: number;
  distinctFromInputs?: boolean;
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
    throw new Error(`Upload to ${spaceHost} failed with status ${res.status}`);
  }

  const data = await res.json();
  const first = data?.[0];
  return typeof first === 'string' ? { path: first } : first;
}

async function testProvider(
  space: string,
  spaceHost: string,
  fnName: string,
  payloadBuilder: (humanObj: any, garmentObj: any) => any,
  humanBuf: Buffer,
  garmentBuf: Buffer,
  humanHash: string,
  garmentHash: string,
  hfToken?: string
): Promise<ProviderTestResult> {
  const startTime = Date.now();
  console.log(`\n==================================================`);
  console.log(`TESTING PROVIDER: ${space}`);
  console.log(`==================================================`);

  try {
    console.log(`Uploading test fixtures to https://${spaceHost}/upload...`);
    const humanObj = await uploadToSpace(spaceHost, humanBuf, 'human.jpg', hfToken);
    const garmentObj = await uploadToSpace(spaceHost, garmentBuf, 'garment.jpg', hfToken);
    console.log(`Upload successful.`);

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (hfToken) headers["Authorization"] = `Bearer ${hfToken}`;

    const endpoint = `https://${spaceHost}/call/${fnName}`;
    console.log(`Submitting payload to ${endpoint}...`);

    const submitRes = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ data: payloadBuilder(humanObj, garmentObj) })
    });

    if (submitRes.status === 429 || submitRes.status === 503) {
      return {
        space,
        endpoint,
        submitted: false,
        completed: false,
        error: `HTTP ${submitRes.status} (Quota exhausted / Space unavailable)`,
        durationMs: Date.now() - startTime
      };
    }

    if (!submitRes.ok) {
      return {
        space,
        endpoint,
        submitted: false,
        completed: false,
        error: `HTTP ${submitRes.status} ${submitRes.statusText}`,
        durationMs: Date.now() - startTime
      };
    }

    const { event_id } = await submitRes.json();
    console.log(`Job queued successfully. event_id=${event_id}`);

    const sseUrl = `https://${spaceHost}/call/${fnName}/${event_id}`;
    console.log(`Listening to SSE stream at ${sseUrl}...`);

    const sseRes = await fetch(sseUrl, { headers });
    if (!sseRes.ok || !sseRes.body) {
      return {
        space,
        endpoint,
        submitted: true,
        eventId: event_id,
        completed: false,
        error: `SSE Connection failed (HTTP ${sseRes.status})`,
        durationMs: Date.now() - startTime
      };
    }

    const reader = sseRes.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let resultImageUrl = "";
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
                if (typeof firstOut === 'string') resultImageUrl = firstOut;
                else if (firstOut?.url) resultImageUrl = firstOut.url;
                else if (firstOut?.path) resultImageUrl = firstOut.path;
              } catch (e) {}
              done = true;
              break;
            }
          }
        }
      }
    }

    if (errorMsg) {
      return {
        space,
        endpoint,
        submitted: true,
        eventId: event_id,
        completed: false,
        error: `Gradio error: ${errorMsg}`,
        durationMs: Date.now() - startTime
      };
    }

    if (!resultImageUrl) {
      return {
        space,
        endpoint,
        submitted: true,
        eventId: event_id,
        completed: false,
        error: "Job completed but no result image URL was returned",
        durationMs: Date.now() - startTime
      };
    }

    if (!resultImageUrl.startsWith("http://") && !resultImageUrl.startsWith("https://") && !resultImageUrl.startsWith("data:")) {
      resultImageUrl = `https://${spaceHost}/file=${resultImageUrl}`;
    }

    console.log(`Result image URL received: ${resultImageUrl}`);

    const imgRes = await fetch(resultImageUrl);
    if (!imgRes.ok) {
      return {
        space,
        endpoint,
        submitted: true,
        eventId: event_id,
        completed: false,
        error: `Failed to download output image (HTTP ${imgRes.status})`,
        durationMs: Date.now() - startTime
      };
    }

    const outBuf = Buffer.from(await imgRes.arrayBuffer());
    const outHash = computeHash(outBuf);
    const distinct = outHash !== humanHash && outHash !== garmentHash;

    console.log(`OUTPUT_BYTES: ${outBuf.length}, OUTPUT_HASH: ${outHash}, DISTINCT: ${distinct}`);

    return {
      space,
      endpoint,
      submitted: true,
      eventId: event_id,
      completed: true,
      outputHash: outHash,
      outputBytes: outBuf.length,
      distinctFromInputs: distinct,
      durationMs: Date.now() - startTime
    };

  } catch (err: any) {
    return {
      space,
      endpoint: `https://${spaceHost}/call/${fnName}`,
      submitted: false,
      completed: false,
      error: err?.message || String(err),
      durationMs: Date.now() - startTime
    };
  }
}

async function runDiscovery() {
  const hfToken = process.env.HF_TOKEN;
  const humanPath = path.join(process.cwd(), 'public', 'vto-tests', 'human-test.jpg');
  const garmentPath = path.join(process.cwd(), 'public', 'vto-tests', 'saree-test.jpg');

  if (!fs.existsSync(humanPath) || !fs.existsSync(garmentPath)) {
    console.error("Test fixtures missing. Run setup-vto-fixtures.ts first.");
    process.exit(1);
  }

  const humanBuf = fs.readFileSync(humanPath);
  const garmentBuf = fs.readFileSync(garmentPath);
  const humanHash = computeHash(humanBuf);
  const garmentHash = computeHash(garmentBuf);

  console.log("==================================================");
  console.log("FREE VTO PROVIDER DISCOVERY & MODEL COMPARISON");
  console.log("==================================================");
  console.log(`USER_IMAGE_HASH: ${humanHash}`);
  console.log(`PRODUCT_IMAGE_HASH: ${garmentHash}`);
  console.log(`HF_TOKEN_PRESENT: ${Boolean(hfToken)}`);

  const providers = [
    {
      space: "yisol/IDM-VTON",
      host: "yisol-idm-vton.hf.space",
      fnName: "tryon",
      payload: (h: any, g: any) => [
        { background: h, layers: [], composite: null },
        g,
        "Manyavar Crimson Kanjivaram Silk Saree",
        true,
        false,
        30,
        42
      ]
    },
    {
      space: "Kwai-Kolors/Kolors-Virtual-Try-On",
      host: "kwai-kolors-kolors-virtual-try-on.hf.space",
      fnName: "tryon",
      payload: (h: any, g: any) => [
        h,
        g,
        42,
        true
      ]
    },
    {
      space: "Nymbo/Virtual-Try-On",
      host: "nymbo-virtual-try-on.hf.space",
      fnName: "tryon",
      payload: (h: any, g: any) => [
        { background: h, layers: [], composite: null },
        g,
        "Silk saree drape",
        true,
        false,
        30,
        42
      ]
    }
  ];

  const results: ProviderTestResult[] = [];

  for (const p of providers) {
    const res = await testProvider(
      p.space,
      p.host,
      p.fnName,
      p.payload,
      humanBuf,
      garmentBuf,
      humanHash,
      garmentHash,
      hfToken
    );
    results.push(res);
  }

  console.log("\n==================================================");
  console.log("DISCOVERY SUMMARY MATRIX");
  console.log("==================================================");
  console.table(results);
}

runDiscovery().catch(console.error);
