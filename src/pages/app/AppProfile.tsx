import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  User, Package, LogOut, Crown, Star, Sparkles,
  Share2, Pencil, Check, X, RefreshCw, Users,
  Wallet, MapPin, Activity, Shield, Loader2, Gift
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Volume2, VolumeX } from 'lucide-react';
import { useEnhancedHaptics } from '@/hooks/useEnhancedHaptics';
import { useEnhancedSounds } from '@/hooks/useEnhancedSounds';
import { AppSpinner } from '@/components/app/AppSpinner';
import { useNativeShare } from '@/hooks/useNativeShare';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PrivacyControls } from '@/components/app/PrivacyControls';
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
  beginner: { icon: Star, color: 'text-amber-400', bg: 'bg-amber-400/20', name: 'Starter' },
  traveler: { icon: Crown, color: 'text-sky-400', bg: 'bg-sky-400/20', name: 'Traveler' },
  adventurer: { icon: Crown, color: 'text-amber-500', bg: 'bg-amber-500/20', name: 'Adventurer' },
  explorer: { icon: Sparkles, color: 'text-violet-400', bg: 'bg-violet-400/20', name: 'Explorer' }
};

export const AppProfile: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { buttonTap, successPattern, selectionTap } = useEnhancedHaptics();
  const { soundEnabled, toggleSound, playSuccess } = useEnhancedSounds();
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
  const [userPoints, setUserPoints] = useState<{ total_points: number; total_distance_meters: number } | null>(null);
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    return tabParam && ['account', 'orders', 'settings'].includes(tabParam) ? tabParam : 'account';
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
          supabase.from('profiles').select('username, solana_wallet').eq('user_id', currentUser.id).maybeSingle(),
          supabase.from('user_spending').select('*').eq('user_id', currentUser.id).maybeSingle(),
          supabase.from('affiliates').select('*').or(`user_id.eq.${currentUser.id},email.eq.${currentUser.email}`).order('tier_level', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('orders').select('id, package_name, data_amount, status, created_at').eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(10),
          supabase.functions.invoke('get-contribution-stats')
        ]);

        const profileData = profileResult.data;
        const username = profileData?.username || currentUser.email?.split('@')[0] || 'User';
        setProfile({ username, email: currentUser.email || '', solana_wallet: profileData?.solana_wallet });
        setEditedUsername(username);
        setSolanaWallet(profileData?.solana_wallet || '');

        let membershipData = membershipResult.data;
        if (!membershipData) {
          const { data: newMembership } = await supabase.from('user_spending').insert({ user_id: currentUser.id, total_spent_usd: 0 }).select().single();
          membershipData = newMembership;
        }
        setMembership(membershipData);

        if (statsResult.data && !statsResult.error) {
          setUserPoints({
            total_points: statsResult.data.points?.total || 0,
            total_distance_meters: statsResult.data.points?.total_distance_meters || 0
          });
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
    const link = affiliate.username ? `https://nomiqa.com/${affiliate.username}` : `https://nomiqa.com/r/${affiliate.affiliate_code}`;
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
    const link = affiliate.username ? `https://nomiqa.com/${affiliate.username}` : `https://nomiqa.com/r/${affiliate.affiliate_code}`;
    await share({ title: 'Join Nomiqa', text: 'Get travel eSIMs and earn rewards!', url: link });
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

      const { data: existingUser } = await supabase.from('profiles').select('id').eq('username', editedUsername.trim()).neq('user_id', session.user.id).maybeSingle();
      if (existingUser) {
        toast({ title: 'Username is already taken', variant: 'destructive' });
        setSavingUsername(false);
        return;
      }

      const { error } = await supabase.from('profiles').update({ username: editedUsername.trim() }).eq('user_id', session.user.id);
      if (error) throw error;

      setProfile(prev => prev ? { ...prev, username: editedUsername.trim() } : null);
      setIsEditingUsername(false);
      successPattern();
      playSuccess();
      toast({ title: 'Username updated!' });
    } catch (error) {
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
      return;
    }
    setSavingWallet(true);
    setWalletError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { error } = await supabase.from('profiles').update({ solana_wallet: trimmedWallet || null }).eq('user_id', session.user.id);
      if (error) throw error;
      setProfile(prev => prev ? { ...prev, solana_wallet: trimmedWallet || null } : null);
      setIsEditingWallet(false);
      successPattern();
      playSuccess();
      toast({ title: trimmedWallet ? 'Wallet saved!' : 'Wallet removed!' });
    } catch (error) {
      toast({ title: 'Failed to save wallet', variant: 'destructive' });
    } finally {
      setSavingWallet(false);
    }
  };

  const getTierConfig = (tier: string) => TIER_CONFIG[tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.beginner;
  const tierConfig = membership ? getTierConfig(membership.membership_tier) : getTierConfig('beginner');
  const TierIcon = tierConfig.icon;
  const totalCashbackEarned = membership ? (membership.total_spent_usd * membership.cashback_rate) / 100 : 0;

  if (!user && !loading) {
    return (
      <div className="px-4 py-6 flex flex-col items-center justify-center min-h-[60vh]">
        <User className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Sign in to view profile</h2>
        <p className="text-muted-foreground text-center mb-6">Access your account, orders, and rewards</p>
        <Button onClick={() => navigate('/auth')}>Sign In</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <AppSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-5 pb-24 min-h-screen overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className={cn("w-14 h-14 rounded-full flex items-center justify-center", tierConfig.bg)}>
          <span className={cn("text-xl font-bold", tierConfig.color)}>
            {profile?.username?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">{profile?.username}</h1>
            <Badge variant="outline" className={cn("text-xs", tierConfig.color, 'border-current')}>
              {tierConfig.name}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{profile?.email}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} className="active:scale-95">
          <LogOut className="w-5 h-5" />
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-card border border-border p-3 text-center">
          <Activity className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{(userPoints?.total_points || 0).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Points</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-3 text-center">
          <MapPin className="w-4 h-4 text-green-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{((userPoints?.total_distance_meters || 0) / 1000).toFixed(1)}</p>
          <p className="text-xs text-muted-foreground">km</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-3 text-center">
          <Wallet className="w-4 h-4 text-amber-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">${totalCashbackEarned.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Earned</p>
        </div>
      </div>

      {/* Referral CTA */}
      {affiliate && (
        <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Gift className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <p className="font-semibold text-foreground">Invite Friends</p>
                <p className="text-xs text-muted-foreground">Earn when they join & buy</p>
              </div>
              <Button size="sm" onClick={handleShare} className="active:scale-95">
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="font-bold text-foreground">{affiliate.total_registrations}</p>
                <p className="text-muted-foreground">Joined</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="font-bold text-green-500">${(affiliate.total_earnings_usd || 0).toFixed(2)}</p>
                <p className="text-muted-foreground">Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs - Reduced to 3 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-card border border-border rounded-xl">
          <TabsTrigger value="account" className="py-2.5 text-xs rounded-lg" onClick={() => selectionTap()}>
            <User className="w-4 h-4 mr-1" />
            Account
          </TabsTrigger>
          <TabsTrigger value="orders" className="py-2.5 text-xs rounded-lg" onClick={() => selectionTap()}>
            <Package className="w-4 h-4 mr-1" />
            eSIMs
          </TabsTrigger>
          <TabsTrigger value="settings" className="py-2.5 text-xs rounded-lg" onClick={() => selectionTap()}>
            <Shield className="w-4 h-4 mr-1" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account" className="mt-4 space-y-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Username</p>
                {isEditingUsername ? (
                  <div className="flex items-center gap-2">
                    <Input value={editedUsername} onChange={(e) => setEditedUsername(e.target.value)} className="bg-muted/50" autoFocus />
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
              <div>
                <p className="text-xs text-muted-foreground mb-1">Tier</p>
                <div className="flex items-center gap-2">
                  <TierIcon className={cn("w-4 h-4", tierConfig.color)} />
                  <p className="text-base font-medium text-foreground">{tierConfig.name}</p>
                  <span className="text-xs text-muted-foreground">({membership?.cashback_rate}% cashback)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="mt-4 space-y-3">
          {orders.length === 0 ? (
            <Card className="bg-card border-border border-dashed">
              <CardContent className="p-6 text-center">
                <EmptyStateIllustration type="orders" className="mb-2" />
                <p className="text-muted-foreground text-sm mb-1">No eSIMs yet</p>
                <p className="text-xs text-muted-foreground/60 mb-4">Your travel plans will appear here</p>
                <Button onClick={() => navigate('/app/shop')}>Browse Plans</Button>
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => {
              const getStatusDisplay = (status: string) => {
                switch (status) {
                  case 'completed': case 'active': return { label: 'Active', color: 'bg-green-500/20 text-green-400' };
                  case 'failed': case 'cancelled': return { label: 'Failed', color: 'bg-red-500/20 text-red-400' };
                  case 'expired': return { label: 'Expired', color: 'bg-muted text-muted-foreground' };
                  default: return { label: 'Processing', color: 'bg-amber-500/20 text-amber-400' };
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
                      <Badge variant="outline" className={cn('text-xs', statusDisplay.color)}>{statusDisplay.label}</Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-4 space-y-4">
          {/* Sound Toggle */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {soundEnabled ? <Volume2 className="w-5 h-5 text-primary" /> : <VolumeX className="w-5 h-5 text-muted-foreground" />}
                  <div>
                    <p className="text-sm font-medium text-foreground">Sound Effects</p>
                    <p className="text-xs text-muted-foreground">Play sounds for rewards</p>
                  </div>
                </div>
                <Switch checked={soundEnabled} onCheckedChange={() => { selectionTap(); toggleSound(); }} />
              </div>
            </CardContent>
          </Card>

          {/* Wallet - Optional */}
          <Card className="bg-card border-border">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-violet-400" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Rewards Wallet</p>
                    <p className="text-xs text-muted-foreground">Optional - for future payouts</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsEditingWallet(!isEditingWallet)} className="text-xs">
                  {profile?.solana_wallet ? 'Edit' : 'Add'}
                </Button>
              </div>
              {isEditingWallet && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <Input value={solanaWallet} onChange={(e) => { setSolanaWallet(e.target.value); setWalletError(null); }} placeholder="Solana address" className="font-mono text-sm bg-muted/50" />
                  {walletError && <p className="text-xs text-red-500">{walletError}</p>}
                  <div className="flex gap-2">
                    <Button onClick={handleSaveWallet} disabled={savingWallet} size="sm" className="flex-1">
                      {savingWallet ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setIsEditingWallet(false); setSolanaWallet(profile?.solana_wallet || ''); }}>Cancel</Button>
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

          {/* Privacy Controls */}
          <PrivacyControls />

          {/* Refresh */}
          <Button variant="ghost" size="sm" onClick={loadData} className="w-full text-xs text-muted-foreground">
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AppProfile;
