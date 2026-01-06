-- Add FK references for user_id + session_id (data integrity)

-- connection_events FKs
ALTER TABLE public.connection_events
  ADD CONSTRAINT connection_events_session_fk
  FOREIGN KEY (session_id) REFERENCES public.contribution_sessions(id);

-- coverage_confirmations FKs  
ALTER TABLE public.coverage_confirmations
  ADD CONSTRAINT coverage_confirmations_session_fk
  FOREIGN KEY (session_id) REFERENCES public.contribution_sessions(id);