

# Fix Plan: Speed Test Save + Account Deletion

## Bug 7 — Speed Test Results Not Saved

**Root cause analysis:** The insert code and RLS policy are both correct (`WITH CHECK (auth.uid() = user_id)`). The DB has 0 rows, meaning inserts consistently fail. Two likely causes:

1. **`userId` is null** — On the native app, if `supabase.auth.getUser()` fails (bad JWT, session expired), `userId` stays null and `saveResult()` silently returns on line 62 (`if (!userId) return;`). The auth logs show `bad_jwt` errors.
2. **Silent insert failure** — Even with the `toast.error` added previously, the toast may be missed or the error might not contain useful info.

**Fix:**
- In `saveResult()`, if `userId` is null, show a toast error ("Please sign in to save results") instead of silently returning
- Add `.select()` after `.insert()` to force PostgREST to return data (makes errors more explicit)
- Add `console.error` with the full error details for debugging
- After successful save, trigger a refresh event so `SpeedTestHistory` re-fetches

**File:** `src/components/app/SpeedTest.tsx`

---

## Bug 9 — Account Deletion Fails

**Root cause analysis:** The `delete-user` edge function is deployed and responding (confirmed via test call). However, it only deletes from ~12 tables but the database has ~27 tables with `user_id`. The missing tables include:

- `daily_checkins`
- `mining_logs`
- `notification_preferences`
- `social_task_claims`
- `speed_test_results`
- `spin_wheel_results`
- `user_collection_preferences`
- `user_contribution_levels`
- `user_daily_limits`
- `user_goals`
- `user_monthly_limits`
- `referral_commissions` (referrer_user_id)
- `pending_referral_bonuses`
- `affiliate_referrals` (registered_user_id)
- `security_audit_log`

While there are no FK constraints that would block auth user deletion, data from these tables persists after "deletion" — which is exactly what the tester reported ("user data remains in DB").

Additionally, the `request_data_deletion` RPC (called first) might throw on certain edge cases, preventing the edge function from being called at all.

**Fix:**
1. Add ALL missing tables to the `delete-user` edge function (both self-delete and admin-delete paths)
2. Wrap each table deletion in try-catch so one failure doesn't block the entire flow
3. Add a `console.log` at the very start of the function (before auth check) to confirm it's being reached
4. On the client side in `AppProfile.tsx`, add more detailed error logging so we can see which step fails

**File:** `supabase/functions/delete-user/index.ts`, `src/pages/app/AppProfile.tsx`

---

## Summary

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| Speed test save | `userId` null on native (auth issue) + silent return | Show error toast when not authenticated; add `.select()` for better error info |
| Account deletion | 15+ tables not cleaned up; data persists | Add all missing tables to delete-user function |

