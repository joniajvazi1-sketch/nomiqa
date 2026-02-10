

# Fix: Account Creation "Always Loading" on Android + Website Reliability

## Root Cause Analysis

After deep investigation, I found that **the signup edge function works perfectly** (754ms, 200 status) and **many users are creating accounts successfully** (20+ in the last 24 hours). The beta testers reporting "always loading" are hitting a **client-side race condition**, not a backend failure.

### The Actual Bug (Auth.tsx lines 228-234)

When the `/auth?mode=signup` page loads, it enters a `checkingSession` state (shows spinner). The session check has an 8-second timeout that:
1. Calls `supabase.auth.signOut()` -- this clears any stale session
2. Sets `checkingSession = false` -- should show the form

**BUT** -- the `onAuthStateChange` listener (line 210-216) catches the `SIGNED_OUT` event from step 1 and does NOT set `checkingSession = false` on its own. Meanwhile, if the network is slow (common on mid-range Android with Wi-Fi), the `getSession()` call on line 237 may resolve AFTER the timeout fired. This creates a race where:
- Timeout fires, signs out, sets checkingSession = false
- But then getSession() resolves with a session error (because we just signed out)
- This triggers the error handler on line 242 which calls signOut AGAIN
- The onAuthStateChange fires SIGNED_OUT again...

On fast networks this resolves quickly. On slow Wi-Fi (like the Huawei modems the tester uses), this race window is wide enough to cause a visible "stuck spinner" for several seconds or even appear infinite.

### Secondary Issue: Website Auth page (Auth.tsx)

The same race condition exists in `Auth.tsx` with the same pattern. Additionally, the session check timeout on line 233 calls `signOut()` which is aggressive -- a user who just signed up and got redirected back to the auth page could have their fresh session destroyed.

## Fix Plan

### 1. Fix the session check race condition (Auth.tsx + AppAuth.tsx)

**Both files:**
- Remove the `supabase.auth.signOut()` from the session check timeout -- it's too aggressive and causes cascading events
- Instead, just set `checkingSession = false` to show the form immediately after timeout
- Add a `sessionResolved` ref flag to prevent the `getSession()` callback from running if the timeout already fired
- Reduce timeout from 8s to 5s -- users should see the form faster

### 2. Add error feedback during signup (Auth.tsx)

- Add a visible error state when the signup call fails (currently errors may only show as toast which can be missed on some devices)
- Add a "Retry" button if signup fails, instead of just clearing the loading state

### 3. Harden username validation (Auth.tsx + AppAuth.tsx)

- Add a 3-second timeout to the username availability check (`profiles_safe` query) so it doesn't hang indefinitely on slow connections
- If the check times out, allow signup to proceed anyway (the edge function handles duplicates server-side)

## Files to Modify

- `src/pages/Auth.tsx` -- Fix session check race, add error states
- `src/pages/app/AppAuth.tsx` -- Fix session check race (same pattern)

## Technical Details

### Before (race-prone)
```text
Page Load --> checkingSession = true (spinner)
  |
  +-- setTimeout(8s) --> signOut() --> triggers SIGNED_OUT event
  |                                     |
  +-- getSession() ----[slow network]---+--> resolves after timeout
                                             |
                                             +-- error path --> signOut() AGAIN
                                                                (cascading events)
```

### After (deterministic)
```text
Page Load --> checkingSession = true (spinner)
  |
  +-- setTimeout(5s) --> sessionResolved = true
  |                      checkingSession = false (show form)
  |
  +-- getSession() --> if sessionResolved, skip
                       else process normally
```

This ensures the form ALWAYS appears within 5 seconds maximum, regardless of network conditions.
