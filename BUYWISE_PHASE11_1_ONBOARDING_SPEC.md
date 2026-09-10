# BUYWISE AI — Phase 11.1 Splash Screen & Onboarding Specification

## Splash Screen
- **Duration**: 1.5 Seconds non-blocking timer (`delay(1500)`).
- **Design**: Clean BuyWise AI logo animation, no network blocking, no ads, no heavy startup initialization.

## Post-Signup Onboarding Tutorial
- **Cards (7 Posters)**:
  1. Welcome to BuyWise AI
  2. Compare Before You Buy
  3. Search Smarter (🎙️ Voice & 📷 Camera OCR)
  4. Try Before You Decide (✨ AI Try-On)
  5. Smart Value + Shopping Trust
  6. Discover BuyWise Store
  7. You're Ready! (Start Shopping)
- **Controls**: `SKIP` button (top-right), `NEXT` button, `START SHOPPING` button on final poster.
- **Persistence**: Stored in `SharedPreferences` (`has_completed_buywise_onboarding`). Replay option available in user profile.
