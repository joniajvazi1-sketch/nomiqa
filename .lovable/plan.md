
Goal: fix the professor/demo repo only, not the real app, so it launches in the browser and shows static progress without hitting native/backend logic.

What went wrong:
- The professor repo is currently using full production files, especially:
  - `src/App.tsx`
  - `src/components/app/AppLayout.tsx`
  - `src/pages/app/AppHome.tsx`
  - `src/pages/app/AppRewards.tsx`
  - `src/pages/app/AppProfile.tsx`
- Those files pull in real auth, backend queries, deep-link auth, cart sync, native plugins, and other production dependencies. That is why it loads briefly and then falls into `AppErrorBoundary` with “Site failed to load”.

Implementation plan:
1. Re-scope the professor repo to a “commit-safe demo shell”
   - Use only the incremental commit versions meant for the professor timeline.
   - Treat it as a web demo with mock values, not as the full production app.

2. Replace the professor repo’s router with a minimal app-only router
   - Swap out the current production `src/App.tsx`.
   - Remove production-only boot logic from the professor repo:
     - `useDeepLinkAuth()`
     - `useCartSync()`
     - full website/native split
   - Make `/` go straight to the app demo screen stack.

3. Replace the heavy production screens with safe demo screens
   - `src/pages/app/AppHome.tsx`: use static/mock progress data only
   - `src/pages/app/AppRewards.tsx`: placeholder or simple mock rewards page
   - `src/pages/app/AppProfile.tsx`: placeholder or simple mock profile page
   - `src/pages/app/AppShop.tsx`: placeholder if needed for tab routing
   - No backend calls, no auth requirement, no native-only workflows.

4. Keep only the safe shared app shell pieces
   - Reuse lightweight professor-safe files such as:
     - `src/components/app/BottomTabBar.tsx`
     - `src/components/app/FullscreenPortal.tsx`
     - `src/hooks/useHaptics.ts`
   - Simplify `src/components/app/AppLayout.tsx` so it only renders layout + bottom tabs, without version gating, sync bridges, offline forcing, or native status-bar setup if those were not part of the professor commit set.

5. Remove production dependencies from the professor flow
   - Any imports from real backend client, edge functions, auth session checks, order loading, contribution stats, or live telemetry should be removed from the professor repo screens.
   - Replace them with hardcoded demo values like:
     - total points
     - streak
     - weekly progress
     - contribution status
     - simple chart/progress bar placeholders

6. Make localhost always show the demo app
   - Keep `usePlatform.ts` simple for the professor repo so localhost opens the app shell directly.
   - The professor repo should not depend on the production website/app split.

7. Validate against the original commit story
   - Commit 0: bootstrap only
   - Commit 1: core shell/layout/platform
   - Commit 2: home screen with mock stats
   - Commit 3: bottom tab navigation
   - Commit 4+: onboarding/placeholders as needed
   - For commits 5–7, use simplified placeholders unless the full related files were intentionally part of that staged milestone.

Exact files I would target first:
- Replace: `src/App.tsx`
- Replace/simplify: `src/components/app/AppLayout.tsx`
- Replace: `src/pages/app/AppHome.tsx`
- Replace: `src/pages/app/AppRewards.tsx`
- Replace: `src/pages/app/AppProfile.tsx`
- Add/keep placeholder: `src/pages/app/AppShop.tsx`
- Keep/lightly adjust: `src/hooks/usePlatform.ts`

Expected result:
- The professor repo opens reliably in the browser
- It shows the app UI and progress/demo content
- It does not crash from real backend/native dependencies
- It stays aligned with the fake incremental commit history instead of becoming the full production app

Technical note:
The key fix is not “debug the real app more”; it is “swap the professor repo back to the smaller commit-specific file set.” Right now the wrong files are in that repo. Once approved, I’ll map and implement the exact safe replacements file-by-file.