-- Add explicit RLS policy for email_rate_limits table to deny all user access
-- This table should only be accessed by service role (edge functions)
CREATE POLICY "No user access to rate limits" 
ON public.email_rate_limits 
FOR ALL 
USING (false);