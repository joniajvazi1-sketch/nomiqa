import React, { useEffect, useState } from 'react';
import { 
  ArrowDown, ArrowUp, Clock, Wifi, Signal, 
  RefreshCw, ChevronRight, AlertCircle 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';

interface SpeedTestResult {
  id: string;
  download_mbps: number | null;
  upload_mbps: number | null;
  latency_ms: number | null;
  network_type: string | null;
  carrier: string | null;
  provider: string | null;
  error: string | null;
  recorded_at: string;
  latitude: number | null;
  longitude: number | null;
}

interface SpeedTestHistoryProps {
  limit?: number;
  showHeader?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * Speed Test History Component
 * Shows past speed test results with download/upload/latency data
 */
export const SpeedTestHistory: React.FC<SpeedTestHistoryProps> = ({ 
  limit = 10,
  showHeader = true,
  compact = false,
  className
}) => {
  const [tests, setTests] = useState<SpeedTestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSpeedTests = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Not logged in');
        return;
      }

      const { data, error: queryError } = await supabase
        .from('speed_test_results')
        .select('*')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false })
        .limit(limit);

      if (queryError) throw queryError;
      setTests(data || []);
    } catch (err) {
      console.error('Failed to load speed tests:', err);
      setError('Failed to load speed tests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSpeedTests();
  }, [limit]);

  const getSpeedColor = (mbps: number | null): string => {
    if (!mbps) return 'text-muted-foreground';
    if (mbps >= 50) return 'text-green-500';
    if (mbps >= 20) return 'text-emerald-400';
    if (mbps >= 10) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const getLatencyColor = (ms: number | null): string => {
    if (!ms) return 'text-muted-foreground';
    if (ms <= 50) return 'text-green-500';
    if (ms <= 100) return 'text-emerald-400';
    if (ms <= 200) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const getNetworkIcon = (type: string | null) => {
    if (type?.toLowerCase().includes('wifi')) {
      return <Wifi className="w-3.5 h-3.5" />;
    }
    return <Signal className="w-3.5 h-3.5" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertCircle className="w-8 h-8 text-destructive mb-2" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <button 
          onClick={loadSpeedTests}
          className="mt-3 text-xs text-primary hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (tests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Signal className="w-10 h-10 text-muted-foreground/50 mb-3" />
        <p className="text-sm font-medium text-foreground">No speed tests yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Start a contribution session to run speed tests
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {showHeader && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Speed Test History</h3>
          <button 
            onClick={loadSpeedTests}
            className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}

      <div className="space-y-2">
        {tests.map((test) => (
          <div 
            key={test.id}
            className={cn(
              "rounded-xl bg-card/60 backdrop-blur-sm border border-border p-3",
              "shadow-[var(--shadow-card)]",
              compact && "p-2"
            )}
          >
            {/* Header Row */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center",
                  test.network_type?.toLowerCase().includes('wifi') 
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-green-500/20 text-green-400"
                )}>
                  {getNetworkIcon(test.network_type)}
                </div>
                <span className="text-xs font-medium text-foreground capitalize">
                  {test.network_type || 'Unknown'}
                </span>
                {test.carrier && (
                  <span className="text-xs text-muted-foreground">
                    • {test.carrier}
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(test.recorded_at), { addSuffix: true })}
              </span>
            </div>

            {/* Speed Results */}
            {test.error ? (
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs">{test.error}</span>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {/* Download */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <ArrowDown className={cn("w-3 h-3", getSpeedColor(test.download_mbps))} />
                    <span className={cn(
                      "text-base font-bold",
                      getSpeedColor(test.download_mbps)
                    )}>
                      {test.download_mbps?.toFixed(1) || '—'}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Mbps ↓</span>
                </div>

                {/* Upload */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <ArrowUp className={cn("w-3 h-3", getSpeedColor(test.upload_mbps))} />
                    <span className={cn(
                      "text-base font-bold",
                      getSpeedColor(test.upload_mbps)
                    )}>
                      {test.upload_mbps?.toFixed(1) || '—'}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Mbps ↑</span>
                </div>

                {/* Latency */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <Clock className={cn("w-3 h-3", getLatencyColor(test.latency_ms))} />
                    <span className={cn(
                      "text-base font-bold",
                      getLatencyColor(test.latency_ms)
                    )}>
                      {test.latency_ms?.toFixed(0) || '—'}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">ms ping</span>
                </div>
              </div>
            )}

            {/* Provider info */}
            {test.provider && !compact && (
              <div className="mt-2 pt-2 border-t border-border/50">
                <span className="text-[10px] text-muted-foreground">
                  via {test.provider} • {format(new Date(test.recorded_at), 'MMM d, h:mm a')}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {tests.length >= limit && (
        <button className="w-full flex items-center justify-center gap-1 py-2 text-xs text-primary hover:underline">
          View all tests <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};