export const dynamic = "force-static";
import { NextRequest, NextResponse } from "next/server";
import { scheduleNotificationWindow, dispatchScheduledNotification } from "@/lib/notifications/notificationScheduler";

/**
 * Server-side Authorized Notification Cron Route
 * Endpoint: GET /api/notifications/cron
 * Security: Requires Authorization header matching process.env.CRON_SECRET (or test secret key)
 */
export async function GET(request: NextRequest) {
  let authHeader = null;
  try {
    authHeader = request?.headers?.get ? request.headers.get("authorization") : null;
  } catch (e) {
    authHeader = null;
  }
  const cronSecret = process.env.CRON_SECRET || "buywise_cron_secret_prod_key_2026";

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { success: false, code: "UNAUTHORIZED", message: "Missing or invalid authorization header." },
      { status: 401 }
    );
  }

  const token = authHeader.split(" ")[1];
  if (token !== cronSecret) {
    return NextResponse.json(
      { success: false, code: "FORBIDDEN", message: "Invalid cron secret authorization key." },
      { status: 403 }
    );
  }

  // Determine IST time window and mode
  const url = new URL(request.url);
  const explicitWindow = url.searchParams.get("window") as "MORNING_10_10" | "MIDDAY_14_15" | "EVENING_20_10" | null;
  const isVerificationMode = url.searchParams.get("mode") === "verification";

  // Calculate current IST hour/minute if no explicit test window is specified
  const now = new Date();
  const istOffset = 5.5 * 3600 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  const currentHour = istDate.getUTCHours();

  let targetWindow: "MORNING_10_10" | "MIDDAY_14_15" | "EVENING_20_10" = "MORNING_10_10";
  let title = "BuyWise Morning Festival Deals";
  let body = "Check verified lowest prices across Amazon, Flipkart & Myntra today!";
  let deepLink = "/deals";

  if (explicitWindow && ["MORNING_10_10", "MIDDAY_14_15", "EVENING_20_10"].includes(explicitWindow)) {
    targetWindow = explicitWindow;
  } else if (currentHour >= 12 && currentHour < 17) {
    targetWindow = "MIDDAY_14_15";
    title = "BuyWise Midday SmartCompare Alert";
    body = "Top price drops updated across mobiles, laptops, and fashion!";
    deepLink = "/compare";
  } else if (currentHour >= 17) {
    targetWindow = "EVENING_20_10";
    title = "Gen-G Store Evening Drop";
    body = "Explore trending partner products & new Virtual Try-On styles!";
    deepLink = "/geng";
  }

  if (isVerificationMode) {
    title = `[VERIFICATION TEST] ${title}`;
    body = `[SAFE TEST VERIFICATION MODE] ${body}`;
  }

  // Schedule & Dispatch using Asia/Kolkata timezone idempotency logic
  const job = scheduleNotificationWindow(
    istDate.toISOString(),
    targetWindow,
    title,
    body,
    deepLink,
    isVerificationMode ? "verification_test_account_99" : "all_users"
  );

  let dispatched = false;
  if (job.status === "SCHEDULED") {
    dispatched = dispatchScheduledNotification(job.id);
  }

  return NextResponse.json({
    success: true,
    verificationMode: isVerificationMode,
    scheduledWindow: targetWindow,
    scheduledTimeIST: job.scheduledTimeIST,
    jobStatus: job.status,
    dispatched,
    idempotencyKey: job.idempotencyKey,
    timezone: "Asia/Kolkata"
  });
}
