
CREATE OR REPLACE FUNCTION public.claim_challenge_reward(p_user_id uuid, p_challenge_id uuid, p_reward_points integer, p_bonus_points integer DEFAULT 0, p_period_start date DEFAULT CURRENT_DATE, p_is_daily boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total_reward integer;
  v_new_total numeric;
  v_current_streak integer;
  v_last_completed date;
  v_new_streak integer;
  v_all_daily_done boolean := false;
  v_cap_result jsonb;
BEGIN
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
