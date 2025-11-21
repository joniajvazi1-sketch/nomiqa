-- Fix search_path for existing functions to prevent security issues
-- Set search_path to 'public' for all functions that don't have it explicitly set

-- Update membership tier function
CREATE OR REPLACE FUNCTION public.update_membership_tier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update tier and cashback rate based on total spent
  IF NEW.total_spent_usd >= 150 THEN
    NEW.membership_tier := 'platinum';
    NEW.cashback_rate := 10.00;
  ELSIF NEW.total_spent_usd >= 50 THEN
    NEW.membership_tier := 'gold';
    NEW.cashback_rate := 7.00;
  ELSIF NEW.total_spent_usd >= 20 THEN
    NEW.membership_tier := 'silver';
    NEW.cashback_rate := 6.00;
  ELSE
    NEW.membership_tier := 'bronze';
    NEW.cashback_rate := 5.00;
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

-- Update affiliate tier function
CREATE OR REPLACE FUNCTION public.update_affiliate_tier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Tier 1: 0-9 conversions (9% on direct sales only)
  IF NEW.total_conversions < 10 THEN
    NEW.tier_level := 1;
  -- Tier 2: 10-29 conversions (9% direct + 6% on 2nd level)
  ELSIF NEW.total_conversions < 30 THEN
    NEW.tier_level := 2;
  -- Tier 3: 30+ conversions (9% direct + 6% on 2nd level + 3% on 3rd level)
  ELSE
    NEW.tier_level := 3;
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

-- Update access token expiry function
CREATE OR REPLACE FUNCTION public.set_access_token_expiry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.access_token_expires_at IS NULL THEN
    NEW.access_token_expires_at := NOW() + INTERVAL '90 days';
  END IF;
  RETURN NEW;
END;
$function$;