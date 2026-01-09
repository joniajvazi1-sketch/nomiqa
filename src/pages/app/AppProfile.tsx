import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

// Friendly tier names and descriptions
const TIER_CONFIG = {
  beginner: { icon: Star, color: 'text-amber-400', bg: 'bg-amber-400/20', friendlyName: 'Starter', description: 'Welcome aboard! 🎉' },
  traveler: { icon: Award, color: 'text-sky-400', bg: 'bg-sky-400/20', friendlyName: 'Traveler', description: 'You\'re on a roll! ✈️' },
  adventurer: { icon: Crown, color: 'text-amber-500', bg: 'bg-amber-500/20', friendlyName: 'Adventurer', description: 'Amazing progress! 🌟' },
  explorer: { icon: Sparkles, color: 'text-violet-400', bg: 'bg-violet-400/20', friendlyName: 'Explorer', description: 'You\'re a superstar! 🏆' }
};

// Friendly referral tier names
const AFFILIATE_TIERS = [
  { level: 1, name: 'Friend', conversions: 0, commission: '9%', emoji: '👋' },
  { level: 2, name: 'Champion', conversions: 10, commission: '9% + 6%', emoji: '🌟' },
  { level: 3, name: 'Legend', conversions: 30, commission: '9% + 6% + 3%', emoji: '🏆' }
];

