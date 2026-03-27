

# Plan: Remove Crypto/KYC References + Update Privacy Content

## What's Changing

### 1. Remove "Pay with Crypto" / "No KYC" references
These files need updates:

- **`src/components/HowItWorks.tsx`** — Step 2 "Pay with Crypto" → "Pay Securely" (credit card + crypto), Step 3 remove "No KYC required"
- **`src/components/EasyCheckout.tsx`** — The middle card uses `cryptoNativeTitle`/`cryptoNativeDesc` translation keys → rebrand to "Secure Payments" (cards + crypto)
- **`src/contexts/TranslationContext.tsx`** — Update translation keys:
  - `heroNoKyc` → "Instant Activation" (remove KYC reference)
  - `heroCryptoOnly` → "Card & Crypto Payments" 
  - `cryptoNativeTitle` → "Secure Payments"
  - `cryptoNativeDesc` → mention both card and crypto
  - `gsDePINBenefit2Desc` → remove "No KYC" part
  - `cryptoConversionTitle`/`cryptoConversionMessage` → keep (these are about future token conversion, not payment method)
- **`src/components/SEO.tsx`** — Update all localized shop SEO titles/descriptions to say "Card & Crypto Payments" instead of "Crypto Payments", remove "no KYC" from descriptions (all 10 languages)
- **`supabase/functions/chat-support/index.ts`** — Update system prompt: remove "No KYC/ID required", update payment section to lead with credit cards, crypto as secondary

### 2. Update Privacy Page Content
- **`src/pages/Privacy.tsx`** — Add a new "What We Collect" section that clearly states:
  - We only collect anonymized internet/network performance data (signal strength, speed, latency)
  - We do NOT track personal browsing, app usage, messages, or identity
  - All location data is rounded and anonymized
  - Data is encrypted and stored in EU data centers
  - Users can delete all data at any time
- This is the website privacy page (marketing-focused), not the legal terms privacy section

### 3. Update Terms Privacy Section  
- **`src/components/terms/TermsPrivacy.tsx`** — Add a clear "What We Do NOT Collect" subsection listing: phone numbers, IMEI, MAC addresses, browsing history, app usage, SMS/messages, contacts

## Technical Details

- All translation key changes affect 10 languages (EN, ES, FR, DE, RU, ZH, JA, PT, AR, IT)
- SEO metadata updates span ~80 lines across all language variants in SEO.tsx
- Chat support system prompt is in an Edge Function that will auto-deploy
- No database changes needed
- No new dependencies

