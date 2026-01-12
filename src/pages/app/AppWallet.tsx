import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
  ArrowUpRight,
  ArrowDownRight,
  Gift,
  ShoppingBag,
  Coins,
  Star,
  Trophy,
  Flame
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEnhancedHaptics } from '@/hooks/useEnhancedHaptics';
import { useEnhancedSounds } from '@/hooks/useEnhancedSounds';
import { useTranslation } from '@/contexts/TranslationContext';
import { useNativeShare } from '@/hooks/useNativeShare';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/utils/timeFormatters';
import { useAchievements } from '@/hooks/useAchievements';
import { AchievementBadge, MilestonePopup } from '@/components/app/AchievementSystem';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/app/PullToRefreshIndicator';
import { AppSpinner } from '@/components/app/AppSpinner';
import { EmptyState } from '@/components/app/EmptyState';
import { LevelUpCelebration, useLevelUpCelebration } from '@/components/app/LevelUpCelebration';

interface RecentSession {
  id: string;
  started_at: string;
  ended_at: string | null;
  total_points_earned: number | null;
  total_distance_meters: number | null;
  status: string | null;
}

type TransactionFilter = 'all' | 'earned' | 'bonus';

interface Transaction {
  id: string;
  type: 'earned' | 'spent' | 'bonus' | 'referral';
  amount: number;
  description: string;
  timestamp: Date;
  icon: 'zap' | 'shopping' | 'gift' | 'users';
}

const POINTS_TO_USD = 0.001;

