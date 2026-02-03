-- Create unique index on coverage_tiles for CONCURRENTLY refresh support
-- Using the actual columns from the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_coverage_tiles_unique_key 
ON public.coverage_tiles (location_geohash, COALESCE(country_code, ''), COALESCE(carrier_name, ''), COALESCE(network_generation, ''));

-- Update the refresh function to handle empty view case (non-concurrent first time)
CREATE OR REPLACE FUNCTION public.refresh_coverage_tiles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tile_count integer;
BEGIN
  -- Check if view has any data (for first-time population)
  SELECT COUNT(*) INTO tile_count FROM public.coverage_tiles;
  
  IF tile_count = 0 THEN
    -- First time: non-concurrent refresh (required when empty)
    REFRESH MATERIALIZED VIEW coverage_tiles;
  ELSE
    -- Subsequent refreshes: concurrent to avoid locking
    REFRESH MATERIALIZED VIEW CONCURRENTLY coverage_tiles;
  END IF;
  
  INSERT INTO webhook_logs (event_type, payload, processed)
  VALUES (
    'coverage_tiles_refresh',
    jsonb_build_object('refreshed_at', now(), 'status', 'success', 'previous_count', tile_count),
    true
  );
END;
$$;