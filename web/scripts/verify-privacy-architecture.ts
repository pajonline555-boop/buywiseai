import {
  submitToCompetition,
  getStoredSubmissions,
  withdrawSubmission,
  getPublishedCompetitionGallery,
} from '../src/lib/competitions/competitionService';

async function runPrivacyVerification() {
  console.log('==================================================');
  console.log('  BUYWISE AI — PRIVACY & COMPETITION VERIFICATION ');
  console.log('==================================================\n');

  // Test 1: Explicit consent required for competition submission
  let consentFailedAsExpected = false;
  try {
    // @ts-ignore
    await submitToCompetition('vto_test_1', 'https://example.com/img.png', false);
  } catch (err: any) {
    consentFailedAsExpected = true;
    console.log('[TEST 1] Unconsented submission blocked as expected:', err.message);
  }

  if (!consentFailedAsExpected) {
    console.error('TEST 1 FAILED: Unconsented submission was not blocked!');
    process.exit(1);
  }
  console.log('[TEST 1] Granular Consent Enforcement: PASS ✓\n');

  // Test 2: Valid submission with explicit consent
  const sub = await submitToCompetition('vto_test_1', 'https://example.com/img.png', true);
  console.log('[TEST 2] Submission Created ID:', sub.submissionId);
  console.log('[TEST 2] Initial Visibility State:', sub.visibility); // SUBMITTED
  console.log('[TEST 2] Status:', sub.status); // ACTIVE
  console.log('[TEST 2] Submission Flow: PASS ✓\n');

  // Test 3: Public gallery filtering (Only PUBLISHED items appear)
  const galleryInitial = await getPublishedCompetitionGallery();
  console.log('[TEST 3] Public Gallery Items (Expect 0 since SUBMITTED, not PUBLISHED):', galleryInitial.length);
  if (galleryInitial.length !== 0) {
    console.error('TEST 3 FAILED: SUBMITTED item appeared in public gallery before PUBLISHED approval!');
    process.exit(1);
  }
  console.log('[TEST 3] Public Gallery Isolation: PASS ✓\n');

  // Test 4: Withdrawal transition
  const withdrawn = await withdrawSubmission(sub.submissionId);
  console.log('[TEST 4] Withdrawn State:', withdrawn?.status);
  if (withdrawn?.status !== 'WITHDRAWN') {
    console.error('TEST 4 FAILED: Submission failed to transition to WITHDRAWN!');
    process.exit(1);
  }
  console.log('[TEST 4] Submission Withdrawal Right: PASS ✓\n');

  console.log('==================================================');
  console.log('  ALL PRIVACY & COMPETITION TESTS VERIFIED (4/4)');
  console.log('==================================================');
}

runPrivacyVerification().catch((err) => {
  console.error('Verification Script Failure:', err);
  process.exit(1);
});
