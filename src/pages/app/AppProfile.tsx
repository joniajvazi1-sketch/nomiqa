import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User,
  Award,
  Package,
  Gift,
  LogOut,
  Crown,
  Star,
  Sparkles,
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
  Plus,
  ChevronRight,
  Wallet,
  MapPin,
  Activity,
  BarChart3,
  Shield
} from 'lucide-react';
import { AppSpinner } from '@/components/app/AppSpinner';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useHaptics } from '@/hooks/useHaptics';
import { useNativeShare } from '@/hooks/useNativeShare';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { WeeklyContributionChart } from '@/components/app/WeeklyContributionChart';
import { AnimatedAvatar } from '@/components/app/AnimatedAvatar';
import { AnimatedStatCard } from '@/components/app/AnimatedStatCard';
import { AnimatedCounter } from '@/components/app/AnimatedCounter';
import { AnimatedProgressBar } from '@/components/app/AnimatedProgressBar';
import { useTranslation } from '@/contexts/TranslationContext';
import { AnalyticsDashboard } from '@/components/app/AnalyticsDashboard';
import { PrivacyControls } from '@/components/app/PrivacyControls';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { Switch } from '@/components/ui/switch';
import { Volume2, VolumeX } from 'lucide-react';

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
  registration_milestone_level: number;
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
  beginner: { icon: Star, color: 'text-amber-500', bg: 'bg-amber-500/20' },
  traveler: { icon: Award, color: 'text-slate-400', bg: 'bg-slate-400/20' },
  adventurer: { icon: Crown, color: 'text-yellow-500', bg: 'bg-yellow-500/20' },
  explorer: { icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-500/20' }
};

const AFFILIATE_TIERS = [
  { level: 1, name: 'Recruit', conversions: 0, commission: '9%' },
  { level: 2, name: 'Commander', conversions: 10, commission: '9% + 6%' },
  { level: 3, name: 'Overlord', conversions: 30, commission: '9% + 6% + 3%' }
];

