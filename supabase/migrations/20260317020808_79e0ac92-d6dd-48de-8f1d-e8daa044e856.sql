
-- Update process_referral_commission to use 10% instead of 5%
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
  commission_rate DECIMAL(5,4) := 0.10; -- 10% commission (was 0.05)
  v_cap_result jsonb;
  v_in_commission boolean;
BEGIN
  -- Recursion guard
  BEGIN
    v_in_commission := current_setting('app.in_referral_commission', true)::boolean;
  EXCEPTION WHEN OTHERS THEN
    v_in_commission := false;
  END;
  
  IF v_in_commission THEN
    RETURN NEW;
  END IF;

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
  
  -- Set recursion guard
  PERFORM set_config('app.in_referral_commission', 'true', true);
  
  -- Use add_referral_points to bypass daily/monthly caps (only lifetime cap enforced)
  v_cap_result := public.add_referral_points(referrer_user_id, commission_amount, 'referral_commission');
  
  -- Clear recursion guard
  PERFORM set_config('app.in_referral_commission', 'false', true);
  
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
    COALESCE((v_cap_result->>'points_added')::integer, 0),
    commission_rate
  );
  
  NEW.last_commission_points := NEW.total_points;
  
  RETURN NEW;
END;
$function$;
