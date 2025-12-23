-- Add mining-related columns to affiliates table for the miner boost milestones system
ALTER TABLE public.affiliates 
ADD COLUMN IF NOT EXISTS registration_milestone_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS miner_boost_percentage NUMERIC DEFAULT 0;

-- Create a trigger function to automatically update milestone level and boost based on registrations
CREATE OR REPLACE FUNCTION public.update_affiliate_mining_milestone()
RETURNS TRIGGER AS $$
BEGIN
  -- Update milestone level and miner boost based on total registrations
  -- Level 0: 0-4 registrations (0% boost)
  -- Level 1: 5+ registrations (5% boost) - Recruiter
  -- Level 2: 15+ registrations (10% boost) - Influencer  
  -- Level 3: 30+ registrations (20% boost) - Ambassador
  -- Level 4: 50+ registrations (35% boost) - Champion
  -- Level 5: 100+ registrations (50% boost) - Legend
  
  IF NEW.total_registrations >= 100 THEN
    NEW.registration_milestone_level := 5;
    NEW.miner_boost_percentage := 50;
  ELSIF NEW.total_registrations >= 50 THEN
    NEW.registration_milestone_level := 4;
    NEW.miner_boost_percentage := 35;
  ELSIF NEW.total_registrations >= 30 THEN
    NEW.registration_milestone_level := 3;
    NEW.miner_boost_percentage := 20;
  ELSIF NEW.total_registrations >= 15 THEN
    NEW.registration_milestone_level := 2;
    NEW.miner_boost_percentage := 10;
  ELSIF NEW.total_registrations >= 5 THEN
    NEW.registration_milestone_level := 1;
    NEW.miner_boost_percentage := 5;
  ELSE
    NEW.registration_milestone_level := 0;
    NEW.miner_boost_percentage := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to update milestone on registration changes
DROP TRIGGER IF EXISTS update_affiliate_mining_milestone_trigger ON public.affiliates;
CREATE TRIGGER update_affiliate_mining_milestone_trigger
BEFORE UPDATE OF total_registrations ON public.affiliates
FOR EACH ROW
EXECUTE FUNCTION public.update_affiliate_mining_milestone();

-- Also trigger on insert to set initial values
DROP TRIGGER IF EXISTS update_affiliate_mining_milestone_insert_trigger ON public.affiliates;
CREATE TRIGGER update_affiliate_mining_milestone_insert_trigger
BEFORE INSERT ON public.affiliates
FOR EACH ROW
EXECUTE FUNCTION public.update_affiliate_mining_milestone();