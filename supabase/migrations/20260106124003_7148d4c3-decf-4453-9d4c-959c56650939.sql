-- Create app_remote_config table for storing configuration values
CREATE TABLE public.app_remote_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text NOT NULL UNIQUE,
  config_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_sensitive boolean NOT NULL DEFAULT false,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_remote_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies (no FOR ALL USING(false) - that would block SELECT too)

-- SELECT: Only allow reading non-sensitive config
CREATE POLICY "Public config is readable by anyone"
ON public.app_remote_config
FOR SELECT
USING (is_sensitive = false);

-- INSERT: Blocked for all users (service role only)
CREATE POLICY "No user inserts to config"
ON public.app_remote_config
FOR INSERT
WITH CHECK (false);

-- UPDATE: Blocked for all users (service role only)
CREATE POLICY "No user updates to config"
ON public.app_remote_config
FOR UPDATE
USING (false);

-- DELETE: Blocked for all users (service role only)
CREATE POLICY "No user deletes from config"
ON public.app_remote_config
FOR DELETE
USING (false);

-- Seed initial config rows
INSERT INTO public.app_remote_config (config_key, config_value, is_sensitive, description) VALUES
-- Public config (readable by clients)
('speed_test_enabled', 'true'::jsonb, false, 'Enable/disable speed tests'),
('speed_test_interval_ms', '600000'::jsonb, false, 'Speed test interval in milliseconds'),
('min_logging_distance_m', '100'::jsonb, false, 'Minimum distance between signal logs in meters'),
('min_logging_interval_s', '300'::jsonb, false, 'Minimum time between signal logs in seconds'),
('points_per_km', '10'::jsonb, false, 'Points earned per kilometer traveled'),
('points_per_minute', '0.5'::jsonb, false, 'Points earned per minute of active contribution'),
('speed_test_bonus_points', '2'::jsonb, false, 'Bonus points for completing a speed test'),
('premium_speed_threshold_mbps', '50'::jsonb, false, 'Speed threshold for premium bonus'),
('app_min_version', '"1.0.0"'::jsonb, false, 'Minimum supported app version'),

-- Sensitive anti-fraud config (server-side only)
('max_speed_mps', '50'::jsonb, true, 'Max plausible speed in m/s for fraud detection'),
('max_points_per_session', '1000'::jsonb, true, 'Max points allowed per session'),
('min_accuracy_meters', '5'::jsonb, true, 'Minimum GPS accuracy required'),
('max_accuracy_meters', '100'::jsonb, true, 'Maximum GPS accuracy allowed'),
('fraud_velocity_threshold_mps', '100'::jsonb, true, 'Velocity that triggers fraud flag'),
('session_timeout_hours', '24'::jsonb, true, 'Max session duration before auto-close'),
('duplicate_location_window_s', '60'::jsonb, true, 'Window for detecting duplicate locations'),
('geohash_precision', '7'::jsonb, true, 'Geohash precision for location hashing');