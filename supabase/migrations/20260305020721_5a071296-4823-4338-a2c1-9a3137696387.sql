
CREATE OR REPLACE FUNCTION public.add_referral_points(p_user_id uuid, p_points integer, p_source text DEFAULT 'referral'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_current_total numeric;
  v_is_frozen boolean;
BEGIN
  -- Check if user is frozen
  SELECT COALESCE(is_frozen, false), COALESCE(total_points, 0) 
  INTO v_is_frozen, v_current_total
  FROM user_points WHERE user_id = p_user_id;
  
  IF v_is_frozen THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'account_frozen',
      'points_added', 0,
      'message', 'Account is frozen. Bonus points cannot be awarded.'
    );
  END IF;
  
  IF p_points <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'no_points_to_add',
      'points_added', 0
    );
  END IF;
  
  -- Update user_points directly (NO daily, monthly, or lifetime cap)
  INSERT INTO public.user_points (user_id, total_points, pending_points)
  VALUES (p_user_id, p_points, 0)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_points = COALESCE(user_points.total_points, 0) + p_points,
    updated_at = now();
  
  -- Log for audit trail
  INSERT INTO public.security_audit_log (user_id, event_type, severity, details)
  VALUES (
    p_user_id,
    'bonus_points_awarded',
    'info',
    jsonb_build_object(
      'points', p_points,
      'source', p_source,
      'bypassed_all_caps', true
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'points_added', p_points,
    'source', p_source,
    'bypassed_all_caps', true,
    'new_total', COALESCE(v_current_total, 0) + p_points
  );
END;
$function$;
