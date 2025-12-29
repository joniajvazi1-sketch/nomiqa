import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet as WalletIcon, 
  Zap, 
  Users, 
  TrendingUp,
  Copy,
  Share2,
  LogOut,
  MapPin,
  Activity,
  Clock
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useHaptics } from '@/hooks/useHaptics';
import { useNativeShare } from '@/hooks/useNativeShare';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface RecentSession {
  id: string;
  started_at: string;
  ended_at: string | null;
  total_points_earned: number | null;
  total_distance_meters: number | null;
  status: string | null;
}

/**
 * App Wallet - Earnings, Points, Affiliate management & Recent Activity
 */
export const AppWallet: React.FC = () => {
  const navigate = useNavigate();
  const { lightTap, success } = useHaptics();
  const { share, copyToClipboard } = useNativeShare();
  const { toast } = useToast();
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<any>(null);
  const [affiliate, setAffiliate] = useState<any>(null);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        // Load points
        const { data: pointsData } = await supabase
          .from('user_points')
          .select('*')
          .eq('user_id', currentUser.id)
          .single();
        setPoints(pointsData);

        // Load affiliate
        const { data: affiliateData } = await supabase
          .from('affiliates')
          .select('*')
          .or(`user_id.eq.${currentUser.id},email.eq.${currentUser.email}`)
          .single();
        setAffiliate(affiliateData);

        // Load recent contribution sessions
        const { data: sessionsData } = await supabase
          .from('contribution_sessions')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('started_at', { ascending: false })
          .limit(5);
        setRecentSessions(sessionsData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!affiliate) return;
    lightTap();
    const link = `https://nomiqa.com?ref=${affiliate.affiliate_code}`;
    const copied = await copyToClipboard(link);
    if (copied) {
      success();
      toast({ title: 'Link copied!', description: 'Share it with friends' });
    }
  };

  const handleShare = async () => {
    if (!affiliate) return;
    lightTap();
    const link = `https://nomiqa.com?ref=${affiliate.affiliate_code}`;
    await share({
      title: 'Join Nomiqa',
      text: 'Get travel eSIMs and earn rewards!',
      url: link
    });
  };

  const handleLogout = async () => {
    lightTap();
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toFixed(0);
  };

  const formatDistance = (meters: number | null) => {
    if (!meters) return '0m';
    if (meters >= 1000) return (meters / 1000).toFixed(1) + 'km';
    return meters.toFixed(0) + 'm';
  };

  const getTierName = (level: number) => {
    switch (level) {
      case 1: return 'Starter';
      case 2: return 'Pro';
      case 3: return 'Elite';
      default: return 'Starter';
    }
  };

  const getTierColor = (level: number) => {
    switch (level) {
      case 1: return 'text-gray-400';
      case 2: return 'text-blue-400';
      case 3: return 'text-amber-400';
      default: return 'text-gray-400';
    }
  };

  if (!user && !loading) {
    return (
      <div className="px-4 py-6 flex flex-col items-center justify-center min-h-[60vh]">
        <WalletIcon className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Sign in to view wallet</h2>
        <p className="text-muted-foreground text-center mb-6">
          Track your earnings, points, and referrals
        </p>
        <Button onClick={() => navigate('/auth')}>
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Wallet</h1>
          <p className="text-sm text-muted-foreground">Your earnings & rewards</p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="w-5 h-5" />
        </Button>
      </div>

      {/* Nomi Points Card */}
      <Card className="bg-gradient-to-br from-primary/20 via-primary/10 to-background border-primary/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground font-medium">Nomi Points</span>
          </div>
          <div className="text-4xl font-bold text-foreground mb-1">
            {loading ? '---' : formatNumber(points?.total_points || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Contribute network data to earn more
          </p>
        </CardContent>
      </Card>

      {/* Recent Activity Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground">Recent Activity</h2>
        </div>
        
        {loading ? (
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ) : recentSessions.length === 0 ? (
          <Card className="bg-card/50 border-border/50 border-dashed">
            <CardContent className="p-6 text-center">
              <MapPin className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground text-sm">
                Start moving to see your earnings here.
              </p>
              <Button 
                variant="link" 
                className="mt-2 text-primary"
                onClick={() => navigate('/app/map')}
              >
                Go to Map →
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentSessions.map((session) => (
              <Card key={session.id} className="bg-card/50 border-border/50">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center',
                        session.status === 'active' 
                          ? 'bg-green-500/20 text-green-500' 
                          : 'bg-muted text-muted-foreground'
                      )}>
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground text-sm">
                            +{session.total_points_earned || 0} pts
                          </span>
                          {session.status === 'active' && (
                            <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-500">
                              Active
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(session.started_at), { addSuffix: true })}
                          <span>•</span>
                          <MapPin className="w-3 h-3" />
                          {formatDistance(session.total_distance_meters)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Affiliate Section */}
      {affiliate && (
        <>
          {/* Affiliate Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-xs text-muted-foreground">Referrals</span>
                </div>
                <div className="text-xl font-semibold text-foreground">
                  {affiliate.total_registrations || 0}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-muted-foreground">Earnings</span>
                </div>
                <div className="text-xl font-semibold text-foreground">
                  ${(affiliate.total_earnings_usd || 0).toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tier Badge */}
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground">Sales Tier</span>
                <div className={cn('font-semibold', getTierColor(affiliate.tier_level))}>
                  {getTierName(affiliate.tier_level)}
                </div>
              </div>
              <Badge variant="outline" className={getTierColor(affiliate.tier_level)}>
                {affiliate.commission_rate}% Commission
              </Badge>
            </CardContent>
          </Card>

          {/* Referral Link */}
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-2">Your Referral Link</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm text-foreground truncate bg-muted/50 px-3 py-2 rounded">
                  nomiqa.com?ref={affiliate.affiliate_code}
                </code>
                <Button size="icon" variant="outline" onClick={handleCopyLink}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="outline" onClick={handleShare}>
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Create Affiliate CTA */}
      {!affiliate && !loading && (
        <Card className="bg-muted/50 border-dashed border-2 border-border">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <h3 className="font-semibold text-foreground mb-1">Start Earning</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Refer friends and earn up to 18% commission
            </p>
            <Button onClick={() => navigate('/affiliate')}>
              Join Program
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
