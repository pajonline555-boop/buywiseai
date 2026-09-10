export interface ScheduledNotificationJob {
  id: string;
  idempotencyKey: string;
  window: "MORNING_10_10" | "MIDDAY_14_15" | "EVENING_20_10";
  scheduledTimeIST: string;
  title: string;
  body: string;
  imageUrl?: string;
  deepLink: string;
  targetCategory?: string;
  status: "SCHEDULED" | "DISPATCHED" | "SKIPPED";
  dispatchedAt?: string;
}

const dispatchedKeys = new Set<string>();
const pendingJobs: ScheduledNotificationJob[] = [];

/**
 * Enforces Asia/Kolkata server-side notification scheduling windows.
 * Windows: 10:10 AM IST (10:10), 2:15 PM IST (14:15), 8:10 PM IST (20:10).
 */
export function scheduleNotificationWindow(
  dateStrISO: string,
  window: "MORNING_10_10" | "MIDDAY_14_15" | "EVENING_20_10",
  title: string,
  body: string,
  deepLink: string,
  targetUserId: string = "all_users"
): ScheduledNotificationJob {
  const windowTime = window === "MORNING_10_10" ? "10:10" : window === "MIDDAY_14_15" ? "14:15" : "20:10";
  const dateOnly = dateStrISO.split("T")[0];
  const idempotencyKey = `${dateOnly}:${windowTime}:${window.toLowerCase()}:${targetUserId}`;

  if (dispatchedKeys.has(idempotencyKey)) {
    console.log(`[NOTIFICATION SCHEDULER]: Skipped duplicate job for key ${idempotencyKey}`);
    return {
      id: `job_skip_${Date.now()}`,
      idempotencyKey,
      window,
      scheduledTimeIST: `${dateOnly} ${windowTime} IST`,
      title,
      body,
      deepLink,
      status: "SKIPPED"
    };
  }

  const job: ScheduledNotificationJob = {
    id: `job_${Date.now()}`,
    idempotencyKey,
    window,
    scheduledTimeIST: `${dateOnly} ${windowTime} IST`,
    title,
    body,
    deepLink,
    status: "SCHEDULED"
  };

  pendingJobs.push(job);
  return job;
}

export function dispatchScheduledNotification(jobId: string): boolean {
  const job = pendingJobs.find(j => j.id === jobId);
  if (!job || job.status === "DISPATCHED") return false;

  job.status = "DISPATCHED";
  job.dispatchedAt = new Date().toISOString();
  dispatchedKeys.add(job.idempotencyKey);
  console.log(`[NOTIFICATION SCHEDULER DISPATCHED]: "${job.title}" | DeepLink: ${job.deepLink} | Time (IST): ${job.scheduledTimeIST}`);
  return true;
}
