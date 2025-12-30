import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, 
  ShoppingBag, 
  Signal, 
  TrendingUp,
  ChevronRight,
  Sparkles,
  MapPin,
  Trophy,
  Flame
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHaptics } from '@/hooks/useHaptics';
import { supabase } from '@/integrations/supabase/client';
import nomiqaLogo from '@/assets/nomiqa-animated-logo.gif';

/**
 * App Home Dashboard - Native app home screen
 * Premium design with glassmorphism and engaging visuals
 */
export const AppHome: React.FC = () => {
  const navigate = useNavigate();
  const { mediumTap } = useHaptics();
  const [user, setUser] = useState<any>(null);
  const [points, setPoints] = useState<{
    total_points: number;
    pending_points: number;
    total_distance_meters: number;
    contribution_streak_days: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleNavigation = (path: string) => {
    mediumTap();
    navigate(path);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toFixed(0);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 px-4 py-6 pb-24 space-y-6">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-40 right-1/4 w-48 h-48 bg-neon-cyan/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header with Logo */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 backdrop-blur-xl border border-white/10 flex items-center justify-center overflow-hidden">
            <img src={nomiqaLogo} alt="Nomiqa" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">{greeting()}</p>
            <h1 className="text-xl font-bold text-foreground">
              {user?.user_metadata?.username || 'Explorer'}
            </h1>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 backdrop-blur-xl border border-white/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
      </div>

      {/* Hero Points Card */}
      <div 
        className="relative z-10 rounded-3xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
        onClick={() => handleNavigation('/app/map')}
      >
        {/* Glass background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/20 to-neon-cyan/10 backdrop-blur-xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/40 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-neon-cyan/30 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
        
        {/* Content */}
        <div className="relative p-6 border border-white/10 rounded-3xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/30">
                <Zap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-sm text-foreground/80 font-medium">Nomi Points</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-primary">
              <span>Tap to earn</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
          
          <div className="text-5xl font-bold text-foreground mb-2 tracking-tight">
            {loading ? (
              <div className="h-12 w-32 bg-white/10 rounded-lg animate-pulse" />
            ) : (
              formatNumber(points?.total_points || 0)
            )}
          </div>
          
          {points?.pending_points && points.pending_points > 0 && (
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">
              <Sparkles className="w-3 h-3" />
              +{formatNumber(points.pending_points)} pending
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="relative z-10 grid grid-cols-3 gap-3">
        {/* Distance */}
        <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-4 text-center">
          <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-lg font-bold text-foreground">
            {loading ? '--' : formatDistance(points?.total_distance_meters || 0)}
          </div>
          <div className="text-xs text-muted-foreground">Distance</div>
        </div>
        
        {/* Streak */}
        <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-4 text-center">
          <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 flex items-center justify-center">
            <Flame className="w-5 h-5 text-orange-400" />
          </div>
          <div className="text-lg font-bold text-foreground">
            {loading ? '--' : `${points?.contribution_streak_days || 0}`}
          </div>
          <div className="text-xs text-muted-foreground">Day Streak</div>
        </div>

        {/* Rank placeholder */}
        <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-4 text-center">
          <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-lg font-bold text-foreground">
            {loading ? '--' : '#--'}
          </div>
          <div className="text-xs text-muted-foreground">Rank</div>
        </div>
      </div>

      {/* Primary CTA */}
      <div className="relative z-10 space-y-3">
        <Button 
          onClick={() => handleNavigation('/app/map')}
          className="w-full h-16 rounded-2xl bg-gradient-to-r from-primary via-primary to-primary/80 hover:opacity-90 text-primary-foreground shadow-xl shadow-primary/30 border-0 group"
        >
          <div className="flex items-center justify-between w-full px-2">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Signal className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="font-bold text-lg">Start Contributing</div>
                <div className="text-sm opacity-80">Earn points while you move</div>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 opacity-60 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
          </div>
        </Button>

        {/* Secondary CTA */}
        <Button 
          onClick={() => handleNavigation('/app/shop')}
          variant="outline"
          className="w-full h-14 rounded-2xl bg-white/[0.03] backdrop-blur-xl border-white/10 hover:bg-white/[0.06] hover:border-white/20 group"
        >
          <div className="flex items-center justify-between w-full px-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-cyan/20 to-neon-cyan/5 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-neon-cyan" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-foreground">Buy eSIM</div>
                <div className="text-xs text-muted-foreground">190+ countries covered</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </div>
        </Button>
      </div>

      {/* Quick Info Cards */}
      <div className="relative z-10 space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">How it works</h2>
        
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold">
              1
            </div>
            <div>
              <div className="font-medium text-foreground">Move with cellular data</div>
              <div className="text-sm text-muted-foreground">Contribute to the network</div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold">
              2
            </div>
            <div>
              <div className="font-medium text-foreground">Earn Nomi Points</div>
              <div className="text-sm text-muted-foreground">More distance = more rewards</div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold">
              3
            </div>
            <div>
              <div className="font-medium text-foreground">Convert to $NOMIQA</div>
              <div className="text-sm text-muted-foreground">Redeem when token launches</div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth CTA for non-logged in users */}
      {!loading && !user && (
        <div className="relative z-10 rounded-2xl bg-gradient-to-r from-primary/10 to-neon-cyan/10 backdrop-blur-xl border border-white/10 p-6 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">Join the Network</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Sign in to start earning Nomi Points and build the future of connectivity
          </p>
          <Button 
            onClick={() => handleNavigation('/auth')}
            className="bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
          >
            Sign In to Earn
          </Button>
        </div>
      )}
    </div>
  );
};
