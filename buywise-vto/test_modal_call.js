/**
 * Test script for BuyWise ComfyUI Virtual Try-On deployed on Modal.
 * Usage:
 *   node test_modal_call.js https://<your-username>--buywise-vto-api-buywisevto-generate-tryon.modal.run
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const modalUrl = process.argv[2] || process.env.MODAL_VTO_URL;

if (!modalUrl) {
  console.error("Usage: node test_modal_call.js <MODAL_ENDPOINT_URL>");
  console.error("Example: node test_modal_call.js https://myorg--buywise-vto-api-buywisevto-generate-tryon.modal.run");
  process.exit(1);
}

// Read workflow_api.json
const workflowPath = path.join(__dirname, 'workflow_api.json');
let workflowJson = {};
if (fs.existsSync(workflowPath)) {
  workflowJson = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
}

// Sample test payload (high-quality Indian ethnic wear images)
const payload = {
  person_image_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
  garment_image_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80",
  category: "overall", // For Sarees, Kurtis, Anarkalis, Lehengas
  person_node_id: "10",
  garment_node_id: "11",
  mask_node_id: "12",
  workflow: workflowJson
};

console.log(`[BuyWise VTO Test]: Dispatching POST request to ${modalUrl}...`);
console.log(`[BuyWise VTO Test]: Category: ${payload.category}`);
const startTime = Date.now();

const data = JSON.stringify(payload);
const url = new URL(modalUrl);

const options = {
  hostname: url.hostname,
  port: url.port || 443,
  path: url.pathname + url.search,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    'User-Agent': 'BuyWise-VTO-Tester/1.0'
  },
  timeout: 120000
};

const req = https.request(options, (res) => {
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`[BuyWise VTO Test]: HTTP Status ${res.statusCode} (${duration}s)`);
  console.log(`[BuyWise VTO Test]: Content-Type: ${res.headers['content-type']}`);

  const chunks = [];
  res.on('data', (d) => chunks.push(d));

  res.on('end', () => {
    const buffer = Buffer.concat(chunks);
    if (res.statusCode === 200) {
      const outputPath = path.join(__dirname, 'test_output_result.webp');
      fs.writeFileSync(outputPath, buffer);
      console.log(`SUCCESS! Received ${buffer.length} bytes of WebP image data.`);
      console.log(`Result saved locally to: ${outputPath}`);
    } else {
      console.error(`FAILED: ${buffer.toString('utf8')}`);
    }
  });
});

req.on('error', (e) => {
  console.error(`[BuyWise VTO Test]: Network error: ${e.message}`);
});

req.write(data);
req.end();
