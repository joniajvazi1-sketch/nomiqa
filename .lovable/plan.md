

# Critical Bug Fix Plan: Beta Tester Report

This plan addresses the most impactful bugs reported by beta testers across 3+ Android devices. I've verified each issue by reading the code, querying the database, and testing the backend function directly.

---

## Bug 1: Account Creation Broken (CRITICAL)

**Root Cause:** The `signup-user` edge function calls `listUsers({ page: 1, perPage: 1000 })` to check if an email already exists. With **13,782 users** in the database, this only checks the first 1,000 -- missing 92% of users. More importantly, this call is extremely slow with 13K+ users, causing the function to **timeout** before responding. Users see "Creating account..." loading forever.

**Evidence:** Zero edge function logs for `signup-user` in recent days. The last signup attempt via the function was Feb 5. Every single new user in the last week signed up via Google OAuth only. When I called the function directly from the server, it worked -- confirming the function code is fine but the `listUsers` bottleneck causes timeouts on real devices.

**Fix:**
- Remove the `listUsers` call entirely (lines 276-291 in `signup-user/index.ts`)
- Replace with a targeted email lookup: query the `profiles` table by email (already done on line 295) and rely on the `createUser` error handler for the auth duplicate check (already on line 318)
- This eliminates the slow full-user-list scan and makes signup near-instant

---

## Bug 2: Leaderboard Shows Only Your Own Account (CRITICAL)

**Root Cause:** The `user_points` table has an RLS policy: `Users can view own points` with condition `auth.uid() = user_id`. The leaderboard hook queries `user_points` directly, so each user can **only see themselves**. The `leaderboard_cache` table has the correct policy (top 100 visible), but the code queries the wrong table.

**Evidence:** Confirmed via RLS policy query. The `leaderboard_cache` policy correctly allows: `rank_all_time <= 100 OR rank_weekly <= 100 OR rank_monthly <= 100 OR user_id = auth.uid()`.

**Fix:**
- Add a new RLS SELECT policy on `user_points` that allows authenticated users to read the `user_id` and `total_points` columns of any row (needed for ranking)
- OR (more secure): Create a `SECURITY DEFINER` database function `get_leaderboard_data()` that returns the top 100 users with their points and usernames, bypassing RLS safely
- Update `useLeaderboard.ts` to use this function instead of direct table queries

---

## Bug 3: Streak Always Shows Zero

**Root Cause:** The streak (`background_streak_days`) is only updated inside `add_points_with_cap()` when the source is `contribution` or `background`. Looking at the database, only 4 out of the top 20 users have any streak data. The `last_background_date` is `null` for 80% of active users. This means points are being added but the streak-tracking code path isn't being triggered consistently (likely because the auto-save uses a different source label or the streak update runs before the day boundary).

**Fix:**
- Audit the auto-save and contribution sync paths to ensure they pass `source = 'contribution'` consistently
- Add streak initialization for users who have been active but have null streak data
- The `add_points_with_cap` function's streak logic at lines comparing `last_background_date` with `CURRENT_DATE` should also handle the case where `last_background_date = CURRENT_DATE` (same day activity shouldn't reset the streak)

---

## Bug 4: Challenges Tab Cannot Scroll (Weekly Tasks Hidden)

**Root Cause:** The `SwipeablePages` wrapper intercepts horizontal touch gestures for tab navigation. On some Android devices, diagonal finger movements are misinterpreted as horizontal swipes rather than vertical scrolls, blocking the scroll. The Challenges page is rendered inside `AppLayout > SwipeablePages`, and the direction-lock threshold (`Math.abs(diffY) > 12 && Math.abs(diffY) > Math.abs(diffX) * 1.5`) is too strict for Android touch behavior.

**Fix:**
- Add `/app/challenges` to the `SWIPE_DISABLED_ROUTES` array in `SwipeablePages.tsx` (line 13), since the Challenges page is a detail page (not a main tab) and doesn't need swipe navigation
- This immediately fixes scrolling for Challenges, Leaderboard, and similar sub-pages

---

## Bug 5: Google Login Redirects to Waitlist Website (Native)

**Root Cause:** The OAuthRedirect page triggers a deep link (`com.nomiqa.app://oauth-callback#tokens`) to return to the native app. If the deep link fails (common on Android with certain intent filter configurations), the user stays on the web page. Since `nomiqa-depin.com` is a waitlist/marketing site, users see the waitlist instead of being redirected back to the app.

**Current State:** The OAuth redirect page already shows a "Open Nomiqa App" button as fallback. The issue is the auto-trigger deep link may silently fail on some Android devices.

**Fix:**
- Add a short delay (1-2 seconds) before showing the native prompt fallback to give the deep link time to process
- Make the "Open Nomiqa App" button more prominent with clearer instructions
- Consider using Android App Links (verified deep links) instead of custom scheme for more reliable behavior

---

## Implementation Priority

| Priority | Bug | Impact | Effort |
|----------|-----|--------|--------|
| P0 | #1 Signup broken | Blocks all new email signups | Low - remove ~15 lines |
| P0 | #2 Leaderboard empty | Core engagement feature broken | Medium - new DB function + hook update |
| P1 | #3 Streak zero | Demotivates active users | Medium - audit source labels |
| P1 | #4 Challenges scroll | Hides weekly tasks entirely | Low - add one route to disabled list |
| P2 | #5 Google login redirect | Affects some Android devices | Low - improve fallback UX |

---

## Technical Details

### Bug 1 - Signup Fix (signup-user/index.ts)

Remove lines 276-291 (the entire `listUsers` block). The existing flow already handles duplicates:
1. Line 295-306: Profile table check catches most cases
2. Line 309-325: `createUser` returns "already been registered" error which is properly caught

### Bug 2 - Leaderboard Fix

Create a new database function:
```sql
CREATE OR REPLACE FUNCTION get_leaderboard_top(p_limit integer DEFAULT 100)
RETURNS TABLE(user_id uuid, username text, total_points numeric, total_distance_meters numeric)
LANGUAGE plpgsql SECURITY DEFINER
```

This function joins `user_points` with `profiles` and returns the top N users, bypassing the restrictive RLS on `user_points`.

### Bug 4 - Challenges Scroll Fix (SwipeablePages.tsx)

Change line 13:
```typescript
const SWIPE_DISABLED_ROUTES = ['/app/map', '/app/network', '/app/challenges', '/app/leaderboard', '/app/achievements'];
```

