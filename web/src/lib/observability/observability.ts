export type ObservabilityCategory =
  | "AUTH_FAILURE"
  | "AUTHORIZATION_FAILURE"
  | "RATE_LIMIT_EXCEEDED"
  | "VTO_CREDIT_ANOMALY"
  | "PAYMENT_WEBHOOK"
  | "NOTIFICATION_CRON"
  | "SYSTEM_ERROR_5XX";

export interface ObservabilityLogEntry {
  timestamp: string;
  category: ObservabilityCategory;
  route: string;
  userId?: string;
  details: string;
  severity: "INFO" | "WARN" | "ERROR";
}

const auditLogStore: ObservabilityLogEntry[] = [];

/**
 * Sanitizes input string to ensure no raw passwords, JWTs, API tokens, or secrets leak into logs.
 */
function sanitizeLogDetails(input: string): string {
  return input
    .replace(/(eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+)/g, "[REDACTED_JWT]")
    .replace(/(hf_[A-Za-z0-9]+)/g, "[REDACTED_HF_TOKEN]")
    .replace(/(sk-[A-Za-z0-9]+)/g, "[REDACTED_API_KEY]")
    .replace(/(AIzaSy[A-Za-z0-9-_]+)/g, "[REDACTED_FIREBASE_KEY]");
}

export function recordObservabilityEvent(
  category: ObservabilityCategory,
  route: string,
  details: string,
  severity: "INFO" | "WARN" | "ERROR" = "INFO",
  userId?: string
): ObservabilityLogEntry {
  const sanitizedDetails = sanitizeLogDetails(details);
  const entry: ObservabilityLogEntry = {
    timestamp: new Date().toISOString(),
    category,
    route,
    userId: userId || "ANONYMOUS",
    details: sanitizedDetails,
    severity
  };

  auditLogStore.unshift(entry);
  if (auditLogStore.length > 1000) auditLogStore.pop();

  if (severity === "ERROR") {
    console.error(`[BUYWISE OBSERVABILITY ALERT]: [${category}] Route: ${route} | User: ${entry.userId} | ${sanitizedDetails}`);
  } else if (severity === "WARN") {
    console.warn(`[BUYWISE OBSERVABILITY WARN]: [${category}] Route: ${route} | User: ${entry.userId} | ${sanitizedDetails}`);
  }

  return entry;
}

export function getObservabilityLogs(): ObservabilityLogEntry[] {
  return auditLogStore;
}
