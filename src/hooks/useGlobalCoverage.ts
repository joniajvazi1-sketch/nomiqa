import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GlobalCoverageCell {
  lat: number;
  lng: number;
  intensity: number;
  network: '5g' | 'lte' | '3g' | 'other';
  count: number;
}

export interface GlobalCoverageData {
  cells: GlobalCoverageCell[];
  totalDataPoints: number;
  uniqueLocations: number;
  allTimeCities: number;
  coverageAreaKm2: number;
  totalContributors: number;
  lastUpdated: string;
}

interface UseGlobalCoverageOptions {
  networkFilter?: '5g' | 'lte' | '3g' | null;
  minQuality?: number;
  bounds?: [number, number, number, number] | null; // [minLat, minLng, maxLat, maxLng]
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

interface UseGlobalCoverageReturn {
  data: GlobalCoverageData | null;
  loading: boolean;
  error: string | null;
  refresh: (forceRefresh?: boolean) => Promise<void>;
  setNetworkFilter: (filter: '5g' | 'lte' | '3g' | null) => void;
  networkFilter: '5g' | 'lte' | '3g' | null;
}

/**
 * Hook to fetch global community coverage data
 * Aggregated from all users' signal logs (anonymized)
 */
export const useGlobalCoverage = (
  options: UseGlobalCoverageOptions = {}
): UseGlobalCoverageReturn => {
  const {
    networkFilter: initialNetworkFilter = null,
    minQuality = 0,
    bounds = null,
    autoRefresh = false,
    refreshInterval = 60000, // 1 minute
  } = options;

  const [data, setData] = useState<GlobalCoverageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkFilter, setNetworkFilter] = useState<'5g' | 'lte' | '3g' | null>(initialNetworkFilter);

  const COVERAGE_CACHE_KEY = 'nomiqa_global_coverage_cache';
  const COVERAGE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  const fetchGlobalCoverage = useCallback(async (forceRefresh = false) => {
    try {
      setError(null);

      // Check sessionStorage cache first (unless force refresh or filtered)
      if (!forceRefresh && !networkFilter && !bounds) {
        try {
          const raw = sessionStorage.getItem(COVERAGE_CACHE_KEY);
          if (raw) {
            const cached = JSON.parse(raw);
            if (Date.now() - cached.ts < COVERAGE_CACHE_TTL) {
              console.log('[useGlobalCoverage] Using sessionStorage cache');
              setData(cached.data);
              setLoading(false);
              return;
            }
          }
        } catch {}
      }

      setLoading(true);

      // Build query params
      const params = new URLSearchParams();
      if (networkFilter) params.set('network', networkFilter);
      if (minQuality > 0) params.set('minQuality', minQuality.toString());
      if (bounds) params.set('bounds', bounds.join(','));
      if (forceRefresh) params.set('refresh', 'true');

      const queryString = params.toString();

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      const response = await fetch(
        `${supabaseUrl}/functions/v1/get-global-coverage${queryString ? `?${queryString}` : ''}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': anonKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      setData(json);

      // Cache unfiltered responses
      if (!networkFilter && !bounds) {
        sessionStorage.setItem(COVERAGE_CACHE_KEY, JSON.stringify({ data: json, ts: Date.now() }));
      }

    } catch (err) {
      console.error('[useGlobalCoverage] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch global coverage');
    } finally {
      setLoading(false);
    }
  }, [networkFilter, minQuality, bounds]);

  // Initial fetch
  useEffect(() => {
    fetchGlobalCoverage();
  }, [fetchGlobalCoverage]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchGlobalCoverage();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchGlobalCoverage]);

  return {
    data,
    loading,
    error,
    refresh: fetchGlobalCoverage,
    setNetworkFilter,
    networkFilter,
  };
};
