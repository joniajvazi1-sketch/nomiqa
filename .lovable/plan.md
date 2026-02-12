

# Allow Unlimited Speed Tests, But Only Reward First 3

Currently the speed test is fully blocked after 3 daily tests ("Daily Limit Reached" disables the button entirely). The change is to let users run unlimited tests but only award points for the first 3.

## Changes

### `src/components/app/SpeedTest.tsx`

1. **Remove the hard block on running tests** -- Change `canRunTest` from controlling whether the test can run to only controlling whether points are awarded. The "Start Speed Test" button will always be enabled.

2. **Conditionally award points** -- In `saveResult()`, wrap the points-awarding logic in an `if (dailyTestCount < DAILY_TEST_LIMIT)` check. Tests beyond 3 still get saved to the database (useful network data) but no points are given.

3. **Update UI messaging:**
   - When `dailyTestCount >= DAILY_TEST_LIMIT`: Button text changes to "Run Speed Test (No Reward)" instead of "Daily Limit Reached"
   - After completing a non-rewarded test: Show "Test complete - no points (daily limit reached)" instead of "+5 pts earned"
   - Header still shows `X/3 tests rewarded today` so users know where they stand

4. **Always increment daily count** -- Keep tracking total tests run for the UI counter, but the points logic only fires for the first 3.

### No database or edge function changes needed
The `get_user_daily_speed_tests` RPC counts all tests for the day. The `speed_test_results` table continues to store all results regardless of reward status. The existing 3-test reward limit is enforced purely client-side in the component, with server-side caps (`add_points_with_cap`) as the safety net.

