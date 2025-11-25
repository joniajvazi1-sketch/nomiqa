-- Drop the old trigger function
DROP FUNCTION IF EXISTS public.update_membership_tier() CASCADE;

-- Create updated trigger function with correct tier names
CREATE OR REPLACE FUNCTION public.update_membership_tier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS update_membership_tier_trigger ON public.user_spending;
CREATE TRIGGER update_membership_tier_trigger
  BEFORE INSERT OR UPDATE ON public.user_spending
  FOR EACH ROW
  EXECUTE FUNCTION public.update_membership_tier();

-- Update existing records to use new tier names
UPDATE public.user_spending
SET membership_tier = CASE
  WHEN membership_tier = 'bronze' THEN 'beginner'
  WHEN membership_tier = 'silver' THEN 'traveler'
  WHEN membership_tier = 'gold' THEN 'adventurer'
  WHEN membership_tier = 'platinum' THEN 'explorer'
  ELSE membership_tier
END;