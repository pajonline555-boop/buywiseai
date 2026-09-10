import { runPriceMonitoringCycle } from './monitor';
import { MonitoringCycleResult, MonitoringOptions } from './types';

export async function triggerScheduledMonitoring(
  options: MonitoringOptions = {}
): Promise<MonitoringCycleResult> {
  console.log('[⏱️ BUYWISE AI CRON SCHEDULER] Starting automated price monitoring cycle...');
  const result = await runPriceMonitoringCycle(options);
  console.log(`[⏱️ BUYWISE AI CRON SCHEDULER] Cycle Completed: Evaluated ${result.alertsEvaluated} alerts across ${result.uniqueProductsChecked} unique SKUs.`);
  console.log(`- Prices Recorded: ${result.pricesRecorded} | Alerts Triggered: ${result.notificationsTriggered} | Suppressed: ${result.notificationsSuppressed}`);
  return result;
}
