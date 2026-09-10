import fs from 'fs';
import path from 'path';

function verifyTokenConfig() {
  let tokenPresent = Boolean(process.env.HF_TOKEN && process.env.HF_TOKEN.length > 0);

  if (!tokenPresent) {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/^HF_TOKEN=(.+)$/m);
      if (match && match[1].trim().length > 0) {
        tokenPresent = true;
      }
    }
  }

  if (tokenPresent) {
    console.log("HF_TOKEN_PRESENT=true");
    console.log("HF_ENVIRONMENT=server");
    console.log("\n==================================================");
    console.log("HF_TOKEN_CONFIGURATION_READY");
    console.log("==================================================");
  } else {
    console.log("HF_TOKEN_PRESENT=false");
    console.log("HF_ENVIRONMENT=server");
    console.log("ERROR: HF_TOKEN could not be loaded from .env.local");
  }
}

verifyTokenConfig();
