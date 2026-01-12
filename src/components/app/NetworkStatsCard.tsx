import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Signal, 
  MapPin, 
  Wifi, 
  Activity,
  TrendingUp,
  Zap,
  Radio
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface NetworkStats {
  strongestSignal: number | null;
  strongestSignalLocation: string | null;
  averageNetworkQuality: number; // 0-100 percentage
  dominantNetworkType: string;
  locationsMapped: number;
  totalDataPoints: number;
  uniqueCarriers: number;
  avgLatency: number | null;
}

interface NetworkStatsCardProps {
  className?: string;
  compact?: boolean;
}

const getSignalQualityLabel = (rsrp: number): { label: string; color: string } => {
  if (rsrp >= -80) return { label: 'Excellent', color: 'text-emerald-400' };
  if (rsrp >= -90) return { label: 'Good', color: 'text-green-400' };
  if (rsrp >= -100) return { label: 'Fair', color: 'text-amber-400' };
  if (rsrp >= -110) return { label: 'Poor', color: 'text-orange-400' };
  return { label: 'Weak', color: 'text-red-400' };
};

const getNetworkQualityColor = (percentage: number): string => {
  if (percentage >= 80) return 'text-emerald-400';
  if (percentage >= 60) return 'text-green-400';
  if (percentage >= 40) return 'text-amber-400';
  if (percentage >= 20) return 'text-orange-400';
  return 'text-red-400';
};

const formatNetworkType = (type: string | null): string => {
  if (!type) return 'Unknown';
  const t = type.toLowerCase();
  if (t.includes('5g')) return '5G';
  if (t.includes('lte') || t.includes('4g')) return '4G LTE';
  if (t.includes('3g')) return '3G';
  if (t.includes('2g')) return '2G';
  return type.toUpperCase();
};

