
-- Drop and recreate profiles_safe view WITH security_invoker enabled
-- This ensures the view inherits RLS policies from the base profiles table
DROP VIEW IF EXISTS public.profiles_safe;

CREATE VIEW public.profiles_safe
WITH (security_invoker = on)
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

-- Grant appropriate permissions on the view
GRANT SELECT ON public.profiles_safe TO authenticated;
GRANT SELECT ON public.profiles_safe TO anon;

-- Add a comment explaining the view's purpose
COMMENT ON VIEW public.profiles_safe IS 'Secure view of profiles table that strips sensitive PII (password_reset_code, verification_code, etc). Uses security_invoker=on to inherit RLS from base table.';
