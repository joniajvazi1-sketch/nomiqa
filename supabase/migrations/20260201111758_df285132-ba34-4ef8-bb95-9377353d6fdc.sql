-- ============================================================
-- NOMIQA POINTS SYSTEM HARDENING MIGRATION
-- Implements: referral caps, user freeze, lifetime cap, velocity detection
-- ============================================================

-- 1. Add is_frozen flag to user_points for abuse prevention
ALTER TABLE public.user_points 
ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS frozen_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS frozen_reason TEXT,
ADD COLUMN IF NOT EXISTS lifetime_cap_reached BOOLEAN DEFAULT FALSE;

-- 2. Add referral cap tracking to affiliates table
ALTER TABLE public.affiliates
ADD COLUMN IF NOT EXISTS max_referrals INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS referrals_capped_at TIMESTAMP WITH TIME ZONE;

-- 3. Create referral velocity tracking table for abuse detection
CREATE TABLE IF NOT EXISTS public.referral_velocity_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id),
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  referral_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(affiliate_id, window_start)
);

-- Enable RLS
ALTER TABLE public.referral_velocity_tracking ENABLE ROW LEVEL SECURITY;

-- RLS: Only admins can view velocity data
CREATE POLICY "Only admins can view velocity tracking" 
ON public.referral_velocity_tracking 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "No user inserts to velocity tracking" 
ON public.referral_velocity_tracking 
FOR INSERT 
WITH CHECK (false);

CREATE POLICY "No user updates to velocity tracking" 
ON public.referral_velocity_tracking 
FOR UPDATE 
USING (false);

CREATE POLICY "No user deletes from velocity tracking" 
ON public.referral_velocity_tracking 
FOR DELETE 
USING (false);

-- 4. Create activity requirement table for referral bonuses
CREATE TABLE IF NOT EXISTS public.pending_referral_bonuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL,
  referred_user_id UUID NOT NULL,
  bonus_points INTEGER NOT NULL DEFAULT 30,
  requirement_type TEXT NOT NULL DEFAULT 'first_contribution',
  requirement_met BOOLEAN DEFAULT FALSE,
  requirement_met_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '30 days'),
  UNIQUE(referred_user_id)
);

-- Enable RLS
ALTER TABLE public.pending_referral_bonuses ENABLE ROW LEVEL SECURITY;

-- RLS policies for pending_referral_bonuses
CREATE POLICY "Users can view their pending bonuses" 
ON public.pending_referral_bonuses 
FOR SELECT 
USING (auth.uid() = referrer_user_id);

CREATE POLICY "No user inserts to pending bonuses" 
ON public.pending_referral_bonuses 
FOR INSERT 
WITH CHECK (false);

CREATE POLICY "No user updates to pending bonuses" 
ON public.pending_referral_bonuses 
FOR UPDATE 
USING (false);

CREATE POLICY "No user deletes from pending bonuses" 
ON public.pending_referral_bonuses 
FOR DELETE 
USING (false);

-- 5. Update add_points_with_cap to enforce freeze and lifetime cap
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
  
  -- Apply ALL caps (daily, monthly, AND lifetime - take the minimum)
  v_final_points := LEAST(v_boosted_points, v_remaining_daily_cap, v_remaining_monthly_cap, v_remaining_lifetime_cap);
  
  -- If no points to add (any cap reached), return early
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
      'current_total', v_current_total_points
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
  VALUES (p_user_id, v_final_points, 0, 1, v_today)
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

