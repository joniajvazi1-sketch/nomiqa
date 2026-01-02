import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, 
  ShoppingBag, 
  Signal, 
  ChevronRight,
  Sparkles,
  Trophy,
  Flame,
  Wifi,
  Globe,
  TrendingUp,
  Check,
  Radio,
  Database,
  Satellite,
  Target,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHaptics } from '@/hooks/useHaptics';
import { supabase } from '@/integrations/supabase/client';
import nomiqaLogo from '@/assets/nomiqa-animated-logo.gif';
import { cn } from '@/lib/utils';
import { MiniContributionMap } from '@/components/app/MiniContributionMap';
import { AnimatedProgressBar } from '@/components/app/AnimatedProgressBar';
import { RippleButton } from '@/components/app/RippleButton';

interface DailyEarning {
  date: string;
  points: number;
}

// Daily goal constant (can be made dynamic later)
const DAILY_GOAL = 500;

/**
 * App Home Dashboard - DePIN Command Center
 * Features high-tech network scanner aesthetic with dashboard feel
 */
export const AppHome: React.FC = () => {
  const navigate = useNavigate();
  const { mediumTap, lightTap, success } = useHaptics();
  const [user, setUser] = useState<any>(null);
  const [points, setPoints] = useState<{
    total_points: number;
    pending_points: number;
    total_distance_meters: number;
    contribution_streak_days: number;
  } | null>(null);
  const [dataPointsCount, setDataPointsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [animatedPoints, setAnimatedPoints] = useState(0);
  const [showHowItWorks, setShowHowItWorks] = useState(true);
  const [earningsData, setEarningsData] = useState<DailyEarning[]>([]);
  const pointsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user has dismissed the how it works section
    const dismissed = localStorage.getItem('nomiqa_how_it_works_dismissed');
    if (dismissed === 'true') {
      setShowHowItWorks(false);
    }

    const loadData = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        if (currentUser) {
          const { data: pointsData } = await supabase
            .from('user_points')
            .select('*')
            .eq('user_id', currentUser.id)
            .single();
          
          if (pointsData) {
            setPoints(pointsData);
          }

          // Get total data points count from contribution sessions
          const { data: sessionsData } = await supabase
            .from('contribution_sessions')
            .select('data_points_count, started_at, total_points_earned')
            .eq('user_id', currentUser.id);

          if (sessionsData) {
            const totalDataPoints = sessionsData.reduce((sum, s) => sum + (s.data_points_count || 0), 0);
            setDataPointsCount(totalDataPoints);

            // Filter last 7 days for earnings chart
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            // Aggregate by day
            const dailyMap = new Map<string, number>();
            const today = new Date();
            
            // Initialize all 7 days with 0
            for (let i = 6; i >= 0; i--) {
              const date = new Date(today);
              date.setDate(date.getDate() - i);
              const dateKey = date.toISOString().split('T')[0];
              dailyMap.set(dateKey, 0);
            }
            
            // Sum points per day
            sessionsData.forEach(session => {
              const sessionDate = new Date(session.started_at);
              if (sessionDate >= sevenDaysAgo) {
                const dateKey = sessionDate.toISOString().split('T')[0];
                const current = dailyMap.get(dateKey) || 0;
                dailyMap.set(dateKey, current + (session.total_points_earned || 0));
              }
            });

            const earnings: DailyEarning[] = Array.from(dailyMap.entries()).map(([date, points]) => ({
              date,
              points
            }));
            
            setEarningsData(earnings);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Animate points counter
  useEffect(() => {
    if (loading || !points) return;
    
    const target = points.total_points || 0;
    const duration = 1500;
    const start = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setAnimatedPoints(Math.floor(easeOut * target));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [loading, points]);

  const handleDismissHowItWorks = () => {
    lightTap();
    success();
    localStorage.setItem('nomiqa_how_it_works_dismissed', 'true');
    setShowHowItWorks(false);
  };

  const handleNavigation = (path: string) => {
    mediumTap();
    navigate(path);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  // Convert meters to km² coverage (rough estimate: assume 50m scanning radius)
  const formatCoverage = (meters: number) => {
    // Coverage = distance * 100m width = area in m², convert to km²
    const areaSqMeters = meters * 100; // 100m scanning corridor
    const areaSqKm = areaSqMeters / 1_000_000;
    if (areaSqKm >= 1) return areaSqKm.toFixed(2) + ' km²';
    return (areaSqKm * 1000).toFixed(0) + ' m²';
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Calculate sparkline path
  const sparklinePath = useMemo(() => {
    if (earningsData.length === 0) return '';
    
    const maxPoints = Math.max(...earningsData.map(d => d.points), 1);
    const width = 280;
    const height = 60;
    const padding = 4;
    
    const points = earningsData.map((d, i) => {
      const x = padding + (i / (earningsData.length - 1)) * (width - padding * 2);
      const y = height - padding - (d.points / maxPoints) * (height - padding * 2);
      return { x, y };
    });
    
    // Create smooth curve using bezier
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      path += ` Q ${cpx} ${prev.y} ${cpx} ${(prev.y + curr.y) / 2}`;
      path += ` Q ${cpx} ${curr.y} ${curr.x} ${curr.y}`;
    }
    
    return path;
  }, [earningsData]);

  // Calculate area fill path
  const areaPath = useMemo(() => {
    if (earningsData.length === 0 || !sparklinePath) return '';
    
    const maxPoints = Math.max(...earningsData.map(d => d.points), 1);
    const width = 280;
    const height = 60;
    const padding = 4;
    
    const points = earningsData.map((d, i) => {
      const x = padding + (i / (earningsData.length - 1)) * (width - padding * 2);
      const y = height - padding - (d.points / maxPoints) * (height - padding * 2);
      return { x, y };
    });
    
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    
    return `${sparklinePath} L ${lastX} ${height} L ${firstX} ${height} Z`;
  }, [earningsData, sparklinePath]);

  const totalWeekPoints = useMemo(() => {
    return earningsData.reduce((sum, d) => sum + d.points, 0);
  }, [earningsData]);

  const todayPoints = useMemo(() => {
    if (earningsData.length === 0) return 0;
    return earningsData[earningsData.length - 1].points;
  }, [earningsData]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* High-tech animated background with grid */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, hsl(var(--neon-cyan)) 0%, transparent 70%)',
            filter: 'blur(100px)',
            animation: 'pulse 8s ease-in-out infinite'
          }}
        />
        <div 
          className="absolute bottom-1/4 -right-20 w-[400px] h-[400px] rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)',
            filter: 'blur(80px)',
            animation: 'pulse 6s ease-in-out infinite 2s'
          }}
        />
        {/* Tech grid overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--neon-cyan)) 1px, transparent 1px), 
                              linear-gradient(90deg, hsl(var(--neon-cyan)) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      <div className="relative z-10 px-5 py-6 pb-28 space-y-6">
        {/* Header - with staggered entrance animation */}
        <header className="flex items-center justify-between animate-stagger-in" style={{ animationFillMode: 'backwards' }}>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-cyan/30 via-primary/20 to-transparent backdrop-blur-2xl border border-neon-cyan/20 flex items-center justify-center overflow-hidden shadow-lg shadow-neon-cyan/20 hover:scale-105 transition-transform duration-300">
                <span 
                  className="text-[8px] font-bold text-neon-cyan tracking-[0.08em]"
                  style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' }}
                >
                  NOMIQA
                </span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-neon-cyan rounded-full border-2 border-background shadow-lg shadow-neon-cyan/50 animate-pulse" />
            </div>
            <div className="animate-stagger-in" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
              <p className="text-muted-foreground/80 text-sm font-medium">{greeting()}</p>
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                {user?.user_metadata?.username || 'Operator'}
              </h1>
            </div>
          </div>
          <button 
            onClick={() => { lightTap(); navigate('/app/profile'); }}
            className="w-11 h-11 rounded-full bg-neon-cyan/[0.08] backdrop-blur-xl border border-neon-cyan/20 flex items-center justify-center hover:bg-neon-cyan/[0.12] hover:scale-110 transition-all duration-300 active:scale-95 animate-stagger-in"
            style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}
          >
            <Satellite className="w-5 h-5 text-neon-cyan" />
          </button>
        </header>

        {/* HERO: Total Points - Large & Prominent with Monospace and entrance animation */}
        <div 
          className="relative rounded-[28px] overflow-hidden cursor-pointer active:scale-[0.97] transition-all duration-300 group animate-stagger-in"
          style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}
          onClick={() => handleNavigation('/app/map')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/20 via-primary/15 to-neon-cyan/5" />
          <div className="absolute inset-0 backdrop-blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
          
          {/* Scanning line animation */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              background: 'linear-gradient(180deg, transparent 0%, hsl(var(--neon-cyan) / 0.3) 50%, transparent 100%)',
              backgroundSize: '100% 200%',
              animation: 'scanline 3s linear infinite'
            }}
          />
          
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-neon-cyan/40 to-transparent rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-tr from-primary/30 to-transparent rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500" />
          
          <div className="relative p-6 border border-neon-cyan/20 rounded-[28px] group-hover:border-neon-cyan/30 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-cyan/70 flex items-center justify-center shadow-lg shadow-neon-cyan/40 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-5 h-5 text-background" />
                </div>
                <div>
                  <span className="text-sm text-foreground/80 font-semibold">Network Points</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
                    <span className="text-[10px] text-neon-cyan uppercase tracking-wider font-mono">LIVE</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neon-cyan/[0.1] border border-neon-cyan/20 text-xs text-neon-cyan font-mono uppercase tracking-wide group-hover:bg-neon-cyan/[0.15] transition-colors">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>Scan</span>
              </div>
            </div>
            
            {/* HERO NUMBER - Large Monospace with count-up animation */}
            <div ref={pointsRef} className="mb-3">
              {loading ? (
                <div className="h-20 w-48 bg-neon-cyan/10 rounded-2xl animate-pulse relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-shimmer" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,255,0.1), transparent)' }} />
                </div>
              ) : (
                <div 
                  className="text-[72px] font-bold text-foreground tracking-tighter leading-none animate-count-up"
                  style={{ 
                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
                    animationDelay: '300ms',
                    animationFillMode: 'backwards'
                  }}
                >
                  {formatNumber(animatedPoints)}
                </div>
              )}
            </div>
            
            {points?.pending_points && points.pending_points > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-neon-cyan/20 to-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-sm font-mono animate-bounce-in" style={{ animationDelay: '500ms', animationFillMode: 'backwards' }}>
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span>+{formatNumber(points.pending_points)} pending</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid - DePIN Metrics with staggered animations */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { 
              icon: Globe, 
              value: loading ? '--' : formatCoverage(points?.total_distance_meters || 0),
              label: 'Coverage',
              color: 'from-neon-cyan/30 to-neon-cyan/5',
              iconColor: 'text-neon-cyan'
            },
            { 
              icon: Database, 
              value: loading ? '--' : formatNumber(dataPointsCount),
              label: 'Data Points',
              color: 'from-primary/30 to-primary/5',
              iconColor: 'text-primary'
            },
            { 
              icon: Flame, 
              value: loading ? '--' : `${points?.contribution_streak_days || 0}`,
              label: 'Streak',
              color: 'from-orange-500/30 to-orange-500/5',
              iconColor: 'text-orange-400'
            }
          ].map((stat, i) => (
            <div 
              key={stat.label}
              className="rounded-2xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] p-4 text-center hover:bg-white/[0.05] transition-all duration-300 active:scale-95 animate-stagger-in"
              style={{ 
                animationDelay: `${i * 100 + 200}ms`, 
                animationFillMode: 'backwards'
              }}
            >
              <div className={cn(
                'w-11 h-11 mx-auto mb-3 rounded-xl bg-gradient-to-br flex items-center justify-center transition-transform duration-300 hover:scale-110',
                stat.color
              )}>
                <stat.icon className={cn('w-5 h-5', stat.iconColor)} />
              </div>
              {/* Monospace numbers for dashboard feel */}
              <div 
                className="text-lg font-bold text-foreground mb-0.5 animate-count-up"
                style={{ 
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
                  animationDelay: `${i * 100 + 400}ms`,
                  animationFillMode: 'backwards'
                }}
              >
                {stat.value}
              </div>
              <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Daily Goal Progress */}
        <div className="space-y-3 animate-stagger-in" style={{ animationDelay: '500ms', animationFillMode: 'backwards' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-neon-cyan" />
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider font-mono">Daily Goal</span>
            </div>
            <span 
              className="text-xs text-muted-foreground font-mono"
              style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' }}
            >
              {formatNumber(todayPoints)} / {formatNumber(DAILY_GOAL)}
            </span>
          </div>
          <AnimatedProgressBar 
            value={todayPoints} 
            max={DAILY_GOAL}
            showPercentage={false}
            delay={600}
          />
          {todayPoints >= DAILY_GOAL && (
            <div className="flex items-center justify-center gap-2 text-neon-cyan text-sm font-semibold animate-bounce-in">
              <Trophy className="w-4 h-4" />
              <span>Daily Goal Achieved!</span>
            </div>
          )}
        </div>

        {/* Mini Map Preview Card */}
        <div 
          className="relative rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-all duration-300 group animate-stagger-in"
          style={{ animationDelay: '600ms', animationFillMode: 'backwards' }}
          onClick={() => handleNavigation('/app/map')}
        >
          <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-xl" />
          <div className="relative p-4 border border-white/[0.08] rounded-2xl">
            <div className="flex items-center gap-4">
              <MiniContributionMap 
                className="w-[100px] h-[60px] rounded-lg border border-neon-cyan/20"
                contributionPoints={points?.total_points || 0}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4 text-neon-cyan" />
                  <span className="text-sm font-semibold text-foreground">Contribution Map</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {dataPointsCount > 0 
                    ? `${formatNumber(dataPointsCount)} data points collected`
                    : 'Start scanning to see your coverage'
                  }
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 group-hover:text-neon-cyan transition-all" />
            </div>
          </div>
        </div>

        {/* PRIMARY CTA: Activate Network Scanner - Enhanced with glow pulse */}
        <div 
          className="relative rounded-[24px] overflow-hidden cursor-pointer active:scale-[0.97] transition-all duration-300 group animate-stagger-in animate-glow-pulse"
          style={{ animationDelay: '700ms', animationFillMode: 'backwards' }}
          onClick={() => handleNavigation('/app/map')}
        >
          {/* Pulsing background effect */}
          <div className="absolute inset-0">
            <div 
              className="absolute inset-0 bg-gradient-to-br from-neon-cyan/40 via-primary/30 to-neon-cyan/20"
              style={{ animation: 'pulse 2s ease-in-out infinite' }}
            />
            <div 
              className="absolute inset-0 bg-gradient-to-br from-neon-cyan/30 via-primary/20 to-neon-cyan/10"
              style={{ animation: 'pulse 2s ease-in-out infinite 0.5s' }}
            />
          </div>
          
          {/* Radar/sonar rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            <div 
              className="absolute w-[200%] h-[200%] rounded-full border border-neon-cyan/20"
              style={{ animation: 'sonar-ping 3s ease-out infinite' }}
            />
            <div 
              className="absolute w-[200%] h-[200%] rounded-full border border-neon-cyan/15"
              style={{ animation: 'sonar-ping 3s ease-out infinite 1s' }}
            />
            <div 
              className="absolute w-[200%] h-[200%] rounded-full border border-neon-cyan/10"
              style={{ animation: 'sonar-ping 3s ease-out infinite 2s' }}
            />
          </div>
          
          <div className="absolute inset-0 backdrop-blur-xl" />
          
          <div className="relative p-6 border border-neon-cyan/30 rounded-[24px]">
            <div className="flex items-center gap-5">
              {/* Large pulsing icon with enhanced animation */}
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-cyan/80 flex items-center justify-center shadow-2xl shadow-neon-cyan/50 group-hover:scale-110 transition-transform duration-300">
                  <Signal className="w-8 h-8 text-background" />
                </div>
                {/* Pulse rings around icon */}
                <div 
                  className="absolute inset-0 rounded-2xl border-2 border-neon-cyan/50"
                  style={{ animation: 'sonar-ping 2s ease-out infinite' }}
                />
                <div 
                  className="absolute inset-0 rounded-2xl border-2 border-neon-cyan/30"
                  style={{ animation: 'sonar-ping 2s ease-out infinite 0.5s' }}
                />
              </div>
              
              <div className="flex-1">
                <div 
                  className="font-bold text-xl text-foreground mb-1 group-hover:text-neon-cyan transition-colors"
                  style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' }}
                >
                  ACTIVATE SCANNER
                </div>
                <div className="text-sm text-foreground/70">
                  Map cellular networks • Earn rewards
                </div>
              </div>
              
              <div className="relative">
                <ChevronRight className="w-7 h-7 text-neon-cyan group-hover:translate-x-2 transition-transform duration-300" />
                {/* Arrow glow on hover */}
                <div className="absolute inset-0 bg-neon-cyan/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        </div>

        {/* Secondary: Buy eSIM - Enhanced with stagger animation */}
        <div 
          className="animate-stagger-in"
          style={{ animationDelay: '800ms', animationFillMode: 'backwards' }}
        >
          <Button 
            onClick={() => handleNavigation('/app/shop')}
            variant="ghost"
            className="w-full h-16 rounded-2xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15] group transition-all duration-300 active:scale-[0.98]"
          >
            <div className="flex items-center justify-between w-full px-1">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/25 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-foreground group-hover:text-primary transition-colors">Buy eSIM</div>
                  <div className="text-xs text-muted-foreground">200+ countries covered</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-2 group-hover:text-primary transition-all duration-300" />
            </div>
          </Button>
        </div>

        {/* Network Status Pill - Animated entrance */}
        <div 
          className="flex items-center justify-center gap-2 py-2 animate-stagger-in"
          style={{ animationDelay: '900ms', animationFillMode: 'backwards' }}
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-neon-cyan/[0.05] backdrop-blur-xl border border-neon-cyan/20 hover:bg-neon-cyan/[0.08] transition-all cursor-default">
            <Radio className="w-4 h-4 text-neon-cyan animate-pulse" />
            <span 
              className="text-sm text-neon-cyan font-medium"
              style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' }}
            >
              NETWORK ONLINE
            </span>
            <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse shadow-lg shadow-neon-cyan/50" />
          </div>
        </div>

        {/* Conditional: How It Works OR Earnings Velocity */}
        {showHowItWorks ? (
          /* How It Works Section - DePIN focused with staggered step animations */
          <div className="space-y-4 animate-stagger-in" style={{ animationDelay: '1000ms', animationFillMode: 'backwards' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider font-mono">PROTOCOL</h2>
              <Globe className="w-4 h-4 text-neon-cyan/50" />
            </div>
            
            <div className="space-y-3">
              {[
                { step: 1, title: 'Scan cellular networks', desc: 'Drive or travel with the app active', gradient: 'from-neon-cyan/20 to-neon-cyan/5' },
                { step: 2, title: 'Collect network data', desc: 'Signal strength, coverage, speeds', gradient: 'from-primary/20 to-primary/5' },
                { step: 3, title: 'Earn $NOMIQA tokens', desc: 'Redeem when token launches', gradient: 'from-violet-500/20 to-violet-500/5' }
              ].map((item, i) => (
                <div 
                  key={item.step}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-300 cursor-pointer active:scale-[0.98] animate-stagger-in"
                  style={{ animationDelay: `${1100 + i * 100}ms`, animationFillMode: 'backwards' }}
                >
                  <div className={cn(
                    'w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center font-mono font-bold text-neon-cyan transition-transform duration-300 hover:scale-110',
                    item.gradient
                  )}>
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">{item.title}</div>
                    <div className="text-sm text-muted-foreground">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* I Understand Button - Enhanced with ripple-like feedback */}
            <RippleButton
              onClick={handleDismissHowItWorks}
              variant="secondary"
              hapticStyle="medium"
              className="w-full h-12 rounded-2xl font-mono"
            >
              <Check className="w-4 h-4 mr-2" />
              UNDERSTOOD — SHOW STATS
            </RippleButton>
          </div>
        ) : (
          /* Earnings Velocity Card - with entrance animation */
          <div className="space-y-4 animate-stagger-in" style={{ animationDelay: '1000ms', animationFillMode: 'backwards' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider font-mono">EARNINGS VELOCITY</h2>
              <TrendingUp className="w-4 h-4 text-neon-cyan animate-pulse" />
            </div>
            
            <div className="relative rounded-2xl overflow-hidden hover:scale-[1.01] transition-transform duration-300">
              <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-xl" />
              
              <div className="relative p-5 border border-white/[0.08] rounded-2xl">
                {/* Header Stats */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div 
                      className="text-2xl font-bold text-foreground"
                      style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' }}
                    >
                      {formatNumber(totalWeekPoints)}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">7-DAY TOTAL</div>
                  </div>
                  <div className="text-right">
                    <div 
                      className={cn(
                        'text-lg font-semibold',
                        todayPoints > 0 ? 'text-neon-cyan' : 'text-muted-foreground'
                      )}
                      style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' }}
                    >
                      {todayPoints > 0 ? '+' : ''}{formatNumber(todayPoints)}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">TODAY</div>
                  </div>
                </div>

                {/* Sparkline Chart */}
                <div className="relative h-16 w-full">
                  <svg 
                    viewBox="0 0 280 60" 
                    className="w-full h-full"
                    preserveAspectRatio="none"
                  >
                    {/* Gradient Definition - Cyan themed */}
                    <defs>
                      <linearGradient id="areaGradientCyan" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="hsl(var(--neon-cyan))" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="hsl(var(--neon-cyan))" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="lineGradientCyan" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="hsl(var(--neon-cyan))" />
                        <stop offset="100%" stopColor="hsl(var(--primary))" />
                      </linearGradient>
                    </defs>
                    
                    {/* Area Fill */}
                    {areaPath && (
                      <path
                        d={areaPath}
                        fill="url(#areaGradientCyan)"
                      />
                    )}
                    
                    {/* Line */}
                    {sparklinePath && (
                      <path
                        d={sparklinePath}
                        fill="none"
                        stroke="url(#lineGradientCyan)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                    
                    {/* End Point Glow */}
                    {earningsData.length > 0 && (
                      <>
                        <circle
                          cx={4 + ((earningsData.length - 1) / (earningsData.length - 1)) * 272}
                          cy={56 - (earningsData[earningsData.length - 1].points / Math.max(...earningsData.map(d => d.points), 1)) * 52}
                          r="6"
                          fill="hsl(var(--neon-cyan))"
                          fillOpacity="0.3"
                        />
                        <circle
                          cx={4 + ((earningsData.length - 1) / (earningsData.length - 1)) * 272}
                          cy={56 - (earningsData[earningsData.length - 1].points / Math.max(...earningsData.map(d => d.points), 1)) * 52}
                          r="3"
                          fill="hsl(var(--neon-cyan))"
                        />
                      </>
                    )}
                  </svg>
                  
                  {/* Empty State */}
                  {totalWeekPoints === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-xs text-muted-foreground font-mono">ACTIVATE SCANNER TO COLLECT DATA</p>
                    </div>
                  )}
                </div>

                {/* Day Labels */}
                <div className="flex justify-between mt-2 px-1">
                  {earningsData.map((d, i) => (
                    <span 
                      key={d.date} 
                      className="text-[10px] text-muted-foreground/60 font-mono"
                    >
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'][new Date(d.date).getDay()]}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Action */}
            <button
              onClick={() => setShowHowItWorks(true)}
              className="w-full text-center text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors font-mono uppercase"
            >
              Show protocol again
            </button>
          </div>
        )}

        {/* Auth CTA for non-logged in users */}
        {!loading && !user && (
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/15 to-primary/15" />
            <div className="absolute inset-0 backdrop-blur-xl" />
            <div className="relative p-6 border border-neon-cyan/20 rounded-2xl text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-neon-cyan/30 to-neon-cyan/10 flex items-center justify-center shadow-lg shadow-neon-cyan/20">
                <Satellite className="w-8 h-8 text-neon-cyan" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2 font-mono">JOIN NETWORK</h3>
              <p className="text-sm text-muted-foreground mb-5 max-w-[280px] mx-auto">
                Sign in to activate your scanner and start earning network rewards
              </p>
              <Button 
                onClick={() => handleNavigation('/auth')}
                className="bg-gradient-to-r from-neon-cyan to-neon-cyan/80 hover:opacity-90 shadow-lg shadow-neon-cyan/30 text-background font-mono"
              >
                CONNECT TO EARN
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Scanline animation keyframes */}
      <style>{`
        @keyframes scanline {
          0% { background-position: 0% 0%; }
          100% { background-position: 0% 100%; }
        }
        @keyframes sonar-ping {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
