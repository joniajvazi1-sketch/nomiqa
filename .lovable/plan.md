

# Plan: Flatten Referral to Single-Layer 10% Commission

## Summary
Change the entire referral/commission system from a 3-tier model (9%/6%/3%) to a single flat 10% commission on direct referrals only. Update the points commission rate from 5% to 10%. Remove all multi-level/tier references across the app, website, backend, and database.

## Changes

### 1. Database Migration
Update the `process_referral_commission` function to use `0.10` instead of `0.05`:
```sql
CREATE OR REPLACE FUNCTION public.process_referral_commission() ...
  commission_rate DECIMAL(5,4) := 0.10; -- 10% commission
```

### 2. Tokenomics Config (`src/utils/tokenomics.ts`)
- `REFERRAL_COMMISSION_RATE`: `0.05` → `0.10`

### 3. App Copy (`src/utils/appCopy.ts`)
- Update `referral.inviteDescription` to mention 10% instead of generic "share of value"

### 4. Helio Webhook (`supabase/functions/helio-webhook/index.ts`)
- Change level 1 commission from `0.09` to `0.10`
- **Remove** entire level 2 and level 3 commission blocks (lines ~653-730)

### 5. Stripe Webhook (`supabase/functions/stripe-webhook/index.ts`)
- No commission logic here (it delegates to helio-webhook pattern) — no changes needed.

### 6. Chat Support (`supabase/functions/chat-support/index.ts`)
- Update the referral knowledge text: "5% of points" → "10%", remove level 2/3 commission mentions, flatten to "10% commission on direct referral purchases"

### 7. ConversionRewardsSection (`src/components/ConversionRewardsSection.tsx`)
- Remove the 3-tier system entirely. Show a single card: "10% commission on all direct referral purchases"
- Remove the multi-level explainer (levels 1/2/3 with arrows)
- Keep the total lifetime earnings display

### 8. ReferEarn Website Section (`src/components/ReferEarn.tsx`)
- Replace the 3-level cascade (Level 1: $4.50/9%, Level 2: $3.00/6%, Level 3: $1.50/3%) with a single level: "10% on direct referrals" showing $5.00 on a $50 eSIM
- Remove the "passive starts" dividers and level 2/3 blocks
- Update summary total from "$9.00" to "$5.00"

### 9. ReferEarnModal (`src/components/ReferEarnModal.tsx`)
- Change "9% on direct referrals, 6% on level 2, and 3% on level 3" → "10% on direct referral purchases"

### 10. ShareModal (`src/components/ShareModal.tsx`)
- Same text change as ReferEarnModal

### 11. AppProfile (`src/pages/app/AppProfile.tsx`)
- Change "5% of your team's earnings" → "10% of your team's earnings"

### 12. AppInvite (`src/pages/app/AppInvite.tsx`)
- The value share percentage reads from `TOKENOMICS.REFERRAL_COMMISSION_RATE` — will auto-update
- No other changes needed

### 13. TranslationContext (`src/contexts/TranslationContext.tsx`)
- `appEarnWhenReferralsBuy`: "9%" → "10%" in all 10 languages
- `affiliateCommissionDirect`: "9%" → "10%" in all 10 languages
- **Remove** `affiliateCommissionTier2` and `affiliateCommissionTier3` keys
- Update any "multi-level" references to "flat 10%"
- Update `multiLevelCommission` key text to reflect single-level

### 14. Deploy edge functions
- Deploy `helio-webhook` and `chat-support` after changes

## Files Changed (~12 files)

| File | Change |
|------|--------|
| DB migration | Update `process_referral_commission` to 0.10 |
| `src/utils/tokenomics.ts` | 0.05 → 0.10 |
| `src/utils/appCopy.ts` | Update referral description |
| `supabase/functions/helio-webhook/index.ts` | 0.09→0.10, remove L2/L3 |
| `supabase/functions/chat-support/index.ts` | Update knowledge text |
| `src/components/ConversionRewardsSection.tsx` | Flatten to single tier |
| `src/components/ReferEarn.tsx` | Remove L2/L3 cascade |
| `src/components/ReferEarnModal.tsx` | Update commission text |
| `src/components/ShareModal.tsx` | Update commission text |
| `src/pages/app/AppProfile.tsx` | 5% → 10% |
| `src/contexts/TranslationContext.tsx` | Update 9%→10%, remove tier 2/3 keys |

