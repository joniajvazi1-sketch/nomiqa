-- Fix #1: Restrict leaderboard access to top 100 users + own user's data
-- This prevents full table scraping while still allowing competitive leaderboard UX

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Leaderboard is viewable by authenticated users" ON public.leaderboard_cache;

-- Create new restrictive policy: users can only see top 100 OR their own entry
CREATE POLICY "Leaderboard restricted to top 100 or own user"
ON public.leaderboard_cache
FOR SELECT
TO authenticated
USING (
  rank_all_time <= 100 
  OR rank_weekly <= 100 
  OR rank_monthly <= 100 
  OR user_id = auth.uid()
);

-- Fix #2: Secure update_leaderboard_rankings() with admin-only execution
-- Revoke public execute permission
REVOKE EXECUTE ON FUNCTION public.update_leaderboard_rankings() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_leaderboard_rankings() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_leaderboard_rankings() FROM anon;

-- Create a secure wrapper that checks admin role before execution
CREATE OR REPLACE FUNCTION public.admin_update_leaderboard_rankings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins to call this function
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  
  -- Perform the actual leaderboard update
  UPDATE leaderboard_cache lc
  SET rank_all_time = ranked.rank
  FROM (
    SELECT user_id, ROW_NUMBER() OVER (ORDER BY total_points DESC) as rank
    FROM leaderboard_cache
  ) ranked
  WHERE lc.user_id = ranked.user_id;
  
  UPDATE leaderboard_cache lc
  SET rank_weekly = ranked.rank
  FROM (
    SELECT user_id, ROW_NUMBER() OVER (ORDER BY weekly_points DESC) as rank
    FROM leaderboard_cache
  ) ranked
  WHERE lc.user_id = ranked.user_id;
  
  UPDATE leaderboard_cache lc
  SET rank_monthly = ranked.rank
  FROM (
    SELECT user_id, ROW_NUMBER() OVER (ORDER BY monthly_points DESC) as rank
    FROM leaderboard_cache
  ) ranked
  WHERE lc.user_id = ranked.user_id;
END;
$$;

-- Restrict the new function to admins only (service role can still call)
REVOKE EXECUTE ON FUNCTION public.admin_update_leaderboard_rankings() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_update_leaderboard_rankings() FROM anon;