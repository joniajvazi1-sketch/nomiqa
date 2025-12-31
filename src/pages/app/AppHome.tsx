import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, 
  ShoppingBag, 
  Signal, 
  ChevronRight,
  Sparkles,
  MapPin,
  Trophy,
  Flame,
  Wifi,
  Globe,
  ArrowUpRight,
  TrendingUp,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHaptics } from '@/hooks/useHaptics';
import { supabase } from '@/integrations/supabase/client';
import nomiqaLogo from '@/assets/nomiqa-animated-logo.gif';
import { cn } from '@/lib/utils';

interface DailyEarning {
  date: string;
  points: number;
}

/**
 * App Home Dashboard - Premium native app home screen
 * Features sophisticated glassmorphism, fluid animations, and premium micro-interactions
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

          // Load last 7 days of earnings from contribution_sessions
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          
          const { data: sessionsData } = await supabase
            .from('contribution_sessions')
            .select('started_at, total_points_earned')
            .eq('user_id', currentUser.id)
            .gte('started_at', sevenDaysAgo.toISOString())
            .order('started_at', { ascending: true });

          if (sessionsData) {
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
              const dateKey = new Date(session.started_at).toISOString().split('T')[0];
              const current = dailyMap.get(dateKey) || 0;
              dailyMap.set(dateKey, current + (session.total_points_earned || 0));
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

  const formatDistance = (meters: number) => {
    if (meters >= 1000) return (meters / 1000).toFixed(1) + ' km';
    return meters.toFixed(0) + ' m';
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
      {/* Premium animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)',
            filter: 'blur(80px)',
            animation: 'pulse 8s ease-in-out infinite'
          }}
        />
        <div 
          className="absolute bottom-1/4 -right-20 w-[400px] h-[400px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, hsl(var(--neon-cyan)) 0%, transparent 70%)',
            filter: 'blur(60px)',
            animation: 'pulse 6s ease-in-out infinite 2s'
          }}
        />
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), 
                              linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      <div className="relative z-10 px-5 py-6 pb-28 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/40 via-primary/20 to-transparent backdrop-blur-2xl border border-white/10 flex items-center justify-center overflow-hidden shadow-lg shadow-primary/20">
                <img src={nomiqaLogo} alt="Nomiqa" className="w-9 h-9 object-contain" loading="eager" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-background shadow-lg shadow-green-500/50" />
            </div>
            <div>
              <p className="text-muted-foreground/80 text-sm font-medium">{greeting()}</p>
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                {user?.user_metadata?.username || 'Explorer'}
              </h1>
            </div>
          </div>
          <button 
            onClick={() => { lightTap(); navigate('/app/profile'); }}
            className="w-11 h-11 rounded-full bg-white/[0.05] backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-white/[0.08] transition-all active:scale-95"
          >
            <Sparkles className="w-5 h-5 text-primary" />
          </button>
        </header>

        {/* Hero Points Card */}
        <div 
          className="relative rounded-[28px] overflow-hidden cursor-pointer active:scale-[0.98] transition-all duration-300 group"
          onClick={() => handleNavigation('/app/map')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-primary/15 to-neon-cyan/10" />
          <div className="absolute inset-0 backdrop-blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-white/15 via-transparent to-transparent" />
          
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)',
              animation: 'shimmer 3s infinite'
            }}
          />
          
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-primary/50 to-transparent rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-tr from-neon-cyan/40 to-transparent rounded-full blur-2xl" />
          
          <div className="relative p-6 border border-white/10 rounded-[28px]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/40">
                  <Zap className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <span className="text-sm text-foreground/80 font-semibold">Nomi Points</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Live</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.08] border border-white/10 text-xs text-primary font-medium group-hover:bg-white/[0.12] transition-colors">
                <span>Tap to earn</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>
            
            <div ref={pointsRef} className="mb-3">
              {loading ? (
                <div className="h-14 w-40 bg-white/10 rounded-2xl animate-pulse relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-shimmer" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }} />
                </div>
              ) : (
                <div className="text-[56px] font-bold text-foreground tracking-tighter leading-none">
                  {formatNumber(animatedPoints)}
                </div>
              )}
            </div>
            
            {points?.pending_points && points.pending_points > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/20 text-primary text-sm font-semibold">
                <Sparkles className="w-4 h-4" />
                <span>+{formatNumber(points.pending_points)} pending</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { 
              icon: MapPin, 
              value: loading ? '--' : formatDistance(points?.total_distance_meters || 0),
              label: 'Distance',
              color: 'from-emerald-500/30 to-emerald-500/5',
              iconColor: 'text-emerald-400'
            },
            { 
              icon: Flame, 
              value: loading ? '--' : `${points?.contribution_streak_days || 0}`,
              label: 'Day Streak',
              color: 'from-orange-500/30 to-orange-500/5',
              iconColor: 'text-orange-400'
            },
            { 
              icon: Trophy, 
              value: loading ? '--' : '#--',
              label: 'Rank',
              color: 'from-violet-500/30 to-violet-500/5',
              iconColor: 'text-violet-400'
            }
          ].map((stat, i) => (
            <div 
              key={stat.label}
              className="rounded-2xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] p-4 text-center hover:bg-white/[0.05] transition-all duration-300 animate-fade-in active:scale-95"
              style={{ animationDelay: `${i * 100 + 200}ms`, animationFillMode: 'backwards' }}
            >
              <div className={cn(
                'w-11 h-11 mx-auto mb-3 rounded-xl bg-gradient-to-br flex items-center justify-center',
                stat.color
              )}>
                <stat.icon className={cn('w-5 h-5', stat.iconColor)} />
              </div>
              <div className="text-lg font-bold text-foreground mb-0.5">{stat.value}</div>
              <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Primary CTA */}
        <div className="space-y-3">
          <Button 
            onClick={() => handleNavigation('/app/map')}
            className="relative w-full h-[72px] rounded-2xl border-0 overflow-hidden group shadow-2xl shadow-primary/30"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.8) 100%)'
            }}
          >
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)'
              }}
            />
            
            <div className="relative flex items-center justify-between w-full px-2">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <Signal className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-lg text-primary-foreground">Start Contributing</div>
                  <div className="text-sm text-primary-foreground/70">Earn points while you move</div>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-primary-foreground/60 group-hover:translate-x-1 group-hover:text-primary-foreground transition-all" />
            </div>
          </Button>

          <Button 
            onClick={() => handleNavigation('/app/shop')}
            variant="ghost"
            className="w-full h-16 rounded-2xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15] group transition-all duration-300"
          >
            <div className="flex items-center justify-between w-full px-1">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-neon-cyan/25 to-neon-cyan/5 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-neon-cyan" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-foreground">Buy eSIM</div>
                  <div className="text-xs text-muted-foreground">200+ countries covered</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 group-hover:text-foreground transition-all" />
            </div>
          </Button>
        </div>

        {/* Network Status Pill */}
        <div className="flex items-center justify-center gap-2 py-2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] backdrop-blur-xl border border-white/[0.08]">
            <Wifi className="w-4 h-4 text-green-400" />
            <span className="text-sm text-muted-foreground font-medium">Network Active</span>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
        </div>

        {/* Conditional: How It Works OR Earnings Velocity */}
        {showHowItWorks ? (
          /* How It Works Section - Dismissible */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">How it works</h2>
              <Globe className="w-4 h-4 text-muted-foreground/50" />
            </div>
            
            <div className="space-y-3">
              {[
                { step: 1, title: 'Move with cellular data', desc: 'Contribute to the global network', gradient: 'from-primary/20 to-primary/5' },
                { step: 2, title: 'Earn Nomi Points', desc: 'More distance = more rewards', gradient: 'from-neon-cyan/20 to-neon-cyan/5' },
                { step: 3, title: 'Convert to $NOMIQA', desc: 'Redeem when token launches', gradient: 'from-violet-500/20 to-violet-500/5' }
              ].map((item) => (
                <div 
                  key={item.step}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] hover:bg-white/[0.05] transition-all duration-300"
                >
                  <div className={cn(
                    'w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center font-bold text-primary',
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

            {/* I Understand Button */}
            <Button
              onClick={handleDismissHowItWorks}
              variant="ghost"
              className="w-full h-12 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] hover:bg-white/[0.06] text-muted-foreground hover:text-foreground transition-all"
            >
              <Check className="w-4 h-4 mr-2" />
              I understand, show my earnings
            </Button>
          </div>
        ) : (
          /* Earnings Velocity Card - Robinhood Style */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Earnings Velocity</h2>
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            
            <div className="relative rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-xl" />
              
              <div className="relative p-5 border border-white/[0.08] rounded-2xl">
                {/* Header Stats */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {formatNumber(totalWeekPoints)}
                    </div>
                    <div className="text-xs text-muted-foreground">Points this week</div>
                  </div>
                  <div className="text-right">
                    <div className={cn(
                      'text-lg font-semibold',
                      todayPoints > 0 ? 'text-green-400' : 'text-muted-foreground'
                    )}>
                      {todayPoints > 0 ? '+' : ''}{formatNumber(todayPoints)}
                    </div>
                    <div className="text-xs text-muted-foreground">Today</div>
                  </div>
                </div>

                {/* Sparkline Chart - Robinhood Style */}
                <div className="relative h-16 w-full">
                  <svg 
                    viewBox="0 0 280 60" 
                    className="w-full h-full"
                    preserveAspectRatio="none"
                  >
                    {/* Gradient Definition */}
                    <defs>
                      <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgb(34, 197, 94)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="rgb(34, 197, 94)" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgb(34, 197, 94)" />
                        <stop offset="100%" stopColor="rgb(74, 222, 128)" />
                      </linearGradient>
                    </defs>
                    
                    {/* Area Fill */}
                    {areaPath && (
                      <path
                        d={areaPath}
                        fill="url(#areaGradient)"
                      />
                    )}
                    
                    {/* Line */}
                    {sparklinePath && (
                      <path
                        d={sparklinePath}
                        fill="none"
                        stroke="url(#lineGradient)"
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
                          fill="rgb(34, 197, 94)"
                          fillOpacity="0.3"
                        />
                        <circle
                          cx={4 + ((earningsData.length - 1) / (earningsData.length - 1)) * 272}
                          cy={56 - (earningsData[earningsData.length - 1].points / Math.max(...earningsData.map(d => d.points), 1)) * 52}
                          r="3"
                          fill="rgb(34, 197, 94)"
                        />
                      </>
                    )}
                  </svg>
                  
                  {/* Empty State */}
                  {totalWeekPoints === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-xs text-muted-foreground">Start contributing to see your earnings</p>
                    </div>
                  )}
                </div>

                {/* Day Labels */}
                <div className="flex justify-between mt-2 px-1">
                  {earningsData.map((d, i) => (
                    <span 
                      key={d.date} 
                      className="text-[10px] text-muted-foreground/60 font-medium"
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
              className="w-full text-center text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              Show how it works again
            </button>
          </div>
        )}

        {/* Auth CTA for non-logged in users */}
        {!loading && !user && (
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/15 to-neon-cyan/15" />
            <div className="absolute inset-0 backdrop-blur-xl" />
            <div className="relative p-6 border border-white/10 rounded-2xl text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Join the Network</h3>
              <p className="text-sm text-muted-foreground mb-5 max-w-[280px] mx-auto">
                Sign in to start earning Nomi Points and build the future of connectivity
              </p>
              <Button 
                onClick={() => handleNavigation('/auth')}
                className="bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 shadow-lg shadow-primary/30"
              >
                Sign In to Earn
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
