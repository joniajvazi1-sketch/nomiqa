

# Fix Plan: Remaining Critical Issues

## Status of Previous Fixes

After inspecting every file, here is the real status:

| Issue | Status | Notes |
|-------|--------|-------|
| Account creation timeout | FIXED | `signal: controller.signal` is correctly passed (line 582) |
| Speed test HEAD to GET | FIXED | Both `areStaticFilesAvailable()` and `measureLatency()` use GET |
| Globe IntersectionObserver | FIXED | `frameloop={isVisible ? 'always' : 'never'}` (line 938) |
| Map coverage fetch | FIXED | Direct fetch with query params (lines 76-85) |
| Theme toggle colors | PARTIALLY FIXED | AppHome was updated but globe stats still use hardcoded `text-white/60`, `bg-white/5` |
| Daily streak | FIXED | Database migration moved streak logic before cap check |
| signup-user deployment | FIXED | Logs show it boots and responds in under 2s |

## Remaining Bugs (3 issues)

### 1. Leaderboard Only Shows Current User (ROOT CAUSE FOUND)

The `useLeaderboard` hook calls `get_leaderboard_top` RPC (SECURITY DEFINER) which correctly returns all top 100 users. But then it makes 3 additional queries to `contribution_sessions` to get daily/weekly/monthly points:

```text
supabase.from('contribution_sessions').select(...).in('user_id', userIds)
```

The `contribution_sessions` table has RLS: **"Users can view own contribution sessions"** with `auth.uid() = user_id`. So this query silently returns ONLY the current user's sessions. All other users get 0 for daily/weekly/monthly points.

When sorted by weekly points (the default), only the current user has any points, so they appear alone at the top.

**Fix:** Replace the 3 client-side `contribution_sessions` queries with a single SECURITY DEFINER RPC function that calculates daily/weekly/monthly points server-side, or use the existing `user_daily_limits` and `user_monthly_limits` tables (which also have restrictive RLS but can be accessed via a new RPC).

### 2. Challenges Page Scroll Works But Map Swipe Steals Focus

The Challenges page scroll container is correctly configured with `overflow: auto`, `paddingBottom: 140px`, and `touchAction: pan-y`. The real issue is the 3D globe's OrbitControls intercepting touch events. When a user swipes on the globe (on the Home tab), it can trigger the SwipeablePages horizontal navigation.

**Fix:** Already partially addressed by excluding non-tab routes from SwipeablePages. Verify that touch events on the Canvas element are properly stopped from bubbling.

### 3. Google OAuth on Native Redirects to Waitlist

The native OAuth redirect goes to `nomiqa-depin.com/app/oauth-redirect`. Since the published site is the full SPA, this route SHOULD be served. However, the `/app/oauth-redirect` route may not be handling deep links correctly after redirect. This is an infrastructure/deployment configuration issue.

**Fix:** Ensure the OAuthRedirect component correctly extracts tokens from the URL hash and fires the deep link to `com.nomiqa.app://`. The code in `OAuthRedirect.tsx` already handles this -- the issue may be that the published domain's server-side routing (Netlify `_redirects`) is not catching `/app/*` routes.

## Implementation Details

### Fix 1: Leaderboard -- New RPC Function + Hook Update

**Database migration:** Create a `get_leaderboard_with_periods` SECURITY DEFINER function that returns top users with their daily, weekly, and monthly points calculated from `user_daily_limits` and `user_monthly_limits` tables.

**File:** `src/hooks/useLeaderboard.ts`
- Remove the 3 separate `contribution_sessions` queries (lines 81-117)
- Replace with a single RPC call to the new function
- This also fixes a performance issue (4 separate queries reduced to 1)

### Fix 2: Verify Challenges Scroll

**File:** `src/pages/app/AppChallenges.tsx`
- Already has correct scroll configuration (lines 127-138)
- Verify `paddingBottom: 140px` is sufficient to clear bottom tab bar
- No code change needed -- this was fixed in a previous round

### Fix 3: Netlify Redirects for OAuth

**File:** `public/_redirects`
- Ensure `/*  /index.html  200` catch-all rule exists so `/app/oauth-redirect` is served by the SPA

## Files to Modify

| File | Change |
|-------|--------|
| Database migration | New `get_leaderboard_with_periods()` RPC function |
| `src/hooks/useLeaderboard.ts` | Replace 3 contribution_sessions queries with single RPC call |
| `public/_redirects` | Verify SPA catch-all rule for OAuth redirect |

## What Does NOT Need Fixing

- Account creation: Working (signal passed, function deployed)
- Speed test: Working (all HEAD changed to GET)
- Globe performance: Working (IntersectionObserver pauses render)
- Map coverage: Working (direct fetch with query params)
- Daily streak: Working (DB function updated)
- Notification bar / background persistence: Requires native rebuild only
