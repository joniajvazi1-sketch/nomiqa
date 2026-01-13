-- Add B2B-critical columns to signal_logs
ALTER TABLE signal_logs 
  ADD COLUMN IF NOT EXISTS location_geohash TEXT,
  ADD COLUMN IF NOT EXISTS country_code CHAR(2),
  ADD COLUMN IF NOT EXISTS network_generation TEXT,
  ADD COLUMN IF NOT EXISTS app_version TEXT;

-- Indexes for B2B aggregation queries
CREATE INDEX IF NOT EXISTS idx_signal_logs_geohash 
  ON signal_logs(location_geohash);
CREATE INDEX IF NOT EXISTS idx_signal_logs_country 
  ON signal_logs(country_code);
CREATE INDEX IF NOT EXISTS idx_signal_logs_network_gen 
  ON signal_logs(network_generation);
CREATE INDEX IF NOT EXISTS idx_signal_logs_geohash_time 
  ON signal_logs(location_geohash, recorded_at);
CREATE INDEX IF NOT EXISTS idx_signal_logs_country_time 
  ON signal_logs(country_code, recorded_at);

COMMENT ON COLUMN signal_logs.location_geohash IS 'Precision 7 geohash (~153m x 153m) for B2B aggregation';
COMMENT ON COLUMN signal_logs.country_code IS 'ISO 3166-1 alpha-2 derived from MCC';
COMMENT ON COLUMN signal_logs.network_generation IS '5G, 4G, 3G, 2G, WiFi derived from network_type';
COMMENT ON COLUMN signal_logs.app_version IS 'App version for data quality tracking';