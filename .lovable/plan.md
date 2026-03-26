

## Plan: Fix Commission Rates to 10% and /my-account Routing

### Problem 1: Commission percentages are wrong

The affiliate page and backend still show the old tiered rates (5% network, 9% sales) instead of the agreed flat 10% for both.

**Locations to fix:**

| File | Current | Fix |
|------|---------|-----|
| `src/pages/Affiliate.tsx` line 373 | `5%` badge "From Network" | Change to `10%` |
| `src/pages/Affiliate.tsx` line 377 | `9%` badge "Sales Commission" | Replace both badges with a single `10%` "Referral Commission" badge (covers both points and sales) |
| `src/contexts/TranslationContext.tsx` line 1206 | "earn 5% of everything your network earns" | Update all 10 languages to say "earn 10% of everything your referrals earn" |
| `src/contexts/TranslationContext.tsx` lines 1208-1209 | `affiliateFromNetwork` / `affiliateSalesCommission` | Replace with single `affiliateReferralCommission` key: "Referral Commission" |
| `supabase/functions/shopify-order-webhook/index.ts` lines 224, 250 | `data.price_usd * 0.09` | Change to `data.price_usd * 0.10` |
| `src/components/ConversionRewardsSection.tsx` | Already shows 10% — no change needed | Confirmed correct |

The database trigger `process_referral_commission()` already uses `0.10` — confirmed correct.

### Problem 2: /my-account hits catch-all → shows referral page

The `NotFound` component detects single-segment paths like `my-account` as potential referral usernames. There is no `/my-account` route defined.

**Fix:** Add a redirect route `<Route path="/my-account" element={<Navigate to="/account" replace />} />` in the WebRoutes, plus inside each localized route group. This is placed before the catch-all `*` route, so it will match first.

### Files changed

1. **`src/App.tsx`** — Add `/my-account → /account` redirect in base routes and all 10 locale groups
2. **`src/pages/Affiliate.tsx`** — Merge 5% + 9% badges into single 10% badge
3. **`src/contexts/TranslationContext.tsx`** — Update `affiliateHeroDescription` and replace commission translation keys across all 10 languages
4. **`supabase/functions/shopify-order-webhook/index.ts`** — Change `0.09` to `0.10` (2 occurrences)

