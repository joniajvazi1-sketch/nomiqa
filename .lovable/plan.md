
# Comprehensive Fix: Checkout Overlap, Points Dropping, Globe Theme, Privacy Link, and Globe Swipe

This plan addresses all remaining beta tester issues in one release.

---

## Issue 1: Bottom Navigation Overlaps Checkout Screen

**Root cause:** `AppCheckout.tsx` uses `pb-8` (32px) bottom padding, but the floating bottom nav bar is 56px + safe area (~88-112px total). The payment method section and submit button get hidden behind the nav.

**Fix:** In `AppCheckout.tsx`, increase the bottom padding from `pb-8` to `pb-40` (160px) to clear the bottom navigation on all devices. This matches the pattern used in other pages like `AppRewards` which uses `pb-24`.

---

## Issue 2: Points Reducing On Their Own

**Root cause:** Found it in `useNetworkContribution.ts` lines 874-882. When the server-side `add_points_with_cap` RPC returns a capped result (daily/monthly/lifetime cap hit), the code resets the local `pointsEarned` to `lastAutoSavePointsRef.current + actualPointsAdded`. If the cap allows fewer points than the client accumulated, the UI drops from e.g. 200 to 80 points. This is **correct server-side behavior** (anti-abuse), but the sudden drop confuses users.

**Fix:**
- When points are capped, show a toast notification explaining: "Daily earning limit reached. Points will resume tomorrow."
- Smoothly transition the displayed value instead of abruptly resetting it
- Add a small info indicator on the home screen showing when a cap is active

---

## Issue 3: Claimed Points Don't Reflect Immediately

**Root cause:** In `AppRewards.tsx`, `handleClaimPoints` opens a web URL (`nomiqa-depin.com/account?tab=earnings`) but doesn't refetch the points data when the user returns. The `loadRewardsData` function only runs on mount and when `timeRange` changes.

**Fix:** Add a `visibilitychange` listener and `focus` event to trigger `loadRewardsData()` when the user returns to the app/tab after claiming. Also on `AppHome.tsx`, add the same refresh-on-return pattern for the points display.

---

## Issue 4: Earth Globe Stays Dark in Light Mode

**Root cause:** The `NetworkGlobe.tsx` Canvas uses hardcoded dark colors:
- `GlobeErrorFallback` uses `bg-gradient-to-b from-[#0a0f1a] to-[#020408]` (hardcoded dark)
- The Canvas itself uses `alpha: true` with no background, but the parent container doesn't adapt to theme
- Stars were removed (`{/* Stars removed for cleaner look */}`) which is fine for light mode but leaves dark mode empty

**Fix:**
- Make the globe container background theme-aware (transparent in dark mode shows the app dark gradient; light mode gets a light sky-blue gradient)
- Add subtle starfield back for dark mode only using a conditional render
- Pass theme info to the Canvas so lighting can adapt (brighter ambient light in light mode)

---

## Issue 5: "View our data practices" Navigates to Home

**Root cause:** In `PrivacyControls.tsx` line 230, the privacy policy button calls `window.open('/privacy', '_blank')`. On native Android WebViews, `window.open` with `_blank` can fail silently or redirect to the app's root URL. The `/privacy` route loads the website's privacy page which is outside the `/app` route tree.

**Fix:** Use Capacitor's Browser plugin to open the privacy policy URL in an in-app browser on native, and `window.open` on web. Change the URL to the full absolute URL: `https://nomiqa-depin.com/privacy`.

---

## Issue 6: Globe Swipe Switches Tabs

**Root cause:** The globe Canvas captures touch events for OrbitControls rotation, but the parent `SwipeablePages` also listens to the same touch events. While `/app/map` and `/app/network` are in `SWIPE_DISABLED_ROUTES`, the globe on `/app` (home screen) is NOT excluded.

**Fix:** Add `pointer-events: none` to the globe's outer container so touches pass through to the scroll layer. Then add `pointer-events: auto` specifically to the Canvas element so globe rotation still works but prevents the touch from propagating to `SwipeablePages`. Additionally, add `touch-action: none` to the Canvas container to tell the browser this area handles its own gestures.

---

## Files to Modify

1. **`src/pages/app/AppCheckout.tsx`** -- Increase bottom padding to clear nav bar
2. **`src/hooks/useNetworkContribution.ts`** -- Add toast when points are capped instead of silent reduction
3. **`src/pages/app/AppRewards.tsx`** -- Add visibility-change refetch for claimed points
4. **`src/pages/app/AppHome.tsx`** -- Add visibility-change refetch + globe container touch isolation
5. **`src/components/app/NetworkGlobe.tsx`** -- Theme-aware background, restore dark-mode stars, adjust lighting
6. **`src/components/app/PrivacyControls.tsx`** -- Use Capacitor Browser for native, absolute URL

---

## Technical Details

### Points Cap Notification Logic
```text
Server returns: { points_added: 5, daily_capped: true, reason: "daily_cap_reached" }
Current behavior: silently resets pointsEarned from 200 to 85
New behavior: shows toast "Daily limit reached (500 pts/day). Earning resumes tomorrow!"
             + keeps displayed value stable (no visual drop)
```

### Globe Touch Isolation
```text
AppHome
  +-- Globe container (pointer-events: none, touch-action: none)
       +-- Canvas (pointer-events: auto) -- captures rotation gestures
       +-- Stats overlay (pointer-events: auto) -- captures taps on stats
  +-- Rest of home content -- normal scroll + swipe behavior
```

### Checkout Bottom Padding
```text
BEFORE: pb-8 (32px) -- payment button hidden behind 88px nav bar
AFTER:  pb-40 (160px) -- clears nav bar on all Android devices including gesture nav
```
