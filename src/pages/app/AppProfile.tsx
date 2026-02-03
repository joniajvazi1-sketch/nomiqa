import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { 
  User, Package, LogOut, Crown, Star, Sparkles,
  Share2, Pencil, Check, X, RefreshCw, Users,
  Wallet, MapPin, Activity, Shield, Loader2, Gift,
  Target, Trophy, ChevronRight, Trash2, AlertTriangle, HelpCircle,
  Sun, Moon
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEnhancedHaptics } from '@/hooks/useEnhancedHaptics';
import { AppSpinner } from '@/components/app/AppSpinner';
import { useNativeShare } from '@/hooks/useNativeShare';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PrivacyControls } from '@/components/app/PrivacyControls';
import { EmptyStateIllustration } from '@/components/app/EmptyStateIllustration';
import { NotificationSettings } from '@/components/app/NotificationSettings';
import { DataCollectionControls } from '@/components/app/DataCollectionControls';
import { ContributorLevelCard } from '@/components/app/ContributorLevelCard';
import { HelpCenter } from '@/components/app/HelpCenter';
import { captureError } from '@/lib/sentry';
import { SpeedTestHistory } from '@/components/app/SpeedTestHistory';
import { PermissionDebugPanel } from '@/components/app/PermissionDebugPanel';
import { AppSEO } from '@/components/app/AppSEO';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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
  const { share, copyToClipboard } = useNativeShare();
  const { toast } = useToast();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark' || theme === 'dark';
  
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
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        // Using _safe views to exclude sensitive verification/reset fields
        const [profileResult, membershipResult, affiliateResult, ordersResult, statsResult] = await Promise.all([
          supabase.from('profiles_safe').select('username, solana_wallet').eq('user_id', currentUser.id).maybeSingle(),
          supabase.from('user_spending').select('*').eq('user_id', currentUser.id).maybeSingle(),
          supabase.from('affiliates_safe').select('*').eq('user_id', currentUser.id).order('tier_level', { ascending: false }).limit(1).maybeSingle(),
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
        } else {
          // If stats fetch failed or returned empty, ensure user_points record exists
          const { data: existingPoints } = await supabase
            .from('user_points')
            .select('total_points, total_distance_meters')
            .eq('user_id', currentUser.id)
            .maybeSingle();
          
          if (!existingPoints) {
            // Create initial user_points record
            await supabase
              .from('user_points')
              .insert({ user_id: currentUser.id, total_points: 0, pending_points: 0 });
          }
          
          setUserPoints({
            total_points: existingPoints?.total_points || 0,
            total_distance_meters: existingPoints?.total_distance_meters || 0
          });
        }

        // Auto-create affiliate account if doesn't exist
        let affiliateData = affiliateResult.data;
        if (!affiliateData) {
          // Generate a unique affiliate code
          const affiliateCode = Math.random().toString(36).substring(2, 10).toUpperCase();
          const { data: newAffiliate, error: affiliateError } = await supabase
            .from('affiliates')
            .insert({ 
              user_id: currentUser.id, 
              email: currentUser.email || '',
              affiliate_code: affiliateCode,
              username: username,
              email_verified: true,
              status: 'active'
            })
            .select()
            .single();
          
          if (!affiliateError && newAffiliate) {
            affiliateData = newAffiliate;
          }
        }
        setAffiliate(affiliateData);
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
    navigate('/app/auth?mode=login');
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

      // Using _safe view for username availability check
      const { data: existingUser } = await supabase.from('profiles_safe').select('id').eq('username', editedUsername.trim()).neq('user_id', session.user.id).maybeSingle();
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
      toast({ title: trimmedWallet ? 'Wallet saved!' : 'Wallet removed!' });
    } catch (error) {
      toast({ title: 'Failed to save wallet', variant: 'destructive' });
    } finally {
      setSavingWallet(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      // Call the deletion RPC function
      const { error: rpcError } = await supabase.rpc('request_data_deletion', {
        requesting_user_id: user.id
      });
      
      if (rpcError) throw rpcError;

      // Delete the user from auth
      const { error: deleteError } = await supabase.functions.invoke('delete-user');
      
      if (deleteError) throw deleteError;

      // Sign out and redirect
      await supabase.auth.signOut();
      toast({ title: 'Account deleted', description: 'Your account and data have been removed.' });
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({ 
        title: 'Failed to delete account', 
        description: 'Please try again or contact support.',
        variant: 'destructive' 
      });
    } finally {
      setDeletingAccount(false);
    }
  };

  const getTierConfig = (tier: string) => TIER_CONFIG[tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.beginner;
  const tierConfig = membership ? getTierConfig(membership.membership_tier) : getTierConfig('beginner');
  const TierIcon = tierConfig.icon;
  const totalCashbackEarned = membership ? (membership.total_spent_usd * membership.cashback_rate) / 100 : 0;

  const getNextTierThreshold = (currentTier: string): number => {
    switch (currentTier) {
      case 'beginner': return 50;
      case 'traveler': return 150;
      case 'adventurer': return 500;
      default: return 500;
    }
  };

  if (!user && !loading) {
    return (
      <div className="px-4 py-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <User className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Sign in to view profile</h2>
        <p className="text-muted-foreground text-center mb-6">Access your account, orders, and rewards</p>
        <Button 
          onClick={() => navigate('/app/auth?mode=login')}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Sign In
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AppSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <AppSEO />
      <div className="px-4 py-6 space-y-5 pb-24 min-h-screen overflow-y-auto">
        {/* Header with glassmorphism */}
      <div className="relative rounded-2xl bg-card/80 backdrop-blur-xl border border-border p-4 overflow-hidden shadow-[var(--shadow-card)]">
        
        <div className="relative z-10 flex items-center gap-4">
          <div className={cn("w-16 h-16 rounded-full flex items-center justify-center ring-2 ring-offset-2 ring-offset-transparent bg-primary/10 ring-primary")}>
            <span className="text-2xl font-bold text-primary">
              {profile?.username?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">{profile?.username}</h1>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => { selectionTap(); setTheme(isDark ? 'light' : 'dark'); }} 
              className="active:scale-95 text-muted-foreground hover:text-foreground hover:bg-white/10"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="active:scale-95 text-muted-foreground hover:text-foreground hover:bg-white/10">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Contributor Level Card - PRIMARY identity indicator with all stats */}
      <ContributorLevelCard 
        onTap={() => { selectionTap(); navigate('/app/achievements'); }} 
      />


      {/* Tabs - Glassmorphism */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-card/80 backdrop-blur-sm border border-border rounded-xl shadow-[var(--shadow-card)]">
          <TabsTrigger value="account" className="py-2.5 text-xs rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground" onClick={() => selectionTap()}>
            <User className="w-4 h-4 mr-1" />
            Account
          </TabsTrigger>
          <TabsTrigger value="orders" className="py-2.5 text-xs rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground" onClick={() => selectionTap()}>
            <Package className="w-4 h-4 mr-1" />
            eSIMs
          </TabsTrigger>
          <TabsTrigger value="settings" className="py-2.5 text-xs rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground" onClick={() => selectionTap()}>
            <Shield className="w-4 h-4 mr-1" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account" className="mt-4 space-y-4">

          {/* Invite Friends Section - Clean banking style */}
          {affiliate && (
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">Invite Friends</p>
                    <p className="text-xs text-muted-foreground">Earn when they join & earn</p>
                  </div>
                  <Button size="sm" onClick={handleShare} className="active:scale-95">
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                </div>
                
                {/* Key motivator - Contribution value sharing */}
                <p className="text-xs text-primary font-semibold mb-3 pl-[52px]">
                  Share in the value they help create
                </p>
                
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-muted/50 p-2.5">
                    <p className="font-bold text-foreground text-lg">{affiliate.total_registrations}</p>
                    <p className="text-muted-foreground">Team Members</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2.5">
                    <p className="font-bold text-primary text-lg">{Math.round((affiliate.total_earnings_usd || 0) * 100)}</p>
                    <p className="text-muted-foreground">Team Points</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1.5">Your referral link</p>
                  <button
                    onClick={() => copyToClipboard(`nomiqa.com/${affiliate.username || affiliate.affiliate_code}`)}
                    className="w-full p-2.5 rounded-lg bg-muted/50 text-sm font-medium text-foreground flex items-center justify-between active:scale-[0.99] transition-transform"
                  >
                    <span className="truncate">nomiqa.com/{affiliate.username || affiliate.affiliate_code}</span>
                    <span className="text-xs text-primary ml-2">Copy</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Your Progress Section */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Your Progress</p>
              <div className="space-y-1">
                <button
                  onClick={() => { selectionTap(); navigate('/app/challenges'); }}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 active:scale-[0.99] transition-all -mx-1"
                >
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-blue-500" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">Challenges</p>
                      <p className="text-xs text-muted-foreground">Complete tasks, earn rewards</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => { selectionTap(); navigate('/app/leaderboard'); }}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 active:scale-[0.99] transition-all -mx-1"
                >
                  <div className="flex items-center gap-3">
                    <Crown className="w-5 h-5 text-violet-500" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">Leaderboard</p>
                      <p className="text-xs text-muted-foreground">See where you rank</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Account Details */}
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
          {/* Speed Test History */}
          <Card className="bg-card/80 backdrop-blur-sm border-border shadow-[var(--shadow-card)]">
            <CardContent className="p-4">
              <SpeedTestHistory limit={5} compact />
            </CardContent>
          </Card>

          {/* Data Collection Controls */}
          <DataCollectionControls />

          {/* Notification Settings */}
          <NotificationSettings />

          {/* Wallet - Optional */}
          <Card className="bg-card/80 backdrop-blur-sm border-border shadow-[var(--shadow-card)]">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-violet-500" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Rewards Wallet</p>
                    <p className="text-xs text-muted-foreground">Optional - for token claims</p>
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

          {/* Help Center */}
          <Card className="bg-card/80 backdrop-blur-sm border-border shadow-[var(--shadow-card)]">
            <CardContent className="p-4">
              <button
                onClick={() => { selectionTap(); setShowHelpCenter(true); }}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-blue-500" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">Help & FAQ</p>
                    <p className="text-xs text-muted-foreground">Get answers to common questions</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </CardContent>
          </Card>

          {/* Account Management - Delete Account */}
          <Card className="bg-card/80 backdrop-blur-sm border-border border-destructive/30 shadow-[var(--shadow-card)]">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Account Management</p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-destructive/10 text-left transition-colors -mx-1">
                    <Trash2 className="w-5 h-5 text-destructive" />
                    <div>
                      <p className="text-sm font-medium text-destructive">Delete Account</p>
                      <p className="text-xs text-muted-foreground">Permanently remove your data</p>
                    </div>
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="mx-4">
                  <AlertDialogHeader>
                    <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-2">
                      <AlertTriangle className="w-6 h-6 text-destructive" />
                    </div>
                    <AlertDialogTitle className="text-center">Delete Your Account?</AlertDialogTitle>
                    <AlertDialogDescription className="text-center space-y-2">
                      <p>This action cannot be undone. This will permanently delete your account and remove all associated data.</p>
                      <div className="bg-destructive/10 rounded-lg p-3 mt-3 text-destructive text-sm font-medium">
                        ⚠️ You will lose {(userPoints?.total_points || 0).toLocaleString()} points (worth ~${((userPoints?.total_points || 0) * 0.01).toFixed(2)})
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                    <AlertDialogCancel className="w-full sm:w-auto">Keep Account</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={deletingAccount}
                      className="w-full sm:w-auto bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    >
                      {deletingAccount ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      Delete Forever
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          {/* DEV ONLY - Permission Debug & Sentry Testing */}
          {import.meta.env.DEV && (
            <>
              {/* Permission Debug Panel */}
              <PermissionDebugPanel />

              {/* Sentry Testing */}
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="p-4">
                  <p className="text-xs text-destructive mb-3 font-medium">🧪 DEV ONLY - Sentry Testing</p>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => {
                        throw new Error('Test Sentry Crash - React Error');
                      }}
                    >
                      Test Crash
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs border-destructive/30 text-destructive"
                      onClick={() => {
                        captureError(new Error('Test Sentry - Handled Error'), { 
                          test: true, 
                          timestamp: new Date().toISOString() 
                        });
                        toast({ title: '✅ Handled error sent to Sentry' });
                      }}
                    >
                      Handled Error
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Refresh */}
          <Button variant="ghost" size="sm" onClick={loadData} className="w-full text-xs text-muted-foreground">
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh
          </Button>
        </TabsContent>
      </Tabs>

      {/* Help Center Modal */}
      {showHelpCenter && (
        <HelpCenter onClose={() => setShowHelpCenter(false)} />
      )}
      </div>
    </>
  );
};

export default AppProfile;
