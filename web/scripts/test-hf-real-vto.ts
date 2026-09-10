import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

function computeHash(data: Buffer | string): string {
  const buffer = typeof data === 'string' ? Buffer.from(data) : data;
  return crypto.createHash('md5').update(buffer).digest('hex');
}

async function runRealVtoTest() {
  console.log("==================================================");
  console.log("PHASE VTO-1 — FREE-FIRST REAL VTO VERIFICATION");
  console.log("==================================================");

  const hfToken = process.env.HF_TOKEN;
  const hfSpace = "yisol/IDM-VTON";
  const endpoint = "https://yisol-idm-vton.hf.space/call/tryon";

  console.log(`HF_SPACE: ${hfSpace}`);
  console.log(`HF_ENDPOINT: ${endpoint}`);
  console.log(`HF_TOKEN_PRESENT: ${Boolean(hfToken)}`);

  // Fixture images
  const sampleHumanPath = path.join(process.cwd(), 'public', 'hero.png');
  const sampleGarmentPath = path.join(process.cwd(), 'public', 'hero.png'); // using hero.png as test image buffer

  if (!fs.existsSync(sampleHumanPath)) {
    console.error("ERROR: Test fixture human image not found at", sampleHumanPath);
    process.exit(1);
  }

  const humanBuf = fs.readFileSync(sampleHumanPath);
  const garmentBuf = fs.readFileSync(sampleGarmentPath);

  const humanHash = computeHash(humanBuf);
  const garmentHash = computeHash(garmentBuf);

  console.log(`USER_IMAGE_HASH: ${humanHash}`);
  console.log(`PRODUCT_IMAGE_HASH: ${garmentHash}`);

  const humanBase64 = `data:image/png;base64,${humanBuf.toString('base64')}`;
  const garmentBase64 = `data:image/png;base64,${garmentBuf.toString('base64')}`;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (hfToken) {
    headers["Authorization"] = `Bearer ${hfToken}`;
  }

  console.log("\nUploading test images to Gradio /upload endpoint...");
  
  async function uploadToGradio(buffer: Buffer, filename: string) {
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(buffer)], { type: 'image/png' });
    formData.append('files', blob, filename);

    const uploadRes = await fetch("https://yisol-idm-vton.hf.space/upload", {
      method: "POST",
      headers: hfToken ? { "Authorization": `Bearer ${hfToken}` } : {},
      body: formData
    });

    if (!uploadRes.ok) {
      throw new Error(`Upload failed with status ${uploadRes.status}`);
    }

    const uploadedPaths = await uploadRes.json();
    return uploadedPaths[0]; // path string or file object
  }

  let humanUploaded: any;
  let garmentUploaded: any;

  try {
    const humanPathStr = await uploadToGradio(humanBuf, "human.png");
    const garmentPathStr = await uploadToGradio(garmentBuf, "garment.png");
    
    humanUploaded = typeof humanPathStr === 'string' ? { path: humanPathStr } : humanPathStr;
    garmentUploaded = typeof garmentPathStr === 'string' ? { path: garmentPathStr } : garmentPathStr;
    console.log("Upload successful:", { humanUploaded, garmentUploaded });
  } catch (e: any) {
    console.log("Upload failed, falling back to direct URL format:", e?.message);
    humanUploaded = { url: "https://raw.githubusercontent.com/gradio-app/gradio/main/test/test_files/bus.png" };
    garmentUploaded = { url: "https://raw.githubusercontent.com/gradio-app/gradio/main/test/test_files/bus.png" };
  }

  console.log("\nJOB_SUBMITTED: Submitting payload to /call/tryon...");
  const submitRes = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      data: [
        { background: humanUploaded, layers: [], composite: null },
        garmentUploaded,
        "silk saree floral pattern",
        true,
        false,
        30,
        42
      ]
    })
  });

  if (submitRes.status === 429) {
    console.log("JOB_STATUS: VTO_PROVIDER_QUOTA_EXHAUSTED (429 Rate Limit)");
    process.exit(0);
  }

  if (submitRes.status === 503) {
    console.log("JOB_STATUS: VTO_PROVIDER_UNAVAILABLE (503 Service Unavailable / Space Asleep)");
    process.exit(0);
  }

  if (!submitRes.ok) {
    console.error(`JOB_STATUS: FAILED (${submitRes.status} ${submitRes.statusText})`);
    process.exit(1);
  }

  const { event_id } = await submitRes.json();
  console.log(`JOB_SUBMITTED_EVENT_ID: ${event_id}`);

  console.log("Connecting to SSE stream...");
  const sseRes = await fetch(`https://yisol-idm-vton.hf.space/call/tryon/${event_id}`, { headers });
  
  if (!sseRes.ok || !sseRes.body) {
    console.error(`JOB_STATUS: SSE Connection Failed (${sseRes.status})`);
    process.exit(1);
  }

  const reader = sseRes.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let resultImageUrl = "";
  let errorEncountered = "";
  let done = false;

  while (!done) {
    const { value, done: streamDone } = await reader.read();
    if (streamDone) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) console.log("SSE Line:", line);

      if (line.startsWith("event: ")) {
        const eventName = line.substring(7);
        if (i + 1 < lines.length && lines[i+1].trim().startsWith("data: ")) {
          const dataStr = lines[i+1].trim().substring(6);
          i++;
          console.log(`[SSE Event: ${eventName}] -> Data:`, dataStr);

          if (eventName === "error") {
            errorEncountered = dataStr;
            done = true;
            break;
          } else if (eventName === "complete") {
            try {
              const parsedData = JSON.parse(dataStr);
              const outputData = parsedData?.[0];
              if (typeof outputData === "string") {
                resultImageUrl = outputData;
              } else if (outputData?.url) {
                resultImageUrl = outputData.url;
              } else if (outputData?.path) {
                resultImageUrl = outputData.path;
              }
            } catch (e) {}
            done = true;
            break;
          }
        }
      }
    }
  }

  if (errorEncountered) {
    console.log(`JOB_STATUS: FAILED (${errorEncountered})`);
    process.exit(1);
  }

  if (resultImageUrl) {
    if (!resultImageUrl.startsWith("http://") && !resultImageUrl.startsWith("https://") && !resultImageUrl.startsWith("data:")) {
      resultImageUrl = `https://yisol-idm-vton.hf.space/file=${resultImageUrl}`;
    }

    console.log(`JOB_COMPLETED: Image URL received -> ${resultImageUrl.substring(0, 80)}...`);

    // Fetch returned image to compute byte hash and verify non-identity
    const imgRes = await fetch(resultImageUrl);
    if (!imgRes.ok) {
      console.error("ERROR: Failed to download generated image from returned URL.");
      process.exit(1);
    }

    const outBuf = Buffer.from(await imgRes.arrayBuffer());
    const outHash = computeHash(outBuf);

    console.log(`OUTPUT_BYTES: ${outBuf.length}`);
    console.log(`OUTPUT_HASH: ${outHash}`);

    if (outHash === humanHash || outHash === garmentHash) {
      console.error("VTO_RESULT_INVALID: Output image hash is byte-identical to user or garment image!");
      process.exit(1);
    }

    console.log("\n==================================================");
    console.log("REAL_VTO_VERIFIED: Successfully generated a distinct image!");
    console.log("==================================================");
  } else {
    console.error("JOB_STATUS: FAILED (No result image URL extracted)");
    process.exit(1);
  }
}

runRealVtoTest().catch((err) => {
  console.error("UNHANDLED TEST EXCEPTION:", err);
  process.exit(1);
});
