export const dynamic = "force-static";
import { NextResponse } from 'next/server';
import { getVisionProvider } from '@/lib/vision/provider';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { image, mode = 'exact' } = body;

    // 1. Validation: Image payload presence
    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { error: 'Image data is required. Provide a valid base64 data URI.' },
        { status: 400 }
      );
    }

    // 2. Validation: Max Payload Size (5MB limit)
    const MAX_BASE64_LENGTH = 7 * 1024 * 1024;
    if (image.length > MAX_BASE64_LENGTH) {
      return NextResponse.json(
        { error: 'Image payload exceeds maximum allowed size of 5MB.' },
        { status: 413 }
      );
    }

    // 3. Validation: Allowed MIME types
    const mimeMatch = image.match(/^data:(image\/(jpeg|jpg|png|webp));base64,/);
    if (!mimeMatch && !image.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Invalid image format. Supported formats: JPEG, PNG, WebP.' },
        { status: 400 }
      );
    }

    // 4. Validation: Search Mode
    const validMode = mode === 'similar' ? 'similar' : 'exact';

    // 5. Delegate to Vision Provider
    const visionProvider = getVisionProvider();
    const result = await visionProvider.analyze(image, { mode: validMode });

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error: any) {
    console.error('Vision Analyze Execution Error:', error);
    return NextResponse.json(
      { success: false, status: 'error', error: 'Failed to analyze image with Vision AI.' },
      { status: 500 }
    );
  }
}
