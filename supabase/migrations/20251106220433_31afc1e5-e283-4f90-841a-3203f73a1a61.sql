-- Add RLS policies for webhook_logs (admin/service role only)
-- Since webhooks are system-level, we'll block direct user access
CREATE POLICY "Webhook logs are not accessible to users"
ON webhook_logs FOR ALL
USING (false);