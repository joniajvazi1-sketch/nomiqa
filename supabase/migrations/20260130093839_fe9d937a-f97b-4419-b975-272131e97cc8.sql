-- Add daily points tracking column to user_daily_limits
ALTER TABLE public.user_daily_limits 
ADD COLUMN IF NOT EXISTS points_earned integer DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.user_daily_limits.points_earned IS 'Total points earned today, hard capped at 200/day';

-- Create function to check daily point cap and get boost multiplier
CREATE OR REPLACE FUNCTION public.get_user_earning_status(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_points_today integer;
  v_daily_cap integer := 200;
  v_boost_multiplier numeric := 1.0;
  v_user_created_at timestamp with time zone;
  v_days_since_join integer;
BEGIN
  -- Get today's points
  SELECT COALESCE(points_earned, 0) INTO v_points_today
  FROM public.user_daily_limits
  WHERE user_id = p_user_id
    AND limit_date = CURRENT_DATE;
  
  IF v_points_today IS NULL THEN
    v_points_today := 0;
  END IF;
  
  -- Get user's join date from profiles
  SELECT created_at INTO v_user_created_at
  FROM public.profiles
  WHERE user_id = p_user_id;
  
  -- Calculate days since join
  IF v_user_created_at IS NOT NULL THEN
    v_days_since_join := EXTRACT(DAY FROM (now() - v_user_created_at));
    
    -- Early user boost: +50% for first 30 days
    IF v_days_since_join < 30 THEN
      v_boost_multiplier := 1.5;
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'points_today', v_points_today,
    'daily_cap', v_daily_cap,
    'remaining_cap', GREATEST(0, v_daily_cap - v_points_today),
    'boost_multiplier', v_boost_multiplier,
    'days_since_join', COALESCE(v_days_since_join, 0),
    'is_early_user', COALESCE(v_days_since_join < 30, false)
  );
END;
$$;

-- Create function to add points with cap enforcement
CREATE OR REPLACE FUNCTION public.add_points_with_cap(
  p_user_id uuid,
  p_base_points integer,
  p_source text DEFAULT 'contribution'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_earning_status jsonb;
  v_points_to_add integer;
  v_boosted_points integer;
  v_remaining_cap integer;
  v_boost_multiplier numeric;
  v_final_points integer;
BEGIN
  -- Get current earning status
  v_earning_status := public.get_user_earning_status(p_user_id);
  v_remaining_cap := (v_earning_status->>'remaining_cap')::integer;
  v_boost_multiplier := (v_earning_status->>'boost_multiplier')::numeric;
  
  -- Apply boost multiplier
  v_boosted_points := CEIL(p_base_points * v_boost_multiplier);
  
  -- Apply daily cap
  v_final_points := LEAST(v_boosted_points, v_remaining_cap);
  
  -- If no points to add (cap reached), return early
  IF v_final_points <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'daily_cap_reached',
      'points_added', 0,
      'daily_cap', 200,
      'points_today', (v_earning_status->>'points_today')::integer
    );
  END IF;
  
  -- Update or insert daily limit record
  INSERT INTO public.user_daily_limits (user_id, limit_date, points_earned)
  VALUES (p_user_id, CURRENT_DATE, v_final_points)
  ON CONFLICT (user_id, limit_date) 
  DO UPDATE SET 
    points_earned = COALESCE(user_daily_limits.points_earned, 0) + v_final_points,
    updated_at = now();
  
  -- Update user_points total
  INSERT INTO public.user_points (user_id, total_points, pending_points)
  VALUES (p_user_id, v_final_points, 0)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_points = COALESCE(user_points.total_points, 0) + v_final_points,
    updated_at = now();
  
  RETURN jsonb_build_object(
    'success', true,
    'base_points', p_base_points,
    'boost_multiplier', v_boost_multiplier,
    'boosted_points', v_boosted_points,
    'points_added', v_final_points,
    'capped', v_final_points < v_boosted_points,
    'source', p_source
  );
END;
$$;