-- Create a table to track monthly aggregates
CREATE TABLE IF NOT EXISTS public.user_monthly_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  month_key TEXT NOT NULL, -- Format: YYYY-MM
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, month_key)
);

-- Enable RLS
ALTER TABLE public.user_monthly_limits ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_monthly_limits
CREATE POLICY "Users can view own monthly limits"
ON public.user_monthly_limits FOR SELECT
USING (auth.uid() = user_id);

-- No direct user modifications (server-side only via service role)
CREATE POLICY "No direct inserts to monthly limits"
ON public.user_monthly_limits FOR INSERT
WITH CHECK (false);

CREATE POLICY "No direct updates to monthly limits"
ON public.user_monthly_limits FOR UPDATE
USING (false);

CREATE POLICY "No deletes from monthly limits"
ON public.user_monthly_limits FOR DELETE
USING (false);

-- Add remote config entries for point values
INSERT INTO public.app_remote_config (config_key, config_value, is_sensitive, description)
VALUES 
  ('max_daily_points', '200', false, 'Maximum points a user can earn per day'),
  ('max_monthly_points', '6000', false, 'Maximum points a user can earn per month'),
  ('background_base_points', '50', false, 'Base points for background contribution per day'),
  ('daily_challenge_total_target', '80', false, 'Total daily challenge points available'),
  ('weekly_challenge_total_target', '120', false, 'Total weekly challenge points available'),
  ('speed_test_bonus_points', '5', false, 'Bonus points per valid speed test'),
  ('speed_test_daily_limit', '5', false, 'Max bonus-earning speed tests per day'),
  ('early_user_boost_multiplier', '1.5', false, 'Early user boost multiplier (first 30 days)'),
  ('early_user_boost_days', '30', false, 'Number of days early user boost applies'),
  ('streak_max_multiplier', '2.0', false, 'Maximum streak bonus multiplier'),
  ('min_active_hours_for_rewards', '2', false, 'Minimum active hours before earning rewards'),
  ('referral_commission_rate', '0.05', false, 'Referral commission rate (5%)')
ON CONFLICT (config_key) DO NOTHING;

-- Update add_points_with_cap to also enforce monthly limits
CREATE OR REPLACE FUNCTION public.add_points_with_cap(
  p_user_id uuid, 
  p_base_points integer, 
  p_source text DEFAULT 'contribution'::text, 
  p_session_hours numeric DEFAULT NULL::numeric
)
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
  v_boost_multiplier numeric;
  v_time_multiplier numeric;
  v_streak_multiplier numeric;
  v_final_points integer;
  v_streak_days integer;
  v_last_bg_date date;
  v_today date := CURRENT_DATE;
  v_current_month text := to_char(CURRENT_DATE, 'YYYY-MM');
  v_monthly_points integer;
  v_daily_cap integer := 200;
  v_monthly_cap integer := 6000;
BEGIN
  -- Get caps from remote config (with fallbacks)
  SELECT COALESCE((config_value #>> '{}')::integer, 200) INTO v_daily_cap
  FROM app_remote_config WHERE config_key = 'max_daily_points';
  
  SELECT COALESCE((config_value #>> '{}')::integer, 6000) INTO v_monthly_cap
  FROM app_remote_config WHERE config_key = 'max_monthly_points';

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
  
  -- Calculate time multiplier
  v_time_multiplier := 1.0;
  IF p_session_hours IS NOT NULL THEN
    v_time_multiplier := public.get_time_multiplier(p_session_hours);
  END IF;
  
  -- Calculate streak multiplier (only for background/contribution sources)
  v_streak_multiplier := 1.0;
  IF p_source = 'contribution' OR p_source = 'background' THEN
    v_streak_multiplier := public.get_streak_multiplier(v_streak_days);
    
    -- Update streak tracking
    IF v_last_bg_date IS NULL THEN
      UPDATE user_points SET 
        background_streak_days = 1,
        last_background_date = v_today
      WHERE user_id = p_user_id;
    ELSIF v_last_bg_date = v_today - 1 THEN
      UPDATE user_points SET 
        background_streak_days = v_streak_days + 1,
        last_background_date = v_today
      WHERE user_id = p_user_id;
    ELSIF v_last_bg_date < v_today - 1 THEN
      UPDATE user_points SET 
        background_streak_days = 1,
        last_background_date = v_today
      WHERE user_id = p_user_id;
    END IF;
  END IF;
  
  -- Apply all multipliers BEFORE cap
  v_boosted_points := CEIL(p_base_points * v_boost_multiplier * v_time_multiplier * v_streak_multiplier);
  
  -- Apply BOTH daily AND monthly caps (take the minimum)
  v_final_points := LEAST(v_boosted_points, v_remaining_daily_cap, v_remaining_monthly_cap);
  
  -- If no points to add (either cap reached), return early
  IF v_final_points <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', CASE 
        WHEN v_remaining_monthly_cap <= 0 THEN 'monthly_cap_reached'
        ELSE 'daily_cap_reached'
      END,
      'points_added', 0,
      'daily_cap', v_daily_cap,
      'monthly_cap', v_monthly_cap,
      'points_today', (v_earning_status->>'points_today')::integer,
      'points_this_month', v_monthly_points
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
  INSERT INTO public.user_points (user_id, total_points, pending_points, background_streak_days, last_background_date)
  VALUES (p_user_id, v_final_points, 0, 1, v_today)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_points = COALESCE(user_points.total_points, 0) + v_final_points,
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
    'daily_capped', v_final_points < v_boosted_points AND v_remaining_daily_cap < v_remaining_monthly_cap,
    'monthly_capped', v_final_points < v_boosted_points AND v_remaining_monthly_cap <= v_remaining_daily_cap,
    'points_this_month', v_monthly_points + v_final_points,
    'monthly_cap', v_monthly_cap,
    'source', p_source
  );
END;
$function$;

-- Create helper function to get user's monthly earning status
CREATE OR REPLACE FUNCTION public.get_user_monthly_status(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_monthly_points integer;
  v_monthly_cap integer := 6000;
  v_current_month text := to_char(CURRENT_DATE, 'YYYY-MM');
BEGIN
  -- Get monthly cap from config
  SELECT COALESCE((config_value #>> '{}')::integer, 6000) INTO v_monthly_cap
  FROM app_remote_config WHERE config_key = 'max_monthly_points';
  
  -- Get current month's points
  SELECT COALESCE(points_earned, 0) INTO v_monthly_points
  FROM user_monthly_limits
  WHERE user_id = p_user_id AND month_key = v_current_month;
  
  RETURN jsonb_build_object(
    'points_this_month', COALESCE(v_monthly_points, 0),
    'monthly_cap', v_monthly_cap,
    'remaining_monthly', GREATEST(0, v_monthly_cap - COALESCE(v_monthly_points, 0)),
    'month_key', v_current_month
  );
END;
$function$;