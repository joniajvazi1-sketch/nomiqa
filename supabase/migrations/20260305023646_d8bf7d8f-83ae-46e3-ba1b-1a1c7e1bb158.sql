
CREATE OR REPLACE FUNCTION public.add_referral_points(p_user_id uuid, p_points integer, p_source text DEFAULT 'referral'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_current_total numeric;
  v_is_frozen boolean;
  v_lifetime_cap integer := 100000;
  v_remaining_lifetime integer;
  v_final_points integer;
BEGIN
  -- Get lifetime cap from config
  SELECT COALESCE((config_value #>> '{}')::integer, 100000) INTO v_lifetime_cap
  FROM app_remote_config WHERE config_key = 'max_lifetime_points';

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
  
  -- Enforce lifetime cap
  v_remaining_lifetime := GREATEST(0, v_lifetime_cap - COALESCE(v_current_total, 0)::integer);
  
  IF v_remaining_lifetime <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'lifetime_cap_reached',
      'points_added', 0,
      'lifetime_cap', v_lifetime_cap,
      'current_total', v_current_total
    );
  END IF;
  
  -- Clamp to remaining lifetime cap
  v_final_points := LEAST(p_points, v_remaining_lifetime);
  
  -- Update user_points (bypasses daily/monthly caps, but NOT lifetime)
  INSERT INTO public.user_points (user_id, total_points, pending_points)
  VALUES (p_user_id, v_final_points, 0)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_points = COALESCE(user_points.total_points, 0) + v_final_points,
    lifetime_cap_reached = (COALESCE(user_points.total_points, 0) + v_final_points) >= v_lifetime_cap,
    updated_at = now();
  
  -- Log for audit trail
  INSERT INTO public.security_audit_log (user_id, event_type, severity, details)
  VALUES (
    p_user_id,
    'bonus_points_awarded',
    'info',
    jsonb_build_object(
      'points_requested', p_points,
      'points_awarded', v_final_points,
      'source', p_source,
      'lifetime_capped', v_final_points < p_points,
      'bypassed_daily_monthly', true
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'points_added', v_final_points,
    'source', p_source,
    'bypassed_daily_monthly', true,
    'lifetime_capped', v_final_points < p_points,
    'new_total', COALESCE(v_current_total, 0) + v_final_points
  );
END;
$function$;
