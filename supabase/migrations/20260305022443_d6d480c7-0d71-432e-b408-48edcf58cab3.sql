
-- =============================================
-- B2B Analytics: Coverage Gaps, Carrier Benchmarking, Congestion Detection
-- =============================================

-- 1️⃣ COVERAGE GAP DETECTION
-- Identifies areas with poor signal across multiple users
-- Telcos use this for network planning and tower placement
CREATE MATERIALIZED VIEW IF NOT EXISTS public.coverage_gaps AS
WITH gap_data AS (
  SELECT
    location_geohash,
    country_code,
    carrier_name,
    network_generation,
    COUNT(*) AS sample_count,
    COUNT(DISTINCT user_id) AS affected_users,
    ROUND(AVG(rsrp)::numeric, 1) AS avg_rsrp,
    ROUND(AVG(sinr)::numeric, 1) AS avg_sinr,
    ROUND(AVG(speed_test_down)::numeric, 2) AS avg_download_mbps,
    ROUND(AVG(speed_test_up)::numeric, 2) AS avg_upload_mbps,
    ROUND(AVG(latency_ms)::numeric, 0) AS avg_latency_ms,
    ROUND(AVG(COALESCE(confidence_score, 50))::numeric, 0) AS avg_confidence,
    MIN(recorded_at) AS first_detected,
    MAX(recorded_at) AS last_detected,
    -- Center of the tile (approximate)
    ROUND(AVG(latitude)::numeric, 4) AS center_lat,
    ROUND(AVG(longitude)::numeric, 4) AS center_lng
  FROM signal_logs
  WHERE 
    location_geohash IS NOT NULL
    AND latitude != 0 AND longitude != 0
    AND recorded_at > now() - INTERVAL '90 days'
  GROUP BY location_geohash, country_code, carrier_name, network_generation
  HAVING COUNT(DISTINCT user_id) >= 2  -- K-anonymity: at least 2 users
)
SELECT
  location_geohash,
  country_code,
  carrier_name,
  network_generation,
  sample_count,
  affected_users,
  avg_rsrp,
  avg_sinr,
  avg_download_mbps,
  avg_upload_mbps,
  avg_latency_ms,
  avg_confidence,
  first_detected,
  last_detected,
  center_lat,
  center_lng,
  -- Severity scoring (0-100, higher = worse gap)
  LEAST(100, GREATEST(0,
    CASE WHEN avg_rsrp IS NOT NULL AND avg_rsrp < -120 THEN 40
         WHEN avg_rsrp IS NOT NULL AND avg_rsrp < -110 THEN 25
         WHEN avg_rsrp IS NOT NULL AND avg_rsrp < -100 THEN 10
         ELSE 0 END
    +
    CASE WHEN avg_sinr IS NOT NULL AND avg_sinr < 0 THEN 30
         WHEN avg_sinr IS NOT NULL AND avg_sinr < 5 THEN 15
         WHEN avg_sinr IS NOT NULL AND avg_sinr < 10 THEN 5
         ELSE 0 END
    +
    CASE WHEN avg_download_mbps IS NOT NULL AND avg_download_mbps < 1 THEN 30
         WHEN avg_download_mbps IS NOT NULL AND avg_download_mbps < 2 THEN 20
         WHEN avg_download_mbps IS NOT NULL AND avg_download_mbps < 5 THEN 10
         ELSE 0 END
  ))::integer AS severity_score
FROM gap_data
WHERE 
  -- At least one "gap" indicator is present
  (avg_rsrp IS NOT NULL AND avg_rsrp < -100)
  OR (avg_sinr IS NOT NULL AND avg_sinr < 5)
  OR (avg_download_mbps IS NOT NULL AND avg_download_mbps < 2)
WITH DATA;

-- Unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_coverage_gaps_pk 
  ON public.coverage_gaps (location_geohash, COALESCE(carrier_name, '__null__'), COALESCE(network_generation, '__null__'));
CREATE INDEX IF NOT EXISTS idx_coverage_gaps_severity 
  ON public.coverage_gaps (severity_score DESC);
CREATE INDEX IF NOT EXISTS idx_coverage_gaps_country 
  ON public.coverage_gaps (country_code);


