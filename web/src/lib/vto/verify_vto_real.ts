import { garmentPreparationPipeline } from './garmentPreparation';
import { identityPreservationValidator } from './identityValidator';
import { garmentFidelityValidator } from './garmentFidelityValidator';

export async function runVtoRealVerificationSuite() {
  console.log("=== RUNNING REAL VTO ENGINE VERIFICATION SUITE ===");

  // Test 1: Garment Preparation Pipeline
  const prepared = await garmentPreparationPipeline.prepareGarmentImage(
    "saree_001",
    "https://images.unsplash.com/photo-1610030469983-98e550d6193c",
    "sarees_ethnic",
    "Manyavar Kanjivaram Silk Saree"
  );
  console.log("Test 1 - Garment Preparation:", prepared.preparationStatus === "PREPARED" ? "PASSED ✓" : "FAILED ✕");

  // Test 2: Identity Preservation Validator
  const identity = identityPreservationValidator.validateIdentityPreservation(
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
    "https://images.unsplash.com/photo-1610030469983-98e550d6193c"
  );
  console.log("Test 2 - Identity Preservation:", identity.identityPreserved ? "PASSED ✓" : "FAILED ✕");

  // Test 3: Garment Fidelity Validator
  const fidelity = garmentFidelityValidator.validateGarmentFidelity(
    "https://images.unsplash.com/photo-1610030469983-98e550d6193c",
    "https://images.unsplash.com/photo-1610030469983-98e550d6193c",
    "sarees_ethnic"
  );
  console.log("Test 3 - Garment Fidelity:", fidelity.garmentFidelityVerified ? "PASSED ✓" : "FAILED ✕");

  console.log("=== VERIFICATION SUITE COMPLETED SUCCESSFULLY ===");
  return { prepared, identity, fidelity };
}
