

# Fix Plan: 3 Issues

## Issue 1: Bottom Tab Bar visible on login screen

**Root cause:** In `App.tsx` line 193-218, `NativeAppRoutes` wraps ALL routes (including `/app/auth`) inside `<AppLayout>`, which always renders `<BottomTabBar>`. The auth screen should not show the tab bar.

**Fix:** In `AppLayout.tsx`, check if the current route is `/app/auth` or `/app/oauth-redirect` and conditionally hide the `<BottomTabBar>`. Also remove the bottom padding from the main content area on auth routes.

---

## Issue 2: Check-in points don't update the card immediately

**Root cause:** `DailyCheckIn.tsx` dispatches `window.dispatchEvent(new CustomEvent('points-updated'))` without a `detail.newTotal` value. The `AppHome` listener checks `detail?.newTotal` for optimistic updates — since it's undefined, it skips the instant update. `loadData()` does run, but the check-in modal closes before the async refetch completes, so the user doesn't see the change.

Also, the `daily_checkins` table has **no UPDATE RLS policy**, but the code uses `.upsert()`. Upsert requires UPDATE permission when a conflict exists. This means if a user somehow triggers it twice, the second attempt silently fails. Need to add an UPDATE policy.

**Fix:**
1. In `DailyCheckIn.tsx`, dispatch the event with `detail: { newTotal: result.new_total }` so AppHome can optimistically update the points card instantly.
2. Add an UPDATE RLS policy on `daily_checkins` for `auth.uid() = user_id` so upsert works correctly.

---

## Issue 3: Points accumulate too fast (200 cap hit in ~6h, not 24h)

**Root cause:** The current rates are:
- **Time:** 0.1 pts/min = 6 pts/hour
- **Distance:** 0.005 pts/meter = ~25 pts/hour at walking speed (5km/h)
- **Combined:** ~31 pts/hour → cap reached in ~6.5 hours

Per the spec, the 200-point daily cap should be spread across a full 24-hour period.

**Fix:** Reduce the distance rate from `0.005` to `0.002` pts/meter. This gives:
- Distance: ~10 pts/hour at walking speed
- Time: 6 pts/hour
- Combined: ~16 pts/hour → cap reached in ~12.5 hours of active use

This is more reasonable — a typical user contributing 8-12 hours a day will approach but not always hit the cap, and 24 hours of continuous use would earn ~384 pre-cap points (capped at 200). The time-only rate (stationary users on WiFi) would need ~33 hours to hit cap, ensuring truly passive users spread across full days.

**Files changed:** `src/hooks/useNetworkContribution.ts` — update `0.005` to `0.002` in the distance points calculation (line ~623).

---

## Summary

| Issue | File(s) | Change |
|-------|---------|--------|
| Tab bar on login | `src/components/app/AppLayout.tsx` | Hide BottomTabBar on auth routes |
| Points not updating | `src/components/app/DailyCheckIn.tsx` + DB migration | Pass `newTotal` in event; add UPDATE RLS policy |
| Earning too fast | `src/hooks/useNetworkContribution.ts` | Reduce distance rate from 0.005 to 0.002 pts/meter |

