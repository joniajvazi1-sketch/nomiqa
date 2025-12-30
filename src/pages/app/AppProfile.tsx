import React, { useEffect, useState } from 'react';
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
  Loader2,
  Copy,
  Share2,
  Pencil,
  Check,
  X,
  RefreshCw,
  Users,
  DollarSign,
  UserPlus,
  CheckCircle2,
  Plus,
  ChevronDown
} from 'lucide-react';
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

interface UserProfile {
  username: string;
  email: string;
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
  { level: 1, name: 'Starter', conversions: 0, commission: '9%' },
  { level: 2, name: 'Pro', conversions: 10, commission: '9% + 6%' },
  { level: 3, name: 'Elite', conversions: 30, commission: '9% + 6% + 3%' }
];

export const AppProfile: React.FC = () => {
  const navigate = useNavigate();
  const { lightTap, success } = useHaptics();
  const { share, copyToClipboard } = useNativeShare();
  const { toast } = useToast();
  
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

  const selectedAffiliate = allAffiliates.find(a => a.id === selectedAffiliateId) || allAffiliates[0];

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
          .select('username')
          .eq('user_id', currentUser.id)
          .maybeSingle();

        const username = profileData?.username || currentUser.email?.split('@')[0] || 'User';
        setProfile({
          username,
          email: currentUser.email || ''
        });
        setEditedUsername(username);

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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const tierConfig = membership ? getTierConfig(membership.membership_tier) : getTierConfig('beginner');
  const TierIcon = tierConfig.icon;
  const nextTier = getNextTierInfo();
  const affiliateTierInfo = getAffiliateTierInfo();

  return (
    <div className="px-4 py-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <p className="text-sm text-muted-foreground">Your account & rewards</p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="w-5 h-5" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-card/50 border border-border/50">
          <TabsTrigger value="account" className="flex flex-col items-center gap-1 py-2 text-[10px]">
            <User className="w-4 h-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="membership" className="flex flex-col items-center gap-1 py-2 text-[10px]">
            <Award className="w-4 h-4" />
            Tier
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex flex-col items-center gap-1 py-2 text-[10px]">
            <Package className="w-4 h-4" />
            eSIMs
          </TabsTrigger>
          <TabsTrigger value="earn" className="flex flex-col items-center gap-1 py-2 text-[10px]">
            <Gift className="w-4 h-4" />
            Earn
          </TabsTrigger>
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account" className="mt-4 space-y-4">
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
                    <Button size="icon" variant="ghost" onClick={handleSaveUsername} disabled={savingUsername}>
                      {savingUsername ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-green-500" />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => { setIsEditingUsername(false); setEditedUsername(profile?.username || ''); }}>
                      <X className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold text-foreground">{profile?.username}</p>
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Membership Tab */}
        <TabsContent value="membership" className="mt-4 space-y-4">
          <Card className={cn('border-0 overflow-hidden', tierConfig.bg)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={cn('p-2 rounded-full', tierConfig.bg)}>
                  <TierIcon className={cn('w-6 h-6', tierConfig.color)} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground capitalize">{membership?.membership_tier}</h3>
                  <p className="text-xs text-muted-foreground">{membership?.cashback_rate}% cashback</p>
                </div>
              </div>
              
              <div className="bg-background/50 rounded-lg p-3 mb-3">
                <p className="text-xs text-muted-foreground mb-1">Total Cashback Earned</p>
                <p className="text-2xl font-bold text-primary">${totalCashbackEarned.toFixed(2)}</p>
              </div>

              {nextTier && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Progress to {nextTier.name}</span>
                    <span className="font-medium">{Math.round(nextTier.progress)}%</span>
                  </div>
                  <div className="h-2 bg-background/50 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${nextTier.progress}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground">${nextTier.remaining.toFixed(2)} more to unlock</p>
                </div>
              )}

              {!nextTier && (
                <div className="flex items-center gap-2 text-sm">
                  <Crown className="w-4 h-4 text-primary" />
                  <span>Highest tier reached!</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Lifetime Spending</p>
                  <p className="text-xl font-bold text-foreground">${membership?.total_spent_usd.toFixed(2)}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={loadData}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="mt-4 space-y-3">
          {orders.length === 0 ? (
            <Card className="bg-card/50 border-border/50 border-dashed">
              <CardContent className="p-6 text-center">
                <Package className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground text-sm mb-3">No eSIMs yet</p>
                <Button onClick={() => navigate('/app/shop')}>Browse Plans</Button>
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => {
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
                <Card key={order.id} className="bg-card/50 border-border/50">
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

        {/* Earn Tab - Full Affiliate System */}
        <TabsContent value="earn" className="mt-4 space-y-4">
          {allAffiliates.length > 0 ? (
            <>
              {/* Affiliate Account Selector */}
              {allAffiliates.length > 1 && (
                <Card className="bg-card/50 border-border/50">
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground mb-2">Select Affiliate Account</p>
                    <Select value={selectedAffiliateId} onValueChange={setSelectedAffiliateId}>
                      <SelectTrigger className="w-full bg-background/50">
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {allAffiliates.map((aff) => (
                          <SelectItem key={aff.id} value={aff.id}>
                            <div className="flex items-center gap-2">
                              <span>{aff.username || aff.affiliate_code}</span>
                              <Badge variant="outline" className="text-[10px]">Tier {aff.tier_level}</Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              )}

              {/* Selected Affiliate Details */}
              {selectedAffiliate && (
                <>
                  {/* Referral Links */}
                  <Card className="bg-card/50 border-border/50">
                    <CardContent className="p-4 space-y-3">
                      <p className="text-xs text-muted-foreground">Your Referral Link</p>
                      
                      {/* Username Link (if available) */}
                      {selectedAffiliate.username && (
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-xs truncate bg-background/50 px-3 py-2 rounded">
                            nomiqa.com/{selectedAffiliate.username}
                          </code>
                          <Button size="icon" variant="outline" className="shrink-0" onClick={() => handleCopyLink(selectedAffiliate.username!, true)}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      
                      {/* Code Link */}
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs truncate bg-background/50 px-3 py-2 rounded">
                          nomiqa.com/r/{selectedAffiliate.affiliate_code}
                        </code>
                        <Button size="icon" variant="outline" className="shrink-0" onClick={() => handleCopyLink(selectedAffiliate.affiliate_code)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="outline" className="shrink-0" onClick={handleShare}>
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Stats Grid - Registrations & Conversions Separate */}
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="bg-card/50 border-border/50">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <UserPlus className="w-3 h-3 text-blue-500" />
                          <span className="text-[10px] text-muted-foreground">Registrations</span>
                        </div>
                        <p className="text-xl font-bold text-foreground">{selectedAffiliate.total_registrations || 0}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-card/50 border-border/50">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="w-3 h-3 text-green-500" />
                          <span className="text-[10px] text-muted-foreground">Conversions</span>
                        </div>
                        <p className="text-xl font-bold text-foreground">{selectedAffiliate.total_conversions || 0}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-card/50 border-border/50">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="w-3 h-3 text-green-500" />
                          <span className="text-[10px] text-muted-foreground">Total Earnings</span>
                        </div>
                        <p className="text-xl font-bold text-green-500">${(selectedAffiliate.total_earnings_usd || 0).toFixed(2)}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-card/50 border-border/50">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className="w-3 h-3 text-amber-500" />
                          <span className="text-[10px] text-muted-foreground">Mining Boost</span>
                        </div>
                        <p className="text-xl font-bold text-amber-500">+{selectedAffiliate.miner_boost_percentage || 0}%</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Sales Tier Progress */}
                  {affiliateTierInfo && (
                    <Card className="bg-card/50 border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Sales Tier</p>
                            <p className="font-bold text-foreground">{affiliateTierInfo.currentTier.name}</p>
                          </div>
                          <Badge variant="outline" className="text-primary">
                            {affiliateTierInfo.currentTier.commission}
                          </Badge>
                        </div>
                        
                        {affiliateTierInfo.nextTier && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Progress to {affiliateTierInfo.nextTier.name}</span>
                              <span>{Math.round(affiliateTierInfo.progress)}%</span>
                            </div>
                            <div className="h-2 bg-background/50 rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${affiliateTierInfo.progress}%` }} />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {affiliateTierInfo.remaining} more conversions needed
                            </p>
                          </div>
                        )}
                        
                        {!affiliateTierInfo.nextTier && (
                          <div className="flex items-center gap-2 text-sm text-amber-500">
                            <Crown className="w-4 h-4" />
                            <span>Max tier reached!</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Create Additional Link */}
                  {allAffiliates.length < 3 && (
                    <Card className="bg-card/50 border-border/50 border-dashed">
                      <CardContent className="p-4">
                        {showNewLinkInput ? (
                          <div className="space-y-3">
                            <p className="text-sm font-medium">Create New Affiliate Link</p>
                            <Input
                              placeholder="Enter username (e.g., mylink)"
                              value={newLinkUsername}
                              onChange={(e) => setNewLinkUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                              className="bg-background/50"
                            />
                            <div className="flex gap-2">
                              <Button onClick={createAffiliate} disabled={creatingAffiliate} className="flex-1">
                                {creatingAffiliate ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                Create Link
                              </Button>
                              <Button variant="outline" onClick={() => { setShowNewLinkInput(false); setNewLinkUsername(''); }}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button variant="ghost" className="w-full" onClick={() => setShowNewLinkInput(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Link ({allAffiliates.length}/3)
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </>
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
                  Create My First Link
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
