-- Fix SECURITY DEFINER views - convert to SECURITY INVOKER
-- This ensures views use the querying user's permissions, not the view creator's

-- Drop and recreate profiles_secure view with SECURITY INVOKER
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

-- Grant select on the secure view to authenticated users
GRANT SELECT ON public.profiles_secure TO authenticated;

-- Drop and recreate orders_secure view with SECURITY INVOKER
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

-- Grant select on the secure view to authenticated users
GRANT SELECT ON public.orders_secure TO authenticated;