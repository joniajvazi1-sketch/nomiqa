-- =====================================================
-- Migration: Fix 3 Post-Launch Gaps
-- 1. Solana wallet unique constraint (security)
-- 2. Leaderboard optimization (performance)
-- 3. Referral points bypass caps (new RPC)
-- =====================================================

-- ===========================================
-- GAP 1: Solana Wallet Unique Constraint
-- ===========================================

-- Step 1: Clear duplicate wallets (keep earliest entry per address)
WITH duplicates AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY LOWER(solana_wallet) 
    ORDER BY created_at ASC
  ) as rn
  FROM public.profiles 
  WHERE solana_wallet IS NOT NULL
)
UPDATE public.profiles p 
SET solana_wallet = NULL
FROM duplicates d 
WHERE p.id = d.id AND d.rn > 1;

-- Step 2: Drop old non-unique index if it exists
DROP INDEX IF EXISTS idx_profiles_solana_wallet;

-- Step 3: Create unique partial index (allows NULLs, blocks duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_solana_wallet_unique
ON public.profiles (LOWER(solana_wallet))
WHERE solana_wallet IS NOT NULL;

-- ===========================================
-- GAP 2: Leaderboard Optimization (O(n) → O(1) for unchanged rows)
-- ===========================================

CREATE OR REPLACE FUNCTION public.update_leaderboard_rankings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Single CTE computes all 3 ranks in one pass
  -- Only updates rows where ranks actually changed
  WITH ranked AS (
    SELECT 
      user_id,
      ROW_NUMBER() OVER (ORDER BY total_points DESC NULLS LAST) as new_rank_all_time,
      ROW_NUMBER() OVER (ORDER BY weekly_points DESC NULLS LAST) as new_rank_weekly,
      ROW_NUMBER() OVER (ORDER BY monthly_points DESC NULLS LAST) as new_rank_monthly
    FROM leaderboard_cache
    WHERE total_points > 0 OR weekly_points > 0 OR monthly_points > 0
  )
  UPDATE leaderboard_cache lc
  SET 
    rank_all_time = ranked.new_rank_all_time,
    rank_weekly = ranked.new_rank_weekly,
    rank_monthly = ranked.new_rank_monthly,
    updated_at = now()
  FROM ranked
  WHERE lc.user_id = ranked.user_id
    AND (
      lc.rank_all_time IS DISTINCT FROM ranked.new_rank_all_time
      OR lc.rank_weekly IS DISTINCT FROM ranked.new_rank_weekly
      OR lc.rank_monthly IS DISTINCT FROM ranked.new_rank_monthly
    );
END;
$$;

-- ===========================================
-- GAP 3: Referral Points Bypass Caps (new RPC)
-- ===========================================

CREATE OR REPLACE FUNCTION public.add_referral_points(
  p_user_id uuid,
  p_points integer,
  p_source text DEFAULT 'referral'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_total numeric;
  v_is_frozen boolean;
  v_lifetime_cap integer := 100000;
  v_remaining_lifetime integer;
  v_final_points integer;
BEGIN
  -- Get lifetime cap from remote config (with fallback)
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
      'message', 'Account is frozen. Referral points cannot be awarded.'
    );
  END IF;
  
  -- Check lifetime cap (still enforced for referral points)
  IF v_current_total IS NOT NULL AND v_current_total >= v_lifetime_cap THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'lifetime_cap_reached',
      'points_added', 0,
      'lifetime_cap', v_lifetime_cap,
      'current_total', v_current_total
    );
  END IF;
  
  -- Calculate remaining lifetime cap
  v_remaining_lifetime := GREATEST(0, v_lifetime_cap - COALESCE(v_current_total, 0));
  
  -- Apply ONLY lifetime cap (bypass daily/monthly)
  v_final_points := LEAST(p_points, v_remaining_lifetime);
  
  IF v_final_points <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'no_points_to_add',
      'points_added', 0
    );
  END IF;
  
  -- Update user_points directly (bypassing daily/monthly limits)
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
    'referral_points_awarded',
    'info',
    jsonb_build_object(
      'points', v_final_points,
      'source', p_source,
      'bypassed_daily_cap', true,
      'bypassed_monthly_cap', true,
      'lifetime_cap_remaining', v_remaining_lifetime - v_final_points
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'points_added', v_final_points,
    'source', p_source,
    'bypassed_daily_cap', true,
    'bypassed_monthly_cap', true,
    'new_total', COALESCE(v_current_total, 0) + v_final_points,
    'lifetime_cap', v_lifetime_cap
  );
END;
$$;