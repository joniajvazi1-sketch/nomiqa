
-- Update get_user_earning_status to scale daily cap with streak + referral boosts
CREATE OR REPLACE FUNCTION public.get_user_earning_status(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_points_today integer;
  v_base_daily_cap integer := 200;
  v_effective_daily_cap integer;
  v_boost_multiplier numeric := 1.0;
  v_streak_multiplier numeric := 1.0;
  v_referral_boost numeric := 0;
  v_user_created_at timestamp with time zone;
  v_days_since_join integer;
  v_streak_days integer;
BEGIN
  -- Get today's points
  SELECT COALESCE(points_earned, 0) INTO v_points_today
  FROM public.user_daily_limits
  WHERE user_id = p_user_id
    AND limit_date = CURRENT_DATE;

  IF v_points_today IS NULL THEN
    v_points_today := 0;
  END IF;

  -- Get user's join date and streak from profiles/user_points
  SELECT p.created_at INTO v_user_created_at
  FROM public.profiles p
  WHERE p.user_id = p_user_id;

  -- Calculate days since join
  IF v_user_created_at IS NOT NULL THEN
    v_days_since_join := EXTRACT(DAY FROM (now() - v_user_created_at));

    -- Early user boost: +50% for first 30 days
    IF v_days_since_join < 30 THEN
      v_boost_multiplier := 1.5;
    END IF;
  END IF;

  -- Get streak days
  SELECT COALESCE(up.contribution_streak_days, 0) INTO v_streak_days
  FROM public.user_points up
  WHERE up.user_id = p_user_id;

  IF v_streak_days IS NULL THEN
    v_streak_days := 0;
  END IF;

  -- Calculate streak multiplier: +10% per full week, max 100% (2.0x) at 10 weeks
  v_streak_multiplier := 1.0 + LEAST(FLOOR(v_streak_days / 7.0) * 0.10, 1.0);

  -- Get referral boost from affiliates table
  SELECT COALESCE(a.miner_boost_percentage, 0) INTO v_referral_boost
  FROM public.affiliates a
  WHERE a.user_id = p_user_id;

  IF v_referral_boost IS NULL THEN
    v_referral_boost := 0;
  END IF;

  -- Scale the daily cap by the total boost (streak + referral)
  -- e.g. 200 base * 1.3 streak * 1.2 referral = 312 effective cap
  v_effective_daily_cap := CEIL(v_base_daily_cap * v_streak_multiplier * (1.0 + v_referral_boost / 100.0));

  -- Combine all multipliers for point earning
  v_boost_multiplier := v_boost_multiplier * v_streak_multiplier * (1.0 + v_referral_boost / 100.0);

  RETURN jsonb_build_object(
    'points_today', v_points_today,
    'daily_cap', v_effective_daily_cap,
    'remaining_cap', GREATEST(0, v_effective_daily_cap - v_points_today),
    'boost_multiplier', v_boost_multiplier,
    'days_since_join', COALESCE(v_days_since_join, 0),
    'is_early_user', COALESCE(v_days_since_join < 30, false),
    'streak_days', v_streak_days,
    'streak_multiplier', v_streak_multiplier,
    'referral_boost_pct', v_referral_boost
  );
END;
$$;

-- Also update the monthly status to scale monthly cap
CREATE OR REPLACE FUNCTION public.get_user_monthly_status(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base_monthly_cap integer := 6000;
  v_effective_monthly_cap integer;
  v_points_this_month integer;
  v_month_key text;
  v_streak_days integer;
  v_streak_multiplier numeric;
  v_referral_boost numeric;
BEGIN
  v_month_key := to_char(CURRENT_DATE, 'YYYY-MM');

  -- Get points earned this month
  SELECT COALESCE(SUM(points_earned), 0) INTO v_points_this_month
  FROM public.user_daily_limits
  WHERE user_id = p_user_id
    AND to_char(limit_date, 'YYYY-MM') = v_month_key;

  -- Get streak
  SELECT COALESCE(up.contribution_streak_days, 0) INTO v_streak_days
  FROM public.user_points up
  WHERE up.user_id = p_user_id;
  v_streak_days := COALESCE(v_streak_days, 0);

  v_streak_multiplier := 1.0 + LEAST(FLOOR(v_streak_days / 7.0) * 0.10, 1.0);

  -- Get referral boost
  SELECT COALESCE(a.miner_boost_percentage, 0) INTO v_referral_boost
  FROM public.affiliates a
  WHERE a.user_id = p_user_id;
  v_referral_boost := COALESCE(v_referral_boost, 0);

  -- Scale monthly cap
  v_effective_monthly_cap := CEIL(v_base_monthly_cap * v_streak_multiplier * (1.0 + v_referral_boost / 100.0));

  RETURN jsonb_build_object(
    'points_this_month', v_points_this_month,
    'monthly_cap', v_effective_monthly_cap,
    'remaining_monthly', GREATEST(0, v_effective_monthly_cap - v_points_this_month),
    'month_key', v_month_key
  );
END;
$$;
