

# QA Bug Fix Plan — 5 Failing Tasks

## Bug 1: Account Deletion Fails (Task 9)
**Root cause:** `AppProfile.tsx` line 418 calls `supabase.functions.invoke('delete-user')` without passing `{ body: { self_delete: true } }`. The edge function receives no body, so `self_delete` is undefined and it falls through to the admin-deletion branch, which requires an `email` field — causing a 400 error.

**Fix:** Change the invoke call to pass `{ body: { self_delete: true } }`.

## Bug 2: Daily Check-In Points Not Added (Task 4)
**Root cause:** The `daily_checkins` table has an INSERT RLS policy with `WITH CHECK (auth.uid() = user_id)`, which is correct. The `DailyCheckIn.tsx` code also looks correct — it inserts into `daily_checkins` and calls `add_points_with_cap`. The last successful check-in in the DB was Feb 10. Since the code logic appears correct, the most likely issue is a **silent RPC error** from `add_points_with_cap` that isn't surfaced to the user — specifically the toast only shows on success, but if the insert to `daily_checkins` fails (e.g., duplicate key for today), the error is thrown but the catch block just shows a generic "Failed to check in" without details. Need to check if there's a unique constraint conflict. Looking at the migration: there's no UNIQUE constraint on `(user_id, check_in_date)` — only an index. So a duplicate insert would succeed, creating double entries. The `.maybeSingle()` call on the today check would also fail if duplicates exist. **Fix:** Add a unique constraint on `(user_id, check_in_date)` and use `upsert` or handle the conflict. Also add better error logging.

Actually, re-reading the code more carefully: the insert uses `.insert()` without `.select()`, so if there's no unique constraint, it just inserts. The real issue might be timing — `checkTodayStatus` runs on mount, but if the date string comparison fails (timezone issue), it could try to insert when one already exists. Let me check — the code uses `new Date().toISOString().split('T')[0]` which gives UTC date. If the user is in a timezone ahead of UTC, they might see "today" as a different date than what's stored.

The more likely actual bug: the `add_points_with_cap` RPC is called, but looking at the code flow — after insert succeeds, it calls `add_points_with_cap`. If the user's daily cap is already reached, it returns `success: false` with `reason: daily_cap_reached` and shows a toast.info. But the toast.success with "+X points earned!" still fires regardless because it's outside the cap check. Wait no — looking again at lines 90-107: the success toast and `setHasCheckedInToday(true)` happen AFTER the RPC call, unconditionally. The points might be capped but the check-in is recorded.

The user report says "Points not added when check-in was tapped." This could mean: (a) the insert itself fails, or (b) the points RPC returns 0. Since there's no unique constraint, (a) is unlikely. For (b), if the user already hit their daily 200-point cap, the check-in would record but award 0 points.

**Most likely root cause:** The daily earning cap (200 points) was already reached when they tried the check-in. The code shows a generic success toast `+${bonusPoints} points` even when the RPC caps it to 0. 

**Fix:** Check the actual `points_added` from the RPC result (not the expected `bonusPoints`) and show accurate feedback. Also add the unique constraint to prevent double check-ins.

## Bug 3: Phone State Permission Not Requested (Task 3)
**Root cause:** `PhoneStateRationale.tsx` exists as a component but is **never imported** anywhere in the app. The permission flow in `useNetworkContribution.ts` only handles location (foreground → background) but never triggers the phone state permission request. The `TelephonyInfoPlugin.requestPermissions()` is never called during the contribution start flow.

**Fix:** After background location is granted in `startContribution()`, add a step that shows the `PhoneStateRationale` dialog and then calls `TelephonyInfoPlugin.requestPermissions()`. This requires the hook to expose a callback/state for the parent component to render the rationale, or integrate it directly into the permission flow.

## Bug 4: Speed Test Results Not Saved/Shown (Task 7)
**Root cause:** The DB query returns 0 rows for `speed_test_results`. The `SpeedTest.tsx` insert code looks correct. The INSERT RLS policy exists. The issue is likely that the **RLS policy's WITH CHECK clause** might be blocking the insert silently. Let me check — the policy is `Users can insert own speed test results` for INSERT. Need to verify the WITH CHECK clause. The query showed `qual: <nil>` for the INSERT policy, meaning there's no explicit WITH CHECK. In Supabase, an INSERT policy without WITH CHECK uses the USING clause, but since there's no USING shown either, it might be a permissive policy that allows all authenticated inserts.

Actually, `qual: <nil>` for INSERT means the policy might not have a proper WITH CHECK. This would mean the policy allows inserts from any authenticated user without restriction. So the insert should work.

The user said "Results visible in the pop-up notification but not shown in the app." This means the speed test ran and showed a toast, but `SpeedTestHistory` shows nothing. Since the DB is empty, the insert is failing silently (the code has `if (insertError) { console.error(...); return; }` — it returns without throwing, so the points awarding and toast still don't fire). But the user said results ARE visible in the pop-up... so maybe the toast is from the test completing (line 152 `triggerSuccess()`), not from the save.

Wait — looking at the flow: `runTest()` calls `await saveResult(testResult)` after setting `setResult(testResult)`. The `result` state shows the UI card with speeds. But the data never persists to DB. The insert is likely failing due to missing columns or RLS. Let me check if there's a `with_check` expression.

**Fix:** Need to verify the exact RLS policy. Most likely fix: ensure the INSERT policy has `WITH CHECK (auth.uid() = user_id)`. Also add user-visible error feedback when the insert fails instead of silently returning.

## Bug 5: Google OAuth Redirect (Task 6 — Partial)
**Root cause per memory:** The native OAuth flow uses a broker URL that redirects to `nomiqa-depin.com/app/oauth-redirect`, which then triggers a deep link back to the app. Sometimes the redirect page doesn't trigger the deep link and the user stays on the web version. This is an existing known intermittent issue related to timing/browser behavior.

**Fix:** Improve the `OAuthRedirect.tsx` fallback — add a more prominent "Open in App" button and reduce the delay before showing it. Also ensure the deep link scheme fires immediately on page load.

---

## Implementation Summary

| Task | Bug | Fix | Risk |
|------|-----|-----|------|
| 9 | delete-user missing body | Pass `{ body: { self_delete: true } }` in invoke call | Low — 1 line |
| 4 | Check-in points toast shows wrong value | Use actual RPC result for toast; add unique constraint | Low |
| 3 | Phone state permission never requested | Wire `PhoneStateRationale` into contribution start flow | Medium — multi-file |
| 7 | Speed test insert may fail silently | Verify/fix RLS; add error feedback | Low-Medium |
| 6 | OAuth redirect intermittent | Improve OAuthRedirect fallback timing | Low |

Total: ~5 files to edit, 1 DB migration for the unique constraint.

