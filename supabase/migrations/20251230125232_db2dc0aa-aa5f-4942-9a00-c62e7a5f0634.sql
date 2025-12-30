-- Create signal_logs table for telco-grade metrics
CREATE TABLE public.signal_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id UUID REFERENCES public.contribution_sessions(id),
  
  -- Location Data
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy_meters NUMERIC,
  altitude_meters NUMERIC,
  speed_mps NUMERIC,
  heading_degrees NUMERIC,
  
  -- Signal Quality Metrics (The "Money" Metrics)
  rsrp INTEGER, -- Reference Signal Received Power (dBm, e.g., -90)
  rsrq INTEGER, -- Reference Signal Received Quality (dB)
  rssi INTEGER, -- Received Signal Strength Indicator (dBm)
  sinr NUMERIC, -- Signal-to-Interference-plus-Noise Ratio (dB)
  
  -- Network Identity
  network_type TEXT, -- Granular: '5G SA', '5G NSA', 'LTE', 'LTE-A', 'HSPA+', '3G', '2G'
  carrier_name TEXT, -- Display name (e.g., 'Verizon', 'T-Mobile')
  mcc TEXT, -- Mobile Country Code (e.g., '310')
  mnc TEXT, -- Mobile Network Code (e.g., '410')
  mcc_mnc TEXT, -- Combined (e.g., '310-410')
  roaming_status BOOLEAN DEFAULT FALSE,
  
  -- Connection Quality (Speed Tests)
  speed_test_down NUMERIC, -- Download speed (Mbps)
  speed_test_up NUMERIC, -- Upload speed (Mbps)
  latency_ms INTEGER, -- Ping time (ms)
  jitter_ms INTEGER, -- Jitter (ms)
  
  -- Device Context
  device_model TEXT, -- e.g., 'iPhone 15 Pro', 'Pixel 8'
  device_manufacturer TEXT, -- e.g., 'Apple', 'Samsung'
  os_version TEXT, -- e.g., 'iOS 17.2', 'Android 14'
  
  -- Cell Tower Info (when available)
  cell_id TEXT,
  tac TEXT, -- Tracking Area Code
  pci INTEGER, -- Physical Cell ID
  band_number INTEGER, -- e.g., Band 71, Band 41
  frequency_mhz NUMERIC, -- Center frequency
  bandwidth_mhz NUMERIC, -- Channel bandwidth
  
  -- Timestamps
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for efficient querying
CREATE INDEX idx_signal_logs_user_id ON public.signal_logs(user_id);
CREATE INDEX idx_signal_logs_session_id ON public.signal_logs(session_id);
CREATE INDEX idx_signal_logs_recorded_at ON public.signal_logs(recorded_at DESC);
CREATE INDEX idx_signal_logs_lat_lon ON public.signal_logs(latitude, longitude);
CREATE INDEX idx_signal_logs_mcc_mnc ON public.signal_logs(mcc_mnc);
CREATE INDEX idx_signal_logs_network_type ON public.signal_logs(network_type);
CREATE INDEX idx_signal_logs_carrier ON public.signal_logs(carrier_name);

-- Enable RLS
ALTER TABLE public.signal_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Deny anonymous access to signal_logs"
ON public.signal_logs FOR ALL
USING (false);

CREATE POLICY "Users can view own signal logs"
ON public.signal_logs FOR SELECT
USING ((auth.uid() IS NOT NULL) AND (auth.uid() = user_id));

CREATE POLICY "Users can insert own signal logs"
ON public.signal_logs FOR INSERT
WITH CHECK ((auth.uid() IS NOT NULL) AND (auth.uid() = user_id));

CREATE POLICY "No signal_log deletions by users"
ON public.signal_logs FOR DELETE
USING (false);

CREATE POLICY "No signal_log updates by users"
ON public.signal_logs FOR UPDATE
USING (false);