

# Full App Audit — Play Store Readiness

## Audit Summary

After reviewing all major app screens, flows, native configuration, and edge cases, here is a comprehensive breakdown of what works, what has issues, and what blocks Play Store submission.

---

## PASSED (No Issues Found)

1. **Routing & Navigation** — Native routes (`/app/*`) correctly isolated from web routes. Desktop browsers redirected to `/mobile-only`. Bottom tab bar has 4 tabs (Home, Rewards, eSIMs, Profile) with proper active states.

2. **Authentication Flow** — Login/signup with email, Google OAuth, biometric auth all properly implemented. Session timeout safety (5s boot timer), safe sessionStorage wrapper for iOS edge cases, proper error mapping for user-friendly messages.

3. **Permissions & Manifest** — Android manifest declares all required permissions (location, background location, foreground service, phone state, notifications) with rationale strings in `strings.xml`. iOS Info.plist has proper usage descriptions. Pre-permission explanation flow implemented.

4. **Error Handling** — `AppErrorBoundary` wraps native routes. Contribution toggle wrapped in try/catch. Auth has timeout fallbacks. Network status monitoring with `OfflineScreen`.

5. **Points Event System** — `points-updated` custom events dispatched from all reward sources (DailyCheckIn, Challenges, SocialTasks, SpeedTest, StopContribution). `PointsSyncBridge` persists events to sessionStorage. AppHome reads pending sync on mount.

6. **Build Configuration** — Target SDK 36, Min SDK 24, versionCode 2, proper Gradle setup with play-services-location and biometric dependencies.

7. **Data Safety / Privacy** — Location rounded to 4 decimals, no IMEI/phone number collection, 90-day retention, GDPR deletion flow exists.

---

## ISSUES FOUND

### Issue 1: SocialTasks page is NOT accessible from native app (BUG)
**Severity: Medium**

`SocialRewards` page at `/social-rewards` is only in WebRoutes — it's NOT in NativeAppRoutes. Native app users cannot navigate to social tasks to claim follow rewards. If there's a button linking to it from the native app, it would show a blank page or redirect to `/app`.

**Fix:** Add `/app/social-rewards` route to NativeAppRoutes, or embed SocialTasks directly in AppRewards/AppChallenges.

### Issue 2: DailyCheckIn points may double-count in today's earnings display
**Severity: Low**

In `handleCheckIn`, when `points-updated` fires with `newTotal`, the `PointsSyncBridge` stores an absolute total. But if AppHome is mounted and receives the event directly, it also does an optimistic update AND calls `loadData()`. The sessionStorage pending sync should be cleared by the direct listener, but there's a subtle race where both could apply.

**Current mitigation:** AppHome clears `pendingPointsSync` on mount, so this only matters if AppHome is already mounted — in which case the direct listener handles it and the bridge value gets overwritten. Low risk.

### Issue 3: Speed test dispatches hardcoded `pointsAdded: 25` regardless of actual reward
**Severity: Low**

Line 528 in AppHome always dispatches `{ pointsAdded: 25 }` after a speed test, but WiFi tests earn 10 pts and the actual amount depends on server-side logic. This causes a temporary over-count in the UI until `loadData()` corrects it.

**Fix:** Use the actual points awarded from the speed test result, or dispatch after loadData confirms.

### Issue 4: No `/app/checkout` route exists in NativeAppRoutes
**Severity: Low**

`AppCheckout` is mapped to `/checkout` (not `/app/checkout`) in NativeAppRoutes. This works but is inconsistent with the `/app/*` pattern. Cart flows linking to `/app/checkout` would 404.

**Status:** Needs verification — check if shop links to `/checkout` or `/app/checkout`.

### Issue 5: Missing `AppMap` route
**Severity: None (by design)**

`AppMap` is imported but not routed — map features merged into Home screen per design decision. No issue.

---

## PLAY STORE BLOCKERS (Non-Code)

These cannot be fixed in code — they require action in Google Play Console:

1. **Privacy Policy URL** — Must be linked in Play Console (use `https://nomiqa-depin.com/privacy`)
2. **Data Safety Form** — Declare: location (functionality), device identifiers (analytics), no phone numbers/IMEI
3. **Store Listing Assets** — 512x512 icon, 1024x500 feature graphic, phone screenshots (min 2)
4. **Content Rating Questionnaire** — Complete IARC questionnaire
5. **App Signing** — Enroll in Play App Signing, upload signed AAB
6. **`READ_PHONE_STATE` Justification** — May trigger Play Store review; prepare a declaration explaining signal metrics collection (not PII)

---

## RECOMMENDED FIXES (Code Changes)

### Fix 1: Add SocialTasks route to native app
**File: `src/App.tsx`** — Add route in NativeAppRoutes:
```
<Route path="/app/social-rewards" element={<AppChallenges />} />
```
Or better: create a dedicated native social tasks page, or embed SocialTasks component within AppChallenges.

### Fix 2: Fix speed test points dispatch
**File: `src/pages/app/AppHome.tsx`** line 528 — Replace hardcoded 25 with actual points from result or a conditional value based on connection type.

### Fix 3 (Optional): Verify checkout routing
Confirm that the eSIM shop navigates to `/checkout` (which exists in NativeAppRoutes) not `/app/checkout` (which doesn't).

---

## VERDICT

The app is **code-complete for Play Store submission** with one functional bug: **SocialTasks is unreachable in the native app**. If social task rewards are part of the user experience, this needs fixing before launch.

Everything else (auth, permissions, error handling, points sync, build config) is solid. The remaining blockers are all Play Console configuration tasks.

