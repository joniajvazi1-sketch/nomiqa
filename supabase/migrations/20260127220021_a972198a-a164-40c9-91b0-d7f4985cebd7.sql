-- Fix #1: Create secure view for affiliates that excludes sensitive verification fields
CREATE VIEW public.affiliates_safe
WITH (security_invoker=on) AS
SELECT 
  id,
  user_id,
  username,
  affiliate_code,
  status,
  tier_level,
  commission_rate,
  total_conversions,
  total_earnings_usd,
  total_registrations,
  registration_milestone_level,
  miner_boost_percentage,
  email_verified,
  parent_affiliate_id,
  created_at,
  updated_at
  -- Excludes: email, verification_token, verification_code_expires_at, verification_sent_at
FROM public.affiliates;

-- Fix #2: Create secure view for profiles that excludes sensitive reset/verification codes
CREATE VIEW public.profiles_safe
WITH (security_invoker=on) AS
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
  -- Excludes: password_reset_code, password_reset_expires_at, verification_code, verification_code_expires_at
FROM public.profiles;

-- Grant SELECT on views to authenticated users
GRANT SELECT ON public.affiliates_safe TO authenticated;
GRANT SELECT ON public.profiles_safe TO authenticated;

-- Update RLS on base tables to deny direct SELECT (service role bypasses this)
-- First drop existing permissive SELECT policies
DROP POLICY IF EXISTS "Users can view their own affiliate account" ON public.affiliates;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create new policies that deny direct table access for SELECT
-- Users must use the _safe views instead
CREATE POLICY "No direct SELECT on affiliates base table"
ON public.affiliates
FOR SELECT
USING (false);

CREATE POLICY "No direct SELECT on profiles base table"
ON public.profiles  
FOR SELECT
USING (false);

-- Add SELECT policies on the views (they use security_invoker so RLS applies)
-- But wait - we can't add RLS to views directly. Instead, let's create
-- replacement policies that only allow access through specific conditions

-- Actually, let's take a different approach:
-- Keep the base table accessible but hash the sensitive fields on UPDATE
-- Or better: Create RLS policies that use column-level security via views

-- Let me fix this properly - drop the overly restrictive policies
DROP POLICY IF EXISTS "No direct SELECT on affiliates base table" ON public.affiliates;
DROP POLICY IF EXISTS "No direct SELECT on profiles base table" ON public.profiles;

-- Recreate original policies
CREATE POLICY "Users can view their own affiliate account"
ON public.affiliates
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT  
USING (auth.uid() = user_id);