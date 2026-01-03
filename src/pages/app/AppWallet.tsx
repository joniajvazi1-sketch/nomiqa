import React, { useEffect, useState, useMemo } from 'react';
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
  Clock,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Gift,
  ShoppingBag,
  Coins,
  CreditCard,
  Star
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

type TransactionFilter = 'all' | 'earned' | 'spent' | 'bonus';

// Mock transaction data for premium UI (combines real sessions with sample data)
interface Transaction {
  id: string;
  type: 'earned' | 'spent' | 'bonus' | 'referral';
  amount: number;
  description: string;
  timestamp: Date;
  icon: 'zap' | 'shopping' | 'gift' | 'users';
}

const POINTS_TO_USD = 0.001; // 1000 points = $1

/**
 * App Wallet - Premium earnings dashboard with animated cards and filters
 */
export const AppWallet: React.FC = () => {
  const navigate = useNavigate();
  const { lightTap, success, mediumTap } = useHaptics();
  const { share, copyToClipboard } = useNativeShare();
  const { toast } = useToast();
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<any>(null);
  const [affiliate, setAffiliate] = useState<any>(null);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [activeFilter, setActiveFilter] = useState<TransactionFilter>('all');
  const [showBalanceDetails, setShowBalanceDetails] = useState(false);

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
          .limit(10);
        setRecentSessions(sessionsData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Convert sessions to transactions and add mock data for UI demo
  const transactions = useMemo<Transaction[]>(() => {
    const txs: Transaction[] = recentSessions.map(session => ({
      id: session.id,
      type: 'earned' as const,
      amount: session.total_points_earned || 0,
      description: `Network scan • ${formatDistance(session.total_distance_meters)}`,
      timestamp: new Date(session.started_at),
      icon: 'zap' as const
    }));

    // Add sample transactions for demo (only if we have few real ones)
    if (txs.length < 3) {
      txs.push(
        { id: 'demo-1', type: 'bonus', amount: 500, description: 'Welcome bonus', timestamp: new Date(Date.now() - 86400000 * 2), icon: 'gift' },
        { id: 'demo-2', type: 'referral', amount: 150, description: 'Friend joined', timestamp: new Date(Date.now() - 86400000 * 5), icon: 'users' }
      );
    }

    return txs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [recentSessions]);

  const filteredTransactions = useMemo(() => {
    if (activeFilter === 'all') return transactions;
    if (activeFilter === 'earned') return transactions.filter(t => t.type === 'earned');
    if (activeFilter === 'spent') return transactions.filter(t => t.type === 'spent');
    if (activeFilter === 'bonus') return transactions.filter(t => t.type === 'bonus' || t.type === 'referral');
    return transactions;
  }, [transactions, activeFilter]);

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

  const handleQuickAction = (action: string) => {
    mediumTap();
    if (action === 'earn') navigate('/app/map');
    else if (action === 'shop') navigate('/app/shop');
    else if (action === 'invite') handleShare();
    else if (action === 'redeem') {
      toast({ title: 'Coming Soon', description: 'Redemption will be available soon!' });
    }
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

  const getTransactionIcon = (icon: string) => {
    switch (icon) {
      case 'zap': return <Zap className="w-4 h-4" />;
      case 'shopping': return <ShoppingBag className="w-4 h-4" />;
      case 'gift': return <Gift className="w-4 h-4" />;
      case 'users': return <Users className="w-4 h-4" />;
      default: return <Coins className="w-4 h-4" />;
    }
  };

  const totalPoints = points?.total_points || 0;
  const estimatedUSD = (totalPoints * POINTS_TO_USD).toFixed(2);

  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 animate-float">
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
          className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-20 animate-pulse-slow"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)',
            filter: 'blur(80px)'
          }}
        />
        <div 
          className="absolute bottom-20 -left-20 w-[300px] h-[300px] rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, hsl(var(--neon-cyan)) 0%, transparent 70%)',
            filter: 'blur(60px)'
          }}
        />
      </div>

      <div className="relative z-10 px-5 py-6 pb-28 space-y-5">
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

        {/* Animated Balance Card */}
        <div 
          className="relative rounded-[28px] overflow-hidden cursor-pointer group"
          onClick={() => { lightTap(); setShowBalanceDetails(!showBalanceDetails); }}
        >
          {/* Animated gradient border */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-primary via-neon-cyan to-primary rounded-[29px] opacity-50 group-hover:opacity-70 transition-opacity animate-gradient-x" />
          
          <div className="relative bg-background/95 backdrop-blur-xl m-[1px] rounded-[27px] overflow-hidden">
            {/* Inner glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-neon-cyan/10" />
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-primary/40 to-transparent rounded-full blur-3xl animate-pulse-slow" />
            
            <div className="relative p-6">
              {/* Top row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/40 animate-float">
                    <Zap className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <span className="text-sm text-foreground/80 font-semibold">Total Balance</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Live</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform",
                  showBalanceDetails && "rotate-90"
                )} />
              </div>
              
              {/* Balance display */}
              <div className="mb-1">
                <span 
                  className="text-5xl font-bold text-foreground tracking-tighter animate-count-up"
                  style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' }}
                >
                  {loading ? '---' : formatNumber(totalPoints)}
                </span>
                <span className="text-xl text-muted-foreground ml-2">pts</span>
              </div>
              
              {/* USD estimate */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>≈ ${estimatedUSD} USD</span>
                <TrendingUp className="w-3.5 h-3.5 text-green-400" />
              </div>

              {/* Expandable details */}
              <div className={cn(
                "grid grid-cols-3 gap-3 transition-all overflow-hidden",
                showBalanceDetails ? "mt-5 max-h-24 opacity-100" : "max-h-0 opacity-0"
              )}>
                <div className="bg-white/[0.05] rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-foreground">{points?.contribution_streak_days || 0}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Day Streak</div>
                </div>
                <div className="bg-white/[0.05] rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-foreground">{formatDistance(points?.total_distance_meters)}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Total Dist</div>
                </div>
                <div className="bg-white/[0.05] rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-foreground">{affiliate?.total_registrations || 0}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Referrals</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { id: 'earn', icon: MapPin, label: 'Scan', gradient: 'from-green-500 to-emerald-600' },
            { id: 'shop', icon: ShoppingBag, label: 'Shop', gradient: 'from-blue-500 to-indigo-600' },
            { id: 'invite', icon: Users, label: 'Invite', gradient: 'from-purple-500 to-violet-600' },
            { id: 'redeem', icon: Gift, label: 'Redeem', gradient: 'from-amber-500 to-orange-600' },
          ].map((action) => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action.id)}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] hover:bg-white/[0.06] transition-all active:scale-95"
            >
              <div className={cn(
                "w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg",
                action.gradient
              )}>
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-medium text-foreground">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Transaction List with Filters */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground">Transactions</h2>
            </div>
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {(['all', 'earned', 'spent', 'bonus'] as TransactionFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => { lightTap(); setActiveFilter(filter); }}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                  activeFilter === filter
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : "bg-white/[0.05] text-muted-foreground border border-white/10 hover:bg-white/[0.08]"
                )}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          {/* Transaction list */}
          {loading ? (
            <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-6">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-white/10" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-white/10 rounded w-3/4" />
                      <div className="h-3 bg-white/10 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] border-dashed p-8 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-muted/20 to-muted/5 flex items-center justify-center">
                <Filter className="w-7 h-7 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground">No transactions found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTransactions.map((tx, index) => (
                <div 
                  key={tx.id} 
                  className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] hover:bg-white/[0.05] transition-all animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'w-11 h-11 rounded-xl flex items-center justify-center',
                      tx.type === 'earned' || tx.type === 'bonus' || tx.type === 'referral'
                        ? 'bg-gradient-to-br from-green-500/25 to-green-500/5 text-green-400' 
                        : 'bg-gradient-to-br from-red-500/25 to-red-500/5 text-red-400'
                    )}>
                      {getTransactionIcon(tx.icon)}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-sm">
                        {tx.description}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(tx.timestamp, { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 font-bold",
                    tx.type === 'spent' ? 'text-red-400' : 'text-green-400'
                  )}>
                    {tx.type === 'spent' ? (
                      <ArrowDownRight className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                    <span>{tx.type === 'spent' ? '-' : '+'}{tx.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Affiliate Mini Card */}
        {affiliate && (
          <div 
            className="rounded-2xl bg-gradient-to-br from-primary/10 via-background to-neon-cyan/5 border border-white/10 p-4 cursor-pointer hover:border-primary/30 transition-all active:scale-[0.98]"
            onClick={() => { lightTap(); navigate('/affiliate'); }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center",
                  getTierGradient(affiliate.tier_level)
                )}>
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-foreground text-sm">
                    {getTierName(affiliate.tier_level)} Affiliate
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ${(affiliate.total_earnings_usd || 0).toFixed(2)} earned
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleCopyLink(); }}
                  className="w-9 h-9 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center hover:bg-white/[0.08] transition-all active:scale-95"
                >
                  <Copy className="w-4 h-4 text-foreground" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleShare(); }}
                  className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30 active:scale-95 transition-all"
                >
                  <Share2 className="w-4 h-4 text-primary-foreground" />
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
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center animate-float">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-2">Start Earning More</h3>
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

      {/* CSS Animations */}
      <style>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.35; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes count-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-count-up {
          animation: count-up 0.5s ease-out forwards;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
