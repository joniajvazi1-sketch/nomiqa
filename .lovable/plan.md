

# Fix: Google Play Privacy Policy Rejection

## Problem

Google Play rejected the app for two reasons:

1. **Privacy Policy link leads to the wrong page** — The screenshot shows the Terms & Conditions page, meaning the Play Console link likely points to `/terms` instead of `/privacy`.
2. **Missing comprehensive Location data disclosure** — The current `/privacy` page is a marketing-style page with principles and highlights. It does not contain the actual legal privacy policy text, and critically, it does not comprehensively disclose how Location data is accessed, collected, used, and shared.

The full legal privacy policy text currently lives inside `TermsPrivacy` on the `/terms` page, but Google needs it at the `/privacy` URL.

## Plan

### Step 1: Add full legal privacy policy content to the `/privacy` page

Keep the existing marketing hero section and principles, but **append a comprehensive legal privacy policy section** below the marketing content. This section will include:

- **Data Controller** information (Business Unlimited Worldwide Ltd.)
- **Data We Collect** — explicitly listing Location data with details on precision, purpose, and retention
- **How We Use Location Data** — dedicated subsection explaining:
  - GPS coordinates are rounded to ~11m precision
  - Used for network coverage mapping
  - Background collection (with user consent)
  - Retention period (auto-deleted after 60/90 days)
- **Data We Do NOT Collect** — the existing list
- **Purpose of Data Processing** — legal bases (GDPR Art. 6)
- **Third-Party Sharing** — who receives aggregated data
- **Data Retention** periods
- **Your Rights** under GDPR (access, rectification, deletion, portability)
- **Contact Information** for data requests

This content will be sourced from the existing `TermsPrivacy` translations plus new Location-specific disclosure text.

### Step 2: Add explicit Location data disclosure

Add new content that Google specifically requires — a dedicated "Location Data" section that covers:
- **What**: GPS coordinates (rounded to 4 decimal places), cell tower identifiers (MCC, MNC, TAC, PCI)
- **When**: Foreground and background (with explicit user permission)
- **Why**: Network quality measurement and coverage mapping
- **How shared**: Aggregated and anonymized (K-anonymity, min 5 users per tile) before any B2B export
- **Retention**: Raw location data auto-deleted after 60 days

### Step 3: Update Play Console link

After publishing, update the Privacy Policy URL in Play Console to: `https://nomiqa-depin.com/privacy`

(This is a manual step in the Google Play Developer Console — not a code change.)

## Files Modified

- `src/pages/Privacy.tsx` — Add legal privacy policy sections below the existing marketing content
- `src/contexts/TranslationContext.tsx` — Add new translation keys for Location data disclosure and legal sections

## Technical Notes

- The `TermsPrivacy` component on `/terms` will remain unchanged (Terms page still shows privacy info as part of the full legal terms)
- The `/privacy` page will now serve as the standalone, Google-compliant privacy policy
- All 10 languages will be updated with the new translation keys

