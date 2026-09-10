import { NextResponse } from "next/server";

export type UserRole = "ADMIN" | "PARTNER" | "SHOPPER";

export interface DecodedAuthToken {
  uid: string;
  email?: string;
  role?: UserRole;
  admin?: boolean;
  partnerId?: string;
}

export interface SecurityAuditLogEntry {
  timestamp: string;
  eventType: "AUTHORIZATION_FAILURE" | "ADMIN_LOGIN" | "ROLE_CHANGE" | "MEDIA_REVIEW" | "SUSPICIOUS_ACTIVITY";
  userId?: string;
  email?: string;
  route: string;
  ip?: string;
  reason: string;
}

const auditLogs: SecurityAuditLogEntry[] = [];

export function logSecurityEvent(entry: Omit<SecurityAuditLogEntry, "timestamp">) {
  const fullEntry: SecurityAuditLogEntry = {
    ...entry,
    timestamp: new Date().toISOString()
  };
  auditLogs.unshift(fullEntry);
  if (auditLogs.length > 500) auditLogs.pop();
  console.warn(`[BUYWISE SECURITY AUDIT LOG]: [${fullEntry.eventType}] User: ${fullEntry.userId || "GUEST"} | Route: ${fullEntry.route} | Reason: ${fullEntry.reason}`);
}

export function getSecurityAuditLogs(): SecurityAuditLogEntry[] {
  return auditLogs;
}

/**
 * Server-side authorization checker evaluating user identity & custom claims.
 * Designated Admin: pajonline555@gmail.com (Requires claims.admin === true or role === "ADMIN").
 */
export function authorizeRequest(
  token: DecodedAuthToken | null,
  requiredRole: UserRole,
  routePath: string
): { authorized: boolean; response?: NextResponse } {
  if (!token) {
    logSecurityEvent({
      eventType: "AUTHORIZATION_FAILURE",
      route: routePath,
      reason: "Unauthenticated request attempting access to protected resource"
    });
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, code: "UNAUTHORIZED", message: "Authentication required." },
        { status: 401 }
      )
    };
  }

  // Admin access requires server-side custom claim (admin === true OR role === "ADMIN")
  if (requiredRole === "ADMIN") {
    const isServerAdmin = token.admin === true || token.role === "ADMIN";
    if (!isServerAdmin) {
      logSecurityEvent({
        eventType: "AUTHORIZATION_FAILURE",
        userId: token.uid,
        email: token.email,
        route: routePath,
        reason: `User lacks authoritative ADMIN custom claim. Claim present: admin=${token.admin}, role=${token.role}`
      });
      return {
        authorized: false,
        response: NextResponse.json(
          { success: false, code: "FORBIDDEN", message: "Administrative authorization required." },
          { status: 403 }
        )
      };
    }
  }

  // Partner access requires PARTNER or ADMIN role
  if (requiredRole === "PARTNER") {
    const isPartner = token.role === "PARTNER" || token.role === "ADMIN" || token.admin === true;
    if (!isPartner) {
      logSecurityEvent({
        eventType: "AUTHORIZATION_FAILURE",
        userId: token.uid,
        email: token.email,
        route: routePath,
        reason: "User lacks PARTNER or ADMIN authorization claim"
      });
      return {
        authorized: false,
        response: NextResponse.json(
          { success: false, code: "FORBIDDEN", message: "Partner merchant authorization required." },
          { status: 403 }
        )
      };
    }
  }

  return { authorized: true };
}
