export const dynamic = 'force-static';
import { NextResponse } from 'next/server';
import { runSandboxE2ETestSuite } from '@/lib/checkout/sandboxTestSuite';

export async function GET() {
  try {
    const report = await runSandboxE2ETestSuite();
    return NextResponse.json({
      success: true,
      certification: 'PHASE_9_6_SANDBOX_E2E_CERTIFIED',
      report
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to execute sandbox E2E test suite' },
      { status: 500 }
    );
  }
}
