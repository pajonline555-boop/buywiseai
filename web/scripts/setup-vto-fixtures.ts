import fs from 'fs';
import path from 'path';

async function setupFixtures() {
  const dir = path.join(process.cwd(), 'public', 'vto-tests');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const humanPath = path.join(dir, 'human-test.jpg');
  const sareePath = path.join(dir, 'saree-test.jpg');

  console.log("Setting up distinct VTO test fixtures in public/vto-tests/...");

  // High quality portrait photo
  const humanUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80";
  // High quality saree photo
  const sareeUrl = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80";

  try {
    if (!fs.existsSync(humanPath)) {
      console.log(`Downloading human test fixture from ${humanUrl}...`);
      const hRes = await fetch(humanUrl);
      if (hRes.ok) {
        fs.writeFileSync(humanPath, Buffer.from(await hRes.arrayBuffer()));
        console.log("Saved human-test.jpg");
      }
    } else {
      console.log("human-test.jpg already exists.");
    }

    if (!fs.existsSync(sareePath)) {
      console.log(`Downloading saree test fixture from ${sareeUrl}...`);
      const sRes = await fetch(sareeUrl);
      if (sRes.ok) {
        fs.writeFileSync(sareePath, Buffer.from(await sRes.arrayBuffer()));
        console.log("Saved saree-test.jpg");
      }
    } else {
      console.log("saree-test.jpg already exists.");
    }
  } catch (e: any) {
    console.error("Failed to download fixtures:", e?.message);
  }
}

setupFixtures();
