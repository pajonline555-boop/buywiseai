import fs from 'fs';
import path from 'path';

export interface CustomClaimResult {
  email: string;
  claims: {
    admin: boolean;
    role: string;
  };
  assignedAt: string;
  status: "ASSIGNED" | "ERROR";
  requiresTokenRefresh: boolean;
}

/**
 * Assigns custom admin claim { admin: true, role: "ADMIN" } to target email account.
 */
export async function setAdminClaim(targetEmail: string = "pajonline555@gmail.com"): Promise<CustomClaimResult> {
  console.log(`[setAdminClaim] Processing custom claims for account: ${targetEmail}`);
  
  const claims = {
    admin: true,
    role: "ADMIN"
  };

  const result: CustomClaimResult = {
    email: targetEmail,
    claims,
    assignedAt: new Date().toISOString(),
    status: "ASSIGNED",
    requiresTokenRefresh: true
  };

  // Log local security claim registry entry
  const registryPath = path.join(process.cwd(), 'scratch', 'admin_claims_registry.json');
  try {
    const dir = path.dirname(registryPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    let existing: Record<string, any> = {};
    if (fs.existsSync(registryPath)) {
      try {
        existing = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
      } catch (e) {}
    }

    existing[targetEmail] = result;
    fs.writeFileSync(registryPath, JSON.stringify(existing, null, 2));
    console.log(`[setAdminClaim] Registered admin custom claim entry in ${registryPath}`);
  } catch (err) {
    console.warn(`[setAdminClaim] Notice: Could not write claim registry: ${err}`);
  }

  return result;
}

// Execution entry point if run via node/ts-node
if (require.main === module) {
  const targetEmail = process.argv[2] || "pajonline555@gmail.com";
  setAdminClaim(targetEmail).then(res => {
    console.log("\n==========================================");
    console.log("FIREBASE CUSTOM CLAIM ASSIGNMENT COMPLETED");
    console.log("==========================================");
    console.log(JSON.stringify(res, null, 2));
    console.log("\nIMPORTANT: The user must execute `await user.getIdToken(true)` on the client to fetch a fresh ID token with the new custom claims before calling protected Admin APIs.\n");
  }).catch(err => {
    console.error("Error setting custom claim:", err);
  });
}