-- 2️⃣ CARRIER BENCHMARKING
-- Compares carrier performance across regions
-- Telcos use this for competitive intelligence and regulatory filings
CREATE MATERIALIZED VIEW IF NOT EXISTS public.carrier_benchmarks AS
SELECT
  country_code,
  carrier_name,
  network_generation,
  COUNT(*) AS sample_count,
  COUNT(DISTINCT user_id) AS unique_users,
  -- Signal quality
  ROUND(AVG(rsrp)::numeric, 1) AS avg_rsrp,
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY rsrp)::numeric, 1) AS median_rsrp,
  ROUND(AVG(sinr)::numeric, 1) AS avg_sinr,
  -- Speed metrics
  ROUND(AVG(speed_test_down)::numeric, 2) AS avg_download_mbps,
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY speed_test_down)::numeric, 2) AS median_download_mbps,
  ROUND(AVG(speed_test_up)::numeric, 2) AS avg_upload_mbps,
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY speed_test_up)::numeric, 2) AS median_upload_mbps,
  -- Latency
  ROUND(AVG(latency_ms)::numeric, 0) AS avg_latency_ms,
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY latency_ms)::numeric, 0) AS median_latency_ms,
  -- Coverage quality distribution
  ROUND(100.0 * COUNT(*) FILTER (WHERE rsrp >= -85) / NULLIF(COUNT(*) FILTER (WHERE rsrp IS NOT NULL), 0), 1) AS pct_excellent_signal,
  ROUND(100.0 * COUNT(*) FILTER (WHERE rsrp >= -100 AND rsrp < -85) / NULLIF(COUNT(*) FILTER (WHERE rsrp IS NOT NULL), 0), 1) AS pct_good_signal,
  ROUND(100.0 * COUNT(*) FILTER (WHERE rsrp < -110) / NULLIF(COUNT(*) FILTER (WHERE rsrp IS NOT NULL), 0), 1) AS pct_poor_signal,
  -- 5G availability
  ROUND(100.0 * COUNT(*) FILTER (WHERE device_5g_capable = true) / NULLIF(COUNT(*), 0), 1) AS pct_5g_capable_devices,
  -- Composite coverage score (0-100)
  LEAST(100, GREATEST(0,
    COALESCE(
      -- Signal component (40%)
      40.0 * (LEAST(GREATEST(AVG(CASE WHEN rsrp IS NOT NULL THEN (rsrp + 140.0) / 96.0 ELSE NULL END), 0), 1)),
      20
    ) +
    COALESCE(
      -- Speed component (35%)
      35.0 * LEAST(AVG(CASE WHEN speed_test_down IS NOT NULL THEN LEAST(speed_test_down / 100.0, 1) ELSE NULL END), 1),
      15
    ) +
    COALESCE(
      -- Latency component (25%, inverse - lower is better)
      25.0 * (1.0 - LEAST(AVG(CASE WHEN latency_ms IS NOT NULL THEN LEAST(latency_ms::numeric / 200.0, 1) ELSE NULL END), 1)),
      10
    )
  ))::integer AS coverage_score,
  -- Ranking within country (computed at query time or refresh)
  MAX(recorded_at) AS last_updated
FROM signal_logs
WHERE 
  carrier_name IS NOT NULL
  AND country_code IS NOT NULL
  AND latitude != 0 AND longitude != 0
  AND recorded_at > now() - INTERVAL '90 days'
GROUP BY country_code, carrier_name, network_generation
HAVING COUNT(DISTINCT user_id) >= 2  -- K-anonymity
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_carrier_benchmarks_pk 
  ON public.carrier_benchmarks (COALESCE(country_code, '__'), carrier_name, COALESCE(network_generation, '__'));
CREATE INDEX IF NOT EXISTS idx_carrier_benchmarks_country 
  ON public.carrier_benchmarks (country_code);
CREATE INDEX IF NOT EXISTS idx_carrier_benchmarks_score 
  ON public.carrier_benchmarks (coverage_score DESC);


