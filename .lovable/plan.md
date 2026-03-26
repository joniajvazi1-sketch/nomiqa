

## Plan: Fix 4 Critical App Bugs

### 1. Contribution button rapid-tap multiplies points

**Root cause**: `handleToggleContribution` has no lock. Rapid tapping calls `handleStopContribution` multiple times concurrently, each capturing `stats.pointsEarned` and dispatching `points-updated` with that amount, plus each calling `stopContribution()` which does a final `add_points_with_cap` RPC.

**Fix**:
- Add a `useRef` lock (`isTogglingRef`) in `AppHome.tsx`
- Set it `true` at the start of `handleToggleContribution`, `false` when done
- Early-return if already toggling
- Also add `await` to `handleStopContribution()` call (currently fire-and-forget)

### 2. Challenges don't refresh (daily stuck, weekly static)

**Root cause**: `AppChallenges` queries `user_challenge_progress` with `eq('period_start', today)` for daily and `gte('period_start', weekStartStr)` for weekly. But the `sync-contribution-data` edge function that updates challenge progress may be writing rows with stale `period_start` values, or not creating new rows for new periods.

**Fix**:
- In `AppChallenges.loadChallenges()`, after loading progress, filter out stale daily progress where `period_start < today` (treat as no progress = fresh challenge)
- For weekly: ensure `weekStartStr` uses Monday (ISO week) not Sunday, and filter rows correctly
- The display logic already handles "no progress" as 0% — the issue is stale rows appearing as completed from yesterday

### 3. Speed test history in settings doesn't work — remove it

**Fix**: Remove the `<SpeedTestHistory>` block from `AppProfile.tsx` settings tab (lines 821-826). Speed test data is still collected during contributions and shown on the Network Stats page — this just removes the broken/unnecessary display from settings.

### 4. Account deletion doesn't purge user data

**Root cause**: `delete-user` edge function cleans 28+ tables but misses `orders_pii` and `esim_usage`. Orders are anonymized but the PII table retains email, name, ICCID, QR codes.

**Fix**: Add `safeDelete` calls for:
- `orders_pii` — delete rows where `id` matches the user's order IDs (since `orders_pii.id` references `orders.id`)
- `esim_usage` — delete rows where `order_id` matches user's order IDs
- Must run these BEFORE orders are anonymized (step 11), since we need `orders.user_id` to find the related rows

### Technical details

**Files changed**:
- `src/pages/app/AppHome.tsx` — add toggle lock
- `src/pages/app/AppChallenges.tsx` — fix period comparison logic
- `src/pages/app/AppProfile.tsx` — remove SpeedTestHistory section
- `supabase/functions/delete-user/index.ts` — add orders_pii + esim_usage deletion

