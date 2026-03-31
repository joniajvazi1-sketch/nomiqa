
-- Phase 1: Performance indexes for scaling to 20k users

-- Composite index on signal_logs (user_id, recorded_at) for efficient user-scoped time queries
CREATE INDEX IF NOT EXISTS idx_signal_logs_user_recorded 
ON public.signal_logs (user_id, recorded_at DESC);

-- Composite index on contribution_sessions (user_id, started_at) for session lookups
CREATE INDEX IF NOT EXISTS idx_contribution_sessions_user_started 
ON public.contribution_sessions (user_id, started_at DESC);

-- Index on contribution_sessions started_at for the 24h sessions query in get-network-stats-cached
CREATE INDEX IF NOT EXISTS idx_contribution_sessions_started_at 
ON public.contribution_sessions (started_at DESC);

-- Create a fast estimated count function using pg_class (avoids full table scans)
CREATE OR REPLACE FUNCTION public.estimated_row_count(table_name text)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT GREATEST(
    (SELECT reltuples::bigint FROM pg_class WHERE relname = table_name AND relkind = 'r'),
    0
  );
$$;
