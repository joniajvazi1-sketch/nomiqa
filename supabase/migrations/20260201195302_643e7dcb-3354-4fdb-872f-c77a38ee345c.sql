
-- Drop and recreate profiles_safe view with proper security
-- The view must use security_invoker=on to inherit RLS from base profiles table

-- First drop the existing view
DROP VIEW IF EXISTS public.profiles_safe;

-- Recreate with security_invoker=on
-- This ensures the view respects RLS policies from the profiles table
CREATE VIEW public.profiles_safe 
WITH (security_invoker = on)
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

-- Revoke all access from public and anon roles
REVOKE ALL ON public.profiles_safe FROM anon;
REVOKE ALL ON public.profiles_safe FROM public;

-- Grant access only to authenticated users (RLS will still apply via security_invoker)
GRANT SELECT ON public.profiles_safe TO authenticated;

-- Add a comment documenting the security model
COMMENT ON VIEW public.profiles_safe IS 'Secure view of profiles table. Uses security_invoker=on to inherit RLS from profiles table. Only authenticated users can access, and they can only see their own profile due to RLS on base table.';
