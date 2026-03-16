

# Dead Code Cleanup Plan

## What I Found

After searching all imports across the codebase, here are files that exist but are **never imported anywhere** (true dead code):

### App Components (safe to delete)
| File | Why it's dead |
|------|--------------|
| `src/components/app/SpinWheel.tsx` | Spin wheel removed, zero imports |
| `src/components/app/GlobalCommunityStats.tsx` | Never imported |
| `src/components/app/GracefulFallbacks.tsx` | Never imported |
| `src/components/app/IndoorModeToggle.tsx` | Never imported |
| `src/components/app/PersonalizedGoals.tsx` | Never imported |
| `src/components/app/SpotlightTooltip.tsx` | Never imported |
| `src/components/app/TokenInfoModal.tsx` | Never imported |
| `src/components/app/SocialProofIndicator.tsx` | Never imported |
| `src/components/app/TiltCard3D.tsx` | Never imported |
| `src/components/app/AnalyticsDashboard.tsx` | Never imported |
| `src/components/app/ContributionMap.tsx` | Never imported (MiniContributionMap IS used) |
| `src/components/app/DataQualityIndicator.tsx` | Never imported |
| `src/components/app/EarningExplainer.tsx` | Never imported |
| `src/components/app/FloatingQuickEarn.tsx` | Never imported |
| `src/components/app/HowYouEarnCard.tsx` | Never imported |
| `src/components/app/IOSPermissionBanner.tsx` | Never imported |
| `src/components/app/NetworkStatsCard.tsx` | Never imported |

### Website Components (safe to delete)
| File | Why it's dead |
|------|--------------|
| `src/components/EarnSection.tsx` | Never imported |
| `src/components/HowYouEarn.tsx` | Never imported |
| `src/components/EarnRewardBlock.tsx` | Never imported |
| `src/components/LoyaltyProgram.tsx` | Never imported |
| `src/components/StickyCTA.tsx` | Never imported |
| `src/components/InviteReminderSection.tsx` | Never imported |

### Asset icons (safe to delete)
| File | Why it's dead |
|------|--------------|
| `src/assets/icons/badges-icon.png` | Never referenced |
| `src/assets/icons/challenges-icon.png` | Never referenced |
| `src/assets/icons/leaderboard-icon.png` | Never referenced |

### Translation cleanup
- Remove `appLeaderboard`, `appLeaderboardTitle`, `appThisWeekLeaderboard`, `appThisMonth` keys from `TranslationContext.tsx`
- Remove `achievementUnlocked` from `appCopy.ts`
- Remove `achievements` and `leaderboard` types from `EmptyState.tsx` and `EmptyStateIllustration.tsx`

### What stays (still used)
- `leaderboard_cache` table references in `delete-user` edge function and `WeeklySummaryModal` — these are functional, not UI-dead
- `Confetti.tsx` — used by Shop, MyAccount, LevelUpCelebration, etc.
- `NetworkDashboard.tsx` — still routed at `/network`
- `CSSGlobe.tsx` — used by CoverageSection
- `SocialRewards.tsx` — still routed at `/social-rewards`
- `MobileOnly.tsx` — still routed at `/mobile-only`
- All components on the Index page (DePINAdvantage, WhatIsDePIN, etc.) — still rendered

### What will NOT be touched
- Database tables (leaderboard_cache etc.) — removing tables is risky and the delete-user function references them
- Edge functions — all still serve active purposes
- `types.ts` — auto-generated, never manually edited

## Total: ~26 files to delete

Zero risk to existing functionality. Every file listed has zero imports. The app will build identically after removal — just with a smaller bundle.

