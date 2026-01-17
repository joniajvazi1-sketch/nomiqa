-- Fix leaderboard_cache: require authentication for SELECT
-- This prevents unauthenticated access to top user usernames
DROP POLICY IF EXISTS "Leaderboard restricted to top 100 or own user" ON public.leaderboard_cache;

CREATE POLICY "Authenticated users can view top 100 or own entry"
ON public.leaderboard_cache
FOR SELECT
TO authenticated
USING (
  (rank_all_time <= 100) OR 
  (rank_weekly <= 100) OR 
  (rank_monthly <= 100) OR 
  (user_id = auth.uid())
);

-- Add explicit deny policy for anonymous users
DROP POLICY IF EXISTS "Deny anonymous access to leaderboard" ON public.leaderboard_cache;
CREATE POLICY "Deny anonymous access to leaderboard"
ON public.leaderboard_cache
FOR SELECT
TO anon
USING (false);

-- Verify token_waitlist protection
-- The edge function already has rate limiting, disposable email checking, and validation
-- The RLS policy WITH CHECK (true) is intentional for public signups
-- Add a comment to document this is intentional
COMMENT ON TABLE public.token_waitlist IS 'Public waitlist signup table. INSERT is intentionally open via RLS as the join-waitlist edge function provides rate limiting, disposable email rejection, and input validation.';

-- Verify affiliates RLS is secure - the existing policies look correct:
-- - SELECT: Only own account (auth.uid() = user_id)
-- - INSERT: Only own account (auth.uid() = user_id)  
-- - UPDATE: Only own account
-- - DELETE: Blocked (false)
-- - Anon: Blocked (false)
-- No changes needed for affiliates table