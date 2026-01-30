-- Fix profiles_safe view to inherit RLS from profiles table
-- Drop and recreate the view with SECURITY INVOKER = TRUE
DROP VIEW IF EXISTS public.profiles_safe;

CREATE VIEW public.profiles_safe
WITH (security_invoker = true)
AS SELECT 
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

-- Grant necessary permissions on the view
GRANT SELECT ON public.profiles_safe TO authenticated;
GRANT SELECT ON public.profiles_safe TO anon;