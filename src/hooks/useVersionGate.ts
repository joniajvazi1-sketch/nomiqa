import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getAppVersion } from '@/lib/sentry';
import { meetsMinVersion } from '@/utils/versionCompare';

interface VersionGateResult {
  isOutdated: boolean;
  minVersion: string | null;
  currentVersion: string;
  loading: boolean;
}

let cachedMinVersion: string | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export function useVersionGate(): VersionGateResult {
  const currentVersion = getAppVersion();
  const [minVersion, setMinVersion] = useState<string | null>(cachedMinVersion);
  const [loading, setLoading] = useState(cachedMinVersion === null);

  useEffect(() => {
    // Use cache if fresh
    if (cachedMinVersion && Date.now() - cacheTimestamp < CACHE_TTL) {
      setMinVersion(cachedMinVersion);
      setLoading(false);
      return;
    }

    supabase
      .from('app_remote_config')
      .select('config_value')
      .eq('config_key', 'min_app_version')
      .eq('is_sensitive', false)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.config_value) {
          const ver = typeof data.config_value === 'string'
            ? data.config_value
            : String(data.config_value);
          cachedMinVersion = ver;
          cacheTimestamp = Date.now();
          setMinVersion(ver);
        }
        setLoading(false);
      });
  }, []);

  const isOutdated = minVersion ? !meetsMinVersion(currentVersion, minVersion) : false;

  return { isOutdated, minVersion, currentVersion, loading };
}
