export const dynamic = 'force-static';
import { NextResponse } from 'next/server';
import { getEmergencyKillSwitchStatus, setEmergencyKillSwitchStatus } from '@/lib/checkout/reconciliationEngine';

export async function GET() {
  const config = await getEmergencyKillSwitchStatus();
  return NextResponse.json({
    success: true,
    killSwitch: config
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { enabled, reason, updatedBy } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: "'enabled' boolean parameter is required" },
        { status: 400 }
      );
    }

    const updated = await setEmergencyKillSwitchStatus(enabled, reason || '', updatedBy || 'admin');

    return NextResponse.json({
      success: true,
      message: `Emergency Kill Switch set to ${enabled ? 'ENABLED' : 'DISABLED'}`,
      killSwitch: updated
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update Kill Switch' },
      { status: 500 }
    );
  }
}
