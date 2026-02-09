

# Fix Plan: Light Theme Visibility + Scroll Issues

## Issue 1: Light Theme -- White Text on White Background

**Root Cause:** The `NetworkGlobe.tsx` component uses hardcoded dark-theme colors for its overlay stats (Samples, Cities, Regions labels and the coverage legend). These include `text-white`, `text-white/50`, `text-white/60`, `bg-white/5`, and `border-white/10` -- all invisible on a light background.

**Fix:** Since the globe always renders on a dark canvas (3D scene with dark space background), these overlays should always use light text regardless of theme. The correct fix is NOT to make them theme-aware, but to ensure the globe's container has a dark background in both themes, which it already does. However, the stat boxes below the globe (`bg-white/5`) become invisible in light mode because they sit inside the parent layout which has a light background.

The fix is to wrap the globe overlay stats in a container that forces a dark context, OR use theme-aware tokens with proper contrast:
- `bg-white/5` changes to `bg-black/5 dark:bg-white/5`
- `border-white/10` changes to `border-black/10 dark:border-white/10`
- `text-white` changes to `text-foreground`
- `text-white/50` changes to `text-muted-foreground`

**File:** `src/components/app/NetworkGlobe.tsx` (lines 888-929)

## Issue 2: Achievements Page Scroll

**Root Cause:** The `AppAchievements.tsx` component sets `overflow-y-auto` in its own container class, but it's nested inside AppLayout's `<main>` which also has `overflow-y-auto`. On Android WebViews, this double-scroll nesting can cause the inner container to not scroll properly.

**Fix:** Remove `overflow-y-auto` from the Achievements page and let the parent `<main>` in AppLayout handle scrolling (same pattern as how AppHome works -- it doesn't set its own overflow). Also increase bottom padding to `pb-32` (140px equivalent) to match Challenges page.

**File:** `src/pages/app/AppAchievements.tsx` (line 55)

## Files to Modify

| File | Change |
|------|--------|
| `src/components/app/NetworkGlobe.tsx` | Replace hardcoded `text-white`, `bg-white/5`, `border-white/10` with theme-aware tokens in the stats overlay (lines 888-929) |
| `src/pages/app/AppAchievements.tsx` | Remove `overflow-y-auto` from container, increase bottom padding to 140px |

## What This Fixes
- Globe stats (Samples, Cities, Regions) visible in both light and dark mode
- Coverage legend (High, Medium, New) visible in light mode
- Achievements page scrolls properly on Android devices
- No impact on dark mode appearance

