import sharp from 'sharp';
import axios from 'axios';

async function fetchToBuffer(input: string): Promise<Buffer> {
  if (input.startsWith("data:")) {
    const base64Data = input.replace(/^data:image\/\w+;base64,/, "");
    return Buffer.from(base64Data, "base64");
  }
  const res = await axios.get(input, { responseType: 'arraybuffer' });
  return Buffer.from(res.data);
}

export async function generateWarpedTryOn(
  userPhotoUrl: string,
  garmentUrl: string,
  category: string = "sarees"
): Promise<string> {
  try {
    const [userBuffer, garmentBuffer] = await Promise.all([
      fetchToBuffer(userPhotoUrl),
      fetchToBuffer(garmentUrl)
    ]);

    const userMetadata = await sharp(userBuffer).metadata();
    const userWidth = userMetadata.width || 800;
    const userHeight = userMetadata.height || 1000;

    const cat = (category || "").toLowerCase();
    let garmentTargetWidth = Math.round(userWidth * 0.78);
    let garmentTargetHeight = Math.round(userHeight * 0.68);
    let topOffset = Math.round(userHeight * 0.32);
    let leftOffset = Math.round(userWidth * 0.11);

    if (cat.includes("saree") || cat.includes("banarasi") || cat.includes("kanjivaram")) {
      garmentTargetWidth = Math.round(userWidth * 0.82);
      garmentTargetHeight = Math.round(userHeight * 0.72);
      topOffset = Math.round(userHeight * 0.28);
      leftOffset = Math.round(userWidth * 0.09);
    } else if (cat.includes("jewellery") || cat.includes("necklace")) {
      garmentTargetWidth = Math.round(userWidth * 0.42);
      garmentTargetHeight = Math.round(userHeight * 0.25);
      topOffset = Math.round(userHeight * 0.30);
      leftOffset = Math.round(userWidth * 0.29);
    } else if (cat.includes("gown") || cat.includes("dress") || cat.includes("anarkali")) {
      garmentTargetWidth = Math.round(userWidth * 0.85);
      garmentTargetHeight = Math.round(userHeight * 0.75);
      topOffset = Math.round(userHeight * 0.26);
      leftOffset = Math.round(userWidth * 0.075);
    }

    const resizedGarment = await sharp(garmentBuffer)
      .resize(garmentTargetWidth, garmentTargetHeight, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer();

    const compositedBuffer = await sharp(userBuffer)
      .resize(userWidth, userHeight)
      .composite([
        {
          input: resizedGarment,
          top: Math.max(0, topOffset),
          left: Math.max(0, leftOffset),
          blend: 'over'
        }
      ])
      .png()
      .toBuffer();

    return `data:image/png;base64,${compositedBuffer.toString('base64')}`;
  } catch (err: any) {
    console.error("[garmentWarper error]:", err?.message);
    throw err;
  }
}
