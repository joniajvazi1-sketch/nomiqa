
CREATE OR REPLACE FUNCTION public.get_leaderboard_with_periods(p_limit integer DEFAULT 100)
RETURNS TABLE(
  user_id uuid,
  username text,
  total_points numeric,
  total_distance_meters numeric,
  daily_points bigint,
  weekly_points bigint,
  monthly_points bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    up.user_id,
    p.username,
    COALESCE(up.total_points, 0) as total_points,
    COALESCE(up.total_distance_meters, 0) as total_distance_meters,
    COALESCE(udl.points_earned, 0)::bigint as daily_points,
    COALESCE(wk.points_earned, 0)::bigint as weekly_points,
    COALESCE(uml.points_earned, 0)::bigint as monthly_points
  FROM user_points up
  LEFT JOIN profiles p ON p.user_id = up.user_id
  LEFT JOIN user_daily_limits udl 
    ON udl.user_id = up.user_id AND udl.limit_date = CURRENT_DATE
  LEFT JOIN user_monthly_limits uml 
    ON uml.user_id = up.user_id AND uml.month_key = to_char(CURRENT_DATE, 'YYYY-MM')
  LEFT JOIN LATERAL (
    SELECT COALESCE(SUM(udl2.points_earned), 0) as points_earned
    FROM user_daily_limits udl2
    WHERE udl2.user_id = up.user_id
      AND udl2.limit_date >= CURRENT_DATE - 7
  ) wk ON true
  WHERE up.total_points > 0
    AND COALESCE(up.is_frozen, false) = false
  ORDER BY up.total_points DESC NULLS LAST
  LIMIT p_limit;
END;
$function$;
