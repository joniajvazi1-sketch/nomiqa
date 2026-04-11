import { Database, Globe, Users, TrendingUp, Activity } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { useEffect, useRef, useState, memo } from "react";
import { supabase } from "@/integrations/supabase/client";

interface NetworkStats {
  totalDataPoints: number;
  totalContributors: number;
  countriesCovered: number;
  sessionsToday: number;
}

// CSS-only animated counter to eliminate React re-renders
const formatCompact = (value: number): string => {
  if (value >= 1000) return `${Math.round(value / 1000)}k`;
  return value.toString();
};

const CSSCounter = memo(({ value, isVisible }: { value: number; isVisible: boolean }) => {
  return (
    <span 
      className={`inline-block tabular-nums transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      {formatCompact(value)}
    </span>
  );
});
CSSCounter.displayName = "CSSCounter";

export const LiveNetworkStats = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState<NetworkStats>({
    totalDataPoints: 0,
    totalContributors: 0,
    countriesCovered: 0,
    sessionsToday: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const sectionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const CACHE_KEY = 'nomiqa_network_stats';
    const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

    const getCached = (): NetworkStats | null => {
      try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const { data, ts } = JSON.parse(raw);
        if (Date.now() - ts < CACHE_TTL) return data;
      } catch {}
      return null;
    };

    const cached = getCached();
    if (cached) {
      setStats(cached);
      setIsLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        const { data: cachedData, error: cacheError } = await supabase.functions.invoke('get-network-stats-cached');
        
        if (!cacheError && cachedData) {
          const s: NetworkStats = {
            totalDataPoints: cachedData.totalDataPoints || 0,
            totalContributors: cachedData.totalContributors || 0,
            countriesCovered: cachedData.countriesCovered || 180,
            sessionsToday: cachedData.sessionsToday || 0,
          };
          setStats(s);
          localStorage.setItem(CACHE_KEY, JSON.stringify({ data: s, ts: Date.now() }));
        }
      } catch (error) {
        console.error('Failed to fetch network stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statItems = [
    {
      icon: Database,
      value: stats.totalDataPoints,
      label: t("liveStatsDataPoints"),
      color: "text-neon-cyan",
      bgColor: "bg-neon-cyan/10",
      borderColor: "border-neon-cyan/30",
    },
    {
      icon: Users,
      value: stats.totalContributors,
      label: t("liveStatsContributors"),
      color: "text-neon-violet",
      bgColor: "bg-neon-violet/10",
      borderColor: "border-neon-violet/30",
    },
    {
      icon: Globe,
      value: stats.countriesCovered,
      label: t("liveStatsCountries"),
      color: "text-neon-coral",
      bgColor: "bg-neon-coral/10",
      borderColor: "border-neon-coral/30",
    },
    {
      icon: Activity,
      value: stats.sessionsToday,
      label: t("liveStatsSessions"),
      color: "text-warm-sand",
      bgColor: "bg-warm-sand/10",
      borderColor: "border-warm-sand/30",
    },
  ];

  return (
    <section ref={sectionRef} className="relative py-14 md:py-20 overflow-hidden bg-gradient-to-b from-card/20 via-background to-background">
      {/* Subtle glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--neon-cyan)/0.03),transparent_60%)]" />
      
      <div className="container relative z-10 px-4 sm:px-6">
        {/* Header */}
        <div className={`text-center mb-10 md:mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 mb-5">
            <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse"></div>
            <span className="text-sm font-medium text-neon-cyan">{t("liveStatsBadge")}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 text-foreground">
            {t("liveStatsTitle")}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
            {t("liveStatsSubtitle")}
          </p>
        </div>

        {/* Stats Grid */}
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {statItems.map((item, index) => (
            <div
              key={index}
              className={`relative p-6 md:p-8 rounded-2xl ${item.bgColor} border ${item.borderColor} text-center group hover:scale-105 transition-transform duration-300`}
            >
              <item.icon className={`w-8 h-8 ${item.color} mx-auto mb-4`} />
              <div className={`text-3xl md:text-4xl lg:text-5xl font-bold ${item.color} mb-2`}>
                {isLoading ? (
                  <span className="inline-block w-16 h-8 bg-muted/30 rounded"></span>
                ) : (
                  <CSSCounter value={item.value} isVisible={isVisible && !isLoading} />
                )}
              </div>
              <p className="text-sm text-muted-foreground font-medium">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Growing indicator */}
        <div className={`mt-12 text-center transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="w-4 h-4 text-neon-cyan" />
            <span className="text-sm">{t("liveStatsGrowing")}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
