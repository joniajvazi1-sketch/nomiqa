-- CRITICAL SECURITY FIX: Remove overly permissive public access to affiliates table
-- The previous policy exposed email addresses and user IDs to anyone

-- Drop the problematic policy that exposes all affiliate data publicly
DROP POLICY IF EXISTS "Public can lookup affiliates by username or code" ON public.affiliates;

-- Create a more secure policy that only exposes non-sensitive lookup fields
-- This uses a security definer function to control exactly what's accessible
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
    AND a.is_active = true
    AND a.email_verified = true
  LIMIT 1;
END;
$$;

-- Grant execute to anonymous users for referral link resolution
GRANT EXECUTE ON FUNCTION public.lookup_affiliate_by_username(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.lookup_affiliate_by_username(TEXT) TO authenticated;

-- Create a similar function for looking up by affiliate code
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
    AND a.is_active = true
    AND a.email_verified = true
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_affiliate_by_code(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.lookup_affiliate_by_code(TEXT) TO authenticated;

-- Ensure the original secure policy for affiliate owners is in place
DROP POLICY IF EXISTS "Users can view their own affiliate account" ON public.affiliates;
CREATE POLICY "Users can view their own affiliate account"
ON public.affiliates
FOR SELECT
USING (auth.uid() = user_id);

-- Add rate limiting table for API abuse prevention
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_lookup 
ON public.api_rate_limits(identifier, endpoint, window_start);

CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.api_rate_limits
  WHERE window_start < now() - interval '1 hour';
END;
$$;

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Deny all access - only service role can access
CREATE POLICY "No public access to rate limits"
ON public.api_rate_limits
FOR SELECT
USING (false);

CREATE POLICY "No public insert rate limits"
ON public.api_rate_limits
FOR INSERT
WITH CHECK (false);

CREATE POLICY "No public update rate limits"
ON public.api_rate_limits
FOR UPDATE
USING (false);

CREATE POLICY "No public delete rate limits"
ON public.api_rate_limits
FOR DELETE
USING (false);

-- Add security audit log for tracking suspicious activity
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  ip_hash TEXT,
  user_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_audit_severity 
ON public.security_audit_log(severity, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_audit_type 
ON public.security_audit_log(event_type, created_at DESC);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view security audit logs"
ON public.security_audit_log
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "No public insert security logs"
ON public.security_audit_log
FOR INSERT
WITH CHECK (false);

CREATE POLICY "No public update security logs"
ON public.security_audit_log
FOR UPDATE
USING (false);

CREATE POLICY "No public delete security logs"
ON public.security_audit_log
FOR DELETE
USING (false);