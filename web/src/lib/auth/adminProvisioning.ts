import { UserRole, logSecurityEvent } from "./roleMiddleware";

export const DESIGNATED_BUYWISE_ADMIN_EMAIL = "pajonline555@gmail.com";

export interface ProvisionAdminResult {
  success: boolean;
  email: string;
  assignedRole: UserRole;
  customClaims: Record<string, boolean | string>;
  message: string;
}

/**
 * Controlled Administrative Provisioning Service
 * Assigns authoritative custom claims to designated admin email (pajonline555@gmail.com).
 */
export async function provisionAdminClaims(
  targetEmail: string,
  requesterToken: { admin?: boolean; role?: string } | null
): Promise<ProvisionAdminResult> {
  if (targetEmail.toLowerCase() !== DESIGNATED_BUYWISE_ADMIN_EMAIL) {
    logSecurityEvent({
      eventType: "SUSPICIOUS_ACTIVITY",
      route: "adminProvisioning",
      reason: `Attempted admin claim provisioning for undesignated email: ${targetEmail}`
    });
    return {
      success: false,
      email: targetEmail,
      assignedRole: "SHOPPER",
      customClaims: {},
      message: `Deny: Email ${targetEmail} is not the designated BuyWise administrator.`
    };
  }

  // Provision admin claims
  const claims = {
    admin: true,
    role: "ADMIN" as UserRole,
    provisionedAt: new Date().toISOString()
  };

  logSecurityEvent({
    eventType: "ROLE_CHANGE",
    email: targetEmail,
    route: "adminProvisioning",
    reason: `Authoritative ADMIN role & custom claims assigned to ${targetEmail}`
  });

  return {
    success: true,
    email: targetEmail,
    assignedRole: "ADMIN",
    customClaims: claims,
    message: `Successfully provisioned custom admin claims for ${targetEmail}.`
  };
}
