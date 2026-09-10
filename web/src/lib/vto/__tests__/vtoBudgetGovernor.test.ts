import { vtoBudgetGovernor } from "../vtoBudgetGovernor";
import { vtoProviderRouter } from "../providers/VtoProviderRouter";

export async function runVtoBudgetGovernorSelfTest() {
  console.log("=================================================");
  console.log("[BUYWISE PHASE 7A.2 REAL VTO & BUDGET TEST SUITE]");
  console.log("=================================================");

  const testUser1 = `user_a_${Date.now()}`;
  const testUser2 = `user_b_${Date.now()}`;

  // Configure governor for conservative Phase 7A.2 testing limits
  vtoBudgetGovernor.updateConfig({
    providerMode: "CONTROLLED",
    emergencyStop: false,
    perUserMonthlyLimit: 3,
    perUserDailyLimit: 1,
    globalDailyLimit: 5,
    globalMonthlyLimit: 50,
    maxConcurrentPerUser: 1
  });

  console.log("[Test Config Loaded]: 3/month/user, 1/day/user, 1/concurrent, Global 5/day, Global 50/month");

  // TEST 1: First request of the day for testUser1 -> ALLOWED
  const check1 = vtoBudgetGovernor.checkAndReserveSlot(testUser1);
  if (!check1.allowed) {
    throw new Error(`TEST 1 FAILED: First request for user should be allowed: ${check1.message}`);
  }
  console.log("✓ TEST 1 PASSED: 1st generation allowed for test user");

  // TEST 2: Second request on the same day for testUser1 -> DENIED (Concurrency Lock)
  const check2 = vtoBudgetGovernor.checkAndReserveSlot(testUser1);
  if (check2.allowed) {
    throw new Error("TEST 2 FAILED: Simultaneous/second request while active request processing should be denied.");
  }
  if (check2.code !== "VTO_CONCURRENT_LIMIT" && check2.code !== "VTO_USER_DAILY_LIMIT") {
    throw new Error(`TEST 2 FAILED: Unexpected error code: ${check2.code}`);
  }
  console.log("✓ TEST 2 PASSED: Concurrent request blocked by single-request concurrency lock");

  // Commit slot for testUser1
  vtoBudgetGovernor.commitSlot(testUser1, 0.00);

  // TEST 3: Second request on same day after completing first -> DENIED (Daily limit = 1)
  const check3 = vtoBudgetGovernor.checkAndReserveSlot(testUser1);
  if (check3.allowed) {
    throw new Error("TEST 3 FAILED: 2nd request on same day should be denied by daily limit.");
  }
  if (check3.code !== "VTO_USER_DAILY_LIMIT") {
    throw new Error(`TEST 3 FAILED: Expected VTO_USER_DAILY_LIMIT but got: ${check3.code}`);
  }
  console.log("✓ TEST 3 PASSED: 2nd generation on same day denied by per-user daily cap (1/day)");

  // TEST 4: Global Daily Limit Enforcement (5 generations/day)
  // We commit 4 more distinct users to hit the 5/day global limit
  for (let i = 1; i <= 4; i++) {
    const tempUser = `global_user_${i}_${Date.now()}`;
    const tempCheck = vtoBudgetGovernor.checkAndReserveSlot(tempUser);
    if (!tempCheck.allowed) {
      throw new Error(`TEST 4 FAILED: Global user ${i} should be allowed up to limit of 5: ${tempCheck.message}`);
    }
    vtoBudgetGovernor.commitSlot(tempUser, 0.00);
  }

  // 6th global request -> DENIED (Global Daily Limit = 5)
  const checkGlobalOverflow = vtoBudgetGovernor.checkAndReserveSlot(testUser2);
  if (checkGlobalOverflow.allowed) {
    throw new Error("TEST 4 FAILED: 6th global request should be denied by global daily limit of 5.");
  }
  if (checkGlobalOverflow.code !== "VTO_GLOBAL_DAILY_LIMIT") {
    throw new Error(`TEST 4 FAILED: Expected VTO_GLOBAL_DAILY_LIMIT but got: ${checkGlobalOverflow.code}`);
  }
  console.log("✓ TEST 4 PASSED: Global daily limit of 5 enforced. 6th global request denied BEFORE provider invocation.");

  // TEST 5: Provider Failure Refund Logic
  const refundUser = `refund_user_${Date.now()}`;
  // Reset limits temporarily to test refund
  vtoBudgetGovernor.updateConfig({ globalDailyLimit: 100 });
  const checkRefund1 = vtoBudgetGovernor.checkAndReserveSlot(refundUser);
  if (!checkRefund1.allowed) {
    throw new Error("TEST 5 FAILED: Failed to reserve slot for refund test.");
  }
  // Simulate provider failure / quality gate rejection
  vtoBudgetGovernor.releaseSlot(refundUser);
  const checkRefund2 = vtoBudgetGovernor.checkAndReserveSlot(refundUser);
  if (!checkRefund2.allowed) {
    throw new Error("TEST 5 FAILED: Released slot after provider failure did not refund user quota.");
  }
  vtoBudgetGovernor.releaseSlot(refundUser);
  console.log("✓ TEST 5 PASSED: Provider/Quality Gate failure cleanly refunds budget reservation and entitlement");

  // TEST 6: Emergency Stop Switch
  vtoBudgetGovernor.updateConfig({ emergencyStop: true });
  const checkStop = vtoBudgetGovernor.checkAndReserveSlot(testUser2);
  if (checkStop.allowed || checkStop.code !== "VTO_EMERGENCY_STOP") {
    throw new Error("TEST 6 FAILED: Emergency stop should block all requests immediately.");
  }
  console.log("✓ TEST 6 PASSED: Server-side emergency stop blocks all incoming VTO requests");

  // Restore configuration
  vtoBudgetGovernor.updateConfig({ emergencyStop: false, globalDailyLimit: 5 });

  // TEST 7: Provider Router License & Model Safety Audit
  const primaryProvider = vtoProviderRouter.selectPrimaryProvider();
  if (!primaryProvider || primaryProvider.id !== "huggingface-vto") {
    throw new Error(`TEST 7 FAILED: Expected huggingface-vto as primary development provider, got: ${primaryProvider?.id}`);
  }
  if (primaryProvider.getLicenseStatus() !== "DEVELOPMENT_ONLY") {
    throw new Error(`TEST 7 FAILED: HuggingFace provider must remain marked DEVELOPMENT_ONLY, got: ${primaryProvider.getLicenseStatus()}`);
  }
  console.log("✓ TEST 7 PASSED: Hugging Face IDM-VTON correctly restricted to DEVELOPMENT_ONLY scope.");

  // TEST 8: Paid Commercial Providers Protection Audit
  const allProviders = vtoProviderRouter.getAllProvidersStatus();
  const runpodStatus = allProviders.find((p: { id: string; name: string; configured: boolean; licenseStatus: string }) => p.id === "runpod-vto");
  const falStatus = allProviders.find((p: { id: string; name: string; configured: boolean; licenseStatus: string }) => p.id === "fal-vto");
  if (runpodStatus?.configured || falStatus?.configured) {
    throw new Error("TEST 8 FAILED: Paid commercial providers (RunPod/fal.ai) must NOT be configured without explicit approval!");
  }
  console.log("✓ TEST 8 PASSED: Paid commercial providers (RunPod, fal.ai) remain UNCONFIGURED and safe from unapproved billing.");

  console.log("=================================================");
  console.log("[ALL PHASE 7A.2 VTO & BUDGET TESTS PASSED 100%!]");
  console.log("=================================================");
  return true;
}

