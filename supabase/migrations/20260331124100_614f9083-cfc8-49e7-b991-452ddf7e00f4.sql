
-- Fix request_data_deletion: only delete CONTRIBUTION data, not profile/account
-- Also fix column references (PII is on orders_pii, not orders)
CREATE OR REPLACE FUNCTION public.request_data_deletion(requesting_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  signal_deleted integer;
  sessions_deleted integer;
  speed_tests_deleted integer;
  mining_deleted integer;
  connection_events_deleted integer;
  coverage_deleted integer;
  offline_queue_deleted integer;
BEGIN
  -- Verify the requesting user matches the authenticated user
  IF requesting_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Can only request deletion for your own data';
  END IF;

  -- Delete coverage confirmations (references signal_logs)
  DELETE FROM public.coverage_confirmations WHERE user_id = requesting_user_id;
  GET DIAGNOSTICS coverage_deleted = ROW_COUNT;

  -- Delete connection events
  DELETE FROM public.connection_events WHERE user_id = requesting_user_id;
  GET DIAGNOSTICS connection_events_deleted = ROW_COUNT;

  -- Delete offline contribution queue
  DELETE FROM public.offline_contribution_queue WHERE user_id = requesting_user_id;
  GET DIAGNOSTICS offline_queue_deleted = ROW_COUNT;

  -- Delete signal logs
  DELETE FROM public.signal_logs WHERE user_id = requesting_user_id;
  GET DIAGNOSTICS signal_deleted = ROW_COUNT;

  -- Delete contribution sessions
  DELETE FROM public.contribution_sessions WHERE user_id = requesting_user_id;
  GET DIAGNOSTICS sessions_deleted = ROW_COUNT;

  -- Delete speed test results
  DELETE FROM public.speed_test_results WHERE user_id = requesting_user_id;
  GET DIAGNOSTICS speed_tests_deleted = ROW_COUNT;

  -- Delete mining logs
  DELETE FROM public.mining_logs WHERE user_id = requesting_user_id;
  GET DIAGNOSTICS mining_deleted = ROW_COUNT;

  -- Log the deletion request for audit
  INSERT INTO public.security_audit_log (event_type, user_id, severity, details)
  VALUES (
    'gdpr_data_deletion_request',
    requesting_user_id,
    'info',
    jsonb_build_object(
      'signal_logs_deleted', signal_deleted,
      'sessions_deleted', sessions_deleted,
      'speed_tests_deleted', speed_tests_deleted,
      'mining_logs_deleted', mining_deleted,
      'connection_events_deleted', connection_events_deleted,
      'coverage_confirmations_deleted', coverage_deleted,
      'offline_queue_deleted', offline_queue_deleted,
      'requested_at', now()
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'signal_logs_deleted', signal_deleted,
    'sessions_deleted', sessions_deleted,
    'speed_tests_deleted', speed_tests_deleted,
    'mining_logs_deleted', mining_deleted,
    'connection_events_deleted', connection_events_deleted,
    'coverage_confirmations_deleted', coverage_deleted
  );
END;
$$;
