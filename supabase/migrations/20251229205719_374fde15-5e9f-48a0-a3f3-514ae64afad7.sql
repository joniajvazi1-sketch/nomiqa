-- =====================================================
-- NOMIQA DEPIN / NETWORK CONTRIBUTION TABLES
-- =====================================================

-- 1. Create contribution_sessions table
-- Track individual Network Contribution sessions with GPS data
CREATE TABLE public.contribution_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  total_distance_meters NUMERIC DEFAULT 0,
  total_points_earned NUMERIC DEFAULT 0,
  data_points_count INTEGER DEFAULT 0,
  average_signal_strength INTEGER,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_status CHECK (status IN ('active', 'completed', 'cancelled'))
);

-- Enable RLS for contribution_sessions
ALTER TABLE public.contribution_sessions ENABLE ROW LEVEL SECURITY;

-- Deny anonymous access
CREATE POLICY "Deny anonymous access to contribution_sessions"
ON public.contribution_sessions
FOR ALL
USING (false);

-- Users can view their own sessions
CREATE POLICY "Users can view own contribution sessions"
ON public.contribution_sessions
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert own contribution sessions"
ON public.contribution_sessions
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own contribution sessions"
ON public.contribution_sessions
FOR UPDATE
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- No deletes by users
CREATE POLICY "No contribution session deletions by users"
ON public.contribution_sessions
FOR DELETE
USING (false);

-- 2. Create user_points table
-- Track cumulative Nomi Points balance per user
CREATE TABLE public.user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  total_points NUMERIC DEFAULT 0,
  pending_points NUMERIC DEFAULT 0,
  total_distance_meters NUMERIC DEFAULT 0,
  total_contribution_time_seconds INTEGER DEFAULT 0,
  contribution_streak_days INTEGER DEFAULT 0,
  last_contribution_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for user_points
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

-- Deny anonymous access
CREATE POLICY "Deny anonymous access to user_points"
ON public.user_points
FOR ALL
USING (false);

-- Users can view their own points
CREATE POLICY "Users can view own points"
ON public.user_points
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Users can insert their own points record
CREATE POLICY "Users can insert own points"
ON public.user_points
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Users can update their own points (for local increments)
CREATE POLICY "Users can update own points"
ON public.user_points
FOR UPDATE
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- No deletes by users
CREATE POLICY "No user_points deletions by users"
ON public.user_points
FOR DELETE
USING (false);

-- 3. Create offline_contribution_queue table
-- Store data collected while offline for later sync
CREATE TABLE public.offline_contribution_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID REFERENCES public.contribution_sessions(id),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  signal_dbm INTEGER,
  network_type TEXT,
  carrier TEXT,
  device_type TEXT,
  speed_mps NUMERIC,
  accuracy_meters NUMERIC,
  recorded_at TIMESTAMPTZ NOT NULL,
  synced_at TIMESTAMPTZ,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for offline_contribution_queue
ALTER TABLE public.offline_contribution_queue ENABLE ROW LEVEL SECURITY;

-- Deny anonymous access
CREATE POLICY "Deny anonymous access to offline_contribution_queue"
ON public.offline_contribution_queue
FOR ALL
USING (false);

-- Users can view their own queue
CREATE POLICY "Users can view own offline queue"
ON public.offline_contribution_queue
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Users can insert their own queue items
CREATE POLICY "Users can insert own offline queue"
ON public.offline_contribution_queue
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Users can update their own queue items (for marking as synced)
CREATE POLICY "Users can update own offline queue"
ON public.offline_contribution_queue
FOR UPDATE
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- No deletes by users
CREATE POLICY "No offline_queue deletions by users"
ON public.offline_contribution_queue
FOR DELETE
USING (false);

-- 4. Create trigger to update updated_at on user_points
CREATE TRIGGER update_user_points_updated_at
BEFORE UPDATE ON public.user_points
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Create index for faster queries
CREATE INDEX idx_contribution_sessions_user_id ON public.contribution_sessions(user_id);
CREATE INDEX idx_contribution_sessions_status ON public.contribution_sessions(status);
CREATE INDEX idx_user_points_user_id ON public.user_points(user_id);
CREATE INDEX idx_offline_queue_user_id ON public.offline_contribution_queue(user_id);
CREATE INDEX idx_offline_queue_processed ON public.offline_contribution_queue(processed);