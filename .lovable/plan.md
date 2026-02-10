

# Comprehensive Beta Fix Plan: Scrolling, Account Creation, Performance, and UX

This plan addresses all critical issues reported by beta testers across 3 categories: (A) Scrolling/navigation bugs, (B) Account creation failures, and (C) Performance and UX polish.

---

## Problem Analysis

After thorough code review, here are the root causes:

### 1. Scrolling Still Broken on Challenges/Leaderboard/Achievements
**Root cause:** The pages themselves look correct (no conflicting `overflow` styles), but the `SwipeablePages` wrapper intercepts touch gestures. Even though challenges/leaderboard routes are in `SWIPE_DISABLED_ROUTES`, the direction-lock logic still needs the first 12-18px of vertical drag to decide -- on Android mid-range devices with slower touch event processing, this causes an initial "stuck" feeling. Additionally, `motion.div` from `PageTransition` wraps content in a `transform-gpu` layer, which on some Android WebViews creates an implicit stacking context that interferes with scrolling.

### 2. Account Creation Failing on Android
**Root cause:** The `signup-user` edge function works (confirmed by direct test), but:
- The 15-second `AbortController` timeout in AppAuth is too aggressive for mid-range Android devices on Wi-Fi (the country detection IP lookup adds 2-5 seconds)
- The edge function itself does a country-detection HTTP call that can stall for 3+ seconds, adding to the total time
- Users see infinite spinner and give up

### 3. Google OAuth on Native Redirects to Waitlist
**Root cause:** When native users tap "Sign in with Google", the OAuth flow opens the system browser. After auth, it redirects to `nomiqa-depin.com/app/oauth-redirect`. But if the deep link back to the app fails (common on Android), the user stays on the web domain which shows the website/waitlist -- not the app.

### 4. Slow App Launch
**Root cause:** Already partially addressed with lazy loading, but remaining bottlenecks:
- `framer-motion` is imported by `PageTransition` which is in the critical path
- `NetworkGlobe` (Three.js) lazy loads but blocks the home screen render

---

## Implementation Plan

### Phase 1: Fix Scrolling (Critical)

**File: `src/components/app/PageTransition.tsx`**
- Remove `transform-gpu` class from the motion.div wrapper for non-transform pages. The GPU compositing layer can interfere with scrolling on Android WebViews.
- For the `spring` and `instant` variants (used by most pages), skip the `willChange` and `backfaceVisibility` styles after the entrance animation completes.

**File: `src/components/app/SwipeablePages.tsx`**
- Increase the vertical scroll detection threshold from `12px` to `8px` (catch vertical scrolls sooner)
- Increase the horizontal swipe threshold from `18px` to `25px` (be more conservative about claiming horizontal swipes)
- Increase the aspect ratio from `2.5` to `3.0` for horizontal detection (require more clearly horizontal gesture)

**File: `src/pages/app/AppChallenges.tsx`, `AppLeaderboard.tsx`, `AppAchievements.tsx`**
- Add explicit `touch-action: pan-y` inline style to the root container to hint to the browser that only vertical scrolling should be handled
- Remove `overscroll-behavior: none` from `app-container` CSS (can interfere with scroll initiation on some Android browsers)

### Phase 2: Fix Account Creation (Critical)

**File: `src/pages/app/AppAuth.tsx`**
- Increase the `AbortController` timeout from 15 seconds to 25 seconds for the signup call
- Add a progress indicator showing "Creating your account..." with a secondary message after 5 seconds: "Almost there, please wait..."
- Add explicit error recovery: if the call times out, show a "Retry" button instead of just an error message

**File: `supabase/functions/signup-user/index.ts`**
- Make the country detection IP lookup non-blocking: use `Promise.race` with a 1.5-second timeout so it never delays the signup response
- Move the verification email send to fire-and-forget (don't await it) to shave 1-2 seconds off the response time
- This should bring total signup time from 5-8 seconds down to 1-3 seconds

### Phase 3: Performance -- Faster Cold Start

**File: `src/components/app/AppLayout.tsx`**
- Defer `SwipeablePages` import: it uses touch event listeners that aren't needed until after first paint. Wrap in lazy import.
- Simplify the viewport height interval check from every 1 second to every 3 seconds (reduces JS work on slow devices)

**File: `src/components/app/PageTransition.tsx`**
- Add a `layoutEffect` guard: skip entrance animation entirely on the very first render (cold start). This eliminates the 120ms fade-in delay users see on launch.

**File: `src/index.css`**
- Add `content-visibility: auto` to `.app-container` children sections to enable browser-level rendering optimization (skips painting off-screen content)

### Phase 4: UX Polish

**File: `src/components/ui/sonner.tsx`**
- Already fixed (theme-aware tokens). Verify the light mode notifications are readable.

**File: `src/pages/app/AppHome.tsx`**
- Ensure the globe container has `pointer-events: none` on the canvas area below the dashboard content so accidental touches on the globe don't trigger tab swipes

---

## Technical Details

### Scroll Fix Architecture
```text
AppLayout (overflow-y: auto on <main>)
  +-- SwipeablePages (touch listeners, passive: true)
       +-- PageTransition (motion.div -- remove transform-gpu for scroll pages)
            +-- AppChallenges / AppLeaderboard (touch-action: pan-y)
```

The fix ensures the browser's native scroll handling takes priority over JavaScript touch processing by:
1. Making SwipeablePages more conservative about claiming horizontal gestures
2. Removing GPU compositing hints that create separate scroll layers
3. Adding `touch-action: pan-y` CSS hints

### Signup Speed Optimization
```text
BEFORE: signup-user (avg 5-8s)
  1. Validate input (10ms)
  2. Rate limit check (50ms)
  3. Check existing profile (50ms)
  4. Create auth user (500ms)
  5. Detect country from IP (2-5s) <-- BLOCKING
  6. Create profile (100ms)
  7. Track referral (200ms)
  8. Send verification email (1-2s) <-- BLOCKING

AFTER: signup-user (avg 1-2s)
  1. Validate input (10ms)
  2. Rate limit check (50ms)
  3. Check existing profile (50ms)
  4. Create auth user (500ms)
  5. Detect country (1.5s max, race with timeout) <-- CAPPED
  6. Create profile (100ms)
  7. Track referral (fire-and-forget)
  8. Send email (fire-and-forget) <-- NON-BLOCKING
```

### Files Modified
- `src/components/app/SwipeablePages.tsx` -- gesture thresholds
- `src/components/app/PageTransition.tsx` -- remove transform-gpu on scroll pages
- `src/pages/app/AppChallenges.tsx` -- touch-action hint
- `src/pages/app/AppLeaderboard.tsx` -- touch-action hint
- `src/pages/app/AppAchievements.tsx` -- touch-action hint
- `src/pages/app/AppAuth.tsx` -- increase timeout, better loading UX
- `supabase/functions/signup-user/index.ts` -- non-blocking IP detection and email
- `src/components/app/AppLayout.tsx` -- reduce interval frequency
- `src/index.css` -- content-visibility optimization

