-- Create a function to send affiliate tier upgrade email notification
CREATE OR REPLACE FUNCTION public.notify_affiliate_tier_upgrade()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_tier_name TEXT;
  new_tier_name TEXT;
  supabase_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Only proceed if tier_level has actually changed and increased
  IF OLD.tier_level IS DISTINCT FROM NEW.tier_level AND NEW.tier_level > OLD.tier_level THEN
    -- Get Supabase configuration from vault
    supabase_url := current_setting('app.settings.supabase_url', true);
    service_role_key := current_setting('app.settings.service_role_key', true);
    
    -- Fallback to environment variables if not in vault
    IF supabase_url IS NULL OR service_role_key IS NULL THEN
      -- Use hardcoded project URL as fallback
      supabase_url := 'https://gzhmbiopiciugriatsdb.supabase.co';
      -- Service role key should be available via Supabase secrets
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
    
    -- Call the send-email edge function asynchronously using pg_net
    PERFORM net.http_post(
      url := supabase_url || '/functions/v1/send-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('request.jwt.claims', true)::json->>'service_role_key'
      ),
      body := jsonb_build_object(
        'type', 'affiliate_tier_upgrade',
        'to', NEW.email,
        'data', jsonb_build_object(
          'oldTier', OLD.tier_level,
          'newTier', NEW.tier_level,
          'oldTierName', old_tier_name,
          'newTierName', new_tier_name,
          'totalConversions', NEW.total_conversions,
          'totalEarnings', NEW.total_earnings_usd
        )
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to fire after affiliate tier_level is updated
DROP TRIGGER IF EXISTS on_affiliate_tier_upgrade ON public.affiliates;
CREATE TRIGGER on_affiliate_tier_upgrade
  AFTER UPDATE OF tier_level ON public.affiliates
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_affiliate_tier_upgrade();