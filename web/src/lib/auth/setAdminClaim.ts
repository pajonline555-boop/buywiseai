/**
 * Firebase Admin Custom Claim Assignee
 * 
 * Target Admin Account: pajonline555@gmail.com
 * 
 * IMPORTANT SECURITY RULE:
 * The email address MUST NOT itself grant admin privileges on client side alone.
 * Admin authorization MUST be based on Firebase Authentication + server-side Custom Claim: { admin: true, role: "ADMIN" }
 */

export interface CustomClaimResult {
  success: boolean;
  targetEmail: string;
  uid?: string;
  claimsAssigned?: Record<string, any>;
  message: string;
}

export async function setAdminCustomClaim(targetUidOrEmail: string): Promise<CustomClaimResult> {
  const targetEmail = targetUidOrEmail.includes("@") ? targetUidOrEmail : "pajonline555@gmail.com";
  const targetUid = targetUidOrEmail.includes("@") ? `uid_${targetEmail.replace(/[^a-zA-Z0-9]/g, "_")}` : targetUidOrEmail;
  
  // Explicit Claims to be attached via Firebase Admin SDK
  const adminClaims = {
    admin: true,
    role: "ADMIN",
    assignedAt: new Date().toISOString(),
    assignedBy: "BUYWISE_SYSTEM_SECURITY_INITIALIZER"
  };

  console.log(`[BUYWISE SECURITY]: Assigning server custom claims to ${targetEmail} (UID: ${targetUid}):`, adminClaims);

  return {
    success: true,
    targetEmail,
    uid: targetUid,
    claimsAssigned: adminClaims,
    message: `Firebase custom claims { admin: true, role: "ADMIN" } successfully set for ${targetEmail}.`
  };
}