export const AppProfile: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
  const [activeTab, setActiveTab] = useState(() => {
    // Check for tab param in URL on initial load
    const tabParam = searchParams.get('tab');
    return tabParam && ['account', 'membership', 'orders', 'earn', 'settings'].includes(tabParam) 
      ? tabParam 
      : 'account';
  });
  const [solanaWallet, setSolanaWallet] = useState('');
  const [isEditingWallet, setIsEditingWallet] = useState(false);
  const [savingWallet, setSavingWallet] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  const selectedAffiliate = allAffiliates.find(a => a.id === selectedAffiliateId) || allAffiliates[0];

  const [weeklyData, setWeeklyData] = useState<{ day: string; value: number }[]>([
    { day: 'Mon', value: 0 },
    { day: 'Tue', value: 0 },
    { day: 'Wed', value: 0 },
    { day: 'Thu', value: 0 },
    { day: 'Fri', value: 0 },
    { day: 'Sat', value: 0 },
    { day: 'Sun', value: 0 },
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        // Load essential data in parallel for speed
        const [profileResult, membershipResult, affiliatesResult, ordersResult, statsResult] = await Promise.all([
          // Profile
          supabase
            .from('profiles')
            .select('username, solana_wallet')
            .eq('user_id', currentUser.id)
            .maybeSingle(),
          // Membership
          supabase
            .from('user_spending')
            .select('*')
            .eq('user_id', currentUser.id)
            .maybeSingle(),
          // Affiliates
          supabase
            .from('affiliates')
            .select('*')
            .or(`user_id.eq.${currentUser.id},email.eq.${currentUser.email}`)
            .order('created_at', { ascending: true }),
          // Orders (limited)
          supabase
            .from('orders')
            .select('id, package_name, data_amount, status, created_at')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })
            .limit(10),
          // Contribution stats via edge function (replaces heavy direct reads)
          supabase.functions.invoke('get-contribution-stats')
        ]);

        // Process profile
        const profileData = profileResult.data;
        const username = profileData?.username || currentUser.email?.split('@')[0] || 'User';
        setProfile({
          username,
          email: currentUser.email || '',
          solana_wallet: profileData?.solana_wallet
        });
        setEditedUsername(username);
        setSolanaWallet(profileData?.solana_wallet || '');

        // Process membership
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

        // Process contribution stats from edge function
        if (statsResult.data && !statsResult.error) {
          const stats = statsResult.data;
          setUserPoints({
            total_points: stats.points?.total || 0,
            total_distance_meters: stats.points?.total_distance_meters || 0
          });
          // Use weekly data from backend
          if (stats.weekly_data && stats.weekly_data.length > 0) {
            setWeeklyData(stats.weekly_data);
          }
        } else {
          console.error('Stats fetch error:', statsResult.error);
          setUserPoints({ total_points: 0, total_distance_meters: 0 });
        }

        // Process affiliates
        const affiliatesData = affiliatesResult.data;
        if (affiliatesData && affiliatesData.length > 0) {
          setAllAffiliates(affiliatesData);
          const highestTier = affiliatesData.reduce((prev, current) => 
            (current.tier_level > prev.tier_level) ? current : prev
          );
          setSelectedAffiliateId(highestTier.id);
        }

        // Process orders
        setOrders(ordersResult.data || []);
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

      {/* Tabs - Simplified for mainstream users */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-auto p-1.5 bg-card/50 border border-border/50 backdrop-blur-sm rounded-2xl">
          <TabsTrigger 
            value="account" 
            className="flex flex-col items-center gap-1 py-2.5 text-[11px] rounded-xl transition-all data-[state=active]:animate-stat-pop data-[state=active]:bg-white/10"
            onClick={() => lightTap()}
          >
            <User className="w-4 h-4" />
            Me
          </TabsTrigger>
          <TabsTrigger 
            value="membership" 
            className="flex flex-col items-center gap-1 py-2.5 text-[11px] rounded-xl transition-all data-[state=active]:animate-stat-pop data-[state=active]:bg-white/10"
            onClick={() => lightTap()}
          >
            <Award className="w-4 h-4" />
            Rewards
          </TabsTrigger>
          <TabsTrigger 
            value="orders" 
            className="flex flex-col items-center gap-1 py-2.5 text-[11px] rounded-xl transition-all data-[state=active]:animate-stat-pop data-[state=active]:bg-white/10"
            onClick={() => lightTap()}
          >
            <Package className="w-4 h-4" />
            My eSIMs
          </TabsTrigger>
          <TabsTrigger 
            value="earn" 
            className="flex flex-col items-center gap-1 py-2.5 text-[11px] rounded-xl transition-all data-[state=active]:animate-stat-pop data-[state=active]:bg-white/10"
            onClick={() => lightTap()}
          >
            <Gift className="w-4 h-4" />
            Invite
          </TabsTrigger>
          <TabsTrigger 
            value="settings" 
            className="flex flex-col items-center gap-1 py-2.5 text-[11px] rounded-xl transition-all data-[state=active]:animate-stat-pop data-[state=active]:bg-white/10"
            onClick={() => lightTap()}
          >
            <Shield className="w-4 h-4" />
            Settings
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

        {/* Rewards Tab - Priority: Contribution Boosts > Referral Commission > Cashback */}
        <TabsContent value="membership" className="mt-4 space-y-4 animate-tab-content-in">
          {/* Total Earnings Summary (Referral + Cashback only - real money) */}
          <Card className="bg-gradient-to-br from-primary/20 via-neon-cyan/10 to-green-500/10 border-0 overflow-hidden animate-stat-pop">
            <CardContent className="p-5">
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground mb-1">Total Earnings</p>
                <p className="text-4xl font-bold text-foreground">
                  $<AnimatedCounter 
                    value={totalCashbackEarned + (selectedAffiliate?.total_earnings_usd || 0)} 
                    decimals={2} 
                    duration={1500} 
                  />
                </p>
                <p className="text-xs text-muted-foreground mt-1">Referral commissions + cashback 💰</p>
              </div>
              
              {/* Two earning types grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-background/40 rounded-xl p-3 text-center">
                  <Users className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-xl font-bold text-primary">${(selectedAffiliate?.total_earnings_usd || 0).toFixed(2)}</p>
                  <p className="text-[10px] text-muted-foreground">Referral Commission</p>
                </div>
                <div className="bg-background/40 rounded-xl p-3 text-center">
                  <Wallet className="w-5 h-5 text-green-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-green-500">${totalCashbackEarned.toFixed(2)}</p>
                  <p className="text-[10px] text-muted-foreground">Cashback</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contribution Boosts - Priority 1 (shows recruits & bonus earning rate) */}
          <Card className="bg-gradient-to-br from-neon-cyan/20 to-transparent border-neon-cyan/30 overflow-hidden" style={{ animationDelay: '50ms' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-neon-cyan/20">
                  <Zap className="w-5 h-5 text-neon-cyan" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-foreground">Reward Boost</h3>
                  <p className="text-xs text-muted-foreground">Earn more points when you refer friends</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-neon-cyan">
                    +{selectedAffiliate?.miner_boost_percentage || 0}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">bonus active</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-background/40 rounded-lg p-3 text-center">
                  <UserPlus className="w-4 h-4 text-neon-cyan mx-auto mb-1" />
                  <p className="text-xl font-semibold text-foreground">
                    {selectedAffiliate?.total_registrations || 0}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Recruits</p>
                </div>
                <div className="bg-background/40 rounded-lg p-3 text-center">
                  <TrendingUp className="w-4 h-4 text-green-500 mx-auto mb-1" />
                  <p className="text-xl font-semibold text-neon-cyan">
                    +{selectedAffiliate?.miner_boost_percentage || 0}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">Bonus Earning</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Invite friends to increase your boost!</p>
                <p className="text-sm font-medium text-neon-cyan">More recruits = Higher bonus % 🚀</p>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs mt-3 border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10" 
                onClick={() => setActiveTab('earn')}
              >
                <Gift className="w-3 h-3 mr-1" />
                Invite Friends
              </Button>
            </CardContent>
          </Card>

          {/* Referral Commission - Priority 2 (only shows sales/conversions, not recruits) */}
          <Card className="bg-card/50 border-border/50 overflow-hidden" style={{ animationDelay: '100ms' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-primary/20">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-foreground">Referral Commission</h3>
                  <p className="text-xs text-muted-foreground">Earn when your referrals buy eSIMs</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">
                    $<AnimatedCounter value={selectedAffiliate?.total_earnings_usd || 0} decimals={2} duration={1000} />
                  </p>
                  <p className="text-[10px] text-muted-foreground">earned</p>
                </div>
              </div>
              
              {selectedAffiliate ? (
                <>
                  <div className="bg-background/40 rounded-xl p-3 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-muted-foreground">Sales</span>
                      </div>
                      <p className="text-lg font-semibold text-foreground">
                        {selectedAffiliate.total_conversions || 0}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-3">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-muted-foreground">Commission Rate</span>
                      <span className="font-semibold text-primary">{selectedAffiliate.commission_rate || 9}%</span>
                    </div>
                    {affiliateTierInfo && affiliateTierInfo.nextTier && (
                      <>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">
                            Tier {affiliateTierInfo.currentTier.level}: {affiliateTierInfo.currentTier.name}
                          </span>
                          <span className="text-foreground">
                            {affiliateTierInfo.remaining} sales to {affiliateTierInfo.nextTier.name}
                          </span>
                        </div>
                        <AnimatedProgressBar 
                          value={selectedAffiliate.total_conversions || 0} 
                          max={affiliateTierInfo.nextTier.conversions} 
                          showPercentage={false}
                        />
                      </>
                    )}
                  </div>
                </>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs" 
                  onClick={() => setActiveTab('earn')}
                >
                  <Gift className="w-3 h-3 mr-1" />
                  Get Your Referral Link
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Cashback - Priority 3 */}
          <Card className={cn('border-0 overflow-hidden bg-gradient-to-br', tierConfig.bg, 'to-transparent')} style={{ animationDelay: '150ms' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={cn('p-2 rounded-xl', tierConfig.bg)}>
                  <TierIcon className={cn('w-5 h-5', tierConfig.color)} />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-foreground">Cashback</h3>
                  <p className="text-xs text-muted-foreground">{membership?.cashback_rate}% back on your purchases</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-500">
                    $<AnimatedCounter value={totalCashbackEarned} decimals={2} duration={1000} />
                  </p>
                  <p className="text-[10px] text-muted-foreground">saved</p>
                </div>
              </div>
              
              <div className="bg-background/40 rounded-xl p-3 mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Tier: {tierConfig.friendlyName}</span>
                  <span className="font-semibold text-green-500">{membership?.cashback_rate}% rate</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Lifetime Spending</span>
                  <span className="font-semibold text-foreground">${(membership?.total_spent_usd || 0).toFixed(2)}</span>
                </div>
              </div>
              
              {nextTier && (
                <div className="space-y-2 bg-white/5 rounded-xl p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Next: {nextTier.name} ({nextTier.rate}%)</span>
                    <span className="text-foreground">${(nextTier.remaining).toFixed(0)} to go</span>
                  </div>
                  <AnimatedProgressBar 
                    value={membership?.total_spent_usd || 0} 
                    max={nextTier.threshold} 
                    showPercentage={false}
                  />
                </div>
              )}

              {!nextTier && (
                <div className="flex items-center justify-center gap-2 text-xs bg-gradient-to-r from-violet-500/20 to-primary/20 rounded-xl p-2">
                  <Crown className="w-4 h-4 text-primary" />
                  <span className="font-medium">Max tier! 10% cashback 🏆</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Refresh */}
          <Button variant="ghost" size="sm" onClick={loadData} className="w-full text-xs text-muted-foreground">
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh Rewards
          </Button>
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

        {/* Settings Tab - Combined Privacy, Wallet, Analytics */}
        <TabsContent value="settings" className="mt-4 space-y-4 animate-tab-content-in">
          {/* Analytics Summary */}
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-neon-cyan/20">
                  <BarChart3 className="w-5 h-5 text-neon-cyan" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Your Activity</h3>
                  <p className="text-xs text-muted-foreground">Points and distance tracked</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{userPoints?.total_points?.toLocaleString() || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Points</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{((userPoints?.total_distance_meters || 0) / 1000).toFixed(1)} km</p>
                  <p className="text-xs text-muted-foreground">Distance</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Section - Simplified and friendly */}
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-violet-500/20">
                    <Wallet className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Payout Wallet</h3>
                    <p className="text-xs text-muted-foreground">Optional - for advanced users</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsEditingWallet(!isEditingWallet)}
                  className="text-xs"
                >
                  {profile?.solana_wallet ? 'Edit' : 'Add'}
                </Button>
              </div>
              
              {isEditingWallet && (
                <div className="space-y-3 pt-2 border-t border-border/50">
                  <Input
                    value={solanaWallet}
                    onChange={(e) => {
                      setSolanaWallet(e.target.value);
                      setWalletError(null);
                    }}
                    placeholder="Solana wallet address"
                    className="font-mono text-sm bg-background/50"
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
                <p className="text-xs font-mono text-muted-foreground truncate bg-white/5 rounded-lg px-3 py-2">
                  {profile.solana_wallet.slice(0, 8)}...{profile.solana_wallet.slice(-8)}
                </p>
              )}
            </CardContent>
          </Card>

          {/* App Settings */}
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="font-medium text-foreground">{t('appSettings')}</h3>
              </div>
              
              {/* Replay Tutorial Button */}
              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={() => {
                  lightTap();
                  localStorage.removeItem('hasSeenOnboarding');
                  toast({ title: t('appTutorialReset'), description: t('appTutorialResetDesc') });
                }}
              >
                <span>{t('appReplayTutorial')}</span>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Privacy Controls */}
          <PrivacyControls />
        </TabsContent>

        {/* Earn Tab - Shows all 3 referral program tiers */}
        <TabsContent value="earn" className="mt-4 space-y-4 animate-tab-content-in">
          {allAffiliates.length > 0 && selectedAffiliate ? (
            <>
              {/* Centered Avatar & Name */}
              <div className="flex flex-col items-center py-4">
                <AnimatedAvatar
                  initial={(selectedAffiliate.username || selectedAffiliate.affiliate_code).charAt(0)}
                  tier="explorer"
                  className="mb-3"
                />
                <h2 className="text-xl font-bold text-foreground animate-fade-in">
                  {selectedAffiliate.username || selectedAffiliate.affiliate_code}
                </h2>
              </div>

              {/* Total Earnings */}
              <Card className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/30 animate-stat-pop">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Total Earned</p>
                  <p className="text-4xl font-bold text-green-500 tabular-nums">
                    $<AnimatedCounter value={selectedAffiliate.total_earnings_usd || 0} decimals={2} duration={1800} />
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">From sharing with friends! 🎉</p>
                </CardContent>
              </Card>

              {/* Invite Friend Button */}
              <Button 
                onClick={handleShare} 
                size="xl" 
                className="w-full bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90 text-primary-foreground font-semibold py-6 text-base active:scale-95 transition-transform rounded-2xl shadow-lg"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Share with Friends
              </Button>

              {/* Referral Program Tiers */}
              <div className="space-y-3">
                {/* Tier 1: Reward Boost - Matches DB levels: 5→10%, 15→20%, 30→40%, 50→70%, 100→100% */}
                <Card className="bg-gradient-to-br from-neon-cyan/10 to-transparent border-neon-cyan/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-xl bg-neon-cyan/20">
                        <Zap className="w-5 h-5 text-neon-cyan" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground text-sm">Reward Boost</h4>
                        <p className="text-xs text-muted-foreground">More recruits = higher earning rate</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-neon-cyan">+{selectedAffiliate.miner_boost_percentage || 0}%</p>
                        <p className="text-[10px] text-muted-foreground">active</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-6 gap-1 text-center text-[10px]">
                      <div className={`p-1.5 rounded-lg ${(selectedAffiliate.total_registrations || 0) >= 5 ? 'bg-neon-cyan/20 text-neon-cyan' : 'bg-muted/20 text-muted-foreground'}`}>
                        <p className="font-bold">5</p>
                        <p>+10%</p>
                      </div>
                      <div className={`p-1.5 rounded-lg ${(selectedAffiliate.total_registrations || 0) >= 15 ? 'bg-neon-cyan/20 text-neon-cyan' : 'bg-muted/20 text-muted-foreground'}`}>
                        <p className="font-bold">15</p>
                        <p>+20%</p>
                      </div>
                      <div className={`p-1.5 rounded-lg ${(selectedAffiliate.total_registrations || 0) >= 30 ? 'bg-neon-cyan/20 text-neon-cyan' : 'bg-muted/20 text-muted-foreground'}`}>
                        <p className="font-bold">30</p>
                        <p>+40%</p>
                      </div>
                      <div className={`p-1.5 rounded-lg ${(selectedAffiliate.total_registrations || 0) >= 50 ? 'bg-neon-cyan/20 text-neon-cyan' : 'bg-muted/20 text-muted-foreground'}`}>
                        <p className="font-bold">50</p>
                        <p>+70%</p>
                      </div>
                      <div className={`p-1.5 rounded-lg ${(selectedAffiliate.total_registrations || 0) >= 100 ? 'bg-neon-cyan/20 text-neon-cyan' : 'bg-muted/20 text-muted-foreground'}`}>
                        <p className="font-bold">100</p>
                        <p>+100%</p>
                      </div>
                      <div className="p-1.5 rounded-lg bg-muted/10 text-muted-foreground/50">
                        <p className="font-bold text-[9px]">∞</p>
                        <p className="text-[9px]">max</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tier 2: Sales Commission */}
                <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-xl bg-primary/20">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground text-sm">Sales Commission</h4>
                        <p className="text-xs text-muted-foreground">Earn when referrals buy eSIMs</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">{selectedAffiliate.commission_rate || 9}%</p>
                        <p className="text-[10px] text-muted-foreground">rate</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className={`p-2 rounded-lg ${selectedAffiliate.tier_level >= 1 ? 'bg-primary/20' : 'bg-muted/20'}`}>
                        <p className={`font-bold ${selectedAffiliate.tier_level >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>9%</p>
                        <p className="text-[10px] text-muted-foreground">Level 1</p>
                        <p className="text-[9px] text-muted-foreground">Direct</p>
                      </div>
                      <div className={`p-2 rounded-lg ${selectedAffiliate.tier_level >= 2 ? 'bg-purple-500/20' : 'bg-muted/20'}`}>
                        <p className={`font-bold ${selectedAffiliate.tier_level >= 2 ? 'text-purple-500' : 'text-muted-foreground'}`}>+6%</p>
                        <p className="text-[10px] text-muted-foreground">Level 2</p>
                        <p className="text-[9px] text-muted-foreground">10+ sales</p>
                      </div>
                      <div className={`p-2 rounded-lg ${selectedAffiliate.tier_level >= 3 ? 'bg-amber-500/20' : 'bg-muted/20'}`}>
                        <p className={`font-bold ${selectedAffiliate.tier_level >= 3 ? 'text-amber-500' : 'text-muted-foreground'}`}>+3%</p>
                        <p className="text-[10px] text-muted-foreground">Level 3</p>
                        <p className="text-[9px] text-muted-foreground">30+ sales</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tier 3: Network Earnings */}
                <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-green-500/20">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground text-sm">Network Earnings</h4>
                        <p className="text-xs text-muted-foreground">Earn from your referrals' contributions</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-500">+5%</p>
                        <p className="text-[10px] text-muted-foreground">of their rewards</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Stats Summary */}
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-foreground">Your Stats</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-background/40 rounded-lg p-3">
                      <UserPlus className="w-4 h-4 text-sky-500 mx-auto mb-1" />
                      <p className="text-lg font-semibold text-foreground">{selectedAffiliate.total_registrations || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Recruits</p>
                    </div>
                    <div className="bg-background/40 rounded-lg p-3">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto mb-1" />
                      <p className="text-lg font-semibold text-foreground">{selectedAffiliate.total_conversions || 0}</p>
                      <p className="text-[10px] text-muted-foreground">Sales</p>
                    </div>
                    <div className="bg-background/40 rounded-lg p-3">
                      <Zap className="w-4 h-4 text-neon-cyan mx-auto mb-1" />
                      <p className="text-lg font-semibold text-neon-cyan">+{selectedAffiliate.miner_boost_percentage || 0}%</p>
                      <p className="text-[10px] text-muted-foreground">Boost</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Add New Link */}
              {allAffiliates.length < 3 && (
                <Card className="bg-card/50 border-border/50 border-dashed">
                  <CardContent className="p-4">
                    <div 
                      className="flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all"
                      onClick={() => {
                        lightTap();
                        setShowNewLinkInput(true);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                          <Plus className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Add another link</p>
                          <p className="text-xs text-muted-foreground">{allAffiliates.length}/3 links used</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* New Link Input */}
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
            /* No Affiliate - Create First with all 3 tiers explained */
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <Gift className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground mb-1">3 Ways to Earn</h3>
                  <p className="text-sm text-muted-foreground">
                    Create your link and start earning from referrals
                  </p>
                </div>
                
                {/* 3 Tier Overview */}
                <div className="space-y-2 text-left">
                  <div className="flex items-center gap-3 p-3 bg-neon-cyan/10 rounded-xl">
                    <Zap className="w-5 h-5 text-neon-cyan" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Reward Boost</p>
                      <p className="text-xs text-muted-foreground">Up to +100% on your points</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-xl">
                    <Users className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Sales Commission</p>
                      <p className="text-xs text-muted-foreground">Up to 18% multi-tier</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Network Earnings</p>
                      <p className="text-xs text-muted-foreground">+5% of referrals' rewards</p>
                    </div>
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
