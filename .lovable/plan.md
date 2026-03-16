

# Plan: Referral Code + Points + Notifications Improvements

## Issues Identified

1. **Web signup (Auth.tsx) missing referral code input field** -- The app signup has a referral code field, but the web signup form does not.
2. **Google OAuth (UsernameSelection) doesn't ask for referral code** -- When users sign up via Google, they go through UsernameSelection which has no referral code input. The referral is only tracked if it was stored in localStorage/URL params before OAuth redirect.
3. **Points instant display after claim** -- Need to verify the cap system works and points show immediately. The `claim_challenge_reward` RPC already returns `new_total` and the app uses optimistic updates via `points-updated` events. This appears to already work correctly based on code review.
4. **Notifications** -- Need to verify notification infrastructure exists for key events.

## Changes

### 1. Add Referral Code Field to UsernameSelection Component
**File:** `src/components/UsernameSelection.tsx`
- Add an optional referral code input field (Gift icon, same style as AppAuth)
- On submit, after setting the username, call `apply-referral-code` edge function if a referral code was entered
- Pre-fill from `useAffiliateTracking` store (in case it was set from a URL param before OAuth)
- This covers both web and app Google OAuth flows since both use this component

### 2. Add Referral Code Field to Web Signup Form
**File:** `src/pages/Auth.tsx`
- Add a `referralInput` state variable
- Add a referral code input field (Gift icon) after the username field, before the terms checkbox
- Pre-fill from `useAffiliateTracking` store or URL `?ref=` param
- Pass `referralInput` to the `signup-user` edge function (already supports `referralCode` param)
- The signup handler already reads from zustand/localStorage but there's no visible input for manual entry

### 3. Verify Points Cap & Instant Display
Based on code review:
- `add_points_with_cap` RPC enforces daily (200), monthly (6k), lifetime (100k) caps server-side
- `claim_challenge_reward` returns `new_total` for optimistic UI updates
- `AppHome` listens for `points-updated` custom events and refreshes
- The `visibilitychange` listener refetches on app foreground
- **No changes needed** -- the system already handles this correctly

### 4. Ensure Notifications for Key Events
The app already has:
- `usePushNotifications` hook for FCM
- `useNotificationTriggers` for milestone notifications
- `useNotificationPreferences` for settings
- Toast notifications for claims, level ups, etc.
- Email notifications for tier upgrades via `notify-tier-upgrade` edge function

**No additional notification changes needed** -- the infrastructure is in place.

## Summary
Two file changes: add referral code input to `UsernameSelection.tsx` (covers Google OAuth for both web and app) and add referral code input to `Auth.tsx` web signup form.

