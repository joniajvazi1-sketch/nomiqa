-- Update the mining milestone trigger to double all boost percentages
CREATE OR REPLACE FUNCTION public.update_affiliate_mining_milestone()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Update milestone level and miner boost based on total registrations (DOUBLED BOOSTS)
  -- Level 0: 0-4 registrations (0% boost)
  -- Level 1: 5+ registrations (10% boost) - Recruiter
  -- Level 2: 15+ registrations (20% boost) - Influencer  
  -- Level 3: 30+ registrations (40% boost) - Ambassador
  -- Level 4: 50+ registrations (70% boost) - Champion
  -- Level 5: 100+ registrations (100% boost) - Legend
  
  IF NEW.total_registrations >= 100 THEN
    NEW.registration_milestone_level := 5;
    NEW.miner_boost_percentage := 100;
  ELSIF NEW.total_registrations >= 50 THEN
    NEW.registration_milestone_level := 4;
    NEW.miner_boost_percentage := 70;
  ELSIF NEW.total_registrations >= 30 THEN
    NEW.registration_milestone_level := 3;
    NEW.miner_boost_percentage := 40;
  ELSIF NEW.total_registrations >= 15 THEN
    NEW.registration_milestone_level := 2;
    NEW.miner_boost_percentage := 20;
  ELSIF NEW.total_registrations >= 5 THEN
    NEW.registration_milestone_level := 1;
    NEW.miner_boost_percentage := 10;
  ELSE
    NEW.registration_milestone_level := 0;
    NEW.miner_boost_percentage := 0;
  END IF;
  
  RETURN NEW;
END;
$function$;