-- Fix profiles_secure view to respect underlying RLS
-- First, get the view definition and recreate with security_invoker
DROP VIEW IF EXISTS public.profiles_secure;

CREATE VIEW public.profiles_secure
WITH (security_invoker = true)
AS
SELECT 
  id,
  user_id,
  username,
  email,
  email_verified,
  is_early_member,
  created_at,
  updated_at
FROM public.profiles;

-- Fix orders_secure view to respect underlying RLS
DROP VIEW IF EXISTS public.orders_secure;

CREATE VIEW public.orders_secure
WITH (security_invoker = true)
AS
SELECT
  id,
  user_id,
  product_id,
  status,
  email,
  full_name,
  package_name,
  data_amount,
  validity_days,
  total_amount_usd,
  iccid,
  lpa,
  qrcode,
  qr_code_url,
  qrcode_installation,
  manual_installation,
  activation_code,
  matching_id,
  sharing_link,
  sharing_access_code,
  created_at,
  updated_at
FROM public.orders;

-- Grant select on views to authenticated users (RLS from underlying tables will be enforced)
GRANT SELECT ON public.profiles_secure TO authenticated;
GRANT SELECT ON public.orders_secure TO authenticated;

-- Revoke access from anon role
REVOKE ALL ON public.profiles_secure FROM anon;
REVOKE ALL ON public.orders_secure FROM anon;