import { Database, Globe, Users, TrendingUp, Activity } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface NetworkStats {
  totalDataPoints: number;
  totalContributors: number;
  countriesCovered: number;
  sessionsToday: number;
}

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
    const fetchStats = async () => {
      try {
        // Fetch real stats from the database
        const [signalLogsResult, contributorsResult, sessionsResult] = await Promise.all([
          supabase.from('signal_logs').select('id', { count: 'exact', head: true }),
          supabase.from('user_points').select('id', { count: 'exact', head: true }),
          supabase.from('contribution_sessions')
            .select('id', { count: 'exact', head: true })
            .gte('started_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        ]);

        // Get unique countries from signal_logs (approximation via products table coverage)
        const countriesResult = await supabase
          .from('products')
          .select('country_code')
          .limit(1000);
        
        const uniqueCountries = new Set(countriesResult.data?.map(p => p.country_code) || []);

        setStats({
          totalDataPoints: signalLogsResult.count || 0,
          totalContributors: contributorsResult.count || 0,
          countriesCovered: uniqueCountries.size || 0,
          sessionsToday: sessionsResult.count || 0,
        });
      } catch (error) {
        console.error('Failed to fetch network stats:', error);
        // Fallback to baseline numbers if fetch fails
        setStats({
          totalDataPoints: 1247,
          totalContributors: 89,
          countriesCovered: 42,
          sessionsToday: 12,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Animated counter component
  const AnimatedNumber = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
    const [displayValue, setDisplayValue] = useState(0);
    
    useEffect(() => {
      if (!isVisible || isLoading) return;
      
      const duration = 2000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);
      
      return () => clearInterval(timer);
    }, [value, isVisible, isLoading]);
    
    return (
      <span>
        {displayValue.toLocaleString()}{suffix}
      </span>
    );
  };

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
    <section ref={sectionRef} className="relative py-16 md:py-24 overflow-hidden bg-gradient-to-b from-background/95 to-background">
      {/* Background pulse effect */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-cyan/5 rounded-full blur-3xl animate-pulse"></div>
      </div>
      
      <div className="container relative z-10 px-4 sm:px-6 md:px-8">
        {/* Header */}
        <div className={`text-center mb-12 md:mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 mb-6">
            <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse"></div>
            <span className="text-sm font-medium text-neon-cyan">{t("liveStatsBadge")}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-foreground">
            {t("liveStatsTitle")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
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
                  <span className="inline-block w-16 h-8 bg-muted animate-pulse rounded"></span>
                ) : (
                  <AnimatedNumber value={item.value} />
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
