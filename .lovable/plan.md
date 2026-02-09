

# Comprehensive Fix Plan: Remaining Beta Issues

## Root Cause Analysis

After thorough code inspection, I identified the exact bugs preventing fixes from working:

### 1. Account Creation Still Broken (CRITICAL BUG)

**Root Cause:** The 15-second timeout was added with an `AbortController`, but the **signal was never passed** to `supabase.functions.invoke()`. The Supabase SDK supports both `signal` and `timeout` options, but neither is used. This means the request hangs forever with no timeout.

**Current broken code (line 575):**
```text
supabase.functions.invoke('signup-user', {
  body: { ... },
  // BUG: no signal or timeout passed!
})
```

**Fix:** Pass `signal: controller.signal` into the invoke options. Even simpler: use the built-in `timeout: 15000` option the SDK provides natively.

### 2. Google OAuth on Native Redirects to Waitlist

**Root Cause:** The native OAuth flow opens `nomiqa-depin.com/~oauth/initiate` in the system browser. After Google auth completes, the redirect goes to `nomiqa-depin.com/app/oauth-redirect`. But the **published site** at that URL is the waitlist/marketing page -- it does not serve the `/app/oauth-redirect` route since app routes are only in the preview/native build. The OAuth redirect page never loads, so the deep link back to the native app never fires.

**Fix:** This is an infrastructure issue. The OAuth redirect page needs to exist on the published domain `nomiqa-depin.com`. For now, update the redirect URL to use the Lovable preview domain which does serve all app routes, or ensure the production build includes the OAuth redirect page.

### 3. Daily Streak Shows Zero

**Root Cause:** The `background_streak_days` field in `user_points` is only updated inside the `add_points_with_cap()` database function when `p_source = 'contribution'` or `'background'`. The streak logic checks if `last_background_date` was yesterday and increments. However, if the auto-save sync doesn't call with the correct source, or the daily cap is reached before the streak update runs, the streak stays at 0.

The client reads streak from `user_points.background_streak_days` but this value is only written during point additions. If a user is active but has hit their daily cap, the streak update is skipped entirely because `add_points_with_cap` returns early with "daily_cap_reached" before the streak code runs.

**Fix:** Move streak tracking logic BEFORE the cap check in `add_points_with_cap()`, so streaks are always updated regardless of whether points are awarded.

### 4. Theme Toggle Broken (Light Mode)

**Root Cause:** The app uses `next-themes` for theme switching. The toggle calls `setTheme('light')` correctly. However, the app CSS and component styles likely use hardcoded dark theme classes or the Capacitor WebView may not propagate the theme class to the root element properly on Android.

**Fix:** Ensure the theme class is applied to the `<html>` element and that all app components respect `dark:` prefix variants rather than hardcoded dark colors.

### 5. Gear Icon Goes to Profile Instead of Settings

**Root Cause:** The gear icon in the AppHome header navigates to the Profile tab. There is no dedicated Settings page -- Profile contains all settings. This is a UX expectation mismatch, not a bug.

**Fix:** Either rename the gear icon to a user icon, or add a `/app/settings` route that contains account, privacy, and notification controls.

## Implementation Plan

### Step 1: Fix Account Creation Timeout (Critical)
- **File:** `src/pages/app/AppAuth.tsx`
- Pass `signal: controller.signal` to `supabase.functions.invoke()`, OR use the SDK's built-in `timeout: 15000` option
- Add a retry button in the error state

### Step 2: Fix Daily Streak Always Zero
- **Database migration:** Update `add_points_with_cap()` function to move streak tracking logic BEFORE the daily cap check
- This ensures streaks increment even when the daily cap is reached

### Step 3: Fix Theme Toggle on Android
- **File:** `src/pages/app/AppHome.tsx` and `src/components/app/AppLayout.tsx`
- Audit hardcoded dark-theme colors (e.g., `bg-black/40`) and replace with theme-aware alternatives
- Ensure `next-themes` attribute is set to `class` on the root element

### Step 4: Redeploy signup-user Edge Function
- Force redeploy to ensure the function is active and responding

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/app/AppAuth.tsx` | Add `timeout: 15000` to signup invoke call |
| `add_points_with_cap()` DB function | Move streak logic before cap check |
| `src/pages/app/AppHome.tsx` | Fix hardcoded dark colors for theme support |

## Native Changes (Already Done -- Need Rebuild)
- Notification bar points display
- Background persistence via `onTaskRemoved`
- User must run: `npx cap sync android && npx cap sync ios` then rebuild

