-- Add RLS policy for processed_webhook_requests table
-- Only service role can manage this table (no user access needed)
CREATE POLICY "Service role only access"
ON public.processed_webhook_requests
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);