

# Fix: Points Not Updating Instantly on Home Screen Cards

## Root Cause

The `handlePointsUpdated` listener in `AppHome.tsx` (line 301-308) has **two bugs**:

1. **Stale closure on `points`**: The `useEffect` dependency is `[loadData]` but the handler checks `if (detail?.newTotal != null && points)`. Since `points` is not in the dependency array, it captures the initial `null` value. When `DailyCheckIn` dispatches the event with `newTotal`, the condition `&& points` is `false` (stale null), so the optimistic update never fires.

2. **`todayEarnings` and `todayBreakdown` are never optimistically updated**: Even if the total points updated, the "Today" card and breakdown rows only update after `loadData()` completes (a full DB refetch with ~10 parallel queries). This takes 1-3 seconds on mobile networks, so users see stale numbers.

3. **Some dispatchers send plain `Event` instead of `CustomEvent`**: `SocialTasks.tsx` line 155 and the stop-contribution handler (line 357) use `new Event('points-updated')` with no `detail`, so the optimistic path is skipped entirely for those — it always falls through to the slow `loadData()`.

## Fix

### 1. Fix stale closure in `AppHome.tsx` (lines 290-319)
- Use a `ref` for `points` so the handler always sees the latest value
- Add `pointsAdded` to the CustomEvent detail alongside `newTotal`
- Optimistically increment `todayEarnings` by `pointsAdded` so the Today card updates instantly
- Keep the background `loadData()` call for eventual consistency

### 2. Fix SocialTasks.tsx dispatch (line 155)
- Change `new Event('points-updated')` → `new CustomEvent('points-updated', { detail: { newTotal: undefined, pointsAdded: POINTS_PER_FOLLOW } })`

### 3. Fix stop-contribution dispatch in AppHome.tsx (line 357)
- Change `new Event('points-updated')` → `new CustomEvent('points-updated', { detail: {} })`
- This one doesn't need optimistic update since `loadData()` is fine for post-stop refresh

### 4. Fix speed-test dispatch in AppHome.tsx (line 465)
- Same: change to `CustomEvent` with `pointsAdded` detail

## Files Changed (2)

| File | Change |
|------|--------|
| `src/pages/app/AppHome.tsx` | Use ref for points; optimistically update todayEarnings; fix Event→CustomEvent |
| `src/components/SocialTasks.tsx` | Fix Event→CustomEvent with pointsAdded detail |

## Expected Result
After claiming daily check-in, social tasks, or challenges, the total points card and today's earnings card update **instantly** (within the same render frame), then the background `loadData()` ensures full consistency.

