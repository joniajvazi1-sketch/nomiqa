import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Zap, 
  Wifi, 
  Signal,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { AnimatedCounter } from '@/components/app/AnimatedCounter';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

interface ContributionSession {
  id: string;
  started_at: string;
  ended_at: string | null;
  total_distance_meters: number | null;
  total_points_earned: number | null;
  data_points_count: number | null;
  average_signal_strength: number | null;
  status: string | null;
}

interface SignalLog {
  id: string;
  recorded_at: string;
  rsrp: number | null;
  rssi: number | null;
  network_type: string | null;
  speed_test_down: number | null;
  speed_test_up: number | null;
  latency_ms: number | null;
}

interface DailyPoints {
  date: string;
  points: number;
}

interface SignalTrend {
  date: string;
  strength: number;
}

interface SpeedTestData {
  date: string;
  download: number;
  upload: number;
}

export const AnalyticsDashboard: React.FC = () => {
  const [sessions, setSessions] = useState<ContributionSession[]>([]);
  const [dailyPoints, setDailyPoints] = useState<DailyPoints[]>([]);
  const [signalTrend, setSignalTrend] = useState<SignalTrend[]>([]);
  const [speedTests, setSpeedTests] = useState<SpeedTestData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load contribution sessions
      const { data: sessionsData } = await supabase
        .from('contribution_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(20);
      
      setSessions(sessionsData || []);

      // Load signal logs for trends (last 30 days)
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const { data: signalData } = await supabase
        .from('signal_logs')
        .select('id, recorded_at, rsrp, rssi, network_type, speed_test_down, speed_test_up, latency_ms')
        .eq('user_id', user.id)
        .gte('recorded_at', thirtyDaysAgo)
        .order('recorded_at', { ascending: true });

      // Process data for charts
      if (signalData && signalData.length > 0) {
        // Group by date for daily points
        const pointsByDay: { [key: string]: number } = {};
        const signalByDay: { [key: string]: number[] } = {};
        const speedByDay: { [key: string]: { down: number[], up: number[] } } = {};

        signalData.forEach((log: SignalLog) => {
          const day = format(new Date(log.recorded_at), 'MMM dd');
          
          // Points (count of logs)
          pointsByDay[day] = (pointsByDay[day] || 0) + 1;
          
          // Signal strength
          const signalVal = log.rsrp || log.rssi;
          if (signalVal) {
            if (!signalByDay[day]) signalByDay[day] = [];
            signalByDay[day].push(Math.abs(signalVal));
          }
          
          // Speed tests
          if (log.speed_test_down || log.speed_test_up) {
            if (!speedByDay[day]) speedByDay[day] = { down: [], up: [] };
            if (log.speed_test_down) speedByDay[day].down.push(log.speed_test_down);
            if (log.speed_test_up) speedByDay[day].up.push(log.speed_test_up);
          }
        });

        // Format for charts
        setDailyPoints(Object.entries(pointsByDay).map(([date, points]) => ({ date, points })));
        setSignalTrend(Object.entries(signalByDay).map(([date, values]) => ({
          date,
          strength: Math.round(values.reduce((a, b) => a + b, 0) / values.length)
        })));
        setSpeedTests(Object.entries(speedByDay).map(([date, values]) => ({
          date,
          download: values.down.length ? Math.round(values.down.reduce((a, b) => a + b, 0) / values.down.length) : 0,
          upload: values.up.length ? Math.round(values.up.reduce((a, b) => a + b, 0) / values.up.length) : 0
        })));
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (startedAt: string, endedAt: string | null): string => {
    if (!endedAt) return 'In progress';
    const start = new Date(startedAt).getTime();
    const end = new Date(endedAt).getTime();
    const durationMs = end - start;
    const minutes = Math.floor(durationMs / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const formatDistance = (meters: number | null): string => {
    if (!meters) return '0m';
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)}km`;
    return `${Math.round(meters)}m`;
  };

  const getNetworkTypeIcon = (networkType: string | null) => {
    if (!networkType) return Wifi;
    if (networkType.includes('5G')) return Signal;
    return Wifi;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="bg-card/50 border-border/50 animate-pulse">
            <CardContent className="p-4 h-32" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <Activity className="w-5 h-5 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold text-foreground">
              <AnimatedCounter value={sessions.length} />
            </p>
            <p className="text-xs text-muted-foreground">Total Sessions</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 text-center">
            <MapPin className="w-5 h-5 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold text-foreground">
              <AnimatedCounter 
                value={sessions.reduce((sum, s) => sum + (s.data_points_count || 0), 0)} 
              />
            </p>
            <p className="text-xs text-muted-foreground">Data Points</p>
          </CardContent>
        </Card>
      </div>

      {/* Points Over Last 30 Days Chart */}
      {dailyPoints.length > 0 && (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Points (30 Days)</h3>
              <Badge variant="outline" className="text-xs">
                <TrendingUp className="w-3 h-3 mr-1" />
                Activity
              </Badge>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyPoints.slice(-14)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    width={30}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="points" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Signal Strength Trend */}
      {signalTrend.length > 0 && (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Signal Strength Trend</h3>
              <Badge variant="outline" className="text-xs text-green-500 border-green-500/30">
                <Signal className="w-3 h-3 mr-1" />
                dBm
              </Badge>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={signalTrend.slice(-14)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    width={30}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`-${value} dBm`, 'Signal']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="strength" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Speed Test History */}
      {speedTests.length > 0 && (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Speed Test History</h3>
              <Badge variant="outline" className="text-xs text-neon-cyan border-neon-cyan/30">
                <Zap className="w-3 h-3 mr-1" />
                Mbps
              </Badge>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={speedTests.slice(-14)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    width={30}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="download" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    dot={{ fill: '#22c55e', strokeWidth: 0, r: 3 }}
                    name="Download"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="upload" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 0, r: 3 }}
                    name="Upload"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-2 text-xs">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Download
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                Upload
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session History */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Session History</h3>
        {sessions.length === 0 ? (
          <Card className="bg-card/50 border-border/50 border-dashed">
            <CardContent className="p-6 text-center">
              <Activity className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground text-sm">No sessions yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Start contributing to see your history
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {sessions.map((session, index) => (
              <Card 
                key={session.id} 
                className="bg-card/50 border-border/50 animate-stagger-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        {format(new Date(session.started_at), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        'text-xs',
                        session.status === 'active' 
                          ? 'text-green-500 border-green-500/30' 
                          : 'text-muted-foreground border-border'
                      )}
                    >
                      {session.status === 'active' ? 'Active' : 'Completed'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatDuration(session.started_at, session.ended_at)}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {formatDistance(session.total_distance_meters)}
                    </div>
                    <div className="flex items-center gap-1 text-primary">
                      <Zap className="w-3 h-3" />
                      +{session.total_points_earned || 0}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Signal className="w-3 h-3" />
                      {session.data_points_count || 0}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
