-- 1. Add device integrity columns to signal_logs (all at once)
ALTER TABLE public.signal_logs 
ADD COLUMN IF NOT EXISTS is_mock_location boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_emulator boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_rooted_jailbroken boolean DEFAULT false;

-- 2. Create K-anonymity safe view for B2B exports
-- Only exposes tiles with sufficient data to protect user privacy
CREATE OR REPLACE VIEW public.safe_coverage_tiles AS
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
  unique_users >= 5  -- K-anonymity: at least 5 distinct users
  AND sample_count >= 20  -- Statistical significance
  AND location_geohash IS NOT NULL;

-- Add comment explaining the view purpose
COMMENT ON VIEW public.safe_coverage_tiles IS 
'GDPR-safe coverage data with k-anonymity (>=5 users, >=20 samples per tile). Use this for all B2B exports and external queries.';

-- 3. Add consent tracking to profiles (optional, but good for audit)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS data_consent_accepted_at timestamptz,
ADD COLUMN IF NOT EXISTS data_consent_version text;

-- 4. Create index on is_mock_location for filtering trusted data
CREATE INDEX IF NOT EXISTS idx_signal_logs_mock_location 
ON public.signal_logs(is_mock_location) 
WHERE is_mock_location = true;

-- 5. Create index on confidence_score for filtering high-quality data
CREATE INDEX IF NOT EXISTS idx_signal_logs_confidence 
ON public.signal_logs(confidence_score DESC) 
WHERE confidence_score >= 70;