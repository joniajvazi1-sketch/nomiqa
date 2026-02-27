

# P0 Blocker Fix Plan — Submission Ready

## Issues Found + Fixes

### 1. Auth — Already Canonical-Domain Enforced (Minor Gap)

**Current state:** `AppAuth.tsx` lines 833-842 already force canonical domain `https://nomiqa-depin.com` for OAuth redirects. Native uses the Lovable broker at `nomiqa-depin.com/~oauth/initiate`. This is correct.

**Gap:** When a user starts OAuth from `nomiqa.lovable.app`, the redirect lands on `nomiqa-depin.com/app/auth` — but the user's browser session is on `nomiqa.lovable.app`. The Lovable SDK handles token exchange internally (not via cookies), so this actually works. However, `useNativeGoogleAuth.ts` is orphaned dead code that could confuse future devs.

**Fix:**
- Delete `src/hooks/useNativeGoogleAuth.ts` (orphaned, never imported).
- No auth code changes needed — the flow is already deterministic.

**Test matrix (verifiable in code):**
- iOS Safari on nomiqa-depin.com → canonical origin used ✅
- iOS Safari on nomiqa.lovable.app → forces canonical `nomiqa-depin.com` redirect ✅ (line 837-839)
- Native Capacitor → uses broker at `nomiqa-depin.com/~oauth/initiate` ✅ (line 816)

---

### 2. Points Caps — CRITICAL BUG: DailyCheckIn Bypasses All Caps

**Award path audit:**

| Path | Uses `add_points_with_cap`? | Status |
|------|---------------------------|--------|
| Network contribution (autosave) | Yes (useNetworkContribution.ts:845) | ✅ |
| Network contribution (final save) | Yes (useNetworkContribution.ts:1372) | ✅ |
| Speed test | Yes (SpeedTest.tsx:87) | ✅ |
| Challenge claim | Uses `claim_challenge_reward` RPC (atomic, no daily cap) | ⚠️ By design |
| Social follow | Uses `add_referral_points` RPC (bypasses daily/monthly, lifetime only) | ⚠️ By design |
| **Daily check-in** | **NO — writes directly to `user_points` table** | **🚨 BUG** |

**DailyCheckIn.tsx lines 97-110** does a raw `select` then `update` on `user_points`, bypassing all cap logic. This is a race-condition-prone, cap-bypassing direct write.

**Fix:** Replace the raw select+update in `DailyCheckIn.tsx` with `add_referral_points` RPC (same pattern as social tasks — bypasses daily/monthly but respects lifetime cap and frozen status). This is appropriate because check-in bonuses are reward-type points, not contribution-type.

---

### 3. Rewards/Challenges — Instant Update (No Delay Hack)

**Current state:** `claim_challenge_reward` RPC already returns `{ success, points_added, new_total, all_daily_done }`. But `useChallenges.ts` line 327-331 only checks `result.success` and ignores `new_total`. It then calls `fetchChallenges()` (a full refetch) and dispatches `points-updated` (which triggers `loadData()` in AppHome — another full refetch).

**Fix:** After claim succeeds in `useChallenges.ts`, use the `new_total` from the RPC response to optimistically update local state before the refetch completes. Dispatch `points-updated` with the new total as detail so AppHome can use it immediately without waiting for the DB round-trip.

Also in `ChallengeCard.tsx`, the `points-updated` event is dispatched redundantly (both ChallengeCard and useChallenges dispatch it). Remove the duplicate from `ChallengeCard.tsx` since `useChallenges.claimReward` already dispatches it.

---

### 4. Referral Links — ShareModal Uses Wrong Domain

**Current state:** `ShareModal.tsx` line ~79 uses `window.location.origin` for affiliate links. `AppHome.tsx` lines 259-272 correctly hardcodes `https://nomiqa-depin.com`.

**Fix:** In `ShareModal.tsx`, replace `window.location.origin` with `https://nomiqa-depin.com` for the affiliate link base URL.

---

### 5. Routing Clarity — Documentation

**Route map (already implemented correctly in code):**

```text
NATIVE (Capacitor / ?appPreview=true on localhost):
  / → redirects to /app
  /app → AppHome
  /app/map → NetworkContribution
  /app/shop → AppShop
  /app/profile → AppProfile
  /app/auth → AppAuth
  /app/oauth-redirect → OAuthRedirect (standalone, no layout)
  * → redirects to /app

WEB (browser on nomiqa-depin.com):
  / → Index (landing page)
  /shop → ShopPage
  /app/* → redirects to /mobile-only
  /r/:code → AffiliateRedirect
  /:username → AffiliateRedirect
  * → NotFound

DEV TOGGLES:
  ?appPreview=true → simulates native on localhost/*.lovableproject.com ONLY
  BLOCKED on production domains (usePlatform.ts lines 18-21)
```

No code changes needed.

---

### 6. Data Retention Proof

The cron jobs exist as `pg_cron` entries (confirmed via memories). The functions called are:
- `cleanup_old_mining_logs()` — deletes rows > 90 days
- Signal logs cleanup — same pattern
- `refresh_coverage_tiles()` — refreshes materialized view every 15 min

**Action:** Query `cron.job` to verify schedules are active. This requires a read query.

---

## Summary of Code Changes

| # | File | Change |
|---|------|--------|
| 1 | `src/components/app/DailyCheckIn.tsx` | Replace raw user_points update with `add_referral_points` RPC |
| 2 | `src/components/ShareModal.tsx` | Hardcode `https://nomiqa-depin.com` as affiliate link base |
| 3 | `src/components/app/ChallengeCard.tsx` | Remove duplicate `points-updated` dispatch (useChallenges already does it) |
| 4 | `src/hooks/useChallenges.ts` | Use `new_total` from RPC response for optimistic update; dispatch with detail |
| 5 | `src/pages/app/AppHome.tsx` | Listen for `points-updated` CustomEvent with `detail.newTotal` for instant display |
| 6 | `src/hooks/useNativeGoogleAuth.ts` | Delete orphaned file |

## Build Commands (unchanged)
```
CAPACITOR=true npm run build
npx cap sync ios
npx cap sync android
```

