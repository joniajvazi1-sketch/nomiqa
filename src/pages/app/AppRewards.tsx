import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Coins, TrendingUp, Clock, Zap, Gift, ExternalLink, 
  Info, ChevronRight, Wifi, Activity, Target, ShoppingBag,
  Heart, CreditCard, Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useHaptics } from '@/hooks/useHaptics';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { AppSpinner } from '@/components/app/AppSpinner';
import { TokenInfoModal } from '@/components/app/TokenInfoModal';
import { TOKENOMICS, pointsToUsd, formatTokens } from '@/utils/tokenomics';
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
  const [showTokenInfo, setShowTokenInfo] = useState(false);

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

      // Aggregate by day/week
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

      // Calculate uptime (sessions in last 7 days / 7)
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
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        map.set(key, 0);
      }
    } else if (range === 'weekly') {
      // Last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i * 7);
        const weekNum = getWeekNumber(d);
        map.set(`W${weekNum}`, 0);
      }
    } else {
      // Last 3 months
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

  const handleConvertToTokens = () => {
    mediumTap();
    toast({
      title: 'Token conversion coming soon!',
      description: 'Points will be convertible to tokens when we launch.',
    });
  };

  const redemptionOptions: RedemptionOption[] = [
    {
      id: 'tokens',
      icon: Coins,
      title: 'Convert to Tokens',
      description: 'Exchange points for crypto tokens',
      pointsCost: null,
      available: false,
      badge: 'Coming Soon'
    },
    {
      id: 'data',
      icon: Wifi,
      title: 'Mobile Data Pack',
      description: '1GB eSIM data',
      pointsCost: 500,
      available: true
    },
    {
      id: 'gift',
      icon: CreditCard,
      title: 'Gift Cards',
      description: 'Amazon, Apple, Google Play',
      pointsCost: 1000,
      available: false,
      badge: 'Coming Soon'
    },
    {
      id: 'charity',
      icon: Heart,
      title: 'Donate to Connectivity',
      description: 'Fund rural network access',
      pointsCost: 100,
      available: false,
      badge: 'Coming Soon'
    }
  ];

  const getFactorColor = (value: number) => {
    if (value >= 80) return 'text-green-500';
    if (value >= 50) return 'text-amber-500';
    return 'text-muted-foreground';
  };

  const getFactorBg = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 50) return 'bg-amber-500';
    return 'bg-muted-foreground';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <AppSpinner size="lg" />
      </div>
    );
  }

  const totalUsd = pointsToUsd(totalPoints);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Rewards</h1>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => { lightTap(); setShowTokenInfo(true); }}
            className="text-muted-foreground"
          >
            <Info className="w-4 h-4 mr-1" />
            About Points
          </Button>
        </div>

        {/* Points Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-br from-primary/20 via-card to-card border border-primary/20 p-5"
        >
          <div className="flex items-center gap-2 mb-1">
            <Coins className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Total Points</span>
            <Badge variant="outline" className="ml-auto text-xs border-amber-500/30 text-amber-500">
              Beta
            </Badge>
          </div>
          
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-4xl font-bold text-foreground">
              {totalPoints.toLocaleString()}
            </span>
            <span className="text-lg text-muted-foreground">
              ≈ ${totalUsd.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">1 pt = 1 token</span>
            </div>
            {pendingPoints > 0 && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-amber-500">{pendingPoints} pending</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Earnings Chart */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Earnings History</span>
              </div>
              <Tabs value={timeRange} onValueChange={(v) => { lightTap(); setTimeRange(v as any); }}>
                <TabsList className="h-8 p-0.5 bg-muted">
                  <TabsTrigger value="daily" className="h-7 text-xs px-3">Daily</TabsTrigger>
                  <TabsTrigger value="weekly" className="h-7 text-xs px-3">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly" className="h-7 text-xs px-3">Monthly</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={earningsData}>
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
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
          </CardContent>
        </Card>

        {/* Earning Factors */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Earning Factors</span>
            </div>

            <div className="space-y-4">
              {/* Uptime */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-foreground">Uptime</span>
                  <span className={cn("text-sm font-semibold", getFactorColor(earningFactors.uptime))}>
                    {earningFactors.uptime}%
                  </span>
                </div>
                <Progress value={earningFactors.uptime} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {earningFactors.uptime < 50 
                    ? APP_COPY.rewards.uptimeTip 
                    : 'Great uptime! Keep it going.'}
                </p>
              </div>

              {/* Coverage Quality */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-foreground">Coverage Quality</span>
                  <span className={cn("text-sm font-semibold", getFactorColor(earningFactors.coverageQuality))}>
                    {earningFactors.coverageQuality}%
                  </span>
                </div>
                <Progress value={earningFactors.coverageQuality} className="h-2" />
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <Target className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{earningFactors.speedTests}</p>
                  <p className="text-xs text-muted-foreground">Speed Tests</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <Zap className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{earningFactors.areasExplored}</p>
                  <p className="text-xs text-muted-foreground">Areas Mapped</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Redemption Options */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Gift className="w-4 h-4 text-primary" />
            Spend Your Points
          </h2>

          <div className="space-y-2">
            {redemptionOptions.map((option) => {
              const Icon = option.icon;
              const canRedeem = option.available && option.pointsCost && totalPoints >= option.pointsCost;

              return (
                <motion.button
                  key={option.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    mediumTap();
                    if (option.id === 'tokens') {
                      handleConvertToTokens();
                    } else if (option.id === 'data' && canRedeem) {
                      navigate('/app/shop');
                    } else if (!option.available) {
                      toast({ title: 'Coming soon!', description: 'This option will be available soon.' });
                    }
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 rounded-xl border transition-colors",
                    option.available 
                      ? "bg-card border-border hover:border-primary/30" 
                      : "bg-muted/30 border-border/50"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    option.available ? "bg-primary/10" : "bg-muted"
                  )}>
                    <Icon className={cn(
                      "w-5 h-5",
                      option.available ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>

                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-medium",
                        option.available ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {option.title}
                      </span>
                      {option.badge && (
                        <Badge variant="outline" className="text-[10px] py-0 h-4">
                          {option.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>

                  {option.pointsCost && (
                    <div className="text-right">
                      <p className={cn(
                        "text-sm font-semibold",
                        canRedeem ? "text-primary" : "text-muted-foreground"
                      )}>
                        {option.pointsCost.toLocaleString()} pts
                      </p>
                    </div>
                  )}

                  <ChevronRight className={cn(
                    "w-4 h-4",
                    option.available ? "text-muted-foreground" : "text-muted-foreground/50"
                  )} />
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Token Conversion CTA */}
        <Card className="bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <ExternalLink className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">Token Conversion Portal</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {APP_COPY.rewards.conversionInfo}
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleConvertToTokens}
                  className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                >
                  Learn More
                  <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Note */}
        <p className="text-xs text-center text-muted-foreground px-4">
          {APP_COPY.rewards.privacyNote}
        </p>
      </div>

      <TokenInfoModal isOpen={showTokenInfo} onClose={() => setShowTokenInfo(false)} />
    </div>
  );
};

export default AppRewards;