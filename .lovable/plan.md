

# Plan: Enforce Minimum App Version on All Reward Paths

## Current State

Version gating exists in 3 places:
- **sync-contribution-data** edge function — skips points for old versions ✓
- **SpeedTest.tsx** — client-side check before awarding ✓
- **AppHome.tsx** — shows warning banner ✓

**Unprotected reward paths:**
- `claim_challenge_reward` RPC (challenges page)
- `DailyCheckIn` component (daily check-in points)
- `add_referral_points` RPC (referral commissions)
- `add_points_with_cap` RPC (all contribution/mining points)

## What We'll Do

### 1. Add `p_app_version` parameter to both core RPCs

Add an optional `p_app_version TEXT DEFAULT NULL` parameter to:
- `add_points_with_cap` (4-param version)
- `add_referral_points`
- `claim_challenge_reward`

Each RPC will check `min_app_version` from `app_remote_config`. If `p_app_version` is provided and below minimum, return `{ success: false, reason: 'upgrade_required' }`. If NULL (server-side calls like referral commission trigger), skip the check — the trigger doesn't have a version to pass.

**Database migration** — 3 function replacements.

### 2. Pass `getAppVersion()` from all client-side reward callers

Update these files to send version:
- **`src/components/app/DailyCheckIn.tsx`** — pass `p_app_version` to `add_points_with_cap`
- **`src/pages/app/AppChallenges.tsx`** — pass `p_app_version` to `claim_challenge_reward`
- **`src/components/app/SpeedTest.tsx`** — pass `p_app_version` to `add_referral_points` (replaces client-only check)

### 3. Create a shared version-check hook

New file: **`src/hooks/useVersionGate.ts`**
- Fetches `min_app_version` once from `app_remote_config`, caches it
- Exposes `{ isOutdated, minVersion }` 
- Used by AppHome (replaces inline logic), SpeedTest, DailyCheckIn, AppChallenges

### 4. Full-screen force-update overlay for outdated versions

New file: **`src/components/app/ForceUpdateScreen.tsx`**
- Shown in `AppLayout.tsx` when `useVersionGate().isOutdated` is true
- Blocks all interaction — "Update required to continue earning rewards"
- Links to Play Store / App Store
- Still allows the app to open (data still contributes) but no reward UI accessible

## Security Notes

- Backend is the real gate — even if someone bypasses the client overlay, RPCs reject old versions
- Server-side trigger calls (referral commission) pass NULL version and are allowed (they're triggered by already-validated point awards)
- The `app_remote_config` lookup is cached per-RPC call (single query, not per-row)

## Files Changed

| File | Change |
|---|---|
| Migration SQL | Update 3 RPCs with version gate |
| `src/hooks/useVersionGate.ts` | New shared hook |
| `src/components/app/ForceUpdateScreen.tsx` | New blocking overlay |
| `src/components/app/AppLayout.tsx` | Mount ForceUpdateScreen |
| `src/components/app/DailyCheckIn.tsx` | Pass app_version to RPC |
| `src/pages/app/AppChallenges.tsx` | Pass app_version to RPC |
| `src/components/app/SpeedTest.tsx` | Pass app_version to RPC, remove client-only check |
| `src/pages/app/AppHome.tsx` | Use useVersionGate hook instead of inline logic |

