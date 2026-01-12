import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  User,
  Award,
  Package,
  LogOut,
  Crown,
  Star,
  Zap,
  TrendingUp,
  Share2,
  Pencil,
  Check,
  X,
  RefreshCw,
  Users,
  UserPlus,
  CheckCircle2,
  Wallet,
  Settings,
  Volume2, 
  VolumeX
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEnhancedHaptics } from '@/hooks/useEnhancedHaptics';
import { useEnhancedSounds } from '@/hooks/useEnhancedSounds';
import { AppSpinner } from '@/components/app/AppSpinner';
import { useNativeShare } from '@/hooks/useNativeShare';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { AnimatedAvatar } from '@/components/app/AnimatedAvatar';
import { AnimatedCounter } from '@/components/app/AnimatedCounter';
import { AnimatedProgressBar } from '@/components/app/AnimatedProgressBar';
import { useTranslation } from '@/contexts/TranslationContext';
import { PrivacyControls } from '@/components/app/PrivacyControls';
import { Switch } from '@/components/ui/switch';
import { EmptyStateIllustration } from '@/components/app/EmptyStateIllustration';

interface UserProfile {
  username: string;
  email: string;
  solana_wallet?: string | null;
}

interface MembershipData {
  total_spent_usd: number;
  membership_tier: string;
  cashback_rate: number;
}

interface AffiliateData {
  id: string;
  affiliate_code: string;
  username: string | null;
  total_registrations: number;
  total_conversions: number;
  total_earnings_usd: number;
  tier_level: number;
  commission_rate: number;
  miner_boost_percentage: number;
}

interface Order {
  id: string;
  package_name: string;
  data_amount: string;
  status: string;
  created_at: string;
}

const TIER_CONFIG = {
  beginner: { icon: Star, color: 'text-amber-400', bg: 'bg-amber-400/10', friendlyName: 'Starter' },
  traveler: { icon: Award, color: 'text-sky-400', bg: 'bg-sky-400/10', friendlyName: 'Traveler' },
  adventurer: { icon: Crown, color: 'text-amber-500', bg: 'bg-amber-500/10', friendlyName: 'Adventurer' },
  explorer: { icon: Crown, color: 'text-violet-400', bg: 'bg-violet-400/10', friendlyName: 'Explorer' }
};

