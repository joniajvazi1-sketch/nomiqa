-- Update the affiliate tier upgrade notification function with the correct API key
CREATE OR REPLACE FUNCTION public.notify_affiliate_tier_upgrade()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;