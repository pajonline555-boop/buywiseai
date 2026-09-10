# BUYWISE AI — PHASE 2 PROFILE COMPLETION CONTROLLED IMPLEMENTATION PLAN

**VERSION:** 2.0  
**STATUS:** IMPLEMENTATION PLAN CREATED & PROPOSED  
**APP LOCATION:** `c:\APPS\BUYWISE AI\web`  
**SCOPE:** Profile Completion — Languages, Theme, Security, Offline Packs, Knowledge Hub, Help/FAQ, Intelligence Assistant, and 5 Legal Pages.

---

## EXECUTIVE OVERVIEW

In Phase 2, the **MY BUYWISE Shopping Command Center** is expanded with complete, working subsystems and pages for:
1. **Languages & Localization System (`src/lib/i18n/`)**: Support for English (`en`), Hindi (`hi`), and Hinglish (`hi-en`).
2. **App Theme & Appearance (`src/lib/theme/`)**: System Default, Light, and Dark mode theme engine affecting the entire application.
3. **Security & Password Management (`src/components/profile/SecurityPasswordModal.tsx`)**: Firebase Auth password reset/update and authentication provider display.
4. **Offline Language Packs (`src/components/profile/OfflineLanguagePacksModal.tsx`)**: Offline translation caching architecture.
5. **BuyWise Knowledge Hub (`/knowledge`)**: 14 AI shopping education categories, search, category filters, and legal disclaimers.
6. **Help & FAQ (`/faq`)**: 17 structured FAQ sections with instant search and accordion UI.
7. **Intelligence Assistant Integration**: Connects `/api/chat` with prominent AI disclaimer banners.
8. **Complete Indian E-Commerce Legal Suite**:
   - `/privacy-policy`: DPDP Act 2023 & DPDP Rules 2025 compliant draft.
   - `/terms-of-service`: Platform terms, guest terms, and VTO usage terms.
   - `/refund-policy`: Refund & cancellation policies (Affiliate vs Partner orders).
   - `/affiliate-disclosure`: Amazon affiliate tag (`pajonline-21`) and commission disclosures.
   - `/partner-terms`: Merchant seller marketplace agreement.
9. **Draft Legal Disclaimer**: All legal documents marked: *"Draft for implementation review by qualified Indian legal counsel before commercial launch."*

---

## User Review Required

> [!IMPORTANT]
> **Regulatory Framework Alignment:** The Privacy Policy incorporates the **Digital Personal Data Protection (DPDP) Act, 2023**, the **DPDP Rules, 2025**, the **Consumer Protection (E-Commerce) Rules, 2020**, and the **IT (Intermediary Guidelines) Rules**. All legal pages will display document metadata (Version, Effective Date, Jurisdiction: India, Grievance Officer details).

> [!IMPORTANT]
> **Zero Fake Content Directive:** Knowledge Hub articles, FAQs, and Offline Language Packs will use real data structures or truthful unavailable states. No fake article views, fake government approvals, or fake download progress bars will be rendered.

---

## Proposed Changes

### Component & Library Architecture

#### [NEW] [i18n/translations.ts](file:///c:/APPS/BUYWISE%20AI/web/src/lib/i18n/translations.ts)
- Localization dictionaries for English (`en`), Hindi (`hi`), and Hinglish (`hi-en`).
- Exposes `useTranslation()` hook and translation helper functions.

#### [NEW] [theme/themeProvider.tsx](file:///c:/APPS/BUYWISE%20AI/web/src/lib/theme/themeProvider.tsx)
- Theme provider managing `light`, `dark`, and `system` modes using CSS root variables.

#### [NEW] [knowledge/store.ts](file:///c:/APPS/BUYWISE%20AI/web/src/lib/knowledge/store.ts)
- 14 Shopping Education Categories & Article Store with search, category filtering, and "Last Updated" timestamps.

#### [NEW] [faq/store.ts](file:///c:/APPS/BUYWISE%20AI/web/src/lib/faq/store.ts)
- 17 FAQ categories and search indexing.

---

### New Page Routes (`[NEW]`)

| Route Path | Description | Key Components / Features |
| :--- | :--- | :--- |
| `src/app/privacy-policy/page.tsx` | Privacy Policy Route (`/privacy-policy`) | 38 DPDP 2025 compliant sections, Grievance Officer contact |
| `src/app/terms-of-service/page.tsx` | Terms of Service Route (`/terms-of-service`) | Platform terms, VTO terms, dispute resolution, jurisdiction |
| `src/app/refund-policy/page.tsx` | Refund & Cancellation Policy (`/refund-policy`) | Affiliate purchase rules vs Partner seller order refund rules |
| `src/app/affiliate-disclosure/page.tsx` | Affiliate Disclosure (`/affiliate-disclosure`) | Amazon tag (`pajonline-21`) & commission disclaimer |
| `src/app/partner-terms/page.tsx` | BuyWise Partner Terms (`/partner-terms`) | Merchant seller marketplace agreement, fulfillment & payouts |
| `src/app/knowledge/page.tsx` | Knowledge Hub Page (`/knowledge`) | Article search, 14 categories, reading time, legal disclaimers |
| `src/app/faq/page.tsx` | Help & FAQ Page (`/faq`) | 17 FAQ sections, instant search, report data CTA |

---

### New Profile Modals (`[NEW]`)

| File Path | Description |
| :--- | :--- |
| `src/components/profile/LanguageSelectorModal.tsx` | Language selector dialog (English, Hindi, Hinglish) |
| `src/components/profile/ThemeSelectorModal.tsx` | Theme selector dialog (Light, Dark, System Default) |
| `src/components/profile/SecurityPasswordModal.tsx` | Password reset & authentication provider dialog |
| `src/components/profile/OfflineLanguagePacksModal.tsx` | Offline translation packs caching dialog |
| `src/components/profile/PrivacyCenterModal.tsx` | Data rights & privacy controls modal |

---

### Modifications to Existing Code (`[MODIFY]`)

#### [MODIFY] [page.tsx](file:///c:/APPS/BUYWISE%20AI/web/src/app/profile/page.tsx)
- Integrate new Preferences, Security, Support, and Legal sections into `/profile`.

#### [MODIFY] [layout.tsx](file:///c:/APPS/BUYWISE%20AI/web/src/app/layout.tsx)
- Wrap application in `ThemeProvider` and add footer links to all 5 legal documents.

#### [MODIFY] [AuthContext.tsx](file:///c:/APPS/BUYWISE%20AI/web/src/lib/AuthContext.tsx)
- Add `preferredTheme` and `preferredLanguage` to `userProfile`.

---

## Verification Plan

### Automated Build & Compilation
- `npx tsc --noEmit` — Must pass with 0 errors.
- `npm run build` — Must compile all 34+ routes cleanly.

### Manual & Browser Verification
1. Test `/profile` page preferences (Language, Theme, Security, Offline Packs).
2. Test `/privacy-policy`, `/terms-of-service`, `/refund-policy`, `/affiliate-disclosure`, `/partner-terms`.
3. Test `/knowledge` Hub (Search, Category filters, Article detail views).
4. Test `/faq` Page (Search, Accordion expansion).
5. Verify guest access mode remains 100% active on all public pages.
6. Verify regression safety for SmartCompare, Amazon import, Coupon Truth Engine, Price Alerts, Real AI VTO, and Partner orders.
