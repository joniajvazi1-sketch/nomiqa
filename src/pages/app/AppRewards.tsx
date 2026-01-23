import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Coins, TrendingUp, Clock, Zap, Gift, 
  Info, ChevronRight, Wifi, Activity, Target, ShoppingBag,
  Heart, CreditCard
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useHaptics } from '@/hooks/useHaptics';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { AppSpinner } from '@/components/app/AppSpinner';
import { TOKENOMICS, pointsToUsd } from '@/utils/tokenomics';
import { APP_COPY } from '@/utils/appCopy';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface EarningsData {
  date: string;
  points: number;
  label: string;
}

interface EarningFactors {
  uptime: number;
  coverageQuality: number;
  speedTests: number;
  areasExplored: number;
}

interface RedemptionOption {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  pointsCost: number | null;
  available: boolean;
  badge?: string;
}

export const AppRewards: React.FC = () => {
  const navigate = useNavigate();
  const { mediumTap, lightTap } = useHaptics();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  const [pendingPoints, setPendingPoints] = useState(0);
  const [earningsData, setEarningsData] = useState<EarningsData[]>([]);
  const [earningFactors, setEarningFactors] = useState<EarningFactors>({
    uptime: 0,
    coverageQuality: 0,
    speedTests: 0,
    areasExplored: 0
  });
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    loadRewardsData();
  }, [timeRange]);

  const loadRewardsData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Load user points
      const { data: pointsData } = await supabase
        .from('user_points')
        .select('total_points, pending_points')
        .eq('user_id', user.id)
        .maybeSingle();

      if (pointsData) {
        setTotalPoints(pointsData.total_points || 0);
        setPendingPoints(pointsData.pending_points || 0);
      }

      // Load contribution sessions for chart
      const daysBack = timeRange === 'daily' ? 7 : timeRange === 'weekly' ? 28 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const { data: sessions } = await supabase
        .from('contribution_sessions')
        .select('total_points_earned, started_at')
        .eq('user_id', user.id)
        .gte('started_at', startDate.toISOString())
        .order('started_at', { ascending: true });

      const aggregated = aggregateEarnings(sessions || [], timeRange);
      setEarningsData(aggregated);

      // Load earning factors
      const { data: levelData } = await supabase
        .from('user_contribution_levels')
        .select('areas_mapped, active_days')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: speedTests } = await supabase
        .from('speed_test_results')
        .select('id')
        .eq('user_id', user.id);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const recentSessions = (sessions || []).filter(
        s => new Date(s.started_at) >= weekAgo
      );
      const activeDaysThisWeek = new Set(
        recentSessions.map(s => new Date(s.started_at).toDateString())
      ).size;

      setEarningFactors({
        uptime: Math.round((activeDaysThisWeek / 7) * 100),
        coverageQuality: levelData?.areas_mapped ? Math.min(100, levelData.areas_mapped * 4) : 0,
        speedTests: speedTests?.length || 0,
        areasExplored: levelData?.areas_mapped || 0
      });

    } catch (error) {
      console.error('Error loading rewards data:', error);
    } finally {
      setLoading(false);
    }
  };

  const aggregateEarnings = (
    sessions: { total_points_earned: number | null; started_at: string }[],
    range: 'daily' | 'weekly' | 'monthly'
  ): EarningsData[] => {
    const map = new Map<string, number>();
    const now = new Date();

    if (range === 'daily') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        map.set(key, 0);
      }
    } else if (range === 'weekly') {
      for (let i = 3; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i * 7);
        const weekNum = getWeekNumber(d);
        map.set(`W${weekNum}`, 0);
      }
    } else {
      for (let i = 2; i >= 0; i--) {
        const d = new Date(now);
        d.setMonth(d.getMonth() - i);
        const monthKey = d.toLocaleString('default', { month: 'short' });
        map.set(monthKey, 0);
      }
    }

    sessions.forEach(s => {
      const date = new Date(s.started_at);
      let key: string;

      if (range === 'daily') {
        key = date.toISOString().split('T')[0];
      } else if (range === 'weekly') {
        key = `W${getWeekNumber(date)}`;
      } else {
        key = date.toLocaleString('default', { month: 'short' });
      }

      if (map.has(key)) {
        map.set(key, (map.get(key) || 0) + (s.total_points_earned || 0));
      }
    });

    return Array.from(map.entries()).map(([date, points]) => ({
      date,
      points,
      label: range === 'daily' 
        ? new Date(date).toLocaleDateString('en', { weekday: 'short' })
        : date
    }));
  };

  const getWeekNumber = (date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const handleRedeemPoints = () => {
    mediumTap();
    navigate('/app/shop');
  };

  const redemptionOptions: RedemptionOption[] = [
    {
      id: 'data',
      icon: Wifi,
      title: 'Mobile Data Pack',
      description: '1GB eSIM connectivity',
      pointsCost: 500,
      available: true
    },
    {
      id: 'gift',
      icon: CreditCard,
      title: 'Connectivity Rewards',
      description: 'Gift cards and network credits',
      pointsCost: 1000,
      available: false,
      badge: 'Coming Soon'
    },
    {
      id: 'charity',
      icon: Heart,
      title: 'Support Connectivity Access',
      description: 'Fund subsidized connectivity in underserved regions',
      pointsCost: 100,
      available: false,
      badge: 'Coming Soon'
    }
  ];

  const getFactorColor = (value: number) => {
    if (value >= 80) return 'text-green-600';
    if (value >= 50) return 'text-amber-600';
    return 'text-muted-foreground';
  };

  // Convert percentages to friendly progress labels
  const getProgressLabel = (value: number): { label: string; subtext: string } => {
    if (value === 0) return { label: 'Getting started', subtext: 'Start moving to improve' };
    if (value <= 30) return { label: 'Building', subtext: 'Good start' };
    if (value <= 60) return { label: 'Growing', subtext: 'Nice progress' };
    if (value <= 80) return { label: 'Strong', subtext: 'Great work!' };
    return { label: 'Excellent', subtext: 'Top performer!' };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AppSpinner size="lg" />
      </div>
    );
  }

  const totalUsd = pointsToUsd(totalPoints);

  const handleClaimPoints = () => {
    mediumTap();
    window.open('https://nomiqa.lovable.app/token', '_blank');
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="px-4 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-foreground">Rewards</h1>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => { lightTap(); navigate('/app/profile?tab=settings'); }}
            className="text-muted-foreground font-semibold hover:bg-muted"
          >
            <Info className="w-4 h-4 mr-1" />
            Help
          </Button>
        </div>

        {/* Claim Points CTA - Glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-4 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-primary-foreground">Ready to Claim?</h2>
              <p className="text-sm text-primary-foreground/80 font-medium">Convert your points to tokens</p>
            </div>
            <Button
              onClick={handleClaimPoints}
              className="bg-background text-primary hover:bg-background/90 font-bold px-5 shadow-md"
            >
              Claim Points
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </motion.div>

        {/* Points Balance Card - Glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-card/80 backdrop-blur-xl border border-border shadow-[var(--shadow-elevated)] p-5"
        >
          <div className="flex items-center gap-2 mb-1">
            <Coins className="w-5 h-5 text-green-500" />
            <span className="text-sm font-bold text-foreground">Total Points</span>
          </div>
          
          <div className="flex items-baseline gap-3 mb-1">
            <span className="text-5xl font-extrabold text-foreground tabular-nums">
              {totalPoints.toLocaleString()}
            </span>
            <span className="text-lg font-bold text-muted-foreground">pts</span>
          </div>
          
          <div className="text-base font-semibold text-green-500 mb-1">
            ≈ ${totalUsd.toFixed(2)} USD
          </div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Points convert to network tokens for services & rewards
          </p>
          <p className="text-xs font-semibold text-primary">
            🎁 Invite contributors → Share in network value
          </p>
        </motion.div>

        {/* Earnings Chart - Glassmorphism */}
        <div className="rounded-2xl bg-card/60 backdrop-blur-sm border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Points Over Time</span>
            </div>
            <Tabs value={timeRange} onValueChange={(v) => { lightTap(); setTimeRange(v as any); }}>
              <TabsList className="h-8 p-0.5 bg-muted border border-border">
                <TabsTrigger value="daily" className="h-7 text-xs px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground">Daily</TabsTrigger>
                <TabsTrigger value="weekly" className="h-7 text-xs px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground">Weekly</TabsTrigger>
                <TabsTrigger value="monthly" className="h-7 text-xs px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={earningsData} margin={{ left: -10, right: 5 }}>
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  label={{ value: timeRange === 'daily' ? 'Days' : timeRange === 'weekly' ? 'Weeks' : 'Months', position: 'insideBottom', offset: -5, fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                  tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}
                  label={{ value: 'Points', angle: -90, position: 'insideLeft', fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'hsl(var(--foreground))'
                  }}
                  formatter={(value: number) => [`${value} pts`, 'Earned']}
                />
                <Bar 
                  dataKey="points" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {earningsData.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Total this period
              </span>
              <span className="font-semibold text-foreground">
                {earningsData.reduce((sum, d) => sum + d.points, 0).toLocaleString()} pts
              </span>
            </div>
          )}
        </div>

        {/* Contribution Quality - Glassmorphism */}
        <div className="rounded-2xl bg-card/60 backdrop-blur-sm border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Your Contribution Quality</span>
          </div>
          
          <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 mb-4">
            💡 Higher-quality and more diverse coverage earns higher rewards
          </p>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-foreground">Uptime</span>
                <div className="text-right">
                  <span className={cn("text-sm font-semibold", earningFactors.uptime >= 80 ? 'text-green-500' : earningFactors.uptime >= 50 ? 'text-amber-500' : 'text-muted-foreground')}>
                    {getProgressLabel(earningFactors.uptime).label}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">
                    ({getProgressLabel(earningFactors.uptime).subtext})
                  </span>
                </div>
              </div>
              <Progress value={earningFactors.uptime} className="h-2" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-foreground">Coverage Quality</span>
                <div className="text-right">
                  <span className={cn("text-sm font-semibold", earningFactors.coverageQuality >= 80 ? 'text-green-500' : earningFactors.coverageQuality >= 50 ? 'text-amber-500' : 'text-muted-foreground')}>
                    {getProgressLabel(earningFactors.coverageQuality).label}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">
                    ({getProgressLabel(earningFactors.coverageQuality).subtext})
                  </span>
                </div>
              </div>
              <Progress value={earningFactors.coverageQuality} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button 
                onClick={() => { mediumTap(); toast({ title: 'Run Speed Tests', description: 'Quick contribution – run a speed test for +5 points!' }); }}
                className="bg-card/60 rounded-lg p-3 text-center border border-border hover:border-primary/30 active:scale-95 transition-all"
              >
                <Target className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{earningFactors.speedTests}</p>
                <p className="text-xs text-muted-foreground">Speed Tests</p>
                <p className="text-[9px] text-primary mt-1">Tap to learn more</p>
              </button>
              <button 
                onClick={() => { mediumTap(); toast({ title: 'Explore New Areas', description: 'Contribute network data while moving to map new locations!' }); }}
                className="bg-card/60 rounded-lg p-3 text-center border border-border hover:border-primary/30 active:scale-95 transition-all"
              >
                <Zap className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{earningFactors.areasExplored}</p>
                <p className="text-xs text-muted-foreground">Areas Mapped</p>
                <p className="text-[9px] text-primary mt-1">Tap to learn more</p>
              </button>
            </div>
          </div>
        </div>

        {/* Redemption Options - Glassmorphism */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Gift className="w-4 h-4 text-primary" />
            Use Your Points for Network Services
          </h2>

          <div className="space-y-2">
            {redemptionOptions.map((option) => {
              const Icon = option.icon;
              const canRedeem = option.available && option.pointsCost && totalPoints >= option.pointsCost;

              return (
                <button
                  key={option.id}
                  onClick={() => {
                    mediumTap();
                    if (option.id === 'data' && canRedeem) {
                      navigate('/app/shop');
                    } else if (!option.available) {
                      toast({ title: 'Coming soon!', description: 'This option will be available soon.' });
                    }
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 rounded-xl border transition-colors text-left",
                    option.available 
                      ? "bg-card/60 backdrop-blur-sm border-border active:bg-card/80" 
                      : "bg-muted/30 border-border/50"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    option.available ? "bg-primary/20" : "bg-muted"
                  )}>
                    <Icon className={cn(
                      "w-5 h-5",
                      option.available ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-medium",
                        option.available ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {option.title}
                      </span>
                      {option.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {option.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>

                  <div className="text-right">
                    {option.pointsCost && (
                      <p className={cn(
                        "text-sm font-semibold",
                        canRedeem ? "text-primary" : "text-muted-foreground"
                      )}>
                        {option.pointsCost} pts
                      </p>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground mt-1" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Convert Points CTA */}
        <button
          onClick={handleRedeemPoints}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          Shop with Points
        </button>
      </div>
    </div>
  );
};
