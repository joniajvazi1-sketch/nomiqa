

# Full Audit Report — Ship / Don't Ship

## 🚨 ANSWER TO THE CRITICAL QUESTION

**"Is there ANY direct database write to user_points anywhere left in the codebase?"**

**YES. Do not ship yet.** Here are ALL direct writes:

### Client-side (TypeScript)

| File | Line | Type | Risk |
|------|------|------|------|
| `src/hooks/useNetworkContribution.ts` | 1388-1410 | `.update()` distance/time fields only | ⚠️ LOW — no points modified, only `total_distance_meters` and `total_contribution_time_seconds` |
| `src/pages/app/AppProfile.tsx` | 160-162 | `.insert()` with `total_points: 0` | ✅ SAFE — creates empty row, no points |
| `supabase/functions/sync-contribution-data/index.ts` | 1131-1148 | `.update()` / `.insert()` with `pending_points` | 🚨 **BUG** — fallback path bypasses caps entirely. If `add_points_with_cap` RPC fails, raw points are written to `pending_points` uncapped |
| `supabase/functions/sync-contribution-data/index.ts` | 729 | `.update()` to freeze user | ✅ SAFE — sets `is_frozen: true`, no points |

### Server-side (SQL functions)

| Function | Write type | Risk |
|----------|-----------|------|
| `claim_challenge_reward` | Direct `INSERT ON CONFLICT ... total_points + reward` | 🚨 **NO CAP** — challenge rewards bypass daily/monthly/lifetime caps entirely |
| `process_referral_commission` (trigger) | Direct `INSERT ON CONFLICT ... total_points + commission` | 🚨 **NO CAP** — referral commissions bypass all caps |
| `check_and_award_pending_referral_bonus` | Direct `UPDATE total_points + bonus` | 🚨 **NO CAP** — pending referral bonuses bypass all caps |
| `add_points_with_cap` | Cap-enforced write | ✅ CORRECT |
| `add_referral_points` | Lifetime-only cap | ⚠️ By design |

### Remaining `window.location.origin` issues (referral links)

| File | Line | Status |
|------|------|--------|
| `src/components/ShareModal.tsx` | 95 | ✅ FIXED — uses `https://nomiqa-depin.com` |
| `src/components/ReferEarnModal.tsx` | 70 | 🚨 **NOT FIXED** — still uses `window.location.origin` |
| `src/pages/Affiliate.tsx` | 131, 134, 162, 165, 197, 265, 266 | 🚨 **NOT FIXED** — 7 occurrences of `window.location.origin` |
| `src/pages/Auth.tsx` | 366 | ⚠️ Acceptable — OAuth redirect, not affiliate link |

---

## Required Fixes Before Shipping

### Fix 1: `ReferEarnModal.tsx` — Canonical domain for referral links
Replace `window.location.origin` with `https://nomiqa-depin.com` on line 70.

### Fix 2: `Affiliate.tsx` — Canonical domain for all affiliate links
Replace all 7 `window.location.origin` occurrences with `https://nomiqa-depin.com` (lines 131, 134, 162, 165, 197, 265, 266).

### Fix 3: `sync-contribution-data/index.ts` — Remove fallback direct write
The fallback on lines 1123-1148 writes `pending_points` directly when `add_points_with_cap` fails. This bypasses all caps. Change to: log the error and skip awarding (or retry), rather than raw-writing points.

### Fix 4 (Recommended but by-design): `claim_challenge_reward` SQL
Currently writes points directly without any cap check. If you want ALL paths gated, this RPC should call `add_points_with_cap` internally instead of raw incrementing `total_points`. Same for `process_referral_commission` trigger and `check_and_award_pending_referral_bonus`.

---

## Items That ARE Ship-Safe (Confirmed ✅)

| # | Item | Status |
|---|------|--------|
| 1 | **Auth** — Google OAuth uses canonical domain, session persistence correct, no competing flows | ✅ |
| 2 | **DailyCheckIn** — Now uses `add_points_with_cap` RPC | ✅ |
| 3 | **ShareModal** — Uses canonical domain | ✅ |
| 4 | **ChallengeCard** — No duplicate event dispatch | ✅ |
| 5 | **useChallenges** — Optimistic update with `new_total` | ✅ |
| 6 | **Data collection** — No IMEI/MAC/contacts/SMS/clipboard/camera. Location rounded. Fingerprint hashed | ✅ |
| 7 | **Retention crons** — signal_logs (90d, 5AM UTC), mining_logs (90d, 4AM UTC), order PII (120d, 2AM UTC), coverage refresh (15min) | ✅ |
| 8 | **RLS** — All sensitive tables locked. Anonymous access denied. Service role not in client | ✅ |
| 9 | **Routing** — Native → `/app`, Web → `/`, `?appPreview` blocked on production | ✅ |
| 10 | **Account deletion** — `request_data_deletion` + `delete-user` edge function wipe all data | ✅ |
| 11 | **Frozen users** — `add_points_with_cap` checks `is_frozen` and rejects | ✅ |
| 12 | **Self-referral** — Blocked in `process_referral_commission` trigger | ✅ |
| 13 | **Referral velocity** — `check_referral_eligibility` enforces 10/24h limit | ✅ |
| 14 | **Idempotent challenge claims** — `claim_challenge_reward` checks `claimed_at IS NOT NULL` | ✅ |
| 15 | **useNativeGoogleAuth.ts** — Deleted (orphaned) | ✅ |

---

## Implementation Plan

### Step 1: Fix `ReferEarnModal.tsx` canonical domain
Replace `${window.location.origin}` with `https://nomiqa-depin.com` on line 70.

### Step 2: Fix `Affiliate.tsx` canonical domain (7 locations)
Replace all `${window.location.origin}` with `https://nomiqa-depin.com` on lines 131, 134, 162, 165, 197, 265, 266.

### Step 3: Remove unsafe fallback in `sync-contribution-data`
In lines 1122-1148, instead of writing `pending_points` directly, log the error and return without awarding points. The data is not lost — the session is already saved. Points can be reconciled later.

### Step 4 (Optional, recommended): Gate `claim_challenge_reward` through caps
Modify the SQL function to use `add_points_with_cap` internally instead of raw `total_points` increment. This prevents challenge reward spam from exceeding caps.

