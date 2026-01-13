-- Step 2: Create coverage_tiles materialized view for B2B aggregation
CREATE MATERIALIZED VIEW IF NOT EXISTS coverage_tiles AS
SELECT 
  location_geohash,
  country_code,
  carrier_name,
  network_generation,
  
  -- Sample statistics
  COUNT(*) as sample_count,
  COUNT(DISTINCT user_id) as unique_users,
  MIN(recorded_at) as first_seen,
  MAX(recorded_at) as last_updated,
  
  -- Signal quality aggregations
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY rsrp) as median_rsrp,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY rsrq) as median_rsrq,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY sinr) as median_sinr,
  AVG(rsrp) as avg_rsrp,
  
  -- Speed/latency aggregations
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY speed_test_down) as median_download_mbps,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY speed_test_up) as median_upload_mbps,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY latency_ms) as median_latency_ms,
  AVG(speed_test_down) as avg_download_mbps,
  AVG(latency_ms) as avg_latency_ms,
  
  -- Quality distribution
  ROUND(100.0 * COUNT(*) FILTER (WHERE rsrp >= -80) / NULLIF(COUNT(*) FILTER (WHERE rsrp IS NOT NULL), 0), 1) as pct_excellent_signal,
  ROUND(100.0 * COUNT(*) FILTER (WHERE rsrp BETWEEN -100 AND -81) / NULLIF(COUNT(*) FILTER (WHERE rsrp IS NOT NULL), 0), 1) as pct_good_signal,
  ROUND(100.0 * COUNT(*) FILTER (WHERE rsrp < -100) / NULLIF(COUNT(*) FILTER (WHERE rsrp IS NOT NULL), 0), 1) as pct_poor_signal,
  
  -- Confidence stats
  AVG(confidence_score) as avg_confidence,
  COUNT(*) FILTER (WHERE confidence_score >= 70) as high_confidence_samples,
  
  -- Roaming stats
  ROUND(100.0 * COUNT(*) FILTER (WHERE roaming_status = true) / NULLIF(COUNT(*), 0), 1) as pct_roaming

FROM signal_logs
WHERE location_geohash IS NOT NULL
  AND recorded_at > NOW() - INTERVAL '30 days'
GROUP BY 
  location_geohash,
  country_code,
  carrier_name,
  network_generation;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_coverage_tiles_pk 
  ON coverage_tiles(location_geohash, COALESCE(country_code, ''), COALESCE(carrier_name, ''), COALESCE(network_generation, ''));

CREATE INDEX IF NOT EXISTS idx_coverage_tiles_country ON coverage_tiles(country_code);
CREATE INDEX IF NOT EXISTS idx_coverage_tiles_carrier ON coverage_tiles(carrier_name);
CREATE INDEX IF NOT EXISTS idx_coverage_tiles_samples ON coverage_tiles(sample_count DESC);

-- Create refresh function
CREATE OR REPLACE FUNCTION refresh_coverage_tiles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY coverage_tiles;
  
  INSERT INTO webhook_logs (event_type, payload, processed)
  VALUES (
    'coverage_tiles_refresh',
    jsonb_build_object('refreshed_at', now(), 'status', 'success'),
    true
  );
END;
$$;

-- Create user_daily_limits table for rate limiting
CREATE TABLE IF NOT EXISTS user_daily_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  limit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  signal_logs_count INTEGER DEFAULT 0,
  speed_tests_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, limit_date)
);

ALTER TABLE user_daily_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own limits" ON user_daily_limits
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_daily_limits_user_date 
  ON user_daily_limits(user_id, limit_date);

COMMENT ON TABLE user_daily_limits IS 'Anti-abuse rate limiting per user per day';
COMMENT ON MATERIALIZED VIEW coverage_tiles IS 'B2B aggregation layer - refresh via cron or manual call to refresh_coverage_tiles()';