-- ================================================
-- FIX: Replace SECURITY DEFINER view with SECURITY INVOKER
-- The previous view used auth.uid() filter inside the view definition
-- which required SECURITY DEFINER. Better approach: Use SECURITY INVOKER
-- and let the underlying profiles table's RLS policies handle access.
-- ================================================

-- Drop the security definer view
DROP VIEW IF EXISTS public.profiles_safe;

-- Recreate as SECURITY INVOKER view (inherits RLS from profiles table)
-- This view excludes sensitive columns but relies on profiles table RLS
CREATE VIEW public.profiles_safe
WITH (security_invoker = true)
AS 
SELECT 
  id,
  user_id,
  username,
  email,
  email_verified,
  solana_wallet,
  is_early_member,
  country_code,
  data_consent_version,
  data_consent_accepted_at,
  created_at,
  updated_at
FROM public.profiles;

-- Revoke access from anon users, only authenticated can access
REVOKE ALL ON public.profiles_safe FROM anon;
REVOKE ALL ON public.profiles_safe FROM public;
GRANT SELECT ON public.profiles_safe TO authenticated;

-- Do the same for affiliates_safe view
DROP VIEW IF EXISTS public.affiliates_safe;

CREATE VIEW public.affiliates_safe
WITH (security_invoker = true)
AS
SELECT
  id,
  user_id,
  username,
  affiliate_code,
  status,
  tier_level,
  commission_rate,
  total_registrations,
  total_conversions,
  total_earnings_usd,
  miner_boost_percentage,
  registration_milestone_level,
  email_verified,
  parent_affiliate_id,
  created_at,
  updated_at
FROM public.affiliates;

-- Revoke access from anon users
REVOKE ALL ON public.affiliates_safe FROM anon;
REVOKE ALL ON public.affiliates_safe FROM public;
GRANT SELECT ON public.affiliates_safe TO authenticated;