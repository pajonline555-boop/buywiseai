import { logSecurityEvent, DecodedAuthToken } from "@/lib/auth/roleMiddleware";

export const SERVER_AUTHORITATIVE_FIELDS = [
  "admin",
  "role",
  "paymentStatus",
  "orderStatus",
  "fulfillmentStatus",
  "refundStatus",
  "availableStock",
  "reservedStock",
  "soldStock",
  "commission",
  "payout",
  "primeSubscriber",
  "primeExpiresAt",
  "vtoUsageCount",
  "verifiedPrice",
  "verificationStatus",
] as const;

export type ServerAuthoritativeField = typeof SERVER_AUTHORITATIVE_FIELDS[number];

/**
 * Audit client payload to ensure forbidden server-authoritative fields
 * cannot be overwritten or forged directly from unprivileged client calls.
 */
export function sanitizeClientPayload<T extends Record<string, any>>(
  payload: T,
  userToken: DecodedAuthToken | null
): Partial<T> {
  const sanitized: Record<string, any> = { ...payload };
  const isAdmin = userToken?.admin === true || userToken?.role === "ADMIN";

  SERVER_AUTHORITATIVE_FIELDS.forEach(field => {
    if (field in sanitized && !isAdmin) {
      logSecurityEvent({
        eventType: "AUTHORIZATION_FAILURE",
        userId: userToken?.uid,
        email: userToken?.email,
        route: "databaseSecurity",
        reason: `Unprivileged user attempted to mutate server-authoritative field '${field}'`
      });
      delete sanitized[field];
    }
  });

  return sanitized as Partial<T>;
}

/**
 * Validates ownership of resources (IDOR prevention).
 * Ensures User A cannot query or mutate User B's orders, try-on media, or address snapshots.
 */
export function verifyResourceOwnership(
  resourceOwnerId: string,
  userToken: DecodedAuthToken | null,
  resourceName: string
): boolean {
  if (!userToken) return false;

  const isAdmin = userToken.admin === true || userToken.role === "ADMIN";
  const isOwner = userToken.uid === resourceOwnerId;

  if (!isOwner && !isAdmin) {
    logSecurityEvent({
      eventType: "AUTHORIZATION_FAILURE",
      userId: userToken.uid,
      email: userToken.email,
      route: "databaseSecurity",
      reason: `IDOR attempt blocked: User ${userToken.uid} attempted access to ${resourceName} belonging to ${resourceOwnerId}`
    });
    return false;
  }

  return true;
}
