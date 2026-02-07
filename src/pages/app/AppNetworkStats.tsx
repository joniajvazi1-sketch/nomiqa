import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  Signal, 
  MapPin, 
  Activity,
  TrendingUp,
  Zap,
  Radio,
  Wifi,
  RefreshCw,
  Globe,
  BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { CarrierComparison } from '@/components/app/CarrierComparison';
import { SpeedTestHistory } from '@/components/app/SpeedTestHistory';

interface NetworkStats {
  strongestSignal: number | null;
  strongestSignalType: string | null;
  averageNetworkQuality: number;
  dominantNetworkType: string;
  locationsMapped: number;
  totalDataPoints: number;
  uniqueCarriers: number;
  avgLatency: number | null;
  avgDownload: number | null;
  avgUpload: number | null;
  networkTypeBreakdown: Record<string, number>;
  coverageAreaKm2: number;
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

export function AppNetworkStats() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastPosition, setLastPosition] = useState<{ lat: number; lng: number } | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get stats from last 30 days
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);

      const [{ count: totalCount, error: countError }, { data: signalLogs, error }] = await Promise.all([
        supabase
          .from('signal_logs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('recorded_at', monthAgo.toISOString()),
        supabase
          .from('signal_logs')
          .select('rsrp, rsrq, network_type, carrier_name, latitude, longitude, latency_ms, speed_test_down, speed_test_up, recorded_at')
          .eq('user_id', user.id)
          .gte('recorded_at', monthAgo.toISOString())
          .order('recorded_at', { ascending: false })
          .limit(1000),
      ]);

      if (countError) {
        console.warn('[AppNetworkStats] Count query failed:', countError);
      }

      if (error) {
        console.error('[AppNetworkStats] Error fetching signal logs:', error);
        setLoading(false);
        return;
      }

      if (!signalLogs || signalLogs.length === 0) {
        setStats({
          strongestSignal: null,
          strongestSignalType: null,
          averageNetworkQuality: 0,
          dominantNetworkType: 'Unknown',
          locationsMapped: 0,
          totalDataPoints: 0,
          uniqueCarriers: 0,
          avgLatency: null,
          avgDownload: null,
          avgUpload: null,
          networkTypeBreakdown: {},
          coverageAreaKm2: 0
        });
        setLoading(false);
        return;
      }

      // Store latest position for carrier comparison
      if (signalLogs[0]?.latitude && signalLogs[0]?.longitude) {
        setLastPosition({ lat: signalLogs[0].latitude, lng: signalLogs[0].longitude });
      }

      // Calculate strongest signal
      const logsWithSignal = signalLogs.filter(l => l.rsrp !== null);
      let strongestSignal: number | null = null;
      let strongestSignalType: string | null = null;

      if (logsWithSignal.length > 0) {
        const strongest = logsWithSignal.reduce((best, current) => 
          (current.rsrp! > best.rsrp!) ? current : best
        );
        strongestSignal = strongest.rsrp;
        strongestSignalType = formatNetworkType(strongest.network_type);
      }

      // Calculate average network quality
      let averageNetworkQuality = 0;
      if (logsWithSignal.length > 0) {
        const avgRsrp = logsWithSignal.reduce((sum, l) => sum + l.rsrp!, 0) / logsWithSignal.length;
        averageNetworkQuality = Math.round(Math.max(0, Math.min(100, ((avgRsrp + 140) / 96) * 100)));
      }

      // Network type breakdown
      const networkTypeCounts: Record<string, number> = {};
      signalLogs.forEach(l => {
        const type = formatNetworkType(l.network_type);
        networkTypeCounts[type] = (networkTypeCounts[type] || 0) + 1;
      });
      const dominantNetworkType = Object.entries(networkTypeCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

      // Unique locations
      const uniqueLocations = new Set<string>();
      signalLogs.forEach(l => {
        if (l.latitude && l.longitude) {
          const key = `${l.latitude.toFixed(4)},${l.longitude.toFixed(4)}`;
          uniqueLocations.add(key);
        }
      });

      // Estimate coverage area (rough approximation)
      const coverageAreaKm2 = uniqueLocations.size * 0.0001; // ~11m grid squared

      // Unique carriers
      const uniqueCarriers = new Set(signalLogs.map(l => l.carrier_name).filter(Boolean));

      // Latency
      const logsWithLatency = signalLogs.filter(l => l.latency_ms !== null);
      const avgLatency = logsWithLatency.length > 0
        ? Math.round(logsWithLatency.reduce((sum, l) => sum + l.latency_ms!, 0) / logsWithLatency.length)
        : null;

      // Download/Upload speeds
      const logsWithDownload = signalLogs.filter(l => l.speed_test_down !== null);
      const avgDownload = logsWithDownload.length > 0
        ? Math.round(logsWithDownload.reduce((sum, l) => sum + l.speed_test_down!, 0) / logsWithDownload.length * 10) / 10
        : null;

      const logsWithUpload = signalLogs.filter(l => l.speed_test_up !== null);
      const avgUpload = logsWithUpload.length > 0
        ? Math.round(logsWithUpload.reduce((sum, l) => sum + l.speed_test_up!, 0) / logsWithUpload.length * 10) / 10
        : null;

      setStats({
        strongestSignal,
        strongestSignalType,
        averageNetworkQuality,
        dominantNetworkType,
        locationsMapped: uniqueLocations.size,
        totalDataPoints: totalCount ?? signalLogs.length,
        uniqueCarriers: uniqueCarriers.size,
        avgLatency,
        avgDownload,
        avgUpload,
        networkTypeBreakdown: networkTypeCounts,
        coverageAreaKm2
      });
    } catch (err) {
      console.error('[AppNetworkStats] Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const signalQuality = stats?.strongestSignal 
    ? getSignalQualityLabel(stats.strongestSignal) 
    : { label: 'N/A', color: 'text-muted-foreground' };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div 
        className="sticky top-0 z-20 bg-background/95 backdrop-blur-lg border-b border-border"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Network Stats</h1>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
          >
            <RefreshCw className={cn("w-5 h-5 text-foreground", refreshing && "animate-spin")} />
          </button>
        </div>
      </div>

      <div 
        className="px-4 py-4 space-y-4"
        style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}
      >
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-card animate-pulse rounded-xl" />
            ))}
          </div>
        ) : !stats || stats.totalDataPoints === 0 ? (
          <Card className="card-premium">
            <CardContent className="p-6 text-center">
              <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">No Data Yet</h3>
              <p className="text-sm text-muted-foreground">
                Start a contribution session to see your personal network insights!
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Overview Card */}
            <Card className="card-premium overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">30-Day Overview</h3>
                    <p className="text-xs text-muted-foreground">{stats.totalDataPoints.toLocaleString()} data points</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Signal Quality */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
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
                      {signalQuality.label} • {stats.strongestSignalType}
                    </div>
                  </motion.div>

                  {/* Avg Quality */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
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
                    transition={{ delay: 0.1 }}
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
                      ~{stats.coverageAreaKm2.toFixed(2)} km² covered
                    </div>
                  </motion.div>

                  {/* Carriers */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="p-3 rounded-xl bg-card/50 border border-border"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Radio className="w-4 h-4 text-primary" />
                      <span className="text-xs text-muted-foreground">Carriers</span>
                    </div>
                    <div className="text-xl font-bold text-foreground">
                      {stats.uniqueCarriers}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Detected
                    </div>
                  </motion.div>
                </div>
              </CardContent>
            </Card>

            {/* Speed & Latency */}
            <Card className="card-premium">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Speed & Latency</h3>
                    <p className="text-xs text-muted-foreground">Average measurements</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-xl bg-card/50 border border-border">
                    <div className="text-lg font-bold text-foreground">
                      {stats.avgDownload ? `${stats.avgDownload}` : '—'}
                    </div>
                    <div className="text-xs text-muted-foreground">Mbps ↓</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-card/50 border border-border">
                    <div className="text-lg font-bold text-foreground">
                      {stats.avgUpload ? `${stats.avgUpload}` : '—'}
                    </div>
                    <div className="text-xs text-muted-foreground">Mbps ↑</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-card/50 border border-border">
                    <div className="text-lg font-bold text-foreground">
                      {stats.avgLatency ? `${stats.avgLatency}` : '—'}
                    </div>
                    <div className="text-xs text-muted-foreground">ms ping</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Network Type Breakdown */}
            <Card className="card-premium">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Network Types</h3>
                    <p className="text-xs text-muted-foreground">Distribution of connections</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {Object.entries(stats.networkTypeBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => {
                      const percentage = Math.round((count / stats.totalDataPoints) * 100);
                      return (
                        <div key={type}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-foreground">{type}</span>
                            <span className="text-xs text-muted-foreground">{percentage}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.5, delay: 0.2 }}
                              className={cn(
                                "h-full rounded-full",
                                type === '5G' ? 'bg-emerald-500' :
                                type === '4G LTE' ? 'bg-blue-500' :
                                type === '3G' ? 'bg-amber-500' : 'bg-muted-foreground'
                              )}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            {/* Speed Test History */}
            <SpeedTestHistory className="card-premium" />

            {/* Carrier Comparison */}
            {lastPosition && (
              <CarrierComparison
                latitude={lastPosition.lat}
                longitude={lastPosition.lng}
                radiusKm={25}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AppNetworkStats;
