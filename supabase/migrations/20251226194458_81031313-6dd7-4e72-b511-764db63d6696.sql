-- Create a function to clean up old mining logs (location data older than 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_mining_logs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Delete mining logs older than 90 days to limit location data exposure
  DELETE FROM public.mining_logs
  WHERE timestamp < now() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the cleanup for audit purposes
  INSERT INTO public.webhook_logs (event_type, payload, processed)
  VALUES (
    'mining_logs_cleanup_executed',
    jsonb_build_object(
      'deleted_logs', deleted_count,
      'executed_at', now(),
      'retention_days', 90
    ),
    true
  );
  
  RETURN deleted_count;
END;
$$;

-- Add a comment explaining the data retention policy
COMMENT ON TABLE public.mining_logs IS 'Stores network signal data for mining rewards. Location data is automatically purged after 90 days via cleanup_old_mining_logs() to comply with privacy regulations.';

-- Grant execute permission only to service role (for scheduled cleanup)
REVOKE ALL ON FUNCTION public.cleanup_old_mining_logs() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cleanup_old_mining_logs() FROM anon;
REVOKE ALL ON FUNCTION public.cleanup_old_mining_logs() FROM authenticated;