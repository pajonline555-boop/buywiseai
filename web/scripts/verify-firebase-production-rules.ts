import * as fs from 'fs';
import * as path from 'path';

interface AssertionResult {
  id: number;
  name: string;
  target: 'firestore.rules' | 'storage.rules';
  passed: boolean;
  details: string;
}

function runFirebaseRulesVerification(): void {
  console.log("==================================================");
  console.log("BUYWISE AI — FIREBASE PRODUCTION RULES VERIFIER");
  console.log("==================================================\n");

  const webDir = process.cwd();
  const firestoreRulesPath = path.join(webDir, 'firestore.rules');
  const storageRulesPath = path.join(webDir, 'storage.rules');

  const firestoreContent = fs.readFileSync(firestoreRulesPath, 'utf8');
  const storageContent = fs.readFileSync(storageRulesPath, 'utf8');

  const assertions: AssertionResult[] = [
    {
      id: 1,
      name: "Firestore Syntax Version Check",
      target: "firestore.rules",
      passed: firestoreContent.includes("rules_version = '2';"),
      details: "Must specify rules_version = '2'"
    },
    {
      id: 2,
      name: "Global Admin Custom Claim Verification",
      target: "firestore.rules",
      passed: firestoreContent.includes("request.auth.token.admin == true") && firestoreContent.includes("request.auth.token.role == 'ADMIN'"),
      details: "Must use server-authoritative custom claims for admin status"
    },
    {
      id: 3,
      name: "Firestore Default Wildcard Deny",
      target: "firestore.rules",
      passed: firestoreContent.includes("match /{document=**}") && firestoreContent.includes("allow read, write: if false;"),
      details: "Must end with default-deny-all rule"
    },
    {
      id: 4,
      name: "User Privilege Escalation Protection",
      target: "firestore.rules",
      passed: firestoreContent.includes("isUnprivilegedUserFieldMutation()") && firestoreContent.includes("['role', 'admin', 'subscriptionStatus'"),
      details: "Must prevent unprivileged client mutation of role and admin fields"
    },
    {
      id: 5,
      name: "Security Audit Log Protection",
      target: "firestore.rules",
      passed: firestoreContent.includes("match /security_audit_logs/{logId}") && firestoreContent.includes("allow read, write: if isAdmin();"),
      details: "Audit logs must be admin-only read/write"
    },
    {
      id: 6,
      name: "Shopper Price Alert Isolation",
      target: "firestore.rules",
      passed: firestoreContent.includes("match /alerts/{alertId}") && firestoreContent.includes("resource.data.userId == request.auth.uid"),
      details: "User price alerts must enforce user isolation"
    },
    {
      id: 7,
      name: "Storage Syntax Version Check",
      target: "storage.rules",
      passed: storageContent.includes("rules_version = '2';"),
      details: "Must specify rules_version = '2'"
    },
    {
      id: 8,
      name: "Storage Default Wildcard Deny",
      target: "storage.rules",
      passed: storageContent.includes("match /{allPaths=**}") && storageContent.includes("allow read, write: if false;"),
      details: "Must end with default-deny-all rule"
    },
    {
      id: 9,
      name: "Storage File Size Constraint (10MB Max)",
      target: "storage.rules",
      passed: storageContent.includes("request.resource.size <= 10 * 1024 * 1024"),
      details: "Must enforce 10MB max upload size limit"
    },
    {
      id: 10,
      name: "Storage Content-Type Mime Filtering",
      target: "storage.rules",
      passed: storageContent.includes("image/jpeg") && storageContent.includes("image/png") && storageContent.includes("image/webp"),
      details: "Must enforce image/jpeg, image/png, and image/webp mime restrictions"
    }
  ];

  let passedCount = 0;

  assertions.forEach((a) => {
    const statusSymbol = a.passed ? "🟢 PASS" : "🔴 FAIL";
    if (a.passed) passedCount++;
    console.log(`[${statusSymbol}] Spec #${a.id}: ${a.name} (${a.target})`);
    console.log(`       Details: ${a.details}`);
  });

  console.log("\n--------------------------------------------------");
  console.log(`SUMMARY: ${passedCount}/${assertions.length} Production Rules Assertions Passed`);
  console.log("--------------------------------------------------");

  if (passedCount !== assertions.length) {
    console.error("FAIL: One or more Firebase security rules assertions failed!");
    process.exit(1);
  } else {
    console.log("SUCCESS: Firebase Production Rules Verification Passed 🟢");
  }
}

runFirebaseRulesVerification();
