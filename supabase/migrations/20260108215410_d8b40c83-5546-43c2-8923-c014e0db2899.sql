-- Fix SECURITY DEFINER functions that are missing search_path protection
-- This prevents SQL injection and privilege escalation risks

-- Fix update_membership_tier function
CREATE OR REPLACE FUNCTION public.update_membership_tier()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Update tier and cashback rate based on total spent (using custom tier names)
  IF NEW.total_spent_usd >= 150 THEN
    NEW.membership_tier := 'explorer';  -- Was 'platinum'
    NEW.cashback_rate := 10.00;
  ELSIF NEW.total_spent_usd >= 50 THEN
    NEW.membership_tier := 'adventurer';  -- Was 'gold'
    NEW.cashback_rate := 7.00;
  ELSIF NEW.total_spent_usd >= 20 THEN
    NEW.membership_tier := 'traveler';  -- Was 'silver'
    NEW.cashback_rate := 6.00;
  ELSE
    NEW.membership_tier := 'beginner';  -- Was 'bronze'
    NEW.cashback_rate := 5.00;
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

-- Fix notify_affiliate_tier_upgrade function
CREATE OR REPLACE FUNCTION public.notify_affiliate_tier_upgrade()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  old_tier_name TEXT;
  new_tier_name TEXT;
BEGIN
  -- Only proceed if tier_level has actually changed and increased
  IF OLD.tier_level IS DISTINCT FROM NEW.tier_level AND NEW.tier_level > OLD.tier_level THEN
    -- Map tier levels to names
    old_tier_name := CASE OLD.tier_level
      WHEN 1 THEN 'Starter'
      WHEN 2 THEN 'Pro'
      WHEN 3 THEN 'Elite'
      ELSE 'Unknown'
    END;
    
    new_tier_name := CASE NEW.tier_level
      WHEN 1 THEN 'Starter'
      WHEN 2 THEN 'Pro'
      WHEN 3 THEN 'Elite'
      ELSE 'Unknown'
    END;
    
    -- Call the notify-tier-upgrade edge function asynchronously using pg_net
    -- Using anon key which is safe as it's already public in the frontend
    PERFORM net.http_post(
      url := 'https://gzhmbiopiciugriatsdb.supabase.co/functions/v1/notify-tier-upgrade',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6aG1iaW9waWNpdWdyaWF0c2RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NTIyOTksImV4cCI6MjA3ODAyODI5OX0.AJWpvzFixGJqAthZq1SRV-_WAIHfSMJe_o90YomCKgI'
      ),
      body := jsonb_build_object(
        'type', 'affiliate',
        'email', NEW.email,
        'oldTier', OLD.tier_level,
        'newTier', NEW.tier_level,
        'oldTierName', old_tier_name,
        'newTierName', new_tier_name,
        'totalConversions', NEW.total_conversions,
        'totalEarnings', NEW.total_earnings_usd
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix notify_membership_tier_upgrade function
CREATE OR REPLACE FUNCTION public.notify_membership_tier_upgrade()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  old_tier_name TEXT;
  new_tier_name TEXT;
  user_email TEXT;
BEGIN
  -- Only proceed if membership_tier has actually changed and is an upgrade
  IF OLD.membership_tier IS DISTINCT FROM NEW.membership_tier THEN
    -- Determine if it's an upgrade based on tier hierarchy
    -- beginner (5%) -> traveler (6%) -> adventurer (7%) -> explorer (10%)
    IF (OLD.membership_tier = 'beginner' AND NEW.membership_tier IN ('traveler', 'adventurer', 'explorer'))
       OR (OLD.membership_tier = 'traveler' AND NEW.membership_tier IN ('adventurer', 'explorer'))
       OR (OLD.membership_tier = 'adventurer' AND NEW.membership_tier = 'explorer') THEN
      
      -- Get user's email from auth.users
      SELECT email INTO user_email
      FROM auth.users
      WHERE id = NEW.user_id;
      
      -- Only send email if we found a valid email
      IF user_email IS NOT NULL THEN
        -- Call the notify-tier-upgrade edge function asynchronously using pg_net
        PERFORM net.http_post(
          url := 'https://gzhmbiopiciugriatsdb.supabase.co/functions/v1/notify-tier-upgrade',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6aG1iaW9waWNpdWdyaWF0c2RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NTIyOTksImV4cCI6MjA3ODAyODI5OX0.AJWpvzFixGJqAthZq1SRV-_WAIHfSMJe_o90YomCKgI'
          ),
          body := jsonb_build_object(
            'type', 'membership',
            'email', user_email,
            'oldTier', OLD.membership_tier,
            'newTier', NEW.membership_tier,
            'totalSpent', NEW.total_spent_usd
          )
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix set_profile_email function
CREATE OR REPLACE FUNCTION public.set_profile_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  IF NEW.email IS NULL THEN
    SELECT email INTO NEW.email FROM auth.users WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix set_access_token_expiry function
CREATE OR REPLACE FUNCTION public.set_access_token_expiry()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  IF NEW.access_token_expires_at IS NULL THEN
    NEW.access_token_expires_at := NOW() + INTERVAL '90 days';
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix update_affiliate_tier function
CREATE OR REPLACE FUNCTION public.update_affiliate_tier()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
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