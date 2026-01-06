-- 1️⃣ connection_events — network stability & transitions
CREATE TABLE public.connection_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL,
  session_id UUID,

  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'lost',
      'restored',
      'type_change',
      'roaming_change'
    )
  ),

  -- What changed
  from_state TEXT,
  to_state TEXT,

  -- Context
  network_type TEXT,
  carrier_name TEXT,
  is_roaming BOOLEAN,

  -- Location (rounded, same rules as signal_logs)
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  accuracy_meters NUMERIC,

  -- Timing
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2️⃣ coverage_confirmations — gold data (user truth)
CREATE TABLE public.coverage_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL,
  session_id UUID NOT NULL,

  -- User confirmation
  quality TEXT NOT NULL CHECK (
    quality IN ('excellent', 'good', 'poor', 'no_service')
  ),

  can_browse BOOLEAN,
  can_stream BOOLEAN,
  can_call BOOLEAN,

  -- Context
  network_type TEXT,
  carrier_name TEXT,

  -- Link to objective data (anti-fraud)
  nearest_log_id UUID REFERENCES signal_logs(id),

  -- Location (rounded)
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy_meters NUMERIC,

  -- Derived (server-side)
  location_geohash TEXT,
  country_code TEXT,

  -- Why this confirmation appeared
  trigger_reason TEXT NOT NULL CHECK (
    trigger_reason IN (
      'session_end',
      'network_change',
      'quality_drop',
      'location_cluster',
      'manual'
    )
  ),

  -- Timing
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3️⃣ Phase 3 RLS for connection_events
ALTER TABLE public.connection_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connection events"
ON public.connection_events
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "No direct inserts to connection_events"
ON public.connection_events
FOR INSERT
WITH CHECK (false);

CREATE POLICY "No updates to connection_events"
ON public.connection_events
FOR UPDATE
USING (false);

CREATE POLICY "No deletes from connection_events"
ON public.connection_events
FOR DELETE
USING (false);

-- 4️⃣ Phase 3 RLS for coverage_confirmations
ALTER TABLE public.coverage_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own coverage confirmations"
ON public.coverage_confirmations
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "No direct inserts to coverage_confirmations"
ON public.coverage_confirmations
FOR INSERT
WITH CHECK (false);

CREATE POLICY "No updates to coverage_confirmations"
ON public.coverage_confirmations
FOR UPDATE
USING (false);

CREATE POLICY "No deletes from coverage_confirmations"
ON public.coverage_confirmations
FOR DELETE
USING (false);

-- 5️⃣ Indexes for performance
CREATE INDEX idx_connection_events_user_id ON public.connection_events(user_id);
CREATE INDEX idx_connection_events_session_id ON public.connection_events(session_id);
CREATE INDEX idx_connection_events_recorded_at ON public.connection_events(recorded_at);

CREATE INDEX idx_coverage_confirmations_user_id ON public.coverage_confirmations(user_id);
CREATE INDEX idx_coverage_confirmations_session_id ON public.coverage_confirmations(session_id);
CREATE INDEX idx_coverage_confirmations_geohash ON public.coverage_confirmations(location_geohash);
CREATE INDEX idx_coverage_confirmations_recorded_at ON public.coverage_confirmations(recorded_at);