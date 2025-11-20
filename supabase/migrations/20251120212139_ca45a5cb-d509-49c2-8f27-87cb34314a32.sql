-- Fix search_path for update_membership_tier function
CREATE OR REPLACE FUNCTION public.update_membership_tier()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;