export function NetworkStatsCard({ className, compact = false }: NetworkStatsCardProps) {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get stats from last 7 days
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: signalLogs, error } = await supabase
        .from('signal_logs')
        .select('rsrp, rsrq, network_type, carrier_name, latitude, longitude, latency_ms, recorded_at')
        .eq('user_id', user.id)
        .gte('recorded_at', weekAgo.toISOString())
        .order('recorded_at', { ascending: false });

      if (error) {
        console.error('[NetworkStatsCard] Error fetching signal logs:', error);
        setLoading(false);
        return;
      }

      if (!signalLogs || signalLogs.length === 0) {
        setStats({
          strongestSignal: null,
          strongestSignalLocation: null,
          averageNetworkQuality: 0,
          dominantNetworkType: 'Unknown',
          locationsMapped: 0,
          totalDataPoints: 0,
          uniqueCarriers: 0,
          avgLatency: null
        });
        setLoading(false);
        return;
      }

      // Calculate strongest signal (highest RSRP, less negative is better)
      const logsWithSignal = signalLogs.filter(l => l.rsrp !== null);
      let strongestSignal: number | null = null;
      let strongestSignalLocation: string | null = null;

      if (logsWithSignal.length > 0) {
        const strongest = logsWithSignal.reduce((best, current) => 
          (current.rsrp! > best.rsrp!) ? current : best
        );
        strongestSignal = strongest.rsrp;
        // Create a rough location description
        if (strongest.latitude && strongest.longitude) {
          strongestSignalLocation = `${strongest.latitude.toFixed(2)}°, ${strongest.longitude.toFixed(2)}°`;
        }
      }

      // Calculate average network quality (based on RSRP)
      // RSRP ranges from -140 (worst) to -44 (best), normalize to 0-100
      let averageNetworkQuality = 0;
      if (logsWithSignal.length > 0) {
        const avgRsrp = logsWithSignal.reduce((sum, l) => sum + l.rsrp!, 0) / logsWithSignal.length;
        // Normalize: -140 = 0%, -44 = 100%
        averageNetworkQuality = Math.round(Math.max(0, Math.min(100, ((avgRsrp + 140) / 96) * 100)));
      }

      // Find dominant network type
      const networkTypeCounts: Record<string, number> = {};
      signalLogs.forEach(l => {
        const type = formatNetworkType(l.network_type);
        networkTypeCounts[type] = (networkTypeCounts[type] || 0) + 1;
      });
      const dominantNetworkType = Object.entries(networkTypeCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

      // Count unique locations (using grid approximation)
      const uniqueLocations = new Set<string>();
      signalLogs.forEach(l => {
        if (l.latitude && l.longitude) {
          // Round to 4 decimal places (~11m precision)
          const key = `${l.latitude.toFixed(4)},${l.longitude.toFixed(4)}`;
          uniqueLocations.add(key);
        }
      });

      // Count unique carriers
      const uniqueCarriers = new Set(signalLogs.map(l => l.carrier_name).filter(Boolean));

      // Calculate average latency
      const logsWithLatency = signalLogs.filter(l => l.latency_ms !== null);
      const avgLatency = logsWithLatency.length > 0
        ? Math.round(logsWithLatency.reduce((sum, l) => sum + l.latency_ms!, 0) / logsWithLatency.length)
        : null;

      setStats({
        strongestSignal,
        strongestSignalLocation,
        averageNetworkQuality,
        dominantNetworkType,
        locationsMapped: uniqueLocations.size,
        totalDataPoints: signalLogs.length,
        uniqueCarriers: uniqueCarriers.size,
        avgLatency
      });
    } catch (err) {
      console.error('[NetworkStatsCard] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <Card className={cn("card-premium animate-pulse", className)}>
        <CardContent className="p-4">
          <div className="h-24 bg-muted/20 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.totalDataPoints === 0) {
    return (
      <Card className={cn("card-premium", className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Your Network Stats</h3>
              <p className="text-xs text-muted-foreground">Start mapping to see stats</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground text-center py-4">
            No data yet. Start a contribution session to see your personal network insights!
          </p>
        </CardContent>
      </Card>
    );
  }

  const signalQuality = stats.strongestSignal 
    ? getSignalQualityLabel(stats.strongestSignal) 
    : { label: 'N/A', color: 'text-muted-foreground' };

  if (compact) {
    return (
      <Card className={cn("card-premium overflow-hidden", className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Network Stats</h3>
                <p className="text-xs text-muted-foreground">{stats.locationsMapped} locations</p>
              </div>
            </div>
            <div className="text-right">
              <div className={cn("text-lg font-bold", getNetworkQualityColor(stats.averageNetworkQuality))}>
                {stats.averageNetworkQuality}%
              </div>
              <div className="text-xs text-muted-foreground">Avg Quality</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("card-premium overflow-hidden", className)}>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Your Network Stats</h3>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </div>
        </div>

        {/* Main stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Strongest Signal */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-3 rounded-xl bg-card/50 border border-border"
          >
            <div className="flex items-center gap-2 mb-2">
              <Signal className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Best Signal</span>
            </div>
            <div className={cn("text-xl font-bold", signalQuality.color)}>
              {stats.strongestSignal ? `${stats.strongestSignal} dBm` : 'N/A'}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {signalQuality.label}
            </div>
          </motion.div>

          {/* Average Quality */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-3 rounded-xl bg-card/50 border border-border"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Avg Quality</span>
            </div>
            <div className={cn("text-xl font-bold", getNetworkQualityColor(stats.averageNetworkQuality))}>
              {stats.averageNetworkQuality}%
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {stats.dominantNetworkType}
            </div>
          </motion.div>

          {/* Locations Mapped */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-3 rounded-xl bg-card/50 border border-border"
          >
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Locations</span>
            </div>
            <div className="text-xl font-bold text-foreground">
              {stats.locationsMapped.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Mapped
            </div>
          </motion.div>

          {/* Data Points */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="p-3 rounded-xl bg-card/50 border border-border"
          >
            <div className="flex items-center gap-2 mb-2">
              <Radio className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Data Points</span>
            </div>
            <div className="text-xl font-bold text-foreground">
              {stats.totalDataPoints.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Collected
            </div>
          </motion.div>
        </div>

        {/* Additional stats row */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          {stats.avgLatency !== null && (
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-muted-foreground">
                Avg Latency: <span className="font-medium text-foreground">{stats.avgLatency}ms</span>
              </span>
            </div>
          )}
          {stats.uniqueCarriers > 0 && (
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{stats.uniqueCarriers}</span> carrier{stats.uniqueCarriers !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default NetworkStatsCard;