export const AppProfile: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { buttonTap, successPattern, selectionTap } = useEnhancedHaptics();
  const { soundEnabled, toggleSound, playSuccess, playPop } = useEnhancedSounds();
  const { share, copyToClipboard } = useNativeShare();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [membership, setMembership] = useState<MembershipData | null>(null);
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [editedUsername, setEditedUsername] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);
  const [userPoints, setUserPoints] = useState<{ total_points: number; total_distance_meters: number } | null>(null);
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    return tabParam && ['account', 'rewards', 'orders', 'settings'].includes(tabParam) 
      ? tabParam 
      : 'account';
  });
  const [solanaWallet, setSolanaWallet] = useState('');
  const [isEditingWallet, setIsEditingWallet] = useState(false);
  const [savingWallet, setSavingWallet] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        const [profileResult, membershipResult, affiliateResult, ordersResult, statsResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('username, solana_wallet')
            .eq('user_id', currentUser.id)
            .maybeSingle(),
          supabase
            .from('user_spending')
            .select('*')
            .eq('user_id', currentUser.id)
            .maybeSingle(),
          supabase
            .from('affiliates')
            .select('*')
            .or(`user_id.eq.${currentUser.id},email.eq.${currentUser.email}`)
            .maybeSingle(),
          supabase
            .from('orders')
            .select('id, package_name, data_amount, status, created_at')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })
            .limit(10),
          supabase.functions.invoke('get-contribution-stats')
        ]);

        const profileData = profileResult.data;
        const username = profileData?.username || currentUser.email?.split('@')[0] || 'User';
        setProfile({
          username,
          email: currentUser.email || '',
          solana_wallet: profileData?.solana_wallet
        });
        setEditedUsername(username);
        setSolanaWallet(profileData?.solana_wallet || '');

        let membershipData = membershipResult.data;
        if (!membershipData) {
          const { data: newMembership } = await supabase
            .from('user_spending')
            .insert({ user_id: currentUser.id, total_spent_usd: 0 })
            .select()
            .single();
          membershipData = newMembership;
        }
        setMembership(membershipData);

        if (statsResult.data && !statsResult.error) {
          setUserPoints({
            total_points: statsResult.data.points?.total || 0,
            total_distance_meters: statsResult.data.points?.total_distance_meters || 0
          });
        } else {
          setUserPoints({ total_points: 0, total_distance_meters: 0 });
        }

        setAffiliate(affiliateResult.data);
        setOrders(ordersResult.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!affiliate) return;
    buttonTap();
    playPop();
    const link = affiliate.username 
      ? `https://nomiqa.com/${affiliate.username}`
      : `https://nomiqa.com/r/${affiliate.affiliate_code}`;
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
    const link = affiliate.username 
      ? `https://nomiqa.com/${affiliate.username}`
      : `https://nomiqa.com/r/${affiliate.affiliate_code}`;
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

  const handleSaveUsername = async () => {
    if (!editedUsername.trim() || editedUsername.length < 3) {
      toast({ title: 'Username must be at least 3 characters', variant: 'destructive' });
      return;
    }

    setSavingUsername(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', editedUsername.trim())
        .neq('user_id', session.user.id)
        .maybeSingle();

      if (existingUser) {
        toast({ title: 'Username is already taken', variant: 'destructive' });
        setSavingUsername(false);
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ username: editedUsername.trim() })
        .eq('user_id', session.user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, username: editedUsername.trim() } : null);
      setIsEditingUsername(false);
      successPattern();
      playSuccess();
      toast({ title: 'Username updated!' });
    } catch (error) {
      console.error('Error updating username:', error);
      toast({ title: 'Failed to update username', variant: 'destructive' });
    } finally {
      setSavingUsername(false);
    }
  };

  const validateSolanaWallet = (address: string): boolean => {
    if (!address) return true;
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
    return address.length >= 32 && address.length <= 44 && base58Regex.test(address);
  };

  const handleSaveWallet = async () => {
    const trimmedWallet = solanaWallet.trim();
    
    if (trimmedWallet && !validateSolanaWallet(trimmedWallet)) {
      setWalletError('Invalid Solana wallet address');
      toast({ title: 'Invalid Solana wallet address', variant: 'destructive' });
      return;
    }

    setSavingWallet(true);
    setWalletError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('profiles')
        .update({ solana_wallet: trimmedWallet || null })
        .eq('user_id', session.user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, solana_wallet: trimmedWallet || null } : null);
      setIsEditingWallet(false);
      successPattern();
      playSuccess();
      toast({ title: trimmedWallet ? 'Wallet saved!' : 'Wallet removed!' });
    } catch (error) {
      console.error('Error saving wallet:', error);
      toast({ title: 'Failed to save wallet', variant: 'destructive' });
    } finally {
      setSavingWallet(false);
    }
  };

  const getTierConfig = (tier: string) => {
    return TIER_CONFIG[tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.beginner;
  };

  const getNextTierInfo = () => {
    if (!membership) return null;
    
    const tiers = [
      { name: 'beginner', threshold: 0, rate: 5 },
      { name: 'traveler', threshold: 20, rate: 6 },
      { name: 'adventurer', threshold: 50, rate: 7 },
      { name: 'explorer', threshold: 150, rate: 10 }
    ];

    const currentIndex = tiers.findIndex(t => t.name === membership.membership_tier);
    if (currentIndex === tiers.length - 1) return null;

    const nextTier = tiers[currentIndex + 1];
    const remaining = nextTier.threshold - membership.total_spent_usd;
    const progress = Math.min((membership.total_spent_usd / nextTier.threshold) * 100, 100);

    return { ...nextTier, remaining, progress };
  };

  const totalCashbackEarned = membership 
    ? (membership.total_spent_usd * membership.cashback_rate) / 100 
    : 0;

  if (!user && !loading) {
    return (
      <div className="px-4 py-6 flex flex-col items-center justify-center min-h-[60vh]">
        <User className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">Sign in to view profile</h2>
        <p className="text-muted-foreground text-center text-sm mb-6">
          Access your account, orders, and rewards
        </p>
        <Button onClick={() => navigate('/auth')}>Sign In</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <AppSpinner size="lg" label="Loading..." />
      </div>
    );
  }

  const tierConfig = membership ? getTierConfig(membership.membership_tier) : getTierConfig('beginner');
  const TierIcon = tierConfig.icon;
  const nextTier = getNextTierInfo();

  return (
    <div className="px-4 py-4 space-y-4 pb-24 min-h-screen overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <AnimatedAvatar
          initial={profile?.username?.charAt(0) || 'U'}
          tier={(membership?.membership_tier || 'beginner') as 'beginner' | 'traveler' | 'adventurer' | 'explorer'}
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-foreground truncate">{profile?.username || 'User'}</h1>
          <p className="text-sm text-muted-foreground truncate">{profile?.email}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} className="active:scale-95">
          <LogOut className="w-5 h-5" />
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-card border border-border p-3">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-green-500" />
            <span className="text-xs text-muted-foreground">Total Cashback</span>
          </div>
          <p className="text-xl font-bold text-foreground">${totalCashbackEarned.toFixed(2)}</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-3">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Data Points</span>
          </div>
          <p className="text-xl font-bold text-foreground">{(userPoints?.total_points || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Tabs - Reduced to 4 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-card border border-border rounded-xl">
          <TabsTrigger 
            value="account" 
            className="flex flex-col items-center gap-1 py-2 text-xs rounded-lg"
            onClick={() => selectionTap()}
          >
            <User className="w-4 h-4" />
            Me
          </TabsTrigger>
          <TabsTrigger 
            value="rewards" 
            className="flex flex-col items-center gap-1 py-2 text-xs rounded-lg"
            onClick={() => selectionTap()}
          >
            <Award className="w-4 h-4" />
            Rewards
          </TabsTrigger>
          <TabsTrigger 
            value="orders" 
            className="flex flex-col items-center gap-1 py-2 text-xs rounded-lg"
            onClick={() => selectionTap()}
          >
            <Package className="w-4 h-4" />
            eSIMs
          </TabsTrigger>
          <TabsTrigger 
            value="settings" 
            className="flex flex-col items-center gap-1 py-2 text-xs rounded-lg"
            onClick={() => selectionTap()}
          >
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account" className="mt-4 space-y-3">
          <Card className="bg-card border-border">
            <CardContent className="p-4 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Username</p>
                {isEditingUsername ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editedUsername}
                      onChange={(e) => setEditedUsername(e.target.value)}
                      className="text-base font-medium"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" onClick={handleSaveUsername} disabled={savingUsername}>
                      {savingUsername ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-green-500" />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => { setIsEditingUsername(false); setEditedUsername(profile?.username || ''); }}>
                      <X className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-base font-medium text-foreground">{profile?.username}</p>
                    <Button size="icon" variant="ghost" onClick={() => setIsEditingUsername(true)} className="w-6 h-6">
                      <Pencil className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Email</p>
                <p className="text-base text-foreground">{profile?.email}</p>
              </div>
              
              {/* Sound Toggle */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
                  <div>
                    <p className="text-sm font-medium text-foreground">Sound Effects</p>
                    <p className="text-xs text-muted-foreground">Play sounds for rewards</p>
                  </div>
                </div>
                <Switch checked={soundEnabled} onCheckedChange={() => { selectionTap(); toggleSound(); }} />
              </div>
            </CardContent>
          </Card>

          {/* Referral Card */}
          {affiliate && (
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Referral Program</span>
                  </div>
                  <Badge variant="outline" className="text-xs">Level {affiliate.tier_level}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-foreground">{affiliate.total_registrations}</p>
                    <p className="text-xs text-muted-foreground">Referrals</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-green-500">${(affiliate.total_earnings_usd || 0).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Earned</p>
                  </div>
                </div>
                <Button onClick={handleShare} className="w-full" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Link
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="mt-4 space-y-3">
          {/* Total Earnings */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Total Earnings</p>
              <p className="text-3xl font-bold text-foreground">
                $<AnimatedCounter value={totalCashbackEarned + (affiliate?.total_earnings_usd || 0)} decimals={2} duration={1200} />
              </p>
              <p className="text-xs text-muted-foreground mt-1">Cashback + referral commissions</p>
            </CardContent>
          </Card>

          {/* Reward Boost */}
          {affiliate && (
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-foreground">Reward Boost</h4>
                    <p className="text-xs text-muted-foreground">Bonus on all earnings</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">+{affiliate.miner_boost_percentage || 0}%</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-muted/50 rounded-lg p-2">
                    <UserPlus className="w-4 h-4 text-primary mx-auto mb-1" />
                    <p className="text-base font-semibold text-foreground">{affiliate.total_registrations}</p>
                    <p className="text-xs text-muted-foreground">Friends</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto mb-1" />
                    <p className="text-base font-semibold text-foreground">{affiliate.total_conversions}</p>
                    <p className="text-xs text-muted-foreground">Sales</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cashback Tier */}
          <Card className={cn('border-0', tierConfig.bg)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={cn('p-2 rounded-lg', tierConfig.bg)}>
                  <TierIcon className={cn('w-5 h-5', tierConfig.color)} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-foreground">Cashback</h4>
                  <p className="text-xs text-muted-foreground">{membership?.cashback_rate}% on purchases</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-500">${totalCashbackEarned.toFixed(2)}</p>
                </div>
              </div>
              
              {nextTier && (
                <div className="space-y-2 bg-background/50 rounded-lg p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Next: {nextTier.name} ({nextTier.rate}%)</span>
                    <span className="text-foreground">${nextTier.remaining.toFixed(0)} to go</span>
                  </div>
                  <AnimatedProgressBar value={membership?.total_spent_usd || 0} max={nextTier.threshold} showPercentage={false} />
                </div>
              )}
              
              {!nextTier && (
                <div className="flex items-center justify-center gap-2 text-xs bg-background/50 rounded-lg p-2">
                  <Crown className="w-4 h-4 text-primary" />
                  <span className="font-medium">Max tier - 10% cashback</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Button variant="ghost" size="sm" onClick={loadData} className="w-full text-xs text-muted-foreground">
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh
          </Button>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="mt-4 space-y-2">
          {orders.length === 0 ? (
            <Card className="bg-card border-border border-dashed">
              <CardContent className="p-6 text-center">
                <EmptyStateIllustration type="orders" className="mb-2" />
                <p className="text-muted-foreground text-sm mb-1">No eSIMs yet</p>
                <p className="text-xs text-muted-foreground mb-4">Your travel plans will appear here</p>
                <Button onClick={() => navigate('/app/shop')}>Browse Plans</Button>
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => {
              const getStatusDisplay = (status: string) => {
                switch (status) {
                  case 'pending_payment':
                  case 'pending':
                  case 'processing':
                    return { label: 'Processing', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
                  case 'completed':
                  case 'active':
                    return { label: 'Active', color: 'bg-green-500/10 text-green-500 border-green-500/20' };
                  case 'failed':
                  case 'cancelled':
                    return { label: 'Failed', color: 'bg-red-500/10 text-red-500 border-red-500/20' };
                  case 'expired':
                    return { label: 'Expired', color: 'bg-muted text-muted-foreground border-border' };
                  default:
                    return { label: 'Processing', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
                }
              };
              
              const statusDisplay = getStatusDisplay(order.status);
              
              return (
                <Card key={order.id} className="bg-card border-border">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground text-sm">{order.package_name || 'eSIM Plan'}</p>
                        <p className="text-xs text-muted-foreground">{order.data_amount}</p>
                      </div>
                      <Badge variant="outline" className={cn('text-xs border', statusDisplay.color)}>
                        {statusDisplay.label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-4 space-y-3">
          {/* Activity Summary */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Your Activity</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-foreground">{(userPoints?.total_points || 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Points</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-foreground">{((userPoints?.total_distance_meters || 0) / 1000).toFixed(1)} km</p>
                  <p className="text-xs text-muted-foreground">Distance</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wallet */}
          <Card className="bg-card border-border">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-violet-500" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Payout Wallet</p>
                    <p className="text-xs text-muted-foreground">For advanced users</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsEditingWallet(!isEditingWallet)} className="text-xs">
                  {profile?.solana_wallet ? 'Edit' : 'Add'}
                </Button>
              </div>
              
              {isEditingWallet && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <Input
                    value={solanaWallet}
                    onChange={(e) => { setSolanaWallet(e.target.value); setWalletError(null); }}
                    placeholder="Solana wallet address"
                    className="font-mono text-sm"
                  />
                  {walletError && <p className="text-xs text-red-500">{walletError}</p>}
                  <div className="flex gap-2">
                    <Button onClick={handleSaveWallet} disabled={savingWallet} size="sm" className="flex-1">
                      {savingWallet ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setIsEditingWallet(false); setSolanaWallet(profile?.solana_wallet || ''); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              
              {!isEditingWallet && profile?.solana_wallet && (
                <p className="text-xs font-mono text-muted-foreground truncate bg-muted/50 rounded-lg px-3 py-2">
                  {profile.solana_wallet.slice(0, 8)}...{profile.solana_wallet.slice(-8)}
                </p>
              )}
            </CardContent>
          </Card>

          {/* App Settings */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={() => {
                  buttonTap();
                  localStorage.removeItem('hasSeenOnboarding');
                  toast({ title: t('appTutorialReset'), description: t('appTutorialResetDesc') });
                }}
              >
                <span className="text-sm">{t('appReplayTutorial')}</span>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Privacy Controls */}
          <PrivacyControls />
        </TabsContent>
      </Tabs>
    </div>
  );
};
