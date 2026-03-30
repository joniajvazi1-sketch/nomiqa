
-- Add version gate to add_points_with_cap (4-param version)
CREATE OR REPLACE FUNCTION public.add_points_with_cap(p_user_id uuid, p_base_points integer, p_source text DEFAULT 'contribution'::text, p_session_hours numeric DEFAULT NULL::numeric, p_app_version text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_min_version text;
  v_earning_status jsonb;
  v_boosted_points integer;
  v_remaining_daily_cap integer;
  v_remaining_monthly_cap integer;
  v_remaining_lifetime_cap integer;
  v_boost_multiplier numeric;
  v_time_multiplier numeric;
  v_streak_multiplier numeric;
  v_referral_boost numeric;
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
  -- VERSION GATE: Check minimum app version if provided
  IF p_app_version IS NOT NULL THEN
    SELECT config_value #>> '{}' INTO v_min_version
    FROM app_remote_config WHERE config_key = 'min_app_version';
    
    IF v_min_version IS NOT NULL AND p_app_version < v_min_version THEN
      RETURN jsonb_build_object(
        'success', false,
        'reason', 'upgrade_required',
        'points_added', 0,
        'min_version', v_min_version,
        'current_version', p_app_version
      );
    END IF;
  END IF;

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

  -- Get current earning status (includes daily points and early-user boost)
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
  IF p_source = 'contribution' OR p_source = 'background' THEN
    IF v_last_bg_date IS NULL THEN
      UPDATE user_points SET 
        background_streak_days = 1,
        last_background_date = v_today,
        contribution_streak_days = 1,
        last_contribution_date = v_today
      WHERE user_id = p_user_id;
      v_streak_days := 1;
    ELSIF v_last_bg_date = v_today - 1 THEN
      v_streak_days := v_streak_days + 1;
      UPDATE user_points SET 
        background_streak_days = v_streak_days,
        last_background_date = v_today,
        contribution_streak_days = v_streak_days,
        last_contribution_date = v_today
      WHERE user_id = p_user_id;
    ELSIF v_last_bg_date < v_today - 1 THEN
      v_streak_days := 1;
      UPDATE user_points SET 
        background_streak_days = 1,
        last_background_date = v_today,
        contribution_streak_days = 1,
        last_contribution_date = v_today
      WHERE user_id = p_user_id;
    ELSE
      UPDATE user_points SET
        contribution_streak_days = background_streak_days,
        last_contribution_date = v_today
      WHERE user_id = p_user_id
        AND (contribution_streak_days IS DISTINCT FROM background_streak_days
             OR last_contribution_date IS DISTINCT FROM v_today);
    END IF;
  END IF;
  
  -- Calculate time multiplier
  v_time_multiplier := 1.0;
  IF p_session_hours IS NOT NULL THEN
    v_time_multiplier := public.get_time_multiplier(p_session_hours);
  END IF;
  
  -- Calculate streak multiplier (weekly: +10% per week, max 100% at 10 weeks)
  v_streak_multiplier := 1.0;
  IF p_source = 'contribution' OR p_source = 'background' THEN
    v_streak_multiplier := public.get_streak_multiplier(v_streak_days);
  END IF;
  
  -- Get referral mining boost (stacks on top)
  v_referral_boost := 1.0;
  SELECT 1.0 + COALESCE(MAX(miner_boost_percentage), 0) / 100.0 
  INTO v_referral_boost
  FROM affiliates
  WHERE user_id = p_user_id AND status = 'active';
  
  v_referral_boost := COALESCE(v_referral_boost, 1.0);
  
  -- Apply all multipliers BEFORE cap:
  v_boosted_points := CEIL(p_base_points * v_boost_multiplier * v_time_multiplier * v_streak_multiplier * v_referral_boost);
  
  -- Apply ALL caps (daily, monthly, AND lifetime - take the minimum)
  v_final_points := LEAST(v_boosted_points, v_remaining_daily_cap, v_remaining_monthly_cap, v_remaining_lifetime_cap);
  
  -- If no points to add, return early (streak already updated above)
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
      'streak_days', v_streak_days,
      'streak_boost', v_streak_multiplier,
      'referral_boost', v_referral_boost
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
  
  -- Update user_points total
  INSERT INTO public.user_points (user_id, total_points, pending_points, background_streak_days, last_background_date, contribution_streak_days, last_contribution_date)
  VALUES (p_user_id, v_final_points, 0, v_streak_days, v_today, v_streak_days, v_today)
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
    'referral_boost', v_referral_boost,
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

-- Add version gate to add_referral_points
CREATE OR REPLACE FUNCTION public.add_referral_points(p_user_id uuid, p_points integer, p_source text DEFAULT 'referral'::text, p_app_version text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_min_version text;
  v_current_total numeric;
  v_is_frozen boolean;
  v_lifetime_cap integer := 100000;
  v_remaining_lifetime integer;
  v_final_points integer;
BEGIN
  -- VERSION GATE: Check minimum app version if provided
  IF p_app_version IS NOT NULL THEN
    SELECT config_value #>> '{}' INTO v_min_version
    FROM app_remote_config WHERE config_key = 'min_app_version';
    
    IF v_min_version IS NOT NULL AND p_app_version < v_min_version THEN
      RETURN jsonb_build_object(
        'success', false,
        'reason', 'upgrade_required',
        'points_added', 0,
        'min_version', v_min_version,
        'current_version', p_app_version
      );
    END IF;
  END IF;

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

-- Add version gate to claim_challenge_reward
CREATE OR REPLACE FUNCTION public.claim_challenge_reward(p_user_id uuid, p_challenge_id uuid, p_reward_points integer, p_bonus_points integer DEFAULT 0, p_period_start date DEFAULT CURRENT_DATE, p_is_daily boolean DEFAULT false, p_app_version text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_min_version text;
  v_total_reward integer;
  v_new_total numeric;
  v_current_streak integer;
  v_last_completed date;
  v_new_streak integer;
  v_all_daily_done boolean := false;
  v_cap_result jsonb;
BEGIN
  -- VERSION GATE: Check minimum app version if provided
  IF p_app_version IS NOT NULL THEN
    SELECT config_value #>> '{}' INTO v_min_version
    FROM app_remote_config WHERE config_key = 'min_app_version';
    
    IF v_min_version IS NOT NULL AND p_app_version < v_min_version THEN
      RETURN jsonb_build_object(
        'success', false,
        'reason', 'upgrade_required',
        'points_added', 0,
        'min_version', v_min_version,
        'current_version', p_app_version
      );
    END IF;
  END IF;

  v_total_reward := p_reward_points + p_bonus_points;

  -- Check if already claimed (idempotency)
  IF EXISTS (
    SELECT 1 FROM public.user_challenge_progress
    WHERE user_id = p_user_id 
      AND challenge_id = p_challenge_id 
      AND period_start = p_period_start
      AND claimed_at IS NOT NULL
  ) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_claimed');
  END IF;

  -- Upsert progress with claimed timestamp
  INSERT INTO public.user_challenge_progress (
    user_id, challenge_id, current_value, period_start, completed_at, claimed_at
  ) VALUES (
    p_user_id, p_challenge_id, 0, p_period_start, now(), now()
  )
  ON CONFLICT (user_id, challenge_id, period_start)
  DO UPDATE SET 
    completed_at = COALESCE(user_challenge_progress.completed_at, now()),
    claimed_at = now(),
    updated_at = now();

  -- Award points as BONUS (bypass daily/monthly caps, only lifetime cap enforced)
  v_cap_result := public.add_referral_points(p_user_id, v_total_reward, 'challenge_bonus');
  
  -- Get the new total regardless of cap result
  SELECT total_points INTO v_new_total
  FROM public.user_points
  WHERE user_id = p_user_id;

  -- If this is a daily challenge, check if all daily challenges are now claimed
  IF p_is_daily THEN
    SELECT NOT EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.type = 'daily' AND c.is_active = true
      AND NOT EXISTS (
        SELECT 1 FROM public.user_challenge_progress ucp
        WHERE ucp.user_id = p_user_id
          AND ucp.challenge_id = c.id
          AND ucp.period_start = CURRENT_DATE
          AND ucp.claimed_at IS NOT NULL
      )
    ) INTO v_all_daily_done;

    IF v_all_daily_done THEN
      -- Update daily challenge streak
      SELECT daily_challenge_streak_days, last_all_daily_completed_date
      INTO v_current_streak, v_last_completed
      FROM public.user_points
      WHERE user_id = p_user_id;

      IF v_last_completed IS NULL OR v_last_completed < CURRENT_DATE THEN
        IF v_last_completed = CURRENT_DATE - 1 THEN
          v_new_streak := COALESCE(v_current_streak, 0) + 1;
        ELSE
          v_new_streak := 1;
        END IF;

        UPDATE public.user_points
        SET daily_challenge_streak_days = v_new_streak,
            last_all_daily_completed_date = CURRENT_DATE
        WHERE user_id = p_user_id;
      END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'points_added', COALESCE((v_cap_result->>'points_added')::integer, 0),
    'new_total', v_new_total,
    'all_daily_done', v_all_daily_done,
    'capped', NOT COALESCE((v_cap_result->>'success')::boolean, false),
    'is_bonus', true
  );
END;
$function$;

-- Also update the 3-param overload of add_points_with_cap to include version gate
CREATE OR REPLACE FUNCTION public.add_points_with_cap(p_user_id uuid, p_base_points integer, p_source text DEFAULT 'contribution'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Delegate to the full version (no version check, no session hours)
  RETURN public.add_points_with_cap(p_user_id, p_base_points, p_source, NULL::numeric, NULL::text);
END;
$function$;
