-- Fix security issues: Move B2B views to private schema with proper security

-- 1. Drop the public view (it was flagged as SECURITY DEFINER)
DROP VIEW IF EXISTS public.safe_coverage_tiles;

-- 2. Create private schema for B2B data (not exposed via API)
CREATE SCHEMA IF NOT EXISTS b2b;

-- 3. Revoke API access from b2b schema
REVOKE ALL ON SCHEMA b2b FROM anon, authenticated;
GRANT USAGE ON SCHEMA b2b TO service_role;

-- 4. Create safe coverage tiles view in b2b schema (only service_role can access)
CREATE OR REPLACE VIEW b2b.safe_coverage_tiles 
WITH (security_invoker = true)
AS
SELECT 
  location_geohash,
  country_code,
  carrier_name,
  network_generation,
  sample_count,
  unique_users,
  avg_rsrp,
  median_rsrp,
  median_rsrq,
  median_sinr,
  median_latency_ms,
  median_download_mbps,
  median_upload_mbps,
  avg_download_mbps,
  avg_confidence,
  pct_excellent_signal,
  pct_good_signal,
  pct_poor_signal,
  pct_roaming,
  high_confidence_samples,
  first_seen,
  last_updated
FROM public.coverage_tiles
WHERE 
  unique_users >= 5  -- K-anonymity threshold
  AND sample_count >= 20;  -- Statistical significance

COMMENT ON VIEW b2b.safe_coverage_tiles IS 
'GDPR-safe coverage data with k-anonymity (>=5 users, >=20 samples). Only accessible via service_role for B2B exports.';

-- 5. Grant select on the view only to service_role
GRANT SELECT ON b2b.safe_coverage_tiles TO service_role;

-- 6. Also protect coverage_tiles materialized view from anon/authenticated
REVOKE SELECT ON public.coverage_tiles FROM anon, authenticated;