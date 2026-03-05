
-- Add device capability columns to signal_logs
ALTER TABLE public.signal_logs
  ADD COLUMN IF NOT EXISTS device_5g_capable boolean DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS max_supported_generation text DEFAULT NULL;

-- Performance indexes for B2B queries (non-concurrent for migration compatibility)
CREATE INDEX IF NOT EXISTS idx_signal_logs_recorded_at 
  ON public.signal_logs (recorded_at);

CREATE INDEX IF NOT EXISTS idx_signal_logs_country_carrier_gen 
  ON public.signal_logs (country_code, carrier_name, network_generation);

CREATE INDEX IF NOT EXISTS idx_signal_logs_geohash_time 
  ON public.signal_logs (location_geohash, recorded_at);

CREATE INDEX IF NOT EXISTS idx_signal_logs_5g_capable 
  ON public.signal_logs (device_5g_capable) WHERE device_5g_capable IS NOT NULL;
