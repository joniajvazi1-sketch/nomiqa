import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, 
  ShoppingBag, 
  Signal, 
  TrendingUp,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useHaptics } from '@/hooks/useHaptics';
import { supabase } from '@/integrations/supabase/client';

/**
 * App Home Dashboard - Native app home screen
 * Shows Nomi Points, quick stats, and action buttons
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

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back{user?.user_metadata?.username ? `, ${user.user_metadata.username}` : ''}
          </h1>
          <p className="text-muted-foreground text-sm">Ready to contribute?</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
      </div>

      {/* Nomi Points Card - Main Focus */}
      <Card className="bg-gradient-to-br from-primary/20 via-primary/10 to-background border-primary/30 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <CardContent className="p-6 relative">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground font-medium">Nomi Points</span>
          </div>
          <div className="text-4xl font-bold text-foreground mb-1">
            {loading ? '---' : formatNumber(points?.total_points || 0)}
          </div>
          {points?.pending_points && points.pending_points > 0 && (
            <div className="text-sm text-primary">
              +{formatNumber(points.pending_points)} pending
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Signal className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Distance</span>
            </div>
            <div className="text-lg font-semibold text-foreground">
              {loading ? '--' : formatDistance(points?.total_distance_meters || 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">Streak</span>
            </div>
            <div className="text-lg font-semibold text-foreground">
              {loading ? '--' : `${points?.contribution_streak_days || 0} days`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
        
        <Button 
          onClick={() => handleNavigation('/app/map')}
          className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="font-semibold">Start Contributing</div>
              <div className="text-xs opacity-80">Earn Nomi Points now</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Button>

        <Button 
          onClick={() => handleNavigation('/app/shop')}
          variant="outline"
          className="w-full h-14 justify-between group border-border/50"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-foreground">Buy eSIM</div>
              <div className="text-xs text-muted-foreground">Travel data plans</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>

      {/* Auth CTA for non-logged in users */}
      {!loading && !user && (
        <Card className="bg-muted/50 border-dashed border-2 border-border">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Sign in to start earning Nomi Points
            </p>
            <Button 
              onClick={() => handleNavigation('/auth')}
              variant="outline"
              size="sm"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
