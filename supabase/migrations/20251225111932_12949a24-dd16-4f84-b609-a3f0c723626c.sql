-- Fix processed_webhook_requests: The current policy "USING (true)" allows everyone
-- Service role bypasses RLS anyway, so we should block all user access

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Service role only access" ON public.processed_webhook_requests;

-- Create a proper restrictive policy that blocks all user access
-- Service role automatically bypasses RLS, so no policy is needed for it
CREATE POLICY "Block all user access to webhook requests"
ON public.processed_webhook_requests
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);