-- 6. Create function to freeze a user's points (admin only)
CREATE OR REPLACE FUNCTION public.admin_freeze_user_points(
  p_target_user_id uuid,
  p_reason text DEFAULT 'Suspicious activity detected'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow admins
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  
  UPDATE public.user_points 
  SET 
    is_frozen = true,
    frozen_at = now(),
    frozen_reason = p_reason
  WHERE user_id = p_target_user_id;
  
  -- Log the action
  INSERT INTO public.security_audit_log (user_id, event_type, severity, details)
  VALUES (
    auth.uid(),
    'user_points_frozen',
    'warn',
    jsonb_build_object(
      'target_user_id', p_target_user_id,
      'reason', p_reason,
      'frozen_by', auth.uid()
    )
  );
  
  RETURN jsonb_build_object('success', true, 'message', 'User points frozen');
END;
$function$;

-- 7. Create function to unfreeze a user's points (admin only)
CREATE OR REPLACE FUNCTION public.admin_unfreeze_user_points(p_target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow admins
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  
  UPDATE public.user_points 
  SET 
    is_frozen = false,
    frozen_at = null,
    frozen_reason = null
  WHERE user_id = p_target_user_id;
  
  -- Log the action
  INSERT INTO public.security_audit_log (user_id, event_type, severity, details)
  VALUES (
    auth.uid(),
    'user_points_unfrozen',
    'info',
    jsonb_build_object(
      'target_user_id', p_target_user_id,
      'unfrozen_by', auth.uid()
    )
  );
  
  RETURN jsonb_build_object('success', true, 'message', 'User points unfrozen');
END;
$function$;

-- 8. Create function to check referral velocity and caps
CREATE OR REPLACE FUNCTION public.check_referral_eligibility(p_affiliate_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_total_registrations integer;
  v_max_referrals integer;
  v_velocity_24h integer;
  v_velocity_threshold integer := 10;
BEGIN
  -- Get affiliate's current stats
  SELECT total_registrations, max_referrals 
  INTO v_total_registrations, v_max_referrals
  FROM public.affiliates 
  WHERE id = p_affiliate_id;
  
  -- Check if referral cap reached
  IF v_total_registrations >= COALESCE(v_max_referrals, 100) THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'referral_cap_reached',
      'current', v_total_registrations,
      'max', COALESCE(v_max_referrals, 100)
    );
  END IF;
  
  -- Check 24h velocity
  SELECT COUNT(*) INTO v_velocity_24h
  FROM public.affiliate_referrals
  WHERE affiliate_id = p_affiliate_id
    AND registered_at > now() - INTERVAL '24 hours';
  
  IF v_velocity_24h >= v_velocity_threshold THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'velocity_limit_exceeded',
      'registrations_24h', v_velocity_24h,
      'limit', v_velocity_threshold,
      'message', 'Please slow down. You can register more referrals tomorrow.'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'eligible', true,
    'current', v_total_registrations,
    'max', COALESCE(v_max_referrals, 100),
    'registrations_24h', v_velocity_24h,
    'velocity_limit', v_velocity_threshold
  );
END;
$function$;

-- 9. Create function to award pending referral bonus when activity requirement is met
CREATE OR REPLACE FUNCTION public.check_and_award_pending_referral_bonus(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_pending record;
  v_points_awarded integer := 0;
BEGIN
  -- Find pending bonus for this user
  SELECT * INTO v_pending
  FROM public.pending_referral_bonuses
  WHERE referred_user_id = p_user_id
    AND requirement_met = false
    AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_pending_bonus');
  END IF;
  
  -- Mark requirement as met
  UPDATE public.pending_referral_bonuses
  SET 
    requirement_met = true,
    requirement_met_at = now()
  WHERE id = v_pending.id;
  
  -- Award the remaining bonus to the referrer
  UPDATE public.user_points
  SET total_points = COALESCE(total_points, 0) + v_pending.bonus_points
  WHERE user_id = v_pending.referrer_user_id;
  
  v_points_awarded := v_pending.bonus_points;
  
  RETURN jsonb_build_object(
    'success', true,
    'points_awarded', v_points_awarded,
    'referrer_user_id', v_pending.referrer_user_id
  );
END;
$function$;

-- 10. Add lifetime cap to remote config
INSERT INTO public.app_remote_config (config_key, config_value, is_sensitive, description)
VALUES ('max_lifetime_points', '100000', false, 'Maximum lifetime points a user can earn (100,000 default)')
ON CONFLICT (config_key) DO NOTHING;

-- Index for faster velocity checks
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_velocity 
ON public.affiliate_referrals (affiliate_id, registered_at DESC);

-- Index for pending bonuses lookup
CREATE INDEX IF NOT EXISTS idx_pending_referral_bonuses_user 
ON public.pending_referral_bonuses (referred_user_id) 
WHERE requirement_met = false;