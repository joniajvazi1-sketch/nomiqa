-- Store the Supabase anon key in app_remote_config for trigger functions
INSERT INTO public.app_remote_config (config_key, config_value, description, is_sensitive)
VALUES (
  'supabase_anon_key',
  '"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6aG1iaW9waWNpdWdyaWF0c2RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NTIyOTksImV4cCI6MjA3ODAyODI5OX0.AJWpvzFixGJqAthZq1SRV-_WAIHfSMJe_o90YomCKgI"'::jsonb,
  'Supabase anon key for internal trigger functions to call edge functions',
  true
)
ON CONFLICT (config_key) DO UPDATE SET config_value = EXCLUDED.config_value;

-- Update notify_affiliate_tier_upgrade to read from config instead of hardcoded value
CREATE OR REPLACE FUNCTION public.notify_affiliate_tier_upgrade()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  old_tier_name TEXT;
  new_tier_name TEXT;
  anon_key TEXT;
BEGIN
  -- Only proceed if tier_level has actually changed and increased
  IF OLD.tier_level IS DISTINCT FROM NEW.tier_level AND NEW.tier_level > OLD.tier_level THEN
    -- Get anon key from config
    SELECT config_value #>> '{}' INTO anon_key
    FROM public.app_remote_config
    WHERE config_key = 'supabase_anon_key';
    
    -- If key not found, skip silently (don't break the transaction)
    IF anon_key IS NULL THEN
      RETURN NEW;
    END IF;
    
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
    PERFORM net.http_post(
      url := 'https://gzhmbiopiciugriatsdb.supabase.co/functions/v1/notify-tier-upgrade',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', anon_key
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

-- Update notify_membership_tier_upgrade to read from config instead of hardcoded value
CREATE OR REPLACE FUNCTION public.notify_membership_tier_upgrade()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  old_tier_name TEXT;
  new_tier_name TEXT;
  user_email TEXT;
  anon_key TEXT;
BEGIN
  -- Only proceed if membership_tier has actually changed and is an upgrade
  IF OLD.membership_tier IS DISTINCT FROM NEW.membership_tier THEN
    -- Determine if it's an upgrade based on tier hierarchy
    -- beginner (5%) -> traveler (6%) -> adventurer (7%) -> explorer (10%)
    IF (OLD.membership_tier = 'beginner' AND NEW.membership_tier IN ('traveler', 'adventurer', 'explorer'))
       OR (OLD.membership_tier = 'traveler' AND NEW.membership_tier IN ('adventurer', 'explorer'))
       OR (OLD.membership_tier = 'adventurer' AND NEW.membership_tier = 'explorer') THEN
      
      -- Get anon key from config
      SELECT config_value #>> '{}' INTO anon_key
      FROM public.app_remote_config
      WHERE config_key = 'supabase_anon_key';
      
      -- If key not found, skip silently
      IF anon_key IS NULL THEN
        RETURN NEW;
      END IF;
      
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
            'apikey', anon_key
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