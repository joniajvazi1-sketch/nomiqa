
CREATE OR REPLACE FUNCTION public.add_points_with_cap(p_user_id uuid, p_base_points integer, p_source text DEFAULT 'contribution'::text, p_session_hours numeric DEFAULT NULL::numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_earning_status jsonb;
  v_boosted_points integer;
  v_remaining_daily_cap integer;
  v_remaining_monthly_cap integer;
  v_remaining_lifetime_cap integer;
  v_boost_multiplier numeric;
  v_time_multiplier numeric;
  v_streak_multiplier numeric;
  v_final_points integer;
  v_streak_days integer;
  v_last_bg_date date;
  v_today date := CURRENT_DATE;
  v_current_month text := to_char(CURRENT_DATE, 'YYYY-MM');
  v_monthly_points integer;
  v_current_total_points numeric;
  v_daily_cap integer := 200;
  v_monthly_cap integer := 6000;
  v_lifetime_cap integer := 100000;
  v_is_frozen boolean := false;
BEGIN
  -- Get caps from remote config (with fallbacks)
  SELECT COALESCE((config_value #>> '{}')::integer, 200) INTO v_daily_cap
  FROM app_remote_config WHERE config_key = 'max_daily_points';
  
  SELECT COALESCE((config_value #>> '{}')::integer, 6000) INTO v_monthly_cap
  FROM app_remote_config WHERE config_key = 'max_monthly_points';
  
  SELECT COALESCE((config_value #>> '{}')::integer, 100000) INTO v_lifetime_cap
  FROM app_remote_config WHERE config_key = 'max_lifetime_points';

  -- Check if user is frozen
  SELECT COALESCE(is_frozen, false), COALESCE(total_points, 0) 
  INTO v_is_frozen, v_current_total_points
  FROM user_points WHERE user_id = p_user_id;
  
  IF v_is_frozen THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'account_frozen',
      'points_added', 0,
      'message', 'Your account has been temporarily suspended. Please contact support.'
    );
  END IF;
  
  -- Check lifetime cap
  IF v_current_total_points IS NOT NULL AND v_current_total_points >= v_lifetime_cap THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'lifetime_cap_reached',
      'points_added', 0,
      'lifetime_cap', v_lifetime_cap,
      'current_total', v_current_total_points
    );
  END IF;
  
  v_remaining_lifetime_cap := GREATEST(0, v_lifetime_cap - COALESCE(v_current_total_points, 0));

  -- Get current earning status (includes daily points and boost)
  v_earning_status := public.get_user_earning_status(p_user_id);
  v_remaining_daily_cap := (v_earning_status->>'remaining_cap')::integer;
  v_boost_multiplier := (v_earning_status->>'boost_multiplier')::numeric;
  
  -- Get current month's points
  SELECT COALESCE(points_earned, 0) INTO v_monthly_points
  FROM user_monthly_limits
  WHERE user_id = p_user_id AND month_key = v_current_month;
  
  IF v_monthly_points IS NULL THEN
    v_monthly_points := 0;
  END IF;
  
  v_remaining_monthly_cap := GREATEST(0, v_monthly_cap - v_monthly_points);
  
  -- Get streak info
  SELECT background_streak_days, last_background_date 
  INTO v_streak_days, v_last_bg_date
  FROM user_points WHERE user_id = p_user_id;
  
  v_streak_days := COALESCE(v_streak_days, 0);
  
  -- *** STREAK TRACKING MOVED BEFORE CAP CHECK ***
  -- Update streak ALWAYS for contribution/background sources, regardless of cap
  IF p_source = 'contribution' OR p_source = 'background' THEN
    IF v_last_bg_date IS NULL THEN
      UPDATE user_points SET 
        background_streak_days = 1,
        last_background_date = v_today
      WHERE user_id = p_user_id;
      v_streak_days := 1;
    ELSIF v_last_bg_date = v_today - 1 THEN
      v_streak_days := v_streak_days + 1;
      UPDATE user_points SET 
        background_streak_days = v_streak_days,
        last_background_date = v_today
      WHERE user_id = p_user_id;
    ELSIF v_last_bg_date < v_today - 1 THEN
      v_streak_days := 1;
      UPDATE user_points SET 
        background_streak_days = 1,
        last_background_date = v_today
      WHERE user_id = p_user_id;
    END IF;
    -- If v_last_bg_date = v_today, streak is already set for today, no change needed
  END IF;
  
  -- Calculate time multiplier
  v_time_multiplier := 1.0;
  IF p_session_hours IS NOT NULL THEN
    v_time_multiplier := public.get_time_multiplier(p_session_hours);
  END IF;
  
  -- Calculate streak multiplier (only for background/contribution sources)
  v_streak_multiplier := 1.0;
  IF p_source = 'contribution' OR p_source = 'background' THEN
    v_streak_multiplier := public.get_streak_multiplier(v_streak_days);
  END IF;
  
  -- Apply all multipliers BEFORE cap
  v_boosted_points := CEIL(p_base_points * v_boost_multiplier * v_time_multiplier * v_streak_multiplier);
  
  -- Apply ALL caps (daily, monthly, AND lifetime - take the minimum)
  v_final_points := LEAST(v_boosted_points, v_remaining_daily_cap, v_remaining_monthly_cap, v_remaining_lifetime_cap);
  
  -- If no points to add (any cap reached), return early BUT streak is already updated above
  IF v_final_points <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', CASE 
        WHEN v_remaining_lifetime_cap <= 0 THEN 'lifetime_cap_reached'
        WHEN v_remaining_monthly_cap <= 0 THEN 'monthly_cap_reached'
        ELSE 'daily_cap_reached'
      END,
      'points_added', 0,
      'daily_cap', v_daily_cap,
      'monthly_cap', v_monthly_cap,
      'lifetime_cap', v_lifetime_cap,
      'points_today', (v_earning_status->>'points_today')::integer,
      'points_this_month', v_monthly_points,
      'current_total', v_current_total_points,
      'streak_days', v_streak_days
    );
  END IF;
  
  -- Update daily limit record
  INSERT INTO public.user_daily_limits (user_id, limit_date, points_earned)
  VALUES (p_user_id, CURRENT_DATE, v_final_points)
  ON CONFLICT (user_id, limit_date) 
  DO UPDATE SET 
    points_earned = COALESCE(user_daily_limits.points_earned, 0) + v_final_points,
    updated_at = now();
  
  -- Update monthly limit record
  INSERT INTO public.user_monthly_limits (user_id, month_key, points_earned)
  VALUES (p_user_id, v_current_month, v_final_points)
  ON CONFLICT (user_id, month_key) 
  DO UPDATE SET 
    points_earned = COALESCE(user_monthly_limits.points_earned, 0) + v_final_points,
    updated_at = now();
  
  -- Update user_points total and check if lifetime cap reached
  INSERT INTO public.user_points (user_id, total_points, pending_points, background_streak_days, last_background_date)
  VALUES (p_user_id, v_final_points, 0, v_streak_days, v_today)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_points = COALESCE(user_points.total_points, 0) + v_final_points,
    lifetime_cap_reached = (COALESCE(user_points.total_points, 0) + v_final_points) >= v_lifetime_cap,
    updated_at = now();
  
  RETURN jsonb_build_object(
    'success', true,
    'base_points', p_base_points,
    'boost_multiplier', v_boost_multiplier,
    'time_multiplier', v_time_multiplier,
    'streak_multiplier', v_streak_multiplier,
    'streak_days', v_streak_days,
    'boosted_points', v_boosted_points,
    'points_added', v_final_points,
    'daily_capped', v_final_points < v_boosted_points AND v_remaining_daily_cap < LEAST(v_remaining_monthly_cap, v_remaining_lifetime_cap),
    'monthly_capped', v_final_points < v_boosted_points AND v_remaining_monthly_cap <= LEAST(v_remaining_daily_cap, v_remaining_lifetime_cap),
    'lifetime_capped', v_final_points < v_boosted_points AND v_remaining_lifetime_cap <= LEAST(v_remaining_daily_cap, v_remaining_monthly_cap),
    'points_this_month', v_monthly_points + v_final_points,
    'monthly_cap', v_monthly_cap,
    'lifetime_cap', v_lifetime_cap,
    'source', p_source
  );
END;
$function$;
