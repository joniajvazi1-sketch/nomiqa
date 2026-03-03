CREATE OR REPLACE FUNCTION public.get_coverage_grid_cells()
RETURNS TABLE(lat double precision, lng double precision, avg_signal double precision, data_points bigint, dominant_network text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH grid AS (
    SELECT
      FLOOR(latitude / 0.25) * 0.25 + 0.125 AS cell_lat,
      FLOOR(longitude / 0.25) * 0.25 + 0.125 AS cell_lng,
      LEAST(1.0, GREATEST(0.0,
        AVG(CASE 
          WHEN rsrp IS NOT NULL THEN (rsrp + 140.0) / 96.0
          WHEN rssi IS NOT NULL THEN (rssi + 100.0) / 70.0
          ELSE 0.5
        END)
      )) AS avg_sig,
      COUNT(*) AS cnt,
      -- Determine dominant network type
      MODE() WITHIN GROUP (ORDER BY
        CASE
          WHEN LOWER(COALESCE(network_generation, network_type, 'unknown')) LIKE '%5g%' OR LOWER(COALESCE(network_generation, network_type, '')) LIKE '%nr%' THEN '5g'
          WHEN LOWER(COALESCE(network_generation, network_type, 'unknown')) LIKE '%4g%' OR LOWER(COALESCE(network_generation, network_type, '')) LIKE '%lte%' THEN 'lte'
          WHEN LOWER(COALESCE(network_generation, network_type, 'unknown')) LIKE '%3g%' OR LOWER(COALESCE(network_generation, network_type, '')) LIKE '%umts%' OR LOWER(COALESCE(network_generation, network_type, '')) LIKE '%hspa%' THEN '3g'
          ELSE 'lte'
        END
      ) AS dom_net
    FROM signal_logs
    WHERE latitude != 0 AND longitude != 0
    GROUP BY FLOOR(latitude / 0.25), FLOOR(longitude / 0.25)
  )
  SELECT cell_lat AS lat, cell_lng AS lng, avg_sig AS avg_signal, cnt AS data_points, dom_net AS dominant_network
  FROM grid
  ORDER BY cnt DESC;
$$;