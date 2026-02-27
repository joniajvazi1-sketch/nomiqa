
-- Fix check_and_award_pending_referral_bonus to use add_points_with_cap
CREATE OR REPLACE FUNCTION public.check_and_award_pending_referral_bonus(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pending record;
  v_cap_result jsonb;
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
  
  -- Award the remaining bonus to the referrer through cap-enforced RPC
  v_cap_result := public.add_points_with_cap(v_pending.referrer_user_id, v_pending.bonus_points, 'referral_bonus');
  
  RETURN jsonb_build_object(
    'success', true,
    'points_awarded', COALESCE((v_cap_result->>'points_added')::integer, 0),
    'referrer_user_id', v_pending.referrer_user_id,
    'capped', NOT COALESCE((v_cap_result->>'success')::boolean, false)
  );
END;
$function$;

-- Fix process_referral_commission trigger to use add_points_with_cap
CREATE OR REPLACE FUNCTION public.process_referral_commission()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  referrer_affiliate_id UUID;
  referrer_user_id UUID;
  points_delta INTEGER;
  commission_amount INTEGER;
  commission_rate DECIMAL(5,4) := 0.05;
  v_cap_result jsonb;
BEGIN
  points_delta := COALESCE(NEW.total_points, 0) - COALESCE(NEW.last_commission_points, 0);
  
  IF points_delta <= 0 THEN
    RETURN NEW;
  END IF;
  
  SELECT ar.affiliate_id INTO referrer_affiliate_id
  FROM public.affiliate_referrals ar
  WHERE ar.registered_user_id = NEW.user_id
    AND ar.status = 'registered'
  LIMIT 1;
  
  IF referrer_affiliate_id IS NULL THEN
    NEW.last_commission_points := NEW.total_points;
    RETURN NEW;
  END IF;
  
  SELECT a.user_id INTO referrer_user_id
  FROM public.affiliates a
  WHERE a.id = referrer_affiliate_id
    AND a.user_id IS NOT NULL;
  
  IF referrer_user_id IS NULL THEN
    NEW.last_commission_points := NEW.total_points;
    RETURN NEW;
  END IF;
  
  IF referrer_user_id = NEW.user_id THEN
    NEW.last_commission_points := NEW.total_points;
    RETURN NEW;
  END IF;
  
  commission_amount := GREATEST(1, FLOOR(points_delta * commission_rate));
  
  -- Use cap-enforced RPC instead of direct write
  v_cap_result := public.add_points_with_cap(referrer_user_id, commission_amount, 'referral_commission');
  
  -- Record the commission transaction
  INSERT INTO public.referral_commissions (
    referrer_user_id,
    referred_user_id,
    points_earned,
    commission_points,
    commission_rate
  ) VALUES (
    referrer_user_id,
    NEW.user_id,
    points_delta,
    COALESCE((v_cap_result->>'points_added')::integer, commission_amount),
    commission_rate
  );
  
  NEW.last_commission_points := NEW.total_points;
  
  RETURN NEW;
END;
$function$;
