import { VtoProviderRouter } from "../VtoProviderRouter";
import { NormalizedVtoGenerationRequest } from "../VtoProviderTypes";

export async function runVtoRouterSelfTest() {
  console.log("[VTO Router Self-Test Suite Starting...]");
  const router = new VtoProviderRouter();

  // Test 1: Capabilities
  const caps = router.getCapabilities();
  if (!caps || !caps.supportsImageToImage || !caps.supportsSaree) {
    throw new Error("TEST 1 FAILED: Capabilities not supported as expected.");
  }
  console.log("✓ TEST 1 PASSED: Capabilities check");

  // Test 2: Health check
  const health = await router.healthCheck();
  if (!health || typeof health.healthy !== "boolean") {
    throw new Error("TEST 2 FAILED: Health check failed.");
  }
  console.log("✓ TEST 2 PASSED: Health check");

  // Test 3: Cost estimation
  const dummyReq: NormalizedVtoGenerationRequest = {
    requestId: "req_test_1",
    userId: "user_1",
    personImage: "https://example.com/person.jpg",
    garmentImage: "https://example.com/garment.jpg",
    garmentType: "sarees_ethnic"
  };
  const cost = router.estimateCost(dummyReq);
  if (cost < 0) {
    throw new Error("TEST 3 FAILED: Cost estimation negative.");
  }
  console.log("✓ TEST 3 PASSED: Cost estimation");

  // Test 4: Provider enumeration
  const statuses = router.getAllProvidersStatus();
  if (statuses.length < 3) {
    throw new Error("TEST 4 FAILED: Provider status count under 3.");
  }
  const ids = statuses.map(s => s.id);
  if (!ids.includes("runpod-vto") || !ids.includes("fal-vto") || !ids.includes("huggingface-vto")) {
    throw new Error("TEST 4 FAILED: Missing standard adapters.");
  }
  console.log("✓ TEST 4 PASSED: Provider enumeration");

  console.log("[VTO Router Self-Test Suite ALL PASSED SUCCESSFULLY!]");
  return true;
}
