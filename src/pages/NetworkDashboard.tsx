import { useEffect, useState, useMemo, memo } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Database, Globe, Users, Activity, Signal, Wifi, Zap, MapPin, TrendingUp, BarChart3, Radio, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ───────────────────────────────────────────────────────────────

interface CoverageCell {
  lat: number;
  lng: number;
  intensity: number;
  network: string;
  count: number;
}

interface GlobalStats {
  totalDataPoints: number;
  totalContributors: number;
  allTimeCities: number;
  coverageAreaKm2: number;
  cells: CoverageCell[];
}

interface CarrierBenchmark {
  carrier_name: string;
  country_code: string;
  avg_download_mbps: number;
  avg_upload_mbps: number;
  avg_latency_ms: number;
  avg_rsrp: number;
  coverage_score: number;
  sample_count: number;
}

interface RecentContribution {
  id: string;
  network_generation: string;
  carrier_name: string;
  country_code: string;
  speed_test_down: number | null;
  recorded_at: string;
}

// ─── Sub-components ──────────────────────────────────────────────────────

const StatCard = memo(({ 
  icon: Icon, value, label, color, delay 
}: { 
  icon: typeof Database; value: string; label: string; color: string; delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className={`relative p-6 md:p-8 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 text-center group hover:border-${color}/40 transition-all duration-500`}
  >
    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-b from-${color}/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
    <Icon className={`w-7 h-7 text-${color} mx-auto mb-3 relative z-10`} />
    <div className={`text-3xl md:text-4xl lg:text-5xl font-bold text-${color} mb-2 relative z-10 tabular-nums`}>
      {value}
    </div>
    <p className="text-sm text-muted-foreground font-medium relative z-10">{label}</p>
  </motion.div>
));
StatCard.displayName = "StatCard";

const NetworkBadge = memo(({ network }: { network: string }) => {
  const config: Record<string, { label: string; color: string }> = {
    '5g': { label: '5G', color: 'bg-neon-violet/20 text-neon-violet border-neon-violet/30' },
    'lte': { label: 'LTE', color: 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30' },
    '3g': { label: '3G', color: 'bg-warm-sand/20 text-warm-sand border-warm-sand/30' },
  };
  const c = config[network?.toLowerCase()] || config['lte'];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${c.color}`}>
      {c.label}
    </span>
  );
});
NetworkBadge.displayName = "NetworkBadge";

const LiveFeedItem = memo(({ item, index }: { item: RecentContribution; index: number }) => {
  const countryEmoji = item.country_code && item.country_code.length === 2
    ? String.fromCodePoint(...item.country_code.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)))
    : '🌍';
  
  const timeAgo = (() => {
    const diff = Date.now() - new Date(item.recorded_at).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="flex items-center justify-between p-4 rounded-xl bg-card/40 border border-border/30 hover:border-neon-cyan/20 transition-all duration-300 group"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{countryEmoji}</span>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {item.carrier_name || 'Unknown Carrier'}
            </span>
            <NetworkBadge network={item.network_generation || 'lte'} />
          </div>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" /> {timeAgo}
          </span>
        </div>
      </div>
      {item.speed_test_down && (
        <div className="text-right">
          <span className="text-sm font-bold text-neon-cyan tabular-nums">
            {item.speed_test_down.toFixed(0)} Mbps
          </span>
          <span className="text-[10px] text-muted-foreground block">↓ download</span>
        </div>
      )}
    </motion.div>
  );
});
LiveFeedItem.displayName = "LiveFeedItem";

// ─── Coverage Globe (CSS-only lightweight) ───────────────────────────────

const CoverageGlobe = memo(({ cells }: { cells: CoverageCell[] }) => {
  // Group cells into density buckets for the visual
  const hotspots = useMemo(() => {
    if (!cells.length) return [];
    // Take top 80 cells by count for rendering
    return cells
      .sort((a, b) => b.count - a.count)
      .slice(0, 80)
      .map(cell => ({
        // Map lat/lng to percentage positions on a flat projection
        x: ((cell.lng + 180) / 360) * 100,
        y: ((90 - cell.lat) / 180) * 100,
        size: Math.min(Math.max(Math.sqrt(cell.count) * 0.8, 3), 14),
        intensity: cell.intensity,
        network: cell.network,
      }));
  }, [cells]);

  return (
    <div className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden bg-card/30 border border-border/30">
      {/* World map outline (CSS gradient approximation) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,hsl(var(--card))_0%,hsl(var(--background))_100%)]" />
      
      {/* Grid lines */}
      <div className="absolute inset-0 opacity-[0.04]" 
        style={{ 
          backgroundImage: `
            linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)
          `,
          backgroundSize: '10% 10%'
        }} 
      />
      
      {/* Coverage hotspots */}
      {hotspots.map((spot, i) => {
        const color = spot.network === '5g' 
          ? 'hsl(var(--neon-violet))' 
          : spot.network === '3g' 
            ? 'hsl(var(--warm-sand))'
            : 'hsl(var(--neon-cyan))';
        return (
          <div
            key={i}
            className="absolute rounded-full animate-pulse"
            style={{
              left: `${spot.x}%`,
              top: `${spot.y}%`,
              width: `${spot.size}px`,
              height: `${spot.size}px`,
              backgroundColor: color,
              opacity: 0.4 + spot.intensity * 0.5,
              boxShadow: `0 0 ${spot.size * 2}px ${color}`,
              transform: 'translate(-50%, -50%)',
              animationDelay: `${i * 50}ms`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        );
      })}
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-neon-cyan shadow-[0_0_6px_hsl(var(--neon-cyan))]" />
          <span>LTE</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-neon-violet shadow-[0_0_6px_hsl(var(--neon-violet))]" />
          <span>5G</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-warm-sand shadow-[0_0_6px_hsl(var(--warm-sand))]" />
          <span>3G</span>
        </div>
      </div>

      {/* "Live" badge */}
      <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/80 backdrop-blur-sm border border-neon-cyan/20">
        <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
        <span className="text-xs font-medium text-neon-cyan">Live Coverage</span>
      </div>
    </div>
  );
});
CoverageGlobe.displayName = "CoverageGlobe";

// ─── Main Page ───────────────────────────────────────────────────────────

const NetworkDashboard = () => {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [carriers, setCarriers] = useState<CarrierBenchmark[]>([]);
  const [recentFeed, setRecentFeed] = useState<RecentContribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [coverageRes, carriersRes, feedRes] = await Promise.all([
          supabase.functions.invoke('get-global-coverage'),
          supabase.from('carrier_benchmarks' as any).select('*').order('coverage_score', { ascending: false }).limit(10),
          supabase.from('signal_logs').select('id, network_generation, carrier_name, country_code, speed_test_down, recorded_at')
            .not('carrier_name', 'is', null)
            .not('speed_test_down', 'is', null)
            .order('recorded_at', { ascending: false })
            .limit(8),
        ]);

        if (coverageRes.data) {
          setStats(coverageRes.data);
        }

        if (carriersRes.data) {
          setCarriers(carriersRes.data as unknown as CarrierBenchmark[]);
        }

        if (feedRes.data) {
          setRecentFeed(feedRes.data as unknown as RecentContribution[]);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const formattedStats = useMemo(() => {
    if (!stats) return null;
    return {
      dataPoints: stats.totalDataPoints >= 1000000 
        ? `${(stats.totalDataPoints / 1000000).toFixed(1)}M`
        : stats.totalDataPoints >= 1000 
          ? `${(stats.totalDataPoints / 1000).toFixed(1)}K`
          : stats.totalDataPoints.toLocaleString(),
      contributors: stats.totalContributors.toLocaleString(),
      cities: stats.allTimeCities?.toLocaleString() || '0',
      coverage: stats.coverageAreaKm2 >= 1000000
        ? `${(stats.coverageAreaKm2 / 1000000).toFixed(1)}M km²`
        : stats.coverageAreaKm2 >= 1000
          ? `${(stats.coverageAreaKm2 / 1000).toFixed(0)}K km²`
          : `${stats.coverageAreaKm2} km²`,
    };
  }, [stats]);

  return (
    <>
      <Helmet>
        <title>Live Network Coverage Map | Nomiqa DePIN</title>
        <meta name="description" content="Real-time global network coverage map powered by Nomiqa's DePIN contributors. See signal quality, carrier comparisons, and live speed tests across 200+ countries." />
        <link rel="canonical" href="https://nomiqa-depin.com/network" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* ─── Hero ─── */}
        <section className="relative pt-24 pb-16 md:pt-32 md:pb-20 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,hsl(var(--neon-cyan)/0.06),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_80%,hsl(var(--neon-violet)/0.04),transparent_60%)]" />
          
          <div className="container px-4 sm:px-6 relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 mb-6">
                <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
                <span className="text-sm font-medium text-neon-cyan">Live Network Intelligence</span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-4 tracking-tight">
                Global Coverage
                <span className="block text-neon-cyan">Dashboard</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Real-time network coverage data powered by{" "}
                <span className="text-foreground font-medium">thousands of contributors</span>{" "}
                mapping connectivity worldwide.
              </p>
            </motion.div>

            {/* ─── Stats Grid ─── */}
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-36 rounded-2xl bg-card/40 border border-border/30 animate-pulse" />
                ))}
              </div>
            ) : formattedStats && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
                <StatCard icon={Signal} value={formattedStats.dataPoints} label="Signal Measurements" color="neon-cyan" delay={0} />
                <StatCard icon={Users} value={formattedStats.contributors} label="Contributors" color="neon-violet" delay={0.1} />
                <StatCard icon={MapPin} value={formattedStats.cities} label="Cities Mapped" color="neon-coral" delay={0.2} />
                <StatCard icon={Globe} value={formattedStats.coverage} label="Coverage Area" color="warm-sand" delay={0.3} />
              </div>
            )}
          </div>
        </section>

        {/* ─── Coverage Map ─── */}
        <section className="py-12 md:py-16">
          <div className="container px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <Radio className="w-5 h-5 text-neon-cyan" />
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Coverage Heatmap</h2>
              </div>
              <CoverageGlobe cells={stats?.cells || []} />
            </motion.div>
          </div>
        </section>

        {/* ─── Two Column: Carrier Benchmarks + Live Feed ─── */}
        <section className="py-12 md:py-16">
          <div className="container px-4 sm:px-6">
            <div className="grid lg:grid-cols-5 gap-8">
              {/* Carrier Benchmarks (3/5) */}
              <motion.div 
                className="lg:col-span-3"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="w-5 h-5 text-neon-violet" />
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">Carrier Comparison</h2>
                </div>
                
                {carriers.length > 0 ? (
                  <div className="rounded-2xl border border-border/30 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-card/60 border-b border-border/30">
                            <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Carrier</th>
                            <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">↓ Speed</th>
                            <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4 hidden sm:table-cell">↑ Speed</th>
                            <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4 hidden md:table-cell">Latency</th>
                            <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider p-4">Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {carriers.map((carrier, i) => {
                            const emoji = carrier.country_code && carrier.country_code.length === 2
                              ? String.fromCodePoint(...carrier.country_code.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)))
                              : '🌍';
                            return (
                              <motion.tr
                                key={`${carrier.carrier_name}-${carrier.country_code}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className="border-b border-border/20 hover:bg-card/40 transition-colors"
                              >
                                <td className="p-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">{emoji}</span>
                                    <span className="text-sm font-medium text-foreground">{carrier.carrier_name}</span>
                                  </div>
                                </td>
                                <td className="p-4 text-right">
                                  <span className="text-sm font-bold text-neon-cyan tabular-nums">
                                    {carrier.avg_download_mbps?.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">Mbps</span>
                                  </span>
                                </td>
                                <td className="p-4 text-right hidden sm:table-cell">
                                  <span className="text-sm text-muted-foreground tabular-nums">
                                    {carrier.avg_upload_mbps?.toFixed(1)} Mbps
                                  </span>
                                </td>
                                <td className="p-4 text-right hidden md:table-cell">
                                  <span className="text-sm text-muted-foreground tabular-nums">
                                    {carrier.avg_latency_ms?.toFixed(0)} ms
                                  </span>
                                </td>
                                <td className="p-4 text-right">
                                  <div className="inline-flex items-center gap-2">
                                    <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                                      <div 
                                        className="h-full rounded-full bg-gradient-to-r from-neon-cyan to-neon-violet transition-all duration-700"
                                        style={{ width: `${Math.min(carrier.coverage_score || 0, 100)}%` }}
                                      />
                                    </div>
                                    <span className="text-sm font-bold text-foreground tabular-nums w-8">
                                      {carrier.coverage_score?.toFixed(0)}
                                    </span>
                                  </div>
                                </td>
                              </motion.tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-card/30 border border-border/30 p-12 text-center">
                    <BarChart3 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-muted-foreground">Carrier benchmarks will appear as more data is collected.</p>
                  </div>
                )}
              </motion.div>

              {/* Live Feed (2/5) */}
              <motion.div 
                className="lg:col-span-2"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <Activity className="w-5 h-5 text-neon-coral" />
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">Live Feed</h2>
                  <div className="w-2 h-2 rounded-full bg-neon-coral animate-pulse ml-1" />
                </div>
                
                <div className="space-y-3">
                  {recentFeed.length > 0 ? (
                    recentFeed.map((item, i) => (
                      <LiveFeedItem key={item.id} item={item} index={i} />
                    ))
                  ) : (
                    <div className="rounded-2xl bg-card/30 border border-border/30 p-12 text-center">
                      <Activity className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="text-muted-foreground">Contributions will appear here in real-time.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="py-16 md:py-24">
          <div className="container px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto text-center"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Help Build the World's
                <span className="text-neon-cyan"> Largest Coverage Map</span>
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Download the Nomiqa app and start earning rewards by contributing network data from your area.
              </p>
              <a 
                href="/download" 
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-cyan/80 text-background font-semibold text-lg hover:shadow-[0_0_30px_hsl(var(--neon-cyan)/0.3)] transition-all duration-300 hover:scale-105"
              >
                <Zap className="w-5 h-5" />
                Start Contributing
              </a>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default NetworkDashboard;