export const AppProfile: React.FC = () => {
  const navigate = useNavigate();
  const { lightTap, success } = useHaptics();
  const { soundEnabled, toggleSound } = useSoundEffects();
  const { share, copyToClipboard } = useNativeShare();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [membership, setMembership] = useState<MembershipData | null>(null);
  const [allAffiliates, setAllAffiliates] = useState<AffiliateData[]>([]);
  const [selectedAffiliateId, setSelectedAffiliateId] = useState<string>('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [editedUsername, setEditedUsername] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);
  const [creatingAffiliate, setCreatingAffiliate] = useState(false);
  const [showNewLinkInput, setShowNewLinkInput] = useState(false);
  const [newLinkUsername, setNewLinkUsername] = useState('');
  const [userPoints, setUserPoints] = useState<{ total_points: number; total_distance_meters: number } | null>(null);
  const [activeTab, setActiveTab] = useState('account');
  const [solanaWallet, setSolanaWallet] = useState('');
  const [isEditingWallet, setIsEditingWallet] = useState(false);
  const [savingWallet, setSavingWallet] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  const selectedAffiliate = allAffiliates.find(a => a.id === selectedAffiliateId) || allAffiliates[0];

  // Generate mock weekly contribution data based on user points
  const weeklyData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const baseValue = userPoints?.total_points ? Math.floor(userPoints.total_points / 30) : 10;
    return days.map((day, i) => ({
      day,
      value: Math.floor(baseValue * (0.5 + Math.random() * 1.2) * (i === 6 ? 1.5 : 1))
    }));
  }, [userPoints]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        // Load profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, solana_wallet')
          .eq('user_id', currentUser.id)
          .maybeSingle();

        const username = profileData?.username || currentUser.email?.split('@')[0] || 'User';
        setProfile({
          username,
          email: currentUser.email || '',
          solana_wallet: profileData?.solana_wallet
        });
        setEditedUsername(username);
        setSolanaWallet(profileData?.solana_wallet || '');

        // Load membership
        let { data: membershipData } = await supabase
          .from('user_spending')
          .select('*')
          .eq('user_id', currentUser.id)
          .maybeSingle();

        if (!membershipData) {
          const { data: newMembership } = await supabase
            .from('user_spending')
            .insert({ user_id: currentUser.id, total_spent_usd: 0 })
            .select()
            .single();
          membershipData = newMembership;
        }
        setMembership(membershipData);

        // Load user points for stats
        const { data: pointsData } = await supabase
          .from('user_points')
          .select('total_points, total_distance_meters')
          .eq('user_id', currentUser.id)
          .maybeSingle();
        setUserPoints(pointsData);

        // Load all affiliates for this user
        const { data: affiliatesData } = await supabase
          .from('affiliates')
          .select('*')
          .or(`user_id.eq.${currentUser.id},email.eq.${currentUser.email}`)
          .order('created_at', { ascending: true });

        if (affiliatesData && affiliatesData.length > 0) {
          setAllAffiliates(affiliatesData);
          // Select the one with highest tier by default
          const highestTier = affiliatesData.reduce((prev, current) => 
            (current.tier_level > prev.tier_level) ? current : prev
          );
          setSelectedAffiliateId(highestTier.id);
        }

        // Load orders
        const { data: ordersData } = await supabase
          .from('orders')
          .select('id, package_name, data_amount, status, created_at')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false })
          .limit(10);
        setOrders(ordersData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async (code: string, isUsername = false) => {
    lightTap();
    const link = isUsername 
      ? `https://nomiqa.com/${code}`
      : `https://nomiqa.com/r/${code}`;
    const copied = await copyToClipboard(link);
    if (copied) {
      success();
      toast({ title: 'Link copied!' });
    }
  };

  const handleShare = async () => {
    if (!selectedAffiliate) return;
    lightTap();
    const link = selectedAffiliate.username 
      ? `https://nomiqa.com/${selectedAffiliate.username}`
      : `https://nomiqa.com/r/${selectedAffiliate.affiliate_code}`;
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
      success();
      toast({ title: 'Username updated!' });
    } catch (error) {
      console.error('Error updating username:', error);
      toast({ title: 'Failed to update username', variant: 'destructive' });
    } finally {
      setSavingUsername(false);
    }
  };

  // Validate Solana wallet address (base58, 32-44 chars)
  const validateSolanaWallet = (address: string): boolean => {
    if (!address) return true; // Empty is valid (removes wallet)
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
      success();
      toast({ title: trimmedWallet ? 'Wallet saved!' : 'Wallet removed!' });
    } catch (error) {
      console.error('Error saving wallet:', error);
      toast({ title: 'Failed to save wallet', variant: 'destructive' });
    } finally {
      setSavingWallet(false);
    }
  };

  const createAffiliate = async () => {
    if (!user) {
      navigate('/auth?mode=signup');
      return;
    }

    // Check limit
    if (allAffiliates.length >= 3) {
      toast({ title: 'Maximum 3 affiliate links allowed', variant: 'destructive' });
      return;
    }

    // Validate username for additional links
    if (showNewLinkInput && !newLinkUsername) {
      toast({ title: 'Please enter a username', variant: 'destructive' });
      return;
    }

    if (showNewLinkInput && (newLinkUsername.length < 3 || !/^[a-z0-9-]+$/.test(newLinkUsername))) {
      toast({ title: 'Username must be 3+ chars, lowercase letters, numbers, hyphens only', variant: 'destructive' });
      return;
    }

    setCreatingAffiliate(true);
    try {
      const isFirstAffiliate = allAffiliates.length === 0;
      let affiliateUsername = newLinkUsername.toLowerCase();

      if (isFirstAffiliate) {
        // Use profile username for first affiliate
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username')
          .eq('user_id', user.id)
          .maybeSingle();
        affiliateUsername = profileData?.username || user.email!.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      }

      const { data: result, error: edgeFunctionError } = await supabase.functions.invoke('create-affiliate', {
        body: {
          email: user.email!,
          username: affiliateUsername,
          userId: user.id,
        }
      });

      if (edgeFunctionError) throw edgeFunctionError;
      if (!result?.affiliate) throw new Error('Failed to create affiliate');

      // Reload affiliates
      await loadData();
      setShowNewLinkInput(false);
      setNewLinkUsername('');
      success();
      toast({ title: `Affiliate link created!` });
    } catch (error: any) {
      console.error('Error creating affiliate:', error);
      toast({ title: error.message || 'Failed to create affiliate link', variant: 'destructive' });
    } finally {
      setCreatingAffiliate(false);
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

  const getAffiliateTierInfo = () => {
    if (!selectedAffiliate) return null;
    const currentTier = AFFILIATE_TIERS.find(t => t.level === selectedAffiliate.tier_level) || AFFILIATE_TIERS[0];
    const nextTier = AFFILIATE_TIERS.find(t => t.level === selectedAffiliate.tier_level + 1);
    
    if (!nextTier) {
      return { currentTier, nextTier: null, progress: 100, remaining: 0 };
    }
    
    const remaining = nextTier.conversions - (selectedAffiliate.total_conversions || 0);
    const progress = Math.min(((selectedAffiliate.total_conversions || 0) / nextTier.conversions) * 100, 100);
    return { currentTier, nextTier, progress, remaining };
  };

  const totalCashbackEarned = membership 
    ? (membership.total_spent_usd * membership.cashback_rate) / 100 
    : 0;

  if (!user && !loading) {
    return (
      <div className="px-4 py-6 flex flex-col items-center justify-center min-h-[60vh]">
        <User className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Sign in to view profile</h2>
        <p className="text-muted-foreground text-center mb-6">
          Access your account, orders, and rewards
        </p>
        <Button onClick={() => navigate('/auth')}>
          Sign In
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <AppSpinner size="lg" label="Loading profile..." />
      </div>
    );
  }

  const tierConfig = membership ? getTierConfig(membership.membership_tier) : getTierConfig('beginner');
  const TierIcon = tierConfig.icon;
  const nextTier = getNextTierInfo();
  const affiliateTierInfo = getAffiliateTierInfo();

  return (
    <div className="px-4 py-6 space-y-6 pb-24">
      {/* Header with Animated Avatar */}
      <div className="flex items-center gap-4">
        <AnimatedAvatar
          initial={profile?.username?.charAt(0) || 'U'}
          tier={(membership?.membership_tier || 'beginner') as 'beginner' | 'traveler' | 'adventurer' | 'explorer'}
        />
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">{profile?.username || 'User'}</h1>
          <p className="text-sm text-muted-foreground">{profile?.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className={cn('text-xs capitalize', tierConfig.color)}>
              <TierIcon className="w-3 h-3 mr-1" />
              {membership?.membership_tier || 'Beginner'}
            </Badge>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} className="active:scale-95 transition-transform">
          <LogOut className="w-5 h-5" />
        </Button>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <AnimatedStatCard
          icon={Wallet}
          iconColor="text-green-500"
          iconBg="bg-green-500/20"
          label="Total Cashback"
          value={totalCashbackEarned}
          prefix="$"
          decimals={2}
          delay={0}
        />
        <AnimatedStatCard
          icon={Activity}
          iconColor="text-neon-cyan"
          iconBg="bg-neon-cyan/20"
          label="Data Points"
          value={userPoints?.total_points || 0}
          delay={100}
        />
      </div>

      {/* Weekly Contribution Chart */}
      <Card className="bg-card/50 border-border/50 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Weekly Activity</h3>
            <Badge variant="outline" className="text-xs text-primary border-primary/30">
              This Week
            </Badge>
          </div>
          <WeeklyContributionChart data={weeklyData} animated />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7 h-auto p-1 bg-card/50 border border-border/50 backdrop-blur-sm">
          <TabsTrigger 
            value="account" 
            className="flex flex-col items-center gap-1 py-2 text-[10px] transition-all data-[state=active]:animate-stat-pop"
            onClick={() => lightTap()}
          >
            <User className="w-4 h-4" />
            Account
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className="flex flex-col items-center gap-1 py-2 text-[10px] transition-all data-[state=active]:animate-stat-pop"
            onClick={() => lightTap()}
          >
            <BarChart3 className="w-4 h-4" />
            Data
          </TabsTrigger>
          <TabsTrigger 
            value="membership" 
            className="flex flex-col items-center gap-1 py-2 text-[10px] transition-all data-[state=active]:animate-stat-pop"
            onClick={() => lightTap()}
          >
            <Award className="w-4 h-4" />
            Tier
          </TabsTrigger>
          <TabsTrigger 
            value="orders" 
            className="flex flex-col items-center gap-1 py-2 text-[10px] transition-all data-[state=active]:animate-stat-pop"
            onClick={() => lightTap()}
          >
            <Package className="w-4 h-4" />
            eSIMs
          </TabsTrigger>
          <TabsTrigger 
            value="wallet" 
            className="flex flex-col items-center gap-1 py-2 text-[10px] transition-all data-[state=active]:animate-stat-pop"
            onClick={() => lightTap()}
          >
            <Wallet className="w-4 h-4" />
            Wallet
          </TabsTrigger>
          <TabsTrigger 
            value="privacy" 
            className="flex flex-col items-center gap-1 py-2 text-[10px] transition-all data-[state=active]:animate-stat-pop"
            onClick={() => lightTap()}
          >
            <Shield className="w-4 h-4" />
            Privacy
          </TabsTrigger>
          <TabsTrigger 
            value="earn" 
            className="flex flex-col items-center gap-1 py-2 text-[10px] transition-all data-[state=active]:animate-stat-pop"
            onClick={() => lightTap()}
          >
            <Gift className="w-4 h-4" />
            Earn
          </TabsTrigger>
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account" className="mt-4 space-y-4 animate-tab-content-in">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Username</p>
                {isEditingUsername ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editedUsername}
                      onChange={(e) => setEditedUsername(e.target.value)}
                      className="text-lg font-semibold bg-background/50"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" onClick={handleSaveUsername} disabled={savingUsername} className="active:scale-95">
                      {savingUsername ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-green-500" />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => { setIsEditingUsername(false); setEditedUsername(profile?.username || ''); }} className="active:scale-95">
                      <X className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold text-foreground">{profile?.username}</p>
                    <Button size="icon" variant="ghost" onClick={() => setIsEditingUsername(true)} className="w-6 h-6 active:scale-95">
                      <Pencil className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Email</p>
                <p className="text-base text-foreground">{profile?.email}</p>
              </div>
              
              {/* Sound Effects Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex items-center gap-2">
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-primary" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">Sound Effects</p>
                    <p className="text-xs text-muted-foreground">Play sounds for rewards</p>
                  </div>
                </div>
                <Switch 
                  checked={soundEnabled}
                  onCheckedChange={() => {
                    lightTap();
                    toggleSound();
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab - NEW */}
        <TabsContent value="analytics" className="mt-4 animate-tab-content-in">
          <AnalyticsDashboard />
        </TabsContent>

        {/* Membership Tab */}
        <TabsContent value="membership" className="mt-4 space-y-4 animate-tab-content-in">
          <Card className={cn('border-0 overflow-hidden animate-stat-pop', tierConfig.bg)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={cn('p-2 rounded-full', tierConfig.bg, 'animate-pulse-glow')}>
                  <TierIcon className={cn('w-6 h-6', tierConfig.color)} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground capitalize">{membership?.membership_tier}</h3>
                  <p className="text-xs text-muted-foreground">{membership?.cashback_rate}% cashback</p>
                </div>
              </div>
              
              <div className="bg-background/50 rounded-lg p-3 mb-3">
                <p className="text-xs text-muted-foreground mb-1">Total Cashback Earned</p>
                <p className="text-2xl font-bold text-primary tabular-nums">
                  $<AnimatedCounter value={totalCashbackEarned} decimals={2} duration={1500} />
                </p>
              </div>

              {nextTier && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Progress to {nextTier.name}</span>
                    <span className="font-medium tabular-nums">{Math.round(nextTier.progress)}%</span>
                  </div>
                  <AnimatedProgressBar 
                    value={membership?.total_spent_usd || 0} 
                    max={nextTier.threshold} 
                    showPercentage={false}
                  />
                  <p className="text-xs text-muted-foreground">${nextTier.remaining.toFixed(2)} more to unlock</p>
                </div>
              )}

              {!nextTier && (
                <div className="flex items-center gap-2 text-sm animate-pulse">
                  <Crown className="w-4 h-4 text-primary" />
                  <span>Highest tier reached!</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50" style={{ animationDelay: '100ms' }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Lifetime Spending</p>
                  <p className="text-xl font-bold text-foreground tabular-nums">
                    $<AnimatedCounter value={membership?.total_spent_usd || 0} decimals={2} duration={1200} />
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={loadData} className="active:scale-95 transition-transform">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="mt-4 space-y-3 animate-tab-content-in">
          {orders.length === 0 ? (
            <Card className="bg-card/50 border-border/50 border-dashed animate-fade-in">
              <CardContent className="p-6 text-center">
                <Package className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50 animate-bounce-slow" />
                <p className="text-muted-foreground text-sm mb-3">No eSIMs yet</p>
                <Button onClick={() => navigate('/app/shop')} className="active:scale-95 transition-transform">Browse Plans</Button>
              </CardContent>
            </Card>
          ) : (
            orders.map((order, index) => {
              // Format status for display
              const getStatusDisplay = (status: string) => {
                switch (status) {
                  case 'pending_payment':
                  case 'pending':
                  case 'processing':
                    return { label: 'Processing', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
                  case 'completed':
                  case 'active':
                    return { label: 'Active', color: 'bg-green-500/20 text-green-400 border-green-500/30' };
                  case 'failed':
                  case 'cancelled':
                    return { label: 'Failed', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
                  case 'expired':
                    return { label: 'Expired', color: 'bg-muted text-muted-foreground border-border' };
                  default:
                    return { label: 'Processing', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
                }
              };
              
              const statusDisplay = getStatusDisplay(order.status);
              
              return (
                <Card 
                  key={order.id} 
                  className="bg-card/50 border-border/50 animate-stagger-in"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground text-sm">{order.package_name || 'eSIM Plan'}</p>
                        <p className="text-xs text-muted-foreground">{order.data_amount}</p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn('text-xs border', statusDisplay.color)}
                      >
                        {statusDisplay.label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Wallet Tab */}
        <TabsContent value="wallet" className="mt-4 space-y-4 animate-tab-content-in">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-full bg-primary/20">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Solana Wallet</h3>
                  <p className="text-xs text-muted-foreground">Add your wallet to receive rewards</p>
                </div>
              </div>
              
              {isEditingWallet ? (
                <div className="space-y-3">
                  <Input
                    value={solanaWallet}
                    onChange={(e) => {
                      setSolanaWallet(e.target.value);
                      setWalletError(null);
                    }}
                    placeholder="Enter your Solana wallet address"
                    className="font-mono text-sm bg-background/50"
                    autoFocus
                  />
                  {walletError && (
                    <p className="text-xs text-red-500">{walletError}</p>
                  )}
                  <div className="flex gap-2">
                    <Button onClick={handleSaveWallet} disabled={savingWallet} className="flex-1 active:scale-95 transition-transform">
                      {savingWallet ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                      Save
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsEditingWallet(false);
                        setSolanaWallet(profile?.solana_wallet || '');
                        setWalletError(null);
                      }}
                      className="active:scale-95 transition-transform"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {profile?.solana_wallet ? (
                    <div className="p-3 bg-background/50 rounded-lg border border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">Connected Wallet</p>
                      <p className="font-mono text-sm text-foreground break-all">{profile.solana_wallet}</p>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <p className="text-sm text-amber-600 dark:text-amber-400">
                        No wallet connected. Add your Solana wallet to receive rewards.
                      </p>
                    </div>
                  )}
                  <Button 
                    onClick={() => setIsEditingWallet(true)} 
                    variant={profile?.solana_wallet ? "outline" : "default"}
                    className="w-full active:scale-95 transition-transform"
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    {profile?.solana_wallet ? 'Edit Wallet' : 'Add Wallet'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rewards Info */}
          <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/20 mt-0.5">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm mb-1">Earn Real Crypto</h4>
                  <p className="text-xs text-muted-foreground">
                    Your affiliate earnings and network rewards will be distributed directly to your Solana wallet in USDC.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab - NEW */}
        <TabsContent value="privacy" className="mt-4 animate-tab-content-in">
          <PrivacyControls />
        </TabsContent>

        {/* Earn Tab - iOS Style Layout */}
        <TabsContent value="earn" className="mt-4 space-y-4 animate-tab-content-in">
          {allAffiliates.length > 0 && selectedAffiliate ? (
            <>
              {/* Centered Avatar & Name - Using Animated Avatar */}
              <div className="flex flex-col items-center py-4">
                <AnimatedAvatar
                  initial={(selectedAffiliate.username || selectedAffiliate.affiliate_code).charAt(0)}
                  tier="adventurer"
                  className="mb-3"
                />
                <h2 className="text-xl font-bold text-foreground animate-fade-in">
                  {selectedAffiliate.username || selectedAffiliate.affiliate_code}
                </h2>
                <Badge variant="outline" className="mt-1 text-xs animate-stat-pop" style={{ animationDelay: '200ms' }}>
                  {affiliateTierInfo?.currentTier.name || 'Recruit'}
                </Badge>
              </div>

              {/* Total Earnings - Large & Distinct */}
              <Card className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/30 animate-stat-pop">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Total Earnings</p>
                  <p className="text-4xl font-bold text-green-500 tabular-nums">
                    $<AnimatedCounter value={selectedAffiliate.total_earnings_usd || 0} decimals={2} duration={1800} />
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">USDC</p>
                </CardContent>
              </Card>

              {/* Invite Friend Button - Large CTA */}
              <Button 
                onClick={handleShare} 
                size="xl" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-base active:scale-95 transition-transform"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Invite Friend
              </Button>

              {/* Stats Overview Card with Animated Numbers */}
              <Card className="bg-card/50 border-border/50 overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 border-b border-border/50">
                    <p className="text-sm font-semibold text-foreground">Stats Overview</p>
                  </div>
                  <div className="divide-y divide-border/50">
                    <div className="flex items-center justify-between p-4 animate-stagger-in" style={{ animationDelay: '100ms' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <UserPlus className="w-4 h-4 text-blue-500" />
                        </div>
                        <span className="text-sm text-foreground">Registrations</span>
                      </div>
                      <span className="text-lg font-semibold text-foreground tabular-nums">
                        <AnimatedCounter value={selectedAffiliate.total_registrations || 0} duration={1200} />
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 animate-stagger-in" style={{ animationDelay: '200ms' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        </div>
                        <span className="text-sm text-foreground">Recruits</span>
                      </div>
                      <span className="text-lg font-semibold text-foreground tabular-nums">
                        <AnimatedCounter value={selectedAffiliate.total_conversions || 0} duration={1200} />
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 animate-stagger-in" style={{ animationDelay: '300ms' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center animate-pulse-glow">
                          <Zap className="w-4 h-4 text-amber-500" />
                        </div>
                        <span className="text-sm text-foreground">Mining Boost</span>
                      </div>
                      <span className="text-lg font-semibold text-amber-500 tabular-nums">
                        +<AnimatedCounter value={selectedAffiliate.miner_boost_percentage || 0} duration={1500} />%
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 animate-stagger-in" style={{ animationDelay: '400ms' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <Award className="w-4 h-4 text-purple-500" />
                        </div>
                        <span className="text-sm text-foreground">Commission Rate</span>
                      </div>
                      <span className="text-lg font-semibold text-foreground">{affiliateTierInfo?.currentTier.commission || '9%'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* iOS Settings-Style List Items with Transitions */}
              <Card className="bg-card/50 border-border/50 animate-stagger-in" style={{ animationDelay: '500ms' }}>
                <CardContent className="p-0">
                  {/* Team Control */}
                  {allAffiliates.length > 1 && (
                    <div 
                      className="flex items-center justify-between p-4 border-b border-border/50 active:bg-muted/50 active:scale-[0.98] transition-all cursor-pointer"
                      onClick={() => {
                        lightTap();
                        // Cycle through affiliates
                        const currentIndex = allAffiliates.findIndex(a => a.id === selectedAffiliateId);
                        const nextIndex = (currentIndex + 1) % allAffiliates.length;
                        setSelectedAffiliateId(allAffiliates[nextIndex].id);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <Users className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Team Control</p>
                          <p className="text-xs text-muted-foreground">{selectedAffiliate.username || selectedAffiliate.affiliate_code}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground transition-transform group-active:translate-x-1" />
                    </div>
                  )}

                  {/* Squad Level */}
                  <div 
                    className="flex items-center justify-between p-4 border-b border-border/50 active:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <Crown className="w-4 h-4 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Squad Level</p>
                        <p className="text-xs text-muted-foreground">
                          {affiliateTierInfo?.nextTier 
                            ? `${affiliateTierInfo.remaining} more recruits to ${affiliateTierInfo.nextTier.name}` 
                            : 'Max tier reached!'
                          }
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                      {affiliateTierInfo?.currentTier.name}
                    </Badge>
                  </div>

                  {/* Add New Link */}
                  {allAffiliates.length < 3 && (
                    <div 
                      className="flex items-center justify-between p-4 active:bg-muted/50 active:scale-[0.98] transition-all cursor-pointer"
                      onClick={() => {
                        lightTap();
                        setShowNewLinkInput(true);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Plus className="w-4 h-4 text-green-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Add Tracking Link</p>
                          <p className="text-xs text-muted-foreground">{allAffiliates.length}/3 used</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* New Link Input Modal */}
              {showNewLinkInput && (
                <Card className="bg-card/50 border-primary/50">
                  <CardContent className="p-4 space-y-3">
                    <p className="text-sm font-medium">Create New Tracking Link</p>
                    <Input
                      placeholder="Enter username (e.g., mylink)"
                      value={newLinkUsername}
                      onChange={(e) => setNewLinkUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="bg-background/50"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button onClick={createAffiliate} disabled={creatingAffiliate} className="flex-1">
                        {creatingAffiliate ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                        Create
                      </Button>
                      <Button variant="outline" onClick={() => { setShowNewLinkInput(false); setNewLinkUsername(''); }}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            /* No Affiliate - Create First */
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <Gift className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground mb-1">Start Earning</h3>
                  <p className="text-sm text-muted-foreground">
                    Create your affiliate link and earn up to 18% commission on sales
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-background/50 rounded-lg">
                    <p className="text-lg font-bold text-primary">9%</p>
                    <p className="text-[10px] text-muted-foreground">Direct</p>
                  </div>
                  <div className="p-2 bg-background/50 rounded-lg">
                    <p className="text-lg font-bold text-purple-500">6%</p>
                    <p className="text-[10px] text-muted-foreground">Level 2</p>
                  </div>
                  <div className="p-2 bg-background/50 rounded-lg">
                    <p className="text-lg font-bold text-amber-500">3%</p>
                    <p className="text-[10px] text-muted-foreground">Level 3</p>
                  </div>
                </div>

                <Button onClick={createAffiliate} disabled={creatingAffiliate} className="w-full">
                  {creatingAffiliate ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  {t("affiliateCreateButton")}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
