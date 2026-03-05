
-- QoE (Quality of Experience) Materialized View
-- Computes real-world user experience scores per tile/carrier/time bucket
-- Formula: 40% speed + 30% latency + 20% jitter + 10% signal quality

CREATE MATERIALIZED VIEW IF NOT EXISTS public.network_qoe_scores AS
WITH raw AS (
  SELECT
    location_geohash AS tile,
    carrier_name,
    country_code,
    network_generation,
    date_trunc('hour', recorded_at) AS time_bucket,
    EXTRACT(HOUR FROM recorded_at) AS hour_of_day,
    speed_test_down,
    speed_test_up,
    latency_ms,
    jitter_ms,
    rsrp,
    sinr,
    user_id
  FROM signal_logs
  WHERE location_geohash IS NOT NULL
    AND carrier_name IS NOT NULL
    AND is_mock_location = false
    AND is_emulator = false
    AND confidence_score >= 50
    AND (speed_test_down IS NOT NULL OR latency_ms IS NOT NULL)
),
aggregated AS (
  SELECT
    tile,
    carrier_name,
    country_code,
    network_generation,
    time_bucket,
    AVG(speed_test_down) AS avg_download_mbps,
    AVG(speed_test_up) AS avg_upload_mbps,
    AVG(latency_ms) AS avg_latency_ms,
    AVG(jitter_ms) AS avg_jitter_ms,
    AVG(rsrp) AS avg_rsrp,
    AVG(sinr) AS avg_sinr,
    COUNT(*) AS sample_count,
    COUNT(DISTINCT user_id) AS unique_users
  FROM raw
  GROUP BY tile, carrier_name, country_code, network_generation, time_bucket
  HAVING COUNT(DISTINCT user_id) >= 2
)
SELECT
  tile,
  carrier_name,
  country_code,
  network_generation,
  time_bucket,
  ROUND(avg_download_mbps::numeric, 2) AS avg_download_mbps,
  ROUND(avg_upload_mbps::numeric, 2) AS avg_upload_mbps,
  ROUND(avg_latency_ms::numeric, 1) AS avg_latency_ms,
  ROUND(avg_jitter_ms::numeric, 1) AS avg_jitter_ms,
  ROUND(avg_rsrp::numeric, 1) AS avg_rsrp,
  sample_count,
  unique_users,
  -- QoE Score (0-100): 40% speed + 30% latency + 20% jitter + 10% signal
  LEAST(100, GREATEST(0, ROUND(
    -- Speed component (0-40): 100+ Mbps = max, 0 = 0
    (LEAST(avg_download_mbps / 100.0, 1.0) * 40) +
    -- Latency component (0-30): <10ms = max, >200ms = 0
    (GREATEST(0, 1.0 - LEAST(avg_latency_ms / 200.0, 1.0)) * 30) +
    -- Jitter component (0-20): <5ms = max, >100ms = 0
    (CASE WHEN avg_jitter_ms IS NOT NULL
      THEN GREATEST(0, 1.0 - LEAST(avg_jitter_ms / 100.0, 1.0)) * 20
      ELSE 10 END) +
    -- Signal component (0-10): >-70 = max, <-120 = 0
    (CASE WHEN avg_rsrp IS NOT NULL
      THEN GREATEST(0, LEAST((avg_rsrp + 120.0) / 50.0, 1.0)) * 10
      ELSE 5 END)
  ))) AS qoe_score,
  -- Activity classifications
  CASE
    WHEN avg_download_mbps >= 15 AND avg_latency_ms < 40 THEN 'hd_streaming'
    WHEN avg_download_mbps >= 5 THEN 'sd_streaming'
    ELSE 'buffering_risk'
  END AS streaming_quality,
  CASE
    WHEN avg_latency_ms < 40 THEN 'excellent'
    WHEN avg_latency_ms < 80 THEN 'playable'
    ELSE 'lag'
  END AS gaming_quality,
  CASE
    WHEN avg_latency_ms < 80 AND (avg_jitter_ms IS NULL OR avg_jitter_ms < 20) THEN 'stable'
    ELSE 'unstable'
  END AS video_call_quality,
  -- Overall rating
  CASE
    WHEN LEAST(100, GREATEST(0, ROUND(
      (LEAST(avg_download_mbps / 100.0, 1.0) * 40) +
      (GREATEST(0, 1.0 - LEAST(avg_latency_ms / 200.0, 1.0)) * 30) +
      (CASE WHEN avg_jitter_ms IS NOT NULL THEN GREATEST(0, 1.0 - LEAST(avg_jitter_ms / 100.0, 1.0)) * 20 ELSE 10 END) +
      (CASE WHEN avg_rsrp IS NOT NULL THEN GREATEST(0, LEAST((avg_rsrp + 120.0) / 50.0, 1.0)) * 10 ELSE 5 END)
    ))) >= 90 THEN 'excellent'
    WHEN LEAST(100, GREATEST(0, ROUND(
      (LEAST(avg_download_mbps / 100.0, 1.0) * 40) +
      (GREATEST(0, 1.0 - LEAST(avg_latency_ms / 200.0, 1.0)) * 30) +
      (CASE WHEN avg_jitter_ms IS NOT NULL THEN GREATEST(0, 1.0 - LEAST(avg_jitter_ms / 100.0, 1.0)) * 20 ELSE 10 END) +
      (CASE WHEN avg_rsrp IS NOT NULL THEN GREATEST(0, LEAST((avg_rsrp + 120.0) / 50.0, 1.0)) * 10 ELSE 5 END)
    ))) >= 75 THEN 'good'
    WHEN LEAST(100, GREATEST(0, ROUND(
      (LEAST(avg_download_mbps / 100.0, 1.0) * 40) +
      (GREATEST(0, 1.0 - LEAST(avg_latency_ms / 200.0, 1.0)) * 30) +
      (CASE WHEN avg_jitter_ms IS NOT NULL THEN GREATEST(0, 1.0 - LEAST(avg_jitter_ms / 100.0, 1.0)) * 20 ELSE 10 END) +
      (CASE WHEN avg_rsrp IS NOT NULL THEN GREATEST(0, LEAST((avg_rsrp + 120.0) / 50.0, 1.0)) * 10 ELSE 5 END)
    ))) >= 60 THEN 'fair'
    WHEN LEAST(100, GREATEST(0, ROUND(
      (LEAST(avg_download_mbps / 100.0, 1.0) * 40) +
      (GREATEST(0, 1.0 - LEAST(avg_latency_ms / 200.0, 1.0)) * 30) +
      (CASE WHEN avg_jitter_ms IS NOT NULL THEN GREATEST(0, 1.0 - LEAST(avg_jitter_ms / 100.0, 1.0)) * 20 ELSE 10 END) +
      (CASE WHEN avg_rsrp IS NOT NULL THEN GREATEST(0, LEAST((avg_rsrp + 120.0) / 50.0, 1.0)) * 10 ELSE 5 END)
    ))) >= 40 THEN 'poor'
    ELSE 'bad'
  END AS qoe_rating
FROM aggregated;

-- Security: no public access, service role only
REVOKE ALL ON public.network_qoe_scores FROM anon, authenticated;

-- Add to refresh schedule (every 6 hours alongside other views)
SELECT cron.schedule(
  'refresh-qoe-scores',
  '15 */6 * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY public.network_qoe_scores;'
);

-- Create unique index for CONCURRENTLY refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_qoe_scores_unique
  ON public.network_qoe_scores (tile, carrier_name, network_generation, time_bucket);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_qoe_scores_country ON public.network_qoe_scores (country_code);
CREATE INDEX IF NOT EXISTS idx_qoe_scores_carrier ON public.network_qoe_scores (carrier_name);
CREATE INDEX IF NOT EXISTS idx_qoe_scores_score ON public.network_qoe_scores (qoe_score DESC);
CREATE INDEX IF NOT EXISTS idx_qoe_scores_rating ON public.network_qoe_scores (qoe_rating);
