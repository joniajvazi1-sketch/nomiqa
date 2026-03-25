

## Problem Analysis

Two issues reported by testers:

### Issue 1: Points don't update immediately on home screen after collecting rewards

**Root cause:** The `points-updated` event system has a timing gap. When users claim rewards on other screens (Challenges, Social Tasks, Daily Check-in) and navigate back to AppHome, the optimistic update fires but AppHome may not be mounted yet to receive it. The `loadData()` call only triggers on `visibilitychange`/`focus`, which doesn't fire during same-tab navigation.

Specifically:
- `SocialTasks` dispatches `points-updated` but lives on a separate page (`/social-rewards`) — by the time the user navigates back to AppHome, the event was already fired and missed
- Challenge claims on `/app/challenges` dispatch the event, but AppHome unmounts when navigating away, so the listener isn't active
- The `loadData()` in AppHome only re-runs on mount, visibility change, or focus — not on route navigation back

### Issue 2: Items 7 and 8 from audit

Without the exact audit list in context, these likely refer to **store listing assets** and **data safety form** — Play Console configuration items that can't be fixed in code. But if they refer to in-app issues, the points sync problem above is the most commonly reported "broken" behavior.

---

## Plan

### Fix: Ensure points refresh on every AppHome mount/navigation

**File: `src/pages/app/AppHome.tsx`**

1. **Add route-based refresh** — Call `loadData()` not just on initial mount but also when the component re-mounts after navigation. Currently `loadData` runs in a `useEffect` with `[loadData]` dependency, but React may skip re-running if the callback reference is stable. Add a `useLocation()` key or explicit trigger.

2. **Persist pending point updates via sessionStorage** — When `points-updated` fires, also write the delta to `sessionStorage`. On AppHome mount, check for pending updates and apply them before the full data load completes. This bridges the gap when the event fires while AppHome is unmounted.

3. **Add immediate `loadData()` call on component mount** — Ensure the `useEffect` that calls `loadData()` always runs fresh data fetch, not relying on stale cache.

**File: `src/components/SocialTasks.tsx`**
- Already dispatches `points-updated` correctly. No changes needed.

**File: `src/pages/app/AppChallenges.tsx`**  
- Already dispatches `points-updated` with `newTotal`. No changes needed.

### Technical approach

```text
Before (broken flow):
  User on AppHome → navigates to Challenges → claims reward → 
  event fires (AppHome unmounted, misses it) → navigates back → 
  AppHome mounts → shows stale points until loadData() completes

After (fixed flow):
  User on AppHome → navigates to Challenges → claims reward → 
  event fires + writes to sessionStorage → navigates back → 
  AppHome mounts → reads sessionStorage for instant update + 
  loadData() confirms from server
```

### Changes

1. **`src/pages/app/AppHome.tsx`** (~15 lines changed)
   - On mount, check `sessionStorage` for a `pendingPointsUpdate` key and apply it to state immediately
   - Add a global `points-updated` listener that writes to `sessionStorage` (so it persists even if AppHome is unmounted)
   - Register the sessionStorage writer in `App.tsx` or a top-level provider so it's always active

2. **`src/components/app/PointsSyncBridge.tsx`** (new, ~20 lines)
   - A lightweight component mounted at the app layout level that always listens for `points-updated` events and persists them to `sessionStorage`
   - AppHome reads from this on mount for instant display

3. **`src/components/app/AppLayout.tsx`**
   - Mount `PointsSyncBridge` so it's always active regardless of which screen is shown

