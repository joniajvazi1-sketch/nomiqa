
# Beta Test Fixes - Nomiqa Android App

Based on Jim's detailed beta report, here are the fixes organized by priority.

---

## Fix 1: Gear Icon Goes to Profile Instead of Settings

**Problem:** The gear icon on the home dashboard navigates to `/app/profile` (the Profile page). Users expect it to go to Settings.

**Solution:** Change the gear icon navigation to go to `/app/profile?tab=settings` so it opens the Profile page with the Settings tab pre-selected. The Profile page already supports tab query params (`account`, `orders`, `settings`).

**File:** `src/pages/app/AppHome.tsx` (line 574)

---

## Fix 2: Light/Dark Theme Toggle Broken on Home Screen

**Problem:** The home dashboard uses hardcoded dark colors (`bg-[#050a12]`, `text-white`, `bg-black/40`, etc.) that don't respond to the theme toggle. Switching to light mode has no visible effect.

**Solution:** Make the home screen theme-aware by replacing hardcoded dark colors with conditional classes based on `isDark`. The key areas to update:
- Main container background (`bg-[#050a12]` to theme-conditional)
- Fixed gradient background overlay
- All card backgrounds (`bg-black/40` to `bg-card/60` in light mode)
- All text colors (`text-white` to `text-foreground`, etc.)
- Border colors (`border-white/10` to `border-border`)

**File:** `src/pages/app/AppHome.tsx` (lines 532-975)

---

## Fix 3: Privacy Screen / Data Collection Screen Issues

**Problem:** The privacy/data collection screen bounces back to home when scrolling or pressing back. No link to the full privacy policy document.

**Solution:** 
- The `PrivacyControls` component already has a "View Privacy Policy" button but it opens `/privacy` in a new tab. Add an explicit "Read Full Privacy Policy" link at the top of the `DataConsentModal` so users can review before consenting.
- The HelpCenter modal already handles scroll correctly with `overflow-y-auto`. The "bouncing" issue is likely from the `SwipeablePages` horizontal swipe intercepting vertical scrolls inside settings. The fix from SwipeablePages (passive listeners + vertical direction lock) should address this. We will verify and tighten the vertical scroll detection threshold.

**Files:** `src/components/app/DataConsentModal.tsx`, `src/components/app/SwipeablePages.tsx`

---

## Fix 4: Help/FAQ Navigation Doesn't Scroll to Top

**Problem:** When Help/FAQ is opened, it doesn't auto-scroll to the top, making users think it's blank.

**Solution:** Add a `useEffect` in the HelpCenter modal that scrolls the modal's scroll container to the top when it opens.

**File:** `src/components/app/HelpCenter.tsx`

---

## Fix 5: Speed Test Failure - Friendlier Message

**Problem:** Speed test fails silently or shows a generic "Please try again" error. Users worry their contribution is broken.

**Solution:** Update the speed test failure toast to show a reassuring message: "Speed test couldn't connect. Don't worry - background earning continues normally!" Make speed test clearly optional in the UI label.

**File:** `src/pages/app/AppHome.tsx` (line 366-370)

---

## Fix 6: Contribution Feedback - Show Small Point Increases

**Problem:** Points appear to be stuck at 0 with no visible micro-updates. Users only see changes when reopening the app.

**Solution:** When a contribution session is active, show a subtle "+0.1 pts" floating indicator near the points display that pulses periodically. Also add a "Background still earning" status message when the session is active but no recent data point has been collected.

**File:** `src/pages/app/AppHome.tsx` (session stats section)

---

## Fix 7: Shop (eSIM) Page Scroll Fix

**Problem:** The Shop page still doesn't scroll on Android despite previous fixes.

**Solution:** The current `AppShop.tsx` has removed its own overflow styles, which is correct. The issue is likely the inner `<div className="relative z-10 px-5 py-6 space-y-4">` with explicit `paddingBottom` not providing enough room, or the `min-h-full` class conflicting. Remove `min-h-full` and ensure the container is a simple flow layout with no height constraints.

**File:** `src/pages/app/AppShop.tsx`

---

## Fix 8: Launch Loading Tip

**Problem:** 3-5 second blank loading with just a spinner feels slow.

**Solution:** Add a rotating set of tips to the loading screen: "Mapping your signal...", "Connecting to the network...", "Preparing your dashboard..." displayed below the spinner.

**Files:** `src/pages/app/AppHome.tsx` (loading state, line 400-406), `src/components/app/AppSpinner.tsx`

---

## Technical Details

| # | Fix | Files Changed | Risk |
|---|-----|--------------|------|
| 1 | Gear to Settings | AppHome.tsx | Low |
| 2 | Theme toggle | AppHome.tsx | Medium - large color refactor |
| 3 | Privacy screen | DataConsentModal.tsx, SwipeablePages.tsx | Low |
| 4 | Help scroll-to-top | HelpCenter.tsx | Low |
| 5 | Speed test message | AppHome.tsx | Low |
| 6 | Point micro-feedback | AppHome.tsx | Low |
| 7 | Shop scroll | AppShop.tsx | Low |
| 8 | Loading tips | AppHome.tsx | Low |

All changes are UI/frontend only. No database migrations or backend function changes needed.
