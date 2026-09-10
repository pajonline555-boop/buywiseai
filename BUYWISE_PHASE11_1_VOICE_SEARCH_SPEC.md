# BUYWISE AI — Phase 11.1 Voice Search Specification

## Overview
This specification covers voice-to-search functionality across Android Native and Web platforms.

## Multi-Language Speech Processing
- **Supported Languages**: English (`en-IN`), Hindi (`hi-IN`), and Hinglish.
- **Search Integration**: Recognized text passes into SmartCompare search query normalizer without modifying underlying attributes.
- **Contextual Permission**: `RECORD_AUDIO` permission is requested only upon tapping the search bar microphone button (`🎙`). Never requested during splash or background.

## Web Browser Fallback
- `web/src/lib/ai/webSpeechService.ts` checks browser Web Speech API capability (`isWebSpeechSupported()`). If unsupported, displays clear feedback: *"Voice search isn't supported in this browser. Please type your search."*
