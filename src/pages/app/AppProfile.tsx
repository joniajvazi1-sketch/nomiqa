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
  ChevronRight,
  Pencil,
  Check,
  X,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  affiliate_code: string;
  total_earnings_usd: number;
  total_conversions: number;
  total_registrations: number;
  tier_level: number;
  commission_rate: number;
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

export const AppProfile: React.FC = () => {
  const navigate = useNavigate();
  const { lightTap, success } = useHaptics();
  const { share, copyToClipboard } = useNativeShare();
  const { toast } = useToast();
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [membership, setMembership] = useState<MembershipData | null>(null);
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [editedUsername, setEditedUsername] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);

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

        // Load affiliate
        const { data: affiliateData } = await supabase
          .from('affiliates')
          .select('*')
          .or(`user_id.eq.${currentUser.id},email.eq.${currentUser.email}`)
          .maybeSingle();
        setAffiliate(affiliateData);

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
          {/* Current Tier Card */}
          <Card className={cn(
            'border-0 overflow-hidden',
            tierConfig.bg
          )}>
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
              
              {/* Cashback Earned */}
              <div className="bg-background/50 rounded-lg p-3 mb-3">
                <p className="text-xs text-muted-foreground mb-1">Total Cashback Earned</p>
                <p className="text-2xl font-bold text-primary">${totalCashbackEarned.toFixed(2)}</p>
              </div>

              {/* Progress to Next Tier */}
              {nextTier && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Progress to {nextTier.name}</span>
                    <span className="font-medium">{Math.round(nextTier.progress)}%</span>
                  </div>
                  <div className="h-2 bg-background/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${nextTier.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ${nextTier.remaining.toFixed(2)} more to unlock
                  </p>
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

          {/* Spending Stats */}
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
                <Button onClick={() => navigate('/app/shop')}>
                  Browse Plans
                </Button>
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => (
              <Card key={order.id} className="bg-card/50 border-border/50">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground text-sm">{order.package_name || 'eSIM Plan'}</p>
                      <p className="text-xs text-muted-foreground">{order.data_amount}</p>
                    </div>
                    <Badge 
                      variant={order.status === 'completed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {order.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Earn Tab */}
        <TabsContent value="earn" className="mt-4 space-y-4">
          {affiliate ? (
            <>
              {/* Referral Link */}
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-2">Your Referral Link</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm truncate bg-background/50 px-3 py-2 rounded">
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

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="bg-card/50 border-border/50">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Total Earnings</p>
                    <p className="text-xl font-bold text-green-500">${affiliate.total_earnings_usd?.toFixed(2) || '0.00'}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/50 border-border/50">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Referrals</p>
                    <p className="text-xl font-bold text-foreground">{affiliate.total_registrations || 0}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/50 border-border/50">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Conversions</p>
                    <p className="text-xl font-bold text-foreground">{affiliate.total_conversions || 0}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/50 border-border/50">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Commission</p>
                    <p className="text-xl font-bold text-primary">{affiliate.commission_rate || 9}%</p>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card className="bg-card/50 border-border/50 border-dashed">
              <CardContent className="p-6 text-center">
                <Gift className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                <h3 className="font-semibold text-foreground mb-1">Start Earning</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Refer friends and earn up to 18% commission
                </p>
                <Button onClick={() => navigate('/affiliate')}>
                  Join Program
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
