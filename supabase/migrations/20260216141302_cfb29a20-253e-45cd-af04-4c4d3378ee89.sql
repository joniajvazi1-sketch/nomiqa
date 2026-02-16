-- Drop and recreate with username in return type
DROP FUNCTION IF EXISTS public.get_team_activity_status(uuid[]);

CREATE OR REPLACE FUNCTION public.get_team_activity_status(p_team_user_ids uuid[])
 RETURNS TABLE(team_user_id uuid, is_active boolean, last_session_start timestamp with time zone, username text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  ten_minutes_ago TIMESTAMPTZ := now() - interval '10 minutes';
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT 
    u.uid AS team_user_id,
    COALESCE(cs_active.is_active, false) AS is_active,
    cs_active.last_session_start,
    p.username
  FROM unnest(p_team_user_ids) AS u(uid)
  LEFT JOIN profiles p ON p.user_id = u.uid
  LEFT JOIN LATERAL (
    SELECT 
      true AS is_active,
      cs.started_at AS last_session_start
    FROM contribution_sessions cs
    WHERE cs.user_id = u.uid
      AND (cs.status = 'active' OR (cs.ended_at IS NOT NULL AND cs.ended_at >= ten_minutes_ago))
    ORDER BY cs.started_at DESC
    LIMIT 1
  ) cs_active ON true;
END;
$function$;