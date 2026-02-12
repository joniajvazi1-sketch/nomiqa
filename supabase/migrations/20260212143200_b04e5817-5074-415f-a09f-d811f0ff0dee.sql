
-- Create a SECURITY DEFINER function to safely check team members' active status
-- This bypasses RLS to check contribution_sessions for specific user IDs
-- but only returns minimal data (user_id + is_active boolean)
CREATE OR REPLACE FUNCTION public.get_team_activity_status(p_team_user_ids UUID[])
RETURNS TABLE(team_user_id UUID, is_active BOOLEAN, last_session_start TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ten_minutes_ago TIMESTAMPTZ := now() - interval '10 minutes';
BEGIN
  -- Only allow authenticated users
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT DISTINCT ON (cs.user_id)
    cs.user_id AS team_user_id,
    (cs.status = 'active' OR (cs.ended_at IS NOT NULL AND cs.ended_at >= ten_minutes_ago)) AS is_active,
    cs.started_at AS last_session_start
  FROM contribution_sessions cs
  WHERE cs.user_id = ANY(p_team_user_ids)
    AND (cs.status = 'active' OR cs.ended_at >= ten_minutes_ago)
  ORDER BY cs.user_id, cs.started_at DESC;
END;
$$;
