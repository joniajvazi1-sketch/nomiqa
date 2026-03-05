import { lazy, Suspense, useEffect, useState, useMemo, memo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Signal, Users, MapPin, Globe, BarChart3, Activity, Clock, Tv, Video, Gamepad2, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';

const CoverageHeatmap = lazy(() => import('@/components/CoverageHeatmap').then(m => ({ default: m.CoverageHeatmap })));

interface CoverageCell {
  lat: number;
  lng: number;
  intensity: number;
  network: string;
  count: number;
}

interface CarrierBenchmark {
  carrier_name: string;
  country_code: string;
  avg_download_mbps: number;
  avg_upload_mbps: number;
  avg_latency_ms: number;
  coverage_score: number;
}

const NetworkBadge = memo(({ network }: { network: string }) => {
  const config: Record<string, { label: string; cls: string }> = {
    '5g': { label: '5G', cls: 'bg-neon-violet/20 text-neon-violet border-neon-violet/30' },
    'lte': { label: 'LTE', cls: 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30' },
    '3g': { label: '3G', cls: 'bg-warm-sand/20 text-warm-sand border-warm-sand/30' },
  };
  const c = config[network?.toLowerCase()] || config['lte'];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${c.cls}`}>{c.label}</span>;
});
NetworkBadge.displayName = 'NetworkBadge';

export function AppMap() {
  const [cells, setCells] = useState<CoverageCell[]>([]);
  const [carriers, setCarriers] = useState<CarrierBenchmark[]>([]);
  const [recentFeed, setRecentFeed] = useState<any[]>([]);
  const [globalStats, setGlobalStats] = useState<{ dataPoints: number; contributors: number; cities: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [coverageRes, carriersRes, feedRes] = await Promise.all([
          supabase.functions.invoke('get-global-coverage'),
          supabase.from('carrier_benchmarks' as any).select('*').order('coverage_score', { ascending: false }).limit(8),
          supabase.from('signal_logs')
            .select('id, network_generation, carrier_name, country_code, speed_test_down, recorded_at')
            .not('carrier_name', 'is', null)
            .not('speed_test_down', 'is', null)
            .order('recorded_at', { ascending: false })
            .limit(6),
        ]);

        if (coverageRes.data) {
          setCells(coverageRes.data.cells || []);
          setGlobalStats({
            dataPoints: coverageRes.data.totalDataPoints || 0,
            contributors: coverageRes.data.totalContributors || 0,
            cities: coverageRes.data.allTimeCities || 0,
          });
        }
        if (carriersRes.data) setCarriers(carriersRes.data as unknown as CarrierBenchmark[]);
        if (feedRes.data) setRecentFeed(feedRes.data);
      } catch (err) {
        console.error('[AppMap] Load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatCount = (n: number) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString();

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold text-foreground">Coverage Map</h1>
        <p className="text-xs text-muted-foreground">Global network intelligence from contributors</p>
      </div>

      {/* Stats row */}
      {globalStats && (
        <div className="px-4 mb-4">
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Signal, value: formatCount(globalStats.dataPoints), label: 'Signals' },
              { icon: Users, value: formatCount(globalStats.contributors), label: 'Contributors' },
              { icon: MapPin, value: formatCount(globalStats.cities), label: 'Cities' },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="p-3 rounded-xl bg-card/60 border border-border/30 text-center">
                <Icon className="w-4 h-4 text-neon-cyan mx-auto mb-1" />
                <div className="text-lg font-bold text-foreground tabular-nums">{value}</div>
                <div className="text-[10px] text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaflet Heatmap */}
      <div className="px-4 mb-4">
        <Suspense fallback={<div className="h-[350px] rounded-2xl bg-card/30 border border-border/30 animate-pulse" />}>
          <CoverageHeatmap cells={cells} height="350px" />
        </Suspense>
      </div>

      {/* Carrier Comparison */}
      {carriers.length > 0 && (
        <div className="px-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-neon-violet" />
            <h2 className="text-base font-bold text-foreground">Top Carriers</h2>
          </div>
          <div className="rounded-xl border border-border/30 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-card/60 border-b border-border/30">
                  <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase p-3">Carrier</th>
                  <th className="text-right text-[10px] font-semibold text-muted-foreground uppercase p-3">Speed</th>
                  <th className="text-right text-[10px] font-semibold text-muted-foreground uppercase p-3">Score</th>
                </tr>
              </thead>
              <tbody>
                {carriers.slice(0, 6).map((c, i) => {
                  const emoji = c.country_code?.length === 2
                    ? String.fromCodePoint(...c.country_code.toUpperCase().split('').map(ch => 127397 + ch.charCodeAt(0)))
                    : '🌍';
                  return (
                    <tr key={i} className="border-b border-border/10">
                      <td className="p-3 text-sm">
                        <span className="mr-1.5">{emoji}</span>
                        <span className="font-medium text-foreground">{c.carrier_name}</span>
                      </td>
                      <td className="p-3 text-right text-sm font-bold text-neon-cyan tabular-nums">
                        {c.avg_download_mbps?.toFixed(0)} <span className="text-[10px] font-normal text-muted-foreground">Mbps</span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <div className="w-10 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-neon-cyan to-neon-violet" style={{ width: `${Math.min(c.coverage_score || 0, 100)}%` }} />
                          </div>
                          <span className="text-xs font-bold text-foreground tabular-nums">{c.coverage_score?.toFixed(0)}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Network Quality Score (QoE) */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Tv className="w-4 h-4 text-neon-cyan" />
          <h2 className="text-base font-bold text-foreground">Network Quality (QoE)</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: Video, label: 'Streaming', getScore: () => {
              const avg = carriers.length ? carriers.reduce((s, c) => s + (c.avg_download_mbps || 0), 0) / carriers.length : 0;
              return avg >= 25 ? 'Excellent' : avg >= 10 ? 'Good' : avg >= 5 ? 'Fair' : 'Poor';
            }},
            { icon: Phone, label: 'Video Calls', getScore: () => {
              const avg = carriers.length ? carriers.reduce((s, c) => s + (c.avg_download_mbps || 0), 0) / carriers.length : 0;
              return avg >= 15 ? 'Excellent' : avg >= 5 ? 'Good' : avg >= 2 ? 'Fair' : 'Poor';
            }},
            { icon: Gamepad2, label: 'Gaming', getScore: () => {
              const avgLatency = carriers.length ? carriers.reduce((s, c) => s + (c.avg_latency_ms || 100), 0) / carriers.length : 100;
              return avgLatency <= 30 ? 'Excellent' : avgLatency <= 60 ? 'Good' : avgLatency <= 100 ? 'Fair' : 'Poor';
            }},
            { icon: Globe, label: 'Browsing', getScore: () => {
              const avg = carriers.length ? carriers.reduce((s, c) => s + (c.avg_download_mbps || 0), 0) / carriers.length : 0;
              return avg >= 5 ? 'Excellent' : avg >= 2 ? 'Good' : avg >= 1 ? 'Fair' : 'Poor';
            }},
          ].map(({ icon: Icon, label, getScore }) => {
            const score = getScore();
            const colorMap: Record<string, string> = {
              'Excellent': 'text-green-400',
              'Good': 'text-neon-cyan',
              'Fair': 'text-warm-sand',
              'Poor': 'text-neon-coral',
            };
            return (
              <div key={label} className="p-3 rounded-xl bg-card/40 border border-border/20 flex items-center gap-3">
                <Icon className="w-5 h-5 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className={`text-sm font-bold ${colorMap[score] || 'text-foreground'}`}>{score}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Feed */}
      {recentFeed.length > 0 && (
        <div className="px-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-neon-coral" />
            <h2 className="text-base font-bold text-foreground">Recent Activity</h2>
            <div className="w-1.5 h-1.5 rounded-full bg-neon-coral animate-pulse" />
          </div>
          <div className="space-y-2">
            {recentFeed.map((item: any, i: number) => {
              const emoji = item.country_code?.length === 2
                ? String.fromCodePoint(...item.country_code.toUpperCase().split('').map((c: string) => 127397 + c.charCodeAt(0)))
                : '🌍';
              const diff = Date.now() - new Date(item.recorded_at).getTime();
              const mins = Math.floor(diff / 60000);
              const timeAgo = mins < 1 ? 'just now' : mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h`;
              return (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-card/40 border border-border/20">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{emoji}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-foreground">{item.carrier_name}</span>
                        <NetworkBadge network={item.network_generation || 'lte'} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
                    </div>
                  </div>
                  {item.speed_test_down && (
                    <span className="text-xs font-bold text-neon-cyan tabular-nums">{item.speed_test_down.toFixed(0)} Mbps</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default AppMap;
