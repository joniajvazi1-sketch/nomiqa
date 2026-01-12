-- Create table to track referral commission transactions
CREATE TABLE public.referral_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_user_id UUID NOT NULL,
  referred_user_id UUID NOT NULL,
  points_earned INTEGER NOT NULL,
  commission_points INTEGER NOT NULL,
  commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0.05,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for efficient lookups
CREATE INDEX idx_referral_commissions_referrer ON public.referral_commissions(referrer_user_id);
CREATE INDEX idx_referral_commissions_referred ON public.referral_commissions(referred_user_id);
CREATE INDEX idx_referral_commissions_created ON public.referral_commissions(created_at);

-- Enable RLS
ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own commission earnings (as referrer)
CREATE POLICY "Users can view their referral commissions"
ON public.referral_commissions
FOR SELECT
USING (auth.uid() = referrer_user_id);

-- Add last_commission_processed_at to user_points to track what's been processed
ALTER TABLE public.user_points 
ADD COLUMN IF NOT EXISTS last_commission_points INTEGER DEFAULT 0;

-- Create function to process referral commissions
CREATE OR REPLACE FUNCTION public.process_referral_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  referrer_affiliate_id UUID;
  referrer_user_id UUID;
  points_delta INTEGER;
  commission_amount INTEGER;
  commission_rate DECIMAL(5,4) := 0.05; -- 5% commission
BEGIN
  -- Calculate the new points earned since last commission
  points_delta := COALESCE(NEW.total_points, 0) - COALESCE(NEW.last_commission_points, 0);
  
  -- Only process if there are new points (more than 0)
  IF points_delta <= 0 THEN
    RETURN NEW;
  END IF;
  
  -- Find if this user was referred by an affiliate
  SELECT ar.affiliate_id INTO referrer_affiliate_id
  FROM public.affiliate_referrals ar
  WHERE ar.registered_user_id = NEW.user_id
    AND ar.status = 'registered'
  LIMIT 1;
  
  -- If no referrer found, just update the tracking and return
  IF referrer_affiliate_id IS NULL THEN
    NEW.last_commission_points := NEW.total_points;
    RETURN NEW;
  END IF;
  
  -- Get the referrer's user_id from affiliates table
  SELECT a.user_id INTO referrer_user_id
  FROM public.affiliates a
  WHERE a.id = referrer_affiliate_id
    AND a.user_id IS NOT NULL;
  
  -- If referrer has no user_id linked, skip
  IF referrer_user_id IS NULL THEN
    NEW.last_commission_points := NEW.total_points;
    RETURN NEW;
  END IF;
  
  -- Don't credit commission to yourself
  IF referrer_user_id = NEW.user_id THEN
    NEW.last_commission_points := NEW.total_points;
    RETURN NEW;
  END IF;
  
  -- Calculate commission (5% of new points, minimum 1 if any earned)
  commission_amount := GREATEST(1, FLOOR(points_delta * commission_rate));
  
  -- Credit commission to referrer's user_points
  INSERT INTO public.user_points (user_id, total_points, pending_points)
  VALUES (referrer_user_id, commission_amount, 0)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_points = COALESCE(user_points.total_points, 0) + commission_amount,
    updated_at = now();
  
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
    commission_amount,
    commission_rate
  );
  
  -- Update tracking to prevent double-processing
  NEW.last_commission_points := NEW.total_points;
  
  RETURN NEW;
END;
$function$;

-- Create trigger on user_points updates
DROP TRIGGER IF EXISTS trigger_referral_commission ON public.user_points;
CREATE TRIGGER trigger_referral_commission
  BEFORE UPDATE ON public.user_points
  FOR EACH ROW
  WHEN (NEW.total_points > OLD.total_points)
  EXECUTE FUNCTION public.process_referral_commission();

-- Also handle INSERT for new user_points records  
DROP TRIGGER IF EXISTS trigger_referral_commission_insert ON public.user_points;
CREATE TRIGGER trigger_referral_commission_insert
  BEFORE INSERT ON public.user_points
  FOR EACH ROW
  WHEN (NEW.total_points > 0)
  EXECUTE FUNCTION public.process_referral_commission();