
-- Update cleanup_old_signal_logs: 90 days → 60 days
CREATE OR REPLACE FUNCTION public.cleanup_old_signal_logs()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.signal_logs
  WHERE recorded_at < now() - INTERVAL '60 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  INSERT INTO public.webhook_logs (event_type, payload, processed)
  VALUES (
    'signal_logs_cleanup_executed',
    jsonb_build_object(
      'deleted_logs', deleted_count,
      'executed_at', now(),
      'retention_days', 60
    ),
    true
  );
  
  RETURN deleted_count;
END;
$function$;

-- Update cleanup_old_mining_logs: 90 days → 60 days
CREATE OR REPLACE FUNCTION public.cleanup_old_mining_logs()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.mining_logs
  WHERE timestamp < now() - INTERVAL '60 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  INSERT INTO public.webhook_logs (event_type, payload, processed)
  VALUES (
    'mining_logs_cleanup_executed',
    jsonb_build_object(
      'deleted_logs', deleted_count,
      'executed_at', now(),
      'retention_days', 60
    ),
    true
  );
  
  RETURN deleted_count;
END;
$function$;