export const AppWallet: React.FC = () => {
  const navigate = useNavigate();
  const { buttonTap, successPattern, navigationTap, selectionTap } = useEnhancedHaptics();
  const { playCoin, playPop, playSuccess, playSwoosh } = useEnhancedSounds();
  const { share, copyToClipboard } = useNativeShare();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<any>(null);
  const [affiliate, setAffiliate] = useState<any>(null);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [activeFilter, setActiveFilter] = useState<TransactionFilter>('all');
  const [showBalanceDetails, setShowBalanceDetails] = useState(false);
  
  const { isOpen: showLevelUp, previousTier, newTier, triggerLevelUp, close: closeLevelUp } = useLevelUpCelebration();
  
  const { 
    achievements, 
    unlockedCount, 
    totalCount, 
    recentUnlock, 
    clearRecentUnlock,
    streakDays,
    streakMultiplier 
  } = useAchievements();

  const loadData = useCallback(async () => {
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
        
        if (affiliateData) {
          const storedTier = parseInt(localStorage.getItem('affiliate_tier_level') || '1');
          if (affiliateData.tier_level > storedTier) {
            triggerLevelUp(storedTier, affiliateData.tier_level);
          }
          localStorage.setItem('affiliate_tier_level', String(affiliateData.tier_level));
        }

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
  }, [triggerLevelUp]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const { isRefreshing, pullDistance, pullProgress, handlers } = usePullToRefresh({
    onRefresh: loadData
  });

  const transactions = useMemo<Transaction[]>(() => {
    const txs: Transaction[] = recentSessions.map(session => ({
      id: session.id,
      type: 'earned' as const,
      amount: session.total_points_earned || 0,
      description: `Network scan • ${formatDistance(session.total_distance_meters)}`,
      timestamp: new Date(session.started_at),
      icon: 'zap' as const
    }));

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
    if (activeFilter === 'bonus') return transactions.filter(t => t.type === 'bonus' || t.type === 'referral');
    return transactions;
  }, [transactions, activeFilter]);

  const handleCopyLink = async () => {
    if (!affiliate) return;
    buttonTap();
    const link = `https://nomiqa.com?ref=${affiliate.affiliate_code}`;
    const copied = await copyToClipboard(link);
    if (copied) {
      successPattern();
      playSuccess();
      toast({ title: 'Link copied!' });
    }
  };

  const handleShare = async () => {
    if (!affiliate) return;
    buttonTap();
    playSwoosh();
    const link = `https://nomiqa.com?ref=${affiliate.affiliate_code}`;
    await share({
      title: 'Join Nomiqa',
      text: 'Get travel eSIMs and earn rewards!',
      url: link
    });
  };

  const handleLogout = async () => {
    buttonTap();
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleQuickAction = (action: string) => {
    navigationTap();
    playPop();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <AppSpinner size="lg" label="Loading..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <WalletIcon className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Sign in to view wallet</h2>
        <p className="text-muted-foreground text-center mb-6 text-sm">
          Track your earnings and rewards
        </p>
        <Button onClick={() => navigate('/auth')}>Sign In</Button>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-background overflow-y-auto"
      {...handlers}
    >
      <PullToRefreshIndicator 
        pullDistance={pullDistance}
        pullProgress={pullProgress}
        isRefreshing={isRefreshing}
      />

      <div className="px-4 py-4 pb-28 space-y-4">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">{t('app.wallet.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('app.wallet.subtitle')}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center active:scale-95 transition-transform"
          >
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </button>
        </header>

        {/* Balance Card */}
        <button 
          className="w-full rounded-2xl border border-border bg-card p-4 text-left active:scale-[0.99] transition-transform"
          onClick={() => { buttonTap(); playCoin(); setShowBalanceDetails(!showBalanceDetails); }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="text-sm font-medium text-foreground">{t('app.wallet.totalBalance')}</span>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-xs text-muted-foreground">{t('app.wallet.live')}</span>
                </div>
              </div>
            </div>
            <ChevronRight className={cn(
              "w-5 h-5 text-muted-foreground transition-transform",
              showBalanceDetails && "rotate-90"
            )} />
          </div>
          
          <div className="mb-1">
            <span className="text-4xl font-bold text-foreground tabular-nums">
              {formatNumber(totalPoints)}
            </span>
            <span className="text-lg text-muted-foreground ml-2">pts</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>≈ ${estimatedUSD} USD</span>
            {totalPoints > 0 && <TrendingUp className="w-3.5 h-3.5 text-green-500" />}
          </div>

          <div className={cn(
            "grid grid-cols-3 gap-2 transition-all overflow-hidden",
            showBalanceDetails ? "mt-4 max-h-20 opacity-100" : "max-h-0 opacity-0"
          )}>
            <div className="bg-muted/50 rounded-xl p-2.5 text-center">
              <div className="text-base font-bold text-foreground">{points?.contribution_streak_days || 0}</div>
              <div className="text-xs text-muted-foreground">Streak</div>
            </div>
            <div className="bg-muted/50 rounded-xl p-2.5 text-center">
              <div className="text-base font-bold text-foreground">{formatDistance(points?.total_distance_meters)}</div>
              <div className="text-xs text-muted-foreground">Distance</div>
            </div>
            <div className="bg-muted/50 rounded-xl p-2.5 text-center">
              <div className="text-base font-bold text-foreground">{affiliate?.total_registrations || 0}</div>
              <div className="text-xs text-muted-foreground">Referrals</div>
            </div>
          </div>
        </button>

        {/* Streak Banner */}
        {streakDays >= 1 && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <Flame className="w-5 h-5 text-orange-500" />
            <div className="flex-1">
              <span className="text-sm font-medium text-foreground">{streakDays} Day Streak</span>
              <p className="text-xs text-muted-foreground">{streakMultiplier}x earning bonus active</p>
            </div>
          </div>
        )}

        {/* Achievements Row */}
        {achievements.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Achievements</span>
              </div>
              <span className="text-xs text-muted-foreground">{unlockedCount}/{totalCount}</span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {achievements.slice(0, 6).map((achievement) => (
                <AchievementBadge 
                  key={achievement.id} 
                  achievement={achievement} 
                  size="sm"
                  showProgress={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: 'earn', icon: MapPin, label: 'Scan', color: 'text-green-500 bg-green-500/10' },
            { id: 'shop', icon: ShoppingBag, label: 'Shop', color: 'text-blue-500 bg-blue-500/10' },
            { id: 'invite', icon: Users, label: 'Invite', color: 'text-violet-500 bg-violet-500/10' },
            { id: 'redeem', icon: Gift, label: 'Redeem', color: 'text-amber-500 bg-amber-500/10' },
          ].map((action) => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action.id)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-card border border-border active:scale-95 transition-transform"
            >
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', action.color)}>
                <action.icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-foreground">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Transactions */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Transactions</span>
          </div>

          {/* Filter chips */}
          <div className="flex gap-2">
            {(['all', 'earned', 'bonus'] as TransactionFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => { selectionTap(); setActiveFilter(filter); }}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                  activeFilter === filter
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground"
                )}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          {/* Transaction list */}
          {filteredTransactions.length === 0 ? (
            <EmptyState 
              type="transactions" 
              title="No activity yet"
              description="Your earning history will appear here"
              compact={true}
            />
          ) : (
            <div className="space-y-2">
              {filteredTransactions.map((tx) => (
                <div 
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-card border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      tx.type === 'earned' || tx.type === 'bonus' || tx.type === 'referral'
                        ? 'bg-green-500/10 text-green-500' 
                        : 'bg-red-500/10 text-red-500'
                    )}>
                      {getTransactionIcon(tx.icon)}
                    </div>
                    <div>
                      <div className="font-medium text-foreground text-sm">
                        {tx.description}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(tx.timestamp)}
                      </div>
                    </div>
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 font-semibold text-sm",
                    tx.type === 'spent' ? 'text-red-500' : 'text-green-500'
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

        {/* Affiliate Card */}
        {affiliate && (
          <button 
            className="w-full rounded-xl bg-card border border-border p-4 text-left active:scale-[0.98] transition-transform"
            onClick={() => { navigationTap(); playSwoosh(); navigate('/affiliate'); }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Star className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <div className="font-medium text-foreground text-sm">
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
                  className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center active:scale-95 transition-transform"
                >
                  <Copy className="w-4 h-4 text-foreground" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleShare(); }}
                  className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center active:scale-95 transition-transform"
                >
                  <Share2 className="w-4 h-4 text-primary-foreground" />
                </button>
              </div>
            </div>
          </button>
        )}

        {/* Join Affiliate CTA */}
        {!affiliate && (
          <div className="rounded-xl bg-card border border-border p-4 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
              <Gift className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Start Earning More</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Refer friends and earn up to 18% commission
            </p>
            <Button onClick={() => navigate('/affiliate')}>
              Join Program
            </Button>
          </div>
        )}
      </div>

      <MilestonePopup 
        show={!!recentUnlock} 
        achievement={recentUnlock} 
        onClose={clearRecentUnlock} 
      />

      <LevelUpCelebration
        isOpen={showLevelUp}
        onClose={closeLevelUp}
        previousTier={previousTier}
        newTier={newTier}
      />
    </div>
  );
};
