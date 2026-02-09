

# Comprehensive Fix Plan: All Remaining Beta Issues

## Problem Summary

After thorough code analysis, I found that while many fixes were applied in previous rounds, several have **remaining bugs** that prevent them from working correctly, and the **account creation issue** has not been addressed at all. Here is the true status:

## Issue-by-Issue Analysis

### 1. Account Creation Broken (CRITICAL)
**Root Cause:** The `signup-user` edge function shows zero logs -- it is either not deployed, timing out silently, or being blocked. The function itself looks correct, but users on 3 different devices report "always loading" when trying to create accounts.

**Fix:**
- Redeploy the `signup-user` edge function
- Add a client-side timeout (15 seconds) with a clear error message in `AppAuth.tsx` so users are not stuck on an infinite spinner
- Add better error handling for network failures during signup

### 2. Wi-Fi Speed Test Fails (BUG IN FIX)
**Root Cause:** The `isEndpointReachable()` was changed to GET (correct), but `areStaticFilesAvailable()` on line 150 STILL uses `method: 'HEAD'`. On Wi-Fi networks with captive portals or corporate firewalls, HEAD is blocked, so this check fails. Then `measureLatency()` also starts with HEAD before falling back to GET, adding unnecessary delay.

**Fix:**
- Change `areStaticFilesAvailable()` from HEAD to GET with a range header (to avoid downloading the full file)
- Change `measureLatency()` to use GET first instead of HEAD-then-fallback

### 3. Reward Delays (PARTIALLY FIXED)
**Status:** Auto-save interval was reduced from 5 minutes to 2 minutes. This helps but the core issue is that points are calculated server-side via `add_points_with_cap()` and only reflected when the sync function runs.

**Fix:**
- Show optimistic point updates in the UI immediately when a data point is collected (client-side counter)
- This is already partially working -- the `stats.pointsEarned` updates locally. The real issue is the server sync. The 2-minute auto-save should help significantly.

### 4. Map Not Reflecting Coverage
**Root Cause:** The `useGlobalCoverage` hook calls `get-global-coverage` edge function with a non-standard pattern (body: null + x-query-params header). This may be silently failing.

**Fix:**
- Switch to using query params via direct fetch URL instead of the unusual header-based approach
- Ensure the materialized view `coverage_tiles` is being refreshed (check if the cron job is running)

### 5. App Speed / Tab Lag (PARTIALLY FIXED)
**Status:** PageTransition durations reduced to 80-120ms, Globe optimized. These changes ARE deployed.

**Additional Fix:**
- The 3D globe lazy loads correctly but is a heavy component. Add `loading="lazy"` behavior and ensure Suspense fallback is lightweight
- No further code changes needed beyond what was done -- remaining lag is device-specific (mid-range Android with slow WebView)

### 6. Homepage Scroll Jank (PARTIALLY FIXED)
**Status:** Globe container reduced to 35vh with `contain: strict`, antialias disabled, low-power mode enabled.

**Additional Fix:**
- The globe renders continuously even when scrolled off-screen. Add an IntersectionObserver to pause rendering when not visible
- This will significantly reduce GPU load during scrolling

### 7. Points in Notification Bar (NATIVE ONLY)
**Status:** Java code changes are already in `LocationForegroundService.java`. These require `npx cap sync android` and a native rebuild.

**No additional code changes needed** -- just a rebuild.

### 8. App Closes in Background (NATIVE ONLY)
**Status:** `onTaskRemoved()` handler is already implemented in Java. Requires native rebuild.

**No additional code changes needed** -- just a rebuild.

### 9. Referral Links Reload Page (FIXED)
**Status:** AffiliateRedirect.tsx correctly redirects to `/download`. This is deployed.

**Verification:** Test the referral link flow end-to-end after deployment.

---

## Technical Implementation Plan

### Step 1: Fix Account Creation (signup-user edge function)
- Redeploy the edge function to ensure it's active
- Add a 15-second client-side timeout in `AppAuth.tsx` handleEmailAuth
- Add network error detection and retry logic

### Step 2: Fix Wi-Fi Speed Test (speedTestProviders.ts)
- `areStaticFilesAvailable()`: Change HEAD to GET with `Range: bytes=0-0` header
- `measureLatency()`: Use GET as primary method instead of HEAD-then-fallback

### Step 3: Fix Map Coverage (useGlobalCoverage.ts)
- Use direct fetch with query params instead of the x-query-params header pattern
- Add error handling and fallback display

### Step 4: Globe Performance (NetworkGlobe.tsx)
- Add IntersectionObserver to pause Three.js rendering when globe is scrolled off-screen
- This eliminates GPU work during scrolling, fixing remaining homepage jank

### Step 5: Verify All Fixes
- Test signup flow
- Test speed test on Wi-Fi
- Test referral link flow
- Test map coverage display
- Confirm scroll performance

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/app/AppAuth.tsx` | Add 15s timeout + retry for signup |
| `src/utils/speedTestProviders.ts` | HEAD to GET in 2 remaining functions |
| `src/hooks/useGlobalCoverage.ts` | Fix edge function invocation pattern |
| `src/components/app/NetworkGlobe.tsx` | Add IntersectionObserver pause |
| `supabase/functions/signup-user/index.ts` | Redeploy (no code change) |

## Native Changes (Already Done -- Need Rebuild)
- `LocationForegroundService.java`: Notification bar points + onTaskRemoved
- User must run: `npx cap sync android && npx cap sync ios` then rebuild