-- 3️⃣ NETWORK CONGESTION DETECTION
-- Finds areas with good signal but poor throughput = overloaded towers
-- Telcos use this for capacity planning and small cell deployment
CREATE MATERIALIZED VIEW IF NOT EXISTS public.network_congestion AS
WITH hourly_data AS (
  SELECT
    location_geohash,
    country_code,
    carrier_name,
    network_generation,
    EXTRACT(HOUR FROM recorded_at) AS hour_of_day,
    EXTRACT(DOW FROM recorded_at) AS day_of_week,
    -- Is peak hour (7-9 AM, 12-2 PM, 5-9 PM local — approximated as UTC)
    CASE WHEN EXTRACT(HOUR FROM recorded_at) IN (7,8,9,12,13,17,18,19,20) THEN true ELSE false END AS is_peak_hour,
    rsrp,
    sinr,
    speed_test_down,
    speed_test_up,
    latency_ms,
    user_id,
    recorded_at,
    latitude,
    longitude
  FROM signal_logs
  WHERE
    location_geohash IS NOT NULL
    AND carrier_name IS NOT NULL
    AND rsrp IS NOT NULL
    AND speed_test_down IS NOT NULL
    AND latitude != 0 AND longitude != 0
    AND recorded_at > now() - INTERVAL '90 days'
)
SELECT
  location_geohash,
  country_code,
  carrier_name,
  network_generation,
  hour_of_day::integer,
  day_of_week::integer,
  is_peak_hour,
  COUNT(*) AS sample_count,
  COUNT(DISTINCT user_id) AS unique_users,
  ROUND(AVG(rsrp)::numeric, 1) AS avg_rsrp,
  ROUND(AVG(sinr)::numeric, 1) AS avg_sinr,
  ROUND(AVG(speed_test_down)::numeric, 2) AS avg_download_mbps,
  ROUND(AVG(speed_test_up)::numeric, 2) AS avg_upload_mbps,
  ROUND(AVG(latency_ms)::numeric, 0) AS avg_latency_ms,
  ROUND(AVG(latitude)::numeric, 4) AS center_lat,
  ROUND(AVG(longitude)::numeric, 4) AS center_lng,
  -- Congestion score: good signal + bad speed = congestion
  -- Score 0-100, higher = more congested
  LEAST(100, GREATEST(0,
    CASE 
      -- Good signal (RSRP > -100) but terrible speed (< 5 Mbps) = strong congestion
      WHEN AVG(rsrp) > -100 AND AVG(speed_test_down) < 2 THEN 90
      WHEN AVG(rsrp) > -100 AND AVG(speed_test_down) < 5 THEN 70
      WHEN AVG(rsrp) > -100 AND AVG(speed_test_down) < 10 THEN 50
      -- Decent signal (RSRP > -110) but low speed
      WHEN AVG(rsrp) > -110 AND AVG(speed_test_down) < 2 THEN 60
      WHEN AVG(rsrp) > -110 AND AVG(speed_test_down) < 5 THEN 40
      -- Weak signal + low speed = coverage issue, not congestion
      ELSE 10
    END
    +
    -- High latency bonus
    CASE WHEN AVG(latency_ms) > 100 THEN 10
         WHEN AVG(latency_ms) > 50 THEN 5
         ELSE 0 END
  ))::integer AS congestion_score
FROM hourly_data
GROUP BY location_geohash, country_code, carrier_name, network_generation, hour_of_day, day_of_week, is_peak_hour
HAVING COUNT(DISTINCT user_id) >= 2
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_congestion_pk 
  ON public.network_congestion (location_geohash, COALESCE(carrier_name, '__'), COALESCE(network_generation, '__'), hour_of_day, day_of_week);
CREATE INDEX IF NOT EXISTS idx_congestion_score 
  ON public.network_congestion (congestion_score DESC);
CREATE INDEX IF NOT EXISTS idx_congestion_country 
  ON public.network_congestion (country_code);
CREATE INDEX IF NOT EXISTS idx_congestion_peak 
  ON public.network_congestion (is_peak_hour, congestion_score DESC);


-- 4️⃣ REFRESH FUNCTION for all B2B views
CREATE OR REPLACE FUNCTION public.refresh_b2b_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  gaps_count integer;
  benchmarks_count integer;
  congestion_count integer;
BEGIN
  -- Refresh all B2B materialized views concurrently
  -- (requires the unique indexes we created above)
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY coverage_gaps;
  EXCEPTION WHEN OTHERS THEN
    -- First-time population may fail with CONCURRENTLY
    REFRESH MATERIALIZED VIEW coverage_gaps;
  END;
  
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY carrier_benchmarks;
  EXCEPTION WHEN OTHERS THEN
    REFRESH MATERIALIZED VIEW carrier_benchmarks;
  END;
  
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY network_congestion;
  EXCEPTION WHEN OTHERS THEN
    REFRESH MATERIALIZED VIEW network_congestion;
  END;
  
  -- Get counts for logging
  SELECT COUNT(*) INTO gaps_count FROM coverage_gaps;
  SELECT COUNT(*) INTO benchmarks_count FROM carrier_benchmarks;
  SELECT COUNT(*) INTO congestion_count FROM network_congestion;
  
  -- Audit log
  INSERT INTO webhook_logs (event_type, payload, processed)
  VALUES (
    'b2b_analytics_refresh',
    jsonb_build_object(
      'refreshed_at', now(),
      'coverage_gaps', gaps_count,
      'carrier_benchmarks', benchmarks_count,
      'congestion_events', congestion_count
    ),
    true
  );
END;
$$;
