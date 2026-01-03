import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number; // 0-1 based on signal strength
}

interface UseContributionHeatmapReturn {
  points: HeatmapPoint[];
  loading: boolean;
  error: string | null;
  totalDataPoints: number;
  coverageAreaKm: number;
  refresh: () => Promise<void>;
}

/**
 * Fetch user's contribution data points for heatmap visualization
 * Aggregates signal_logs to create coverage heatmap
 */
export const useContributionHeatmap = (): UseContributionHeatmapReturn => {
  const [points, setPoints] = useState<HeatmapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalDataPoints, setTotalDataPoints] = useState(0);
  const [coverageAreaKm, setCoverageAreaKm] = useState(0);

  const fetchHeatmapData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPoints([]);
        setLoading(false);
        return;
      }

      // Fetch signal logs for heatmap
      const { data: signalLogs, error: fetchError } = await supabase
        .from('signal_logs')
        .select('latitude, longitude, rsrp, rssi')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false })
        .limit(1000); // Limit for performance

      if (fetchError) {
        console.error('[useContributionHeatmap] Error:', fetchError);
        setError('Failed to load coverage data');
        setLoading(false);
        return;
      }

      if (!signalLogs || signalLogs.length === 0) {
        setPoints([]);
        setTotalDataPoints(0);
        setCoverageAreaKm(0);
        setLoading(false);
        return;
      }

      // Convert to heatmap points with intensity based on signal strength
      const heatmapPoints: HeatmapPoint[] = signalLogs
        .filter(log => log.latitude !== 0 && log.longitude !== 0)
        .map(log => {
          // Normalize signal strength to 0-1 intensity
          // RSRP typically ranges from -140 to -44 dBm
          // RSSI typically ranges from -100 to -30 dBm
          let intensity = 0.5; // Default
          
          if (log.rsrp !== null) {
            // RSRP: -140 = 0, -44 = 1
            intensity = Math.min(1, Math.max(0, (log.rsrp + 140) / 96));
          } else if (log.rssi !== null) {
            // RSSI: -100 = 0, -30 = 1
            intensity = Math.min(1, Math.max(0, (log.rssi + 100) / 70));
          }
          
          return {
            lat: log.latitude,
            lng: log.longitude,
            intensity
          };
        });

      // Calculate approximate coverage area using bounding box
      if (heatmapPoints.length > 0) {
        const lats = heatmapPoints.map(p => p.lat);
        const lngs = heatmapPoints.map(p => p.lng);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        
        // Approximate km² using lat/lng deltas (rough estimation)
        const latDelta = maxLat - minLat;
        const lngDelta = maxLng - minLng;
        const avgLat = (minLat + maxLat) / 2;
        
        // 1 degree latitude ≈ 111 km
        // 1 degree longitude ≈ 111 * cos(lat) km
        const heightKm = latDelta * 111;
        const widthKm = lngDelta * 111 * Math.cos(avgLat * Math.PI / 180);
        
        setCoverageAreaKm(Math.round(heightKm * widthKm * 100) / 100);
      }

      setPoints(heatmapPoints);
      setTotalDataPoints(signalLogs.length);
      setLoading(false);
    } catch (err) {
      console.error('[useContributionHeatmap] Exception:', err);
      setError('Failed to load coverage data');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHeatmapData();
  }, [fetchHeatmapData]);

  return {
    points,
    loading,
    error,
    totalDataPoints,
    coverageAreaKm,
    refresh: fetchHeatmapData
  };
};
