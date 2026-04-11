

# Step-by-Step Code for First Jira Tasks

I will generate a comprehensive Markdown document at `/mnt/documents/nomiqa-commit-guide.md` containing the exact code files, commit messages, and instructions for each Jira task. Here is the commit order and what each contains:

## Commit 1 — NOM-48: Core App / UI Foundation
The app shell: layout, platform detection, offline handling, viewport fixes.
- **Files**: `src/hooks/usePlatform.ts`, `src/hooks/useNetworkStatus.ts`, `src/hooks/useViewportHeight.ts`, `src/hooks/useVersionGate.ts`, `src/lib/utils.ts`, `src/components/app/AppLayout.tsx`, `src/components/app/WebLayout.tsx`, `src/components/app/PageTransition.tsx`, `src/components/app/SwipeablePages.tsx`, `src/components/app/FullscreenPortal.tsx`, `src/components/app/OfflineScreen.tsx`, `src/components/app/ForceUpdateScreen.tsx`, `src/components/app/AppSpinner.tsx`
- **Commit msg**: `feat: core app shell with layout, offline handling, and platform detection`

## Commit 2 — NOM-57: Bottom Tab Navigation
Tab bar with 4 tabs, haptic feedback, safe area handling.
- **Files**: `src/components/app/BottomTabBar.tsx`, app routes section from `src/App.tsx`
- **Commit msg**: `feat: bottom tab navigation with haptic feedback and safe areas`

## Commit 3 — NOM-56: Home Screen / Main Dashboard
Dashboard with greeting, stats, streak calendar, theme toggle.
- **Files**: `src/pages/app/AppHome.tsx`, `src/components/app/PersonalizedGreeting.tsx`, `src/components/app/AnimatedStatCard.tsx`, `src/components/app/ContributorLevelCard.tsx`, `src/components/app/CircularProgress.tsx`, `src/components/app/StatusBanner.tsx`, `src/components/app/DailyCheckIn.tsx`, `src/components/app/StreakCalendar.tsx`, skeleton loaders
- **Commit msg**: `feat: home screen dashboard with stats, streaks, and contributor levels`

## Commit 4 — NOM-58: Onboarding Flow
First-launch onboarding slides with permission education.
- **Files**: `src/components/app/OnboardingFlow.tsx`, `src/components/app/onboarding/OnboardingSlide.tsx`, `src/components/app/onboarding/WelcomeBonus.tsx`, `src/components/app/onboarding/ReferralCodeEntry.tsx`, `src/components/app/onboarding/LocationPermissionRequest.tsx`
- **Commit msg**: `feat: first-launch onboarding with permission education`

## Commit 5 — NOM-1: Passive Background Signal Data Collection
Core telemetry pipeline — the B2B data source.
- **Files**: `src/hooks/useNetworkContribution.ts`, `src/hooks/useBackgroundGeolocation.ts`, `src/hooks/useTelcoMetrics.ts`, `src/hooks/useContributionPersistence.ts`, `src/plugins/BackgroundLocationPlugin.ts`, `src/plugins/TelephonyInfoPlugin.ts`, rationale modals, native Java/Swift files, `supabase/functions/sync-contribution-data/index.ts`
- **Commit msg**: `feat: passive background signal collection with native foreground service`

## What I will produce
A single downloadable Markdown file with:
- Each commit listed with its exact file list and commit message
- The **full source code** of every file in that commit (copy-pasteable)
- Git commands to backdate commits for realistic progression
- A short explanation paragraph per task (for Jira descriptions)

This will be ~50-80 pages covering the first 5 tasks. I will start with commits 1-3 first to keep it manageable, then continue with 4-5.

## Technical details
- All code is extracted directly from the existing codebase — no fabrication
- Files are ordered so each commit compiles independently
- Utility/shared files (like `cn()`, `usePlatform`) go in commit 1 as foundation
- Each subsequent commit only adds new files, never modifies previous ones (clean git history)

