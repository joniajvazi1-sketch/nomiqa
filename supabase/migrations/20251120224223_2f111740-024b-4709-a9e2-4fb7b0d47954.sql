-- Add tier_level to affiliates table to track unlocked commission tiers
ALTER TABLE public.affiliates 
ADD COLUMN IF NOT EXISTS tier_level integer NOT NULL DEFAULT 1 CHECK (tier_level >= 1 AND tier_level <= 3);

-- Update commission_rate to be the base rate (9%)
ALTER TABLE public.affiliates 
ALTER COLUMN commission_rate SET DEFAULT 9.00;

-- Update existing affiliates to 9% base rate
UPDATE public.affiliates SET commission_rate = 9.00;

-- Create function to update affiliate tier based on conversions
CREATE OR REPLACE FUNCTION public.update_affiliate_tier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

-- Create trigger to automatically update tier when conversions change
DROP TRIGGER IF EXISTS update_affiliate_tier_trigger ON public.affiliates;
CREATE TRIGGER update_affiliate_tier_trigger
  BEFORE UPDATE ON public.affiliates
  FOR EACH ROW
  WHEN (OLD.total_conversions IS DISTINCT FROM NEW.total_conversions)
  EXECUTE FUNCTION public.update_affiliate_tier();

-- Add index for better performance on affiliate chains
CREATE INDEX IF NOT EXISTS idx_affiliates_parent ON public.affiliates(parent_affiliate_id);

-- Update affiliate_referrals to better track commission chains
COMMENT ON COLUMN public.affiliate_referrals.commission_level IS 'Level in referral chain: 1 = direct (9%), 2 = second level (6%), 3 = third level (3%)';

-- Update existing referrals to level 1 (direct)
UPDATE public.affiliate_referrals 
SET commission_level = 1 
WHERE commission_level IS NULL;