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
  Clock,
  ChevronRight,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
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
 * App Wallet - Premium earnings dashboard with sophisticated UI
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
        const { data: pointsData } = await supabase
          .from('user_points')
          .select('*')
          .eq('user_id', currentUser.id)
          .single();
        setPoints(pointsData);

        const { data: affiliateData } = await supabase
          .from('affiliates')
          .select('*')
          .or(`user_id.eq.${currentUser.id},email.eq.${currentUser.email}`)
          .single();
        setAffiliate(affiliateData);

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
      toast({ title: 'Link copied!' });
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
    return num.toLocaleString();
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

  const getTierGradient = (level: number) => {
    switch (level) {
      case 1: return 'from-slate-400 to-slate-500';
      case 2: return 'from-blue-400 to-blue-500';
      case 3: return 'from-amber-400 to-amber-500';
      default: return 'from-slate-400 to-slate-500';
    }
  };

  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6">
          <WalletIcon className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Sign in to view wallet</h2>
        <p className="text-muted-foreground text-center mb-8 max-w-[280px]">
          Track your earnings, points, and referrals
        </p>
        <Button onClick={() => navigate('/auth')} className="shadow-lg shadow-primary/30">
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)',
            filter: 'blur(80px)'
          }}
        />
      </div>

      <div className="relative z-10 px-5 py-6 pb-28 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Wallet</h1>
            <p className="text-sm text-muted-foreground">Your earnings & rewards</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-11 h-11 rounded-full bg-white/[0.05] backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-white/[0.08] transition-all active:scale-95"
          >
            <LogOut className="w-5 h-5 text-muted-foreground" />
          </button>
        </header>

        {/* Points Hero Card */}
        <div className="relative rounded-[28px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/20 to-neon-cyan/10" />
          <div className="absolute inset-0 backdrop-blur-3xl" />
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-primary/50 to-transparent rounded-full blur-3xl" />
          
          <div className="relative p-6 border border-white/10 rounded-[28px]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/40">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <span className="text-sm text-foreground/80 font-semibold">Nomi Points</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Live balance</span>
                </div>
              </div>
            </div>
            
            <div className="text-5xl font-bold text-foreground mb-2 tracking-tighter">
              {loading ? '---' : formatNumber(points?.total_points || 0)}
            </div>
            
            <p className="text-sm text-muted-foreground">
              Contribute network data to earn more
            </p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground">Recent Activity</h2>
            </div>
            <button className="flex items-center gap-1 text-xs text-primary font-medium">
              <span>View all</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          
          {loading ? (
            <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-4 bg-white/10 rounded w-1/2" />
              </div>
            </div>
          ) : recentSessions.length === 0 ? (
            <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] border-dashed p-8 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-muted/20 to-muted/5 flex items-center justify-center">
                <MapPin className="w-7 h-7 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground mb-4">Start moving to see your earnings here</p>
              <Button 
                variant="outline" 
                className="bg-white/[0.03] border-white/10"
                onClick={() => navigate('/app/map')}
              >
                Go to Map
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentSessions.map((session) => (
                <div 
                  key={session.id} 
                  className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] hover:bg-white/[0.05] transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'w-11 h-11 rounded-xl flex items-center justify-center',
                      session.status === 'active' 
                        ? 'bg-gradient-to-br from-green-500/25 to-green-500/5' 
                        : 'bg-white/[0.05]'
                    )}>
                      <Zap className={cn(
                        'w-5 h-5',
                        session.status === 'active' ? 'text-green-400' : 'text-muted-foreground'
                      )} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          +{session.total_points_earned || 0} pts
                        </span>
                        {session.status === 'active' && (
                          <Badge className="bg-green-500/20 text-green-400 border-0 text-[10px] px-1.5">
                            Active
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(session.started_at), { addSuffix: true })}
                        <span>•</span>
                        <MapPin className="w-3 h-3" />
                        {formatDistance(session.total_distance_meters)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Affiliate Section */}
        {affiliate && (
          <div className="space-y-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Affiliate Earnings
            </h2>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-muted-foreground font-medium">Referrals</span>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {affiliate.total_registrations || 0}
                </div>
              </div>
              
              <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-muted-foreground font-medium">Earnings</span>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  ${(affiliate.total_earnings_usd || 0).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Tier Badge */}
            <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground">Sales Tier</span>
                <div className={cn(
                  'text-lg font-bold bg-gradient-to-r bg-clip-text text-transparent',
                  getTierGradient(affiliate.tier_level)
                )}>
                  {getTierName(affiliate.tier_level)}
                </div>
              </div>
              <Badge 
                variant="outline" 
                className={cn('border-0 bg-gradient-to-r text-white shadow-lg', getTierGradient(affiliate.tier_level))}
              >
                {affiliate.commission_rate}% Commission
              </Badge>
            </div>

            {/* Referral Link */}
            <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-4">
              <div className="text-xs text-muted-foreground mb-3 font-medium">Your Referral Link</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm text-foreground truncate bg-white/[0.03] border border-white/[0.08] px-4 py-3 rounded-xl font-mono">
                  nomiqa.com?ref={affiliate.affiliate_code}
                </code>
                <button 
                  onClick={handleCopyLink}
                  className="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center hover:bg-white/[0.08] transition-all active:scale-95"
                >
                  <Copy className="w-5 h-5 text-foreground" />
                </button>
                <button 
                  onClick={handleShare}
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30 active:scale-95 transition-all"
                >
                  <Share2 className="w-5 h-5 text-primary-foreground" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Affiliate CTA */}
        {!affiliate && !loading && (
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-neon-cyan/10" />
            <div className="absolute inset-0 backdrop-blur-xl" />
            <div className="relative p-6 border border-white/10 border-dashed rounded-2xl text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-2">Start Earning</h3>
              <p className="text-sm text-muted-foreground mb-5">
                Refer friends and earn up to 18% commission
              </p>
              <Button 
                onClick={() => navigate('/affiliate')}
                className="shadow-lg shadow-primary/30"
              >
                Join Program
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
