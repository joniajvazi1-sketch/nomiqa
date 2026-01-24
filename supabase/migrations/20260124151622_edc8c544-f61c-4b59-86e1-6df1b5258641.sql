-- Fix the secure lookup functions to use correct column names
-- The affiliates table uses 'status' instead of 'is_active'

CREATE OR REPLACE FUNCTION public.lookup_affiliate_by_username(lookup_username TEXT)
RETURNS TABLE (id UUID, affiliate_code TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.affiliate_code
  FROM public.affiliates a
  WHERE a.username = lookup_username
    AND a.status = 'active'
    AND a.email_verified = true
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.lookup_affiliate_by_code(lookup_code TEXT)
RETURNS TABLE (id UUID, username TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.username
  FROM public.affiliates a
  WHERE a.affiliate_code = lookup_code
    AND a.status = 'active'
    AND a.email_verified = true
  LIMIT 1;
END;
$$;