

# Fix: Points not updating instantly when stopping contribution (all screens)

## Root Causes Found

### 1. `handleStopContribution` doesn't await and sends empty event
In `AppHome.tsx` line 364-372:
```js
const handleStopContribution = useCallback(() => {
    stopContribution(); // NOT awaited — DB writes may not finish
    setTimeout(() => window.dispatchEvent(new CustomEvent('points-updated', { detail: {} })), 500);
    // ↑ Empty detail = no optimistic update, AND loadData() may fetch stale data
}, ...);
```
The `stopContribution()` is async (does multiple DB writes including `add_points_with_cap`) but is NOT awaited. The 500ms timeout fires before the writes complete, so `loadData()` fetches stale data.

### 2. Rewards and Profile screens don't listen for `points-updated`
- `AppRewards.tsx` only refreshes on `visibilitychange`/`focus`
- `AppProfile.tsx` only refreshes on mount
- Neither listens to the `points-updated` custom event, so navigating there shows stale totals

## Fix

### File 1: `src/pages/app/AppHome.tsx`
- Change `handleStopContribution` to:
  1. Capture `stats.pointsEarned` before calling stop
  2. `await stopContribution()` so DB writes complete
  3. Dispatch `points-updated` with `{ pointsAdded: earnedThisSession }` for optimistic update
  4. Remove the arbitrary 500ms `setTimeout`

### File 2: `src/pages/app/AppRewards.tsx`
- Add a `points-updated` event listener that calls `loadRewardsData()` (same pattern as the existing `visibilitychange` listener)

### File 3: `src/pages/app/AppProfile.tsx`
- Add a `points-updated` event listener that calls `loadData()` to refresh the profile's point display

## Expected Result
When the user stops a contribution session:
1. Home screen cards update instantly (optimistic update with earned points)
2. Background `loadData()` confirms the exact server total
3. Navigating to Rewards or Profile shows the correct totals immediately because they also listen for the event

