import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Coins, TrendingUp, Zap, 
  Info, ChevronRight, Activity, Target,
  CheckCircle2, Circle, MapPin, Clock, Flame
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
import { TOKENOMICS, formatPoints } from '@/utils/tokenomics';
import { APP_COPY } from '@/utils/appCopy';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { AppSEO } from '@/components/app/AppSEO';

interface EarningsData {
  date: string;
  points: number;
  label: string;
}

interface WeeklyChecklist {
  activeDays: number;
  speedTestsDone: number;
  areasMapped: number;
  streakDays: number;
  checkedInToday: boolean;
  pointsThisWeek: number;
}


export const AppRewards: React.FC = () => {
  const navigate = useNavigate();
  const { mediumTap, lightTap } = useHaptics();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  const [pendingPoints, setPendingPoints] = useState(0);
  const [earningsData, setEarningsData] = useState<EarningsData[]>([]);
  const [weeklyChecklist, setWeeklyChecklist] = useState<WeeklyChecklist>({
    activeDays: 0,
    speedTestsDone: 0,
    areasMapped: 0,
    streakDays: 0,
    checkedInToday: false,
    pointsThisWeek: 0
  });
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    loadRewardsData();
  }, [timeRange]);

  // Refetch when user returns to the app/tab (e.g. after claiming points externally)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadRewardsData();
      }
    };
    const handlePointsUpdated = () => {
      loadRewardsData();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);
    window.addEventListener('points-updated', handlePointsUpdated);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
      window.removeEventListener('points-updated', handlePointsUpdated);
    };
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

      // Load weekly checklist data
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const today = new Date().toISOString().split('T')[0];

      const [levelRes, speedTestRes, streakRes, checkinRes, weeklyPointsRes] = await Promise.all([
        supabase.from('user_contribution_levels').select('areas_mapped, active_days').eq('user_id', user.id).maybeSingle(),
        supabase.from('speed_test_results').select('id').eq('user_id', user.id).gte('recorded_at', weekAgo.toISOString()),
        supabase.from('user_points').select('background_streak_days, contribution_streak_days').eq('user_id', user.id).maybeSingle(),
        supabase.from('daily_checkins').select('id').eq('user_id', user.id).eq('check_in_date', today).maybeSingle(),
        supabase.from('user_daily_limits').select('points_earned').eq('user_id', user.id).gte('limit_date', weekAgo.toISOString().split('T')[0])
      ]);

      const recentSessions = (sessions || []).filter(
        s => new Date(s.started_at) >= weekAgo
      );
      const activeDaysThisWeek = new Set(
        recentSessions.map(s => new Date(s.started_at).toDateString())
      ).size;

      setWeeklyChecklist({
        activeDays: activeDaysThisWeek,
        speedTestsDone: speedTestRes.data?.length || 0,
        areasMapped: levelRes.data?.areas_mapped || 0,
        streakDays: Math.max(streakRes.data?.background_streak_days || 0, streakRes.data?.contribution_streak_days || 0),
        checkedInToday: !!checkinRes.data,
        pointsThisWeek: (weeklyPointsRes.data || []).reduce((sum: number, d: { points_earned: number | null }) => sum + (d.points_earned || 0), 0)
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


  const getFactorColor = (value: number) => {
    if (value >= 80) return 'text-green-600';
    if (value >= 50) return 'text-amber-600';
    return 'text-muted-foreground';
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AppSpinner size="lg" />
      </div>
    );
  }

  // Points-only display - no USD estimate until token launch

  const handleClaimPoints = () => {
    mediumTap();
    window.open('https://nomiqa-depin.com/english/account?tab=earnings', '_blank');
  };

  return (
    <>
      <AppSEO />
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

        {/* Claim Points CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-5 shadow-lg space-y-3"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-primary-foreground">Ready to Claim?</h2>
              <p className="text-sm text-primary-foreground/80 font-medium">Convert your points to $NOMIQA tokens</p>
            </div>
            <Button
              onClick={handleClaimPoints}
              className="bg-background text-primary hover:bg-background/90 font-bold px-5 shadow-md"
            >
              Claim Points
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* How to claim instructions */}
          <div className="bg-black/15 rounded-xl p-3 space-y-2">
            <p className="text-xs font-bold text-primary-foreground flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0" />
              How to claim your tokens
            </p>
            <ol className="text-xs text-primary-foreground/85 space-y-1.5 pl-5 list-decimal">
              <li>Tap <span className="font-semibold">"Claim Points"</span> — you'll be redirected to the Nomiqa website</li>
              <li>Go to your <span className="font-semibold">Account → Earnings</span> tab</li>
              <li>Enter your <span className="font-semibold">Solana wallet address</span> in Profile settings</li>
              <li>Submit your claim — tokens will be sent to your Solana address</li>
            </ol>
            <p className="text-[11px] text-primary-foreground/70 font-semibold mt-1">
              ⚠️ No Solana address = no tokens! Make sure it's saved in your profile before claiming.
            </p>
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
          
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Points convert to $NOMIQA tokens at launch
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

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={earningsData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
                  axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
                  tickLine={false}
                  dy={8}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  width={35}
                  tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(1)}k` : value.toString()}
                  domain={[0, 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'hsl(var(--foreground))',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                  formatter={(value: number) => [`${value.toLocaleString()} pts`, 'Earned']}
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                />
                <Bar 
                  dataKey="points" 
                  fill="hsl(var(--primary))" 
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
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

        {/* Weekly Boost Checklist — real data, actionable */}
        <div className="rounded-2xl bg-card/60 backdrop-blur-sm border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Weekly Boost Checklist</span>
            </div>
            <span className="text-xs font-mono text-primary">
              {weeklyChecklist.pointsThisWeek.toLocaleString()} pts this week
            </span>
          </div>

          <div className="space-y-2.5">
            {/* Active Days */}
            {(() => {
              const done = weeklyChecklist.activeDays >= 5;
              return (
                <button
                  onClick={() => { lightTap(); if (!done) navigate('/app/home'); }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-card/40 border border-border hover:border-primary/30 active:scale-[0.98] transition-all text-left"
                >
                  {done ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> : <Circle className="w-4 h-4 text-muted-foreground shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium", done ? "text-foreground" : "text-muted-foreground")}>
                      Contribute 5+ days
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {weeklyChecklist.activeDays}/7 days active · Builds streak multiplier
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-primary shrink-0">+2x</span>
                </button>
              );
            })()}

            {/* Speed Tests */}
            {(() => {
              const done = weeklyChecklist.speedTestsDone >= 3;
              return (
                <button
                  onClick={() => { lightTap(); toast({ title: '⚡ Speed Tests', description: 'Earn 25 pts on cellular or 10 pts on Wi-Fi per test (max 3/day). Run them from the home screen while contributing.' }); }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-card/40 border border-border hover:border-primary/30 active:scale-[0.98] transition-all text-left"
                >
                  {done ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> : <Circle className="w-4 h-4 text-muted-foreground shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium", done ? "text-foreground" : "text-muted-foreground")}>
                      Run speed tests
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {weeklyChecklist.speedTestsDone} done this week · Up to 75 pts/day
                    </p>
                  </div>
                  <Target className="w-4 h-4 text-primary shrink-0" />
                </button>
              );
            })()}

            {/* Daily Check-in */}
            {(() => {
              const done = weeklyChecklist.checkedInToday;
              return (
                <button
                  onClick={() => { lightTap(); if (!done) navigate('/app/home'); }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-card/40 border border-border hover:border-primary/30 active:scale-[0.98] transition-all text-left"
                >
                  {done ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> : <Circle className="w-4 h-4 text-muted-foreground shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium", done ? "text-foreground" : "text-muted-foreground")}>
                      {done ? "Checked in today ✓" : "Daily check-in"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {done ? "Come back tomorrow!" : "10-50 bonus pts · Streak bonuses"}
                    </p>
                  </div>
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                </button>
              );
            })()}

            {/* Explore new areas */}
            {(() => {
              const done = weeklyChecklist.areasMapped >= 3;
              return (
                <button
                  onClick={() => { lightTap(); toast({ title: '🗺️ Map New Areas', description: 'Move around to different locations while contributing. New areas = rare data = higher quality scores!' }); }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-card/40 border border-border hover:border-primary/30 active:scale-[0.98] transition-all text-left"
                >
                  {done ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> : <Circle className="w-4 h-4 text-muted-foreground shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium", done ? "text-foreground" : "text-muted-foreground")}>
                      Explore new areas
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {weeklyChecklist.areasMapped} areas mapped · Rare data earns more
                    </p>
                  </div>
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                </button>
              );
            })()}
          </div>

          {/* Streak summary */}
          {weeklyChecklist.streakDays > 0 && (
            <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{weeklyChecklist.streakDays}-day streak</span>
                {' '}· {weeklyChecklist.streakDays >= 30 ? '2x multiplier 🔥' : weeklyChecklist.streakDays >= 7 ? `${(1.1 + (0.9 * (weeklyChecklist.streakDays - 7) / 23)).toFixed(1)}x multiplier` : 'Keep going for bonus multiplier at 7 days'}
              </span>
            </div>
          )}
        </div>


        </div>
      </div>
    </>
  );
};
