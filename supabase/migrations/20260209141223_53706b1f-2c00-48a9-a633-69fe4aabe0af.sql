
-- Bug 2: Create SECURITY DEFINER function to get leaderboard data
-- This bypasses the restrictive RLS on user_points while keeping data secure
CREATE OR REPLACE FUNCTION public.get_leaderboard_top(p_limit integer DEFAULT 100)
RETURNS TABLE(
  user_id uuid,
  username text,
  total_points numeric,
  total_distance_meters numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.user_id,
    p.username,
    COALESCE(up.total_points, 0) as total_points,
    COALESCE(up.total_distance_meters, 0) as total_distance_meters
  FROM user_points up
  LEFT JOIN profiles p ON p.user_id = up.user_id
  WHERE up.total_points > 0
    AND COALESCE(up.is_frozen, false) = false
  ORDER BY up.total_points DESC NULLS LAST
  LIMIT p_limit;
END;
$$;

-- Bug 3: Fix streak tracking - initialize streaks for active users with null data
-- Also handle the same-day case where last_background_date = CURRENT_DATE
UPDATE user_points
SET 
  background_streak_days = 1,
  last_background_date = CURRENT_DATE
WHERE total_points > 0 
  AND last_background_date IS NULL;
