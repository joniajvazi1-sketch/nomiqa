

# Enforce Minimum App Version for Points Earning

## Problem
Old APKs you distributed still work and earn points. There's no version gate — the `sync-contribution-data` and speed test flows award points regardless of which app version is calling them.

## Approach
Add a **minimum version check** at the server level (edge functions) so old APKs get rejected from earning points. Data can still be saved (it's still useful), but **no points are awarded** for outdated versions.

Additionally, fix the hardcoded `app_version: '1.0.0'` in the contribution hook so it sends the real version.

## Changes

### 1. Add `min_app_version` to remote config
Insert a new row into `app_remote_config` with key `min_app_version` and value `"1.0.2"`. This way you can bump the minimum version from the database without redeploying code.

### 2. Fix client to send real app version
**`src/hooks/useNetworkContribution.ts`** — Replace the hardcoded `app_version: '1.0.0'` with the actual version from `getAppVersion()` (already exported from `src/lib/sentry.ts`).

### 3. Gate points in `sync-contribution-data` edge function
**`supabase/functions/sync-contribution-data/index.ts`** — Before calling `add_points_with_cap`:
- Read the `app_version` from the submitted signal log data
- Fetch `min_app_version` from `app_remote_config`
- If app version is missing or below minimum, skip points award but **still save the signal data** (it has B2B value)
- Return a flag `version_outdated: true` in the response so the app can show an update prompt

### 4. Gate points in speed test save
**`src/components/app/SpeedTest.tsx`** — Add the app version to the `speed_test_results` insert. The server-side `add_points_with_cap` RPC doesn't have version info, so add a lightweight client-side check: fetch `min_app_version` from `app_remote_config` on mount, and if outdated, skip the points RPC call (still save the test result). Show a toast telling the user to update.

### 5. Show update prompt for old versions
**`src/pages/app/AppHome.tsx`** — On mount, check `min_app_version` from remote config against `getAppVersion()`. If outdated, show a persistent banner: "Please update your app to keep earning points."

## Version comparison logic
Simple semver compare: split on `.`, compare major/minor/patch numerically. This is a ~10 line utility function.

## Files Changed (4)

| File | Change |
|------|--------|
| `src/hooks/useNetworkContribution.ts` | Send real `getAppVersion()` instead of hardcoded `'1.0.0'` |
| `supabase/functions/sync-contribution-data/index.ts` | Check `min_app_version` config before awarding points |
| `src/components/app/SpeedTest.tsx` | Check version before awarding speed test points |
| `src/pages/app/AppHome.tsx` | Show "update required" banner if version is below minimum |

Plus one database insert: `min_app_version = '1.0.2'` in `app_remote_config`.

## How to bump in the future
Just update the `min_app_version` value in the database — no code deploy needed. Old APKs will immediately stop earning points.

