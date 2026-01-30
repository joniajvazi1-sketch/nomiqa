-- ============================================================
-- PHASE 0: REMOVE CHECK CONSTRAINT TO ALLOW NEW METRIC TYPES
-- ============================================================

-- Drop the existing check constraint on metric_type
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_metric_type_check;

-- ============================================================
-- PHASE 1: REDESIGN DAILY CHALLENGES (Passive-First)
-- ============================================================

-- Clear existing challenges and insert new passive-first challenges
DELETE FROM challenges;

-- Daily Challenges (Total: ~80 points/day, all passive metrics)
INSERT INTO challenges (type, title, description, target_value, reward_points, metric_type, is_active) VALUES
  ('daily', 'App Active 6h', 'Keep the app running for 6 hours today', 6, 25, 'session_hours', true),
  ('daily', 'Move 1km', 'Travel at least 1 kilometer while contributing', 1000, 15, 'distance_meters', true),
  ('daily', 'Network Detected', 'Connect to different network types', 2, 10, 'network_changes', true),
  ('daily', 'Background Scan', 'Collect 30 data points in the background', 30, 20, 'data_points', true),
  ('daily', 'Stay Active', 'Have the app enabled at any point today', 1, 10, 'passive', true);

-- Weekly Challenges (Total: ~120 points/week, retention-focused)
INSERT INTO challenges (type, title, description, target_value, reward_points, metric_type, is_active) VALUES
  ('weekly', '5 Active Days', 'Contribute on 5 different days this week', 5, 40, 'active_days', true),
  ('weekly', '3 Locations', 'Contribute from 3 different areas this week', 3, 30, 'unique_locations', true),
  ('weekly', 'Network Explorer', 'Connect to 2 different network types this week', 2, 20, 'network_diversity', true),
  ('weekly', 'Stability Bonus', 'Keep contributing all week without pausing', 7, 30, 'no_pause', true);

-- Special Challenges (one-time achievements)
INSERT INTO challenges (type, title, description, target_value, reward_points, metric_type, is_active) VALUES
  ('special', 'First Contribution', 'Make your first network contribution', 1, 50, 'sessions', true),
  ('special', 'Distance Pioneer', 'Travel 100km total while contributing', 100000, 200, 'distance_meters', true),
  ('special', '7-Day Streak', 'Contribute for 7 consecutive days', 7, 100, 'streak_days', true);

-- Add new check constraint with expanded metric types
ALTER TABLE challenges ADD CONSTRAINT challenges_metric_type_check 
  CHECK (metric_type IN ('speed_tests', 'distance_meters', 'streak_days', 'data_points', 'sessions', 
                         'session_hours', 'network_changes', 'passive', 'active_days', 
                         'unique_locations', 'network_diversity', 'no_pause'));

-- ============================================================
-- PHASE 3: TIME-BASED DIMINISHING RETURNS FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_time_multiplier(hours NUMERIC) 
RETURNS NUMERIC AS $$
BEGIN
  IF hours < 2 THEN RETURN 0.0;
  ELSIF hours < 6 THEN RETURN 0.5;
  ELSIF hours < 12 THEN RETURN 1.0;
  ELSE RETURN 1.1;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER SET search_path = public;

-- ============================================================
-- PHASE 4: STREAK SYSTEM (Background Only)
-- ============================================================

ALTER TABLE user_points 
  ADD COLUMN IF NOT EXISTS background_streak_days INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_background_date DATE;

CREATE OR REPLACE FUNCTION public.get_streak_multiplier(streak_days INTEGER)
RETURNS NUMERIC AS $$
DECLARE
  multiplier NUMERIC := 1.0;
BEGIN
  IF streak_days >= 30 THEN
    multiplier := 2.0;
  ELSIF streak_days >= 7 THEN
    multiplier := 1.1 + (0.9 * (streak_days - 7) / 23.0);
  END IF;
  RETURN LEAST(multiplier, 2.0);
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER SET search_path = public;

-- ============================================================
-- PHASE 5: WEEKLY TRACKING COLUMNS
-- ============================================================

ALTER TABLE user_challenge_progress
  ADD COLUMN IF NOT EXISTS active_days_this_period INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unique_geohashes_this_period TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS network_types_this_period TEXT[] DEFAULT '{}';

-- ============================================================
-- PHASE 6: ADMIN CONTROLS (Remote Config)
-- ============================================================

INSERT INTO app_remote_config (config_key, config_value, description, is_sensitive) VALUES
  ('points_per_hour_active', '"5"', 'Base hourly rate for active contribution', false),
  ('daily_challenge_total_target', '"80"', 'Total daily challenge points target', false),
  ('weekly_challenge_total_target', '"120"', 'Total weekly challenge points target', false),
  ('background_base_points', '"50"', 'Base background earnings per day', false),
  ('streak_max_multiplier', '"2.0"', 'Maximum streak bonus multiplier', false),
  ('min_active_hours_for_rewards', '"2"', 'Minimum active hours required for any rewards', false)
ON CONFLICT (config_key) DO UPDATE SET 
  config_value = EXCLUDED.config_value,
  description = EXCLUDED.description,
  updated_at = now();

-- ============================================================
-- ENHANCED add_points_with_cap WITH TIME AND STREAK MULTIPLIERS
-- ============================================================

CREATE OR REPLACE FUNCTION public.add_points_with_cap(
  p_user_id uuid, 
  p_base_points integer, 
  p_source text DEFAULT 'contribution'::text,
  p_session_hours numeric DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_earning_status jsonb;
  v_boosted_points integer;
  v_remaining_cap integer;
  v_boost_multiplier numeric;
  v_time_multiplier numeric;
  v_streak_multiplier numeric;
  v_final_points integer;
  v_streak_days integer;
  v_last_bg_date date;
  v_today date := CURRENT_DATE;
BEGIN
  v_earning_status := public.get_user_earning_status(p_user_id);
  v_remaining_cap := (v_earning_status->>'remaining_cap')::integer;
  v_boost_multiplier := (v_earning_status->>'boost_multiplier')::numeric;
  
  SELECT background_streak_days, last_background_date 
  INTO v_streak_days, v_last_bg_date
  FROM user_points WHERE user_id = p_user_id;
  
  v_streak_days := COALESCE(v_streak_days, 0);
  
  v_time_multiplier := 1.0;
  IF p_session_hours IS NOT NULL THEN
    v_time_multiplier := public.get_time_multiplier(p_session_hours);
  END IF;
  
  v_streak_multiplier := 1.0;
  IF p_source = 'contribution' OR p_source = 'background' THEN
    v_streak_multiplier := public.get_streak_multiplier(v_streak_days);
    
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
  
  v_boosted_points := CEIL(p_base_points * v_boost_multiplier * v_time_multiplier * v_streak_multiplier);
  v_final_points := LEAST(v_boosted_points, v_remaining_cap);
  
  IF v_final_points <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'daily_cap_reached',
      'points_added', 0,
      'daily_cap', 200,
      'points_today', (v_earning_status->>'points_today')::integer
    );
  END IF;
  
  INSERT INTO public.user_daily_limits (user_id, limit_date, points_earned)
  VALUES (p_user_id, CURRENT_DATE, v_final_points)
  ON CONFLICT (user_id, limit_date) 
  DO UPDATE SET 
    points_earned = COALESCE(user_daily_limits.points_earned, 0) + v_final_points,
    updated_at = now();
  
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
    'capped', v_final_points < v_boosted_points,
    'source', p_source
  );
END;
$function$;