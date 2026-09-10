# BUYWISE AI — Phase 11.1 AdMob Specification

## Overview
This specification documents native AdMob integration on Android using official Google Test Ad Unit IDs.

## Test Ad Unit Configuration (`AdsManager.kt`)
- **App ID**: `ca-app-pub-3940256099942544~3347511713`
- **Banner Ad Unit**: `ca-app-pub-3940256099942544/6300978111`
- **Interstitial Ad Unit**: `ca-app-pub-3940256099942544/1033173712`
- **Rewarded Ad Unit**: `ca-app-pub-3940256099942544/5224354917`
- **Native Ad Unit**: `ca-app-pub-3940256099942544/2247696110`

## Ad Placement Policy & Exclusions
- **Allowed Placement**: Search feed, product listing feeds, content feeds.
- **Strictly Excluded Screens**: Auth screens, splash screen, onboarding tutorial, checkout/payment screens, VTO studio, legal/privacy pages, admin screens.
- **Frequency Controls**: Interstitial ads require a minimum 5-minute interval and 5 user actions before triggering.
- **Labeling**: All native ads are explicitly labeled with a `SPONSORED` badge.
