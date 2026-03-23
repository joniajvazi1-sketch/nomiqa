import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { 
  User, Package, LogOut, Crown, Star, Sparkles,
  Share2, Pencil, Check, X, RefreshCw, Users,
  Wallet, Shield, Loader2, Gift,
  Target, ChevronRight, Trash2, AlertTriangle, HelpCircle,
  Sun, Moon, Copy, ExternalLink, Zap
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

const PROFILE_GRADIENT = 'from-primary/20 to-primary/5';

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
  
  // Referral code states
  const [isEditingReferralCode, setIsEditingReferralCode] = useState(false);
  const [newReferralCode, setNewReferralCode] = useState('');
  const [savingReferralCode, setSavingReferralCode] = useState(false);
  const [hasChangedCode, setHasChangedCode] = useState(false);
  const [appliedReferral, setAppliedReferral] = useState<boolean | null>(null);
  const [applyReferralInput, setApplyReferralInput] = useState('');
  const [applyingReferral, setApplyingReferral] = useState(false);
  const [showApplyReferral, setShowApplyReferral] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Refresh profile data when points change on other screens
  useEffect(() => {
    const handlePointsUpdated = () => {
      loadData();
    };
    window.addEventListener('points-updated', handlePointsUpdated);
    return () => {
      window.removeEventListener('points-updated', handlePointsUpdated);
    };
  }, []);

  const loadData = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        const [profileResult, affiliateResult, ordersResult, statsResult] = await Promise.all([
          supabase.from('profiles_safe').select('username, solana_wallet').eq('user_id', currentUser.id).maybeSingle(),
          supabase.from('affiliates_safe').select('*').eq('user_id', currentUser.id).order('tier_level', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('orders').select('id, package_name, data_amount, status, created_at').eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(10),
          supabase.functions.invoke('get-contribution-stats')
        ]);

        const profileData = profileResult.data;
        const username = profileData?.username || currentUser.email?.split('@')[0] || 'User';
        setProfile({ username, email: currentUser.email || '', solana_wallet: profileData?.solana_wallet });
        setEditedUsername(username);
        setSolanaWallet(profileData?.solana_wallet || '');

        if (statsResult.data && !statsResult.error) {
          setUserPoints({
            total_points: statsResult.data.points?.total || 0,
            total_distance_meters: statsResult.data.points?.total_distance_meters || 0
          });
        } else {
          const { data: existingPoints } = await supabase
            .from('user_points')
            .select('total_points, total_distance_meters')
            .eq('user_id', currentUser.id)
            .maybeSingle();
          
          if (!existingPoints) {
            await supabase
              .from('user_points')
              .insert({ user_id: currentUser.id, total_points: 0, pending_points: 0 });
          }
          
          setUserPoints({
            total_points: existingPoints?.total_points || 0,
            total_distance_meters: existingPoints?.total_distance_meters || 0
          });
        }

        let affiliateData = affiliateResult.data;
        if (!affiliateData) {
          const { data: newAffiliate, error: affiliateError } = await supabase
            .from('affiliates')
            .insert({ 
              user_id: currentUser.id, 
              email: currentUser.email || '',
              affiliate_code: username.toLowerCase(),
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

        // Auto-fix: if affiliate_code is a random code (not matching username), update it
        if (affiliateData && affiliateData.affiliate_code !== username.toLowerCase()) {
          // Check if the user has manually changed their code before
          const { data: changeAudit } = await supabase
            .from('security_audit_log')
            .select('id')
            .eq('event_type', 'affiliate_code_changed')
            .eq('user_id', currentUser.id)
            .limit(1);
          
          // Only auto-fix if user never manually changed their code
          if (!changeAudit || changeAudit.length === 0) {
            // Check if username is available as affiliate_code
            const { data: codeCollision } = await supabase
              .from('affiliates')
              .select('id')
              .eq('affiliate_code', username.toLowerCase())
              .neq('id', affiliateData.id)
              .maybeSingle();
            
            if (!codeCollision) {
              const { error: fixError } = await supabase
                .from('affiliates')
                .update({ affiliate_code: username.toLowerCase(), username: username })
                .eq('id', affiliateData.id)
                .eq('user_id', currentUser.id);
              
              if (!fixError) {
                affiliateData = { ...affiliateData, affiliate_code: username.toLowerCase(), username };
                console.log('Auto-fixed affiliate code to match username:', username.toLowerCase());
              }
            }
          }
        }

        setAffiliate(affiliateData);
        setOrders(ordersResult.data || []);

        // Check if user already has a referral applied
        try {
          const { data: referralCheck } = await supabase.functions.invoke('apply-referral-code', {
            body: { checkOnly: true }
          });
          setAppliedReferral(referralCheck?.hasReferral ?? false);
        } catch { setAppliedReferral(false); }

        // Check if referral code has been changed before (via audit log)
        if (affiliateData?.id) {
          const { data: auditLogs } = await supabase
            .from('security_audit_log')
            .select('id, details')
            .eq('event_type', 'affiliate_code_changed')
            .eq('user_id', currentUser.id)
            .limit(10);
          const changed = (auditLogs || []).some((log: any) => {
            const affiliateId = (log.details as Record<string, unknown> | null)?.affiliate_id;
            return typeof affiliateId === 'string' && affiliateId === affiliateData!.id;
          });
          setHasChangedCode(changed);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleChangeReferralCode = async () => {
    if (!newReferralCode.trim() || newReferralCode.length < 3) {
      toast({ title: 'Code must be at least 3 characters', variant: 'destructive' });
      return;
    }
    setSavingReferralCode(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-referral-code', {
        body: { referralCode: newReferralCode.trim().toLowerCase() }
      });
      const errMsg = data?.error || (error ? await (error as any)?.context?.json?.().then((b: any) => b?.error).catch(() => null) : null);
      if (errMsg) {
        const friendly = errMsg === 'Referral code already taken' ? 'This code is already taken, please choose another' : errMsg;
        throw new Error(friendly);
      }
      if (error) throw new Error('Failed to update code');
      successPattern();
      toast({ title: 'Referral code updated!' });
      setIsEditingReferralCode(false);
      setHasChangedCode(true);
      // Reload to get updated affiliate data
      loadData();
    } catch (err: any) {
      toast({ title: err.message || 'Failed to update code', variant: 'destructive' });
    } finally {
      setSavingReferralCode(false);
    }
  };

  const handleApplyReferralCode = async () => {
    if (!applyReferralInput.trim()) {
      toast({ title: 'Please enter a referral code', variant: 'destructive' });
      return;
    }
    setApplyingReferral(true);
    try {
      const { data, error } = await supabase.functions.invoke('apply-referral-code', {
        body: { referralCode: applyReferralInput.trim().toLowerCase() }
      });
      if (error) {
        const errBody = typeof error === 'object' && error !== null && 'context' in error
          ? await (error as any).context?.json?.().catch(() => ({}))
          : {};
        throw new Error(errBody?.error || data?.error || 'Failed to apply code');
      }
      if (data?.error) throw new Error(data.error);
      successPattern();
      toast({ title: 'Referral code applied! 🎉', description: 'You both earn bonus points.' });
      setAppliedReferral(true);
      setShowApplyReferral(false);
      setApplyReferralInput('');
    } catch (err: any) {
      toast({ title: err.message || 'Failed to apply code', variant: 'destructive' });
    } finally {
      setApplyingReferral(false);
    }
  };


  const handleCopyLink = async () => {
    if (!affiliate) return;
    buttonTap();
    const code = affiliate.affiliate_code || affiliate.username || '';
    const copied = await copyToClipboard(code);
    if (copied) {
      successPattern();
      toast({ title: 'Referral code copied!' });
    }
  };

  const handleShare = async () => {
    if (!affiliate) return;
    buttonTap();
    const code = affiliate.affiliate_code || affiliate.username || '';
    await share({ title: 'Join Nomiqa', text: `Join Nomiqa and earn rewards! Use my referral code: ${code} when you sign up. Download: https://nomiqa-depin.com/download`, url: 'https://nomiqa-depin.com/download' });
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
      console.log('[DeleteAccount] Step 1: Calling request_data_deletion RPC...');
      const { error: rpcError } = await supabase.rpc('request_data_deletion', {
        requesting_user_id: user.id
      });
      
      if (rpcError) {
        console.error('[DeleteAccount] RPC failed:', rpcError.message, rpcError.details);
        // Don't throw — continue to edge function which handles full deletion
      } else {
        console.log('[DeleteAccount] Step 1 complete: RPC succeeded');
      }

      console.log('[DeleteAccount] Step 2: Calling delete-user edge function...');
      const { data: deleteData, error: deleteError } = await supabase.functions.invoke('delete-user', {
        body: { self_delete: true }
      });
      
      if (deleteError) {
        console.error('[DeleteAccount] Edge function error:', deleteError);
        throw deleteError;
      }
      
      console.log('[DeleteAccount] Step 2 complete:', deleteData);

      await supabase.auth.signOut();
      toast({ title: 'Account deleted', description: 'Your account and data have been removed.' });
      navigate('/');
    } catch (error: any) {
      console.error('[DeleteAccount] Failed:', error?.message || error);
      captureError(error instanceof Error ? error : new Error(String(error)), { context: 'account_deletion' });
      toast({ 
        title: 'Failed to delete account', 
        description: error?.message || 'Please try again or contact support.',
        variant: 'destructive' 
      });
    } finally {
      setDeletingAccount(false);
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

  const referralCode = affiliate?.affiliate_code || affiliate?.username || '';

  return (
    <>
      <AppSEO />
      <div className="px-4 pt-6 pb-24 min-h-screen overflow-y-auto">
        
        {/* ── Profile Header ── */}
        <div className="relative rounded-2xl overflow-hidden mb-5">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 opacity-60" />
          <div className="absolute inset-0 bg-card/70 backdrop-blur-xl" />
          
          <div className="relative p-5">
            {/* Top actions row */}
            <div className="flex justify-end gap-1 mb-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => { selectionTap(); setTheme(isDark ? 'light' : 'dark'); }} 
                className="w-8 h-8 rounded-full bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout} 
                className="w-8 h-8 rounded-full bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>

            {/* Avatar + Identity */}
            <div className="flex flex-col items-center text-center">
              <div className={cn(
                "w-20 h-20 rounded-2xl flex items-center justify-center mb-3",
                "bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30",
                "shadow-[0_0_30px_-5px_hsl(var(--primary)/0.3)]"
              )}>
                <span className="text-3xl font-bold text-primary">
                  {profile?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              
              {/* Username with inline edit */}
              {isEditingUsername ? (
                <div className="flex items-center gap-2 mb-1">
                  <Input 
                    value={editedUsername} 
                    onChange={(e) => setEditedUsername(e.target.value)} 
                    className="bg-muted/50 h-8 text-center text-sm w-40" 
                    autoFocus 
                  />
                  <Button size="icon" variant="ghost" onClick={handleSaveUsername} disabled={savingUsername} className="w-7 h-7">
                    {savingUsername ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 text-green-500" />}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => { setIsEditingUsername(false); setEditedUsername(profile?.username || ''); }} className="w-7 h-7">
                    <X className="w-3.5 h-3.5 text-red-500" />
                  </Button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsEditingUsername(true)}
                  className="flex items-center gap-1.5 mb-1 group"
                >
                  <h1 className="text-xl font-bold text-foreground">{profile?.username}</h1>
                  <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity" />
                </button>
              )}
              
              <p className="text-xs text-muted-foreground mb-3">{profile?.email}</p>
              
              {/* Early Member badge */}
              <div className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold",
                "bg-primary/20 text-primary"
              )}>
                <Zap className="w-3.5 h-3.5" />
                Early Member
              </div>
            </div>

            {/* Quick stats row */}
            <div className="grid grid-cols-3 gap-3 mt-5">
              <div className="text-center rounded-xl bg-white/5 backdrop-blur-sm py-2.5 px-2">
                <p className="text-lg font-bold text-foreground">{(userPoints?.total_points || 0).toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Points</p>
              </div>
              <div className="text-center rounded-xl bg-white/5 backdrop-blur-sm py-2.5 px-2">
                <p className="text-lg font-bold text-foreground">{affiliate?.total_registrations || 0}</p>
                <p className="text-[10px] text-muted-foreground">Team</p>
              </div>
              <div className="text-center rounded-xl bg-white/5 backdrop-blur-sm py-2.5 px-2">
                <p className="text-lg font-bold text-foreground">{((userPoints?.total_distance_meters || 0) / 1000).toFixed(1)}</p>
                <p className="text-[10px] text-muted-foreground">km</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-11 p-1 bg-muted/50 backdrop-blur-sm rounded-xl mb-4">
            <TabsTrigger 
              value="account" 
              className="rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground"
              onClick={() => selectionTap()}
            >
              Account
            </TabsTrigger>
            <TabsTrigger 
              value="orders" 
              className="rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground"
              onClick={() => selectionTap()}
            >
              eSIMs
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground"
              onClick={() => selectionTap()}
            >
              Settings
            </TabsTrigger>
          </TabsList>

          {/* ═══ Account Tab ═══ */}
          <TabsContent value="account" className="mt-0 space-y-4">

            {/* Contributor Level */}
            <ContributorLevelCard 
              onTap={() => { selectionTap(); navigate('/app/rewards'); }} 
            />

            {/* Invite Friends — polished & actionable */}
            {affiliate && (
              <div className="rounded-2xl bg-card border border-border overflow-hidden relative">
                {/* Gradient accent strip */}
                <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary" />
                
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Users className="w-4.5 h-4.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Invite & Earn</p>
                        <p className="text-[11px] text-muted-foreground">10% of your team's earnings</p>
                      </div>
                    </div>
                    <Button size="sm" variant="default" onClick={handleShare} className="h-8 text-xs px-3 active:scale-95">
                      <Share2 className="w-3.5 h-3.5 mr-1.5" />
                      Share
                    </Button>
                  </div>
                  
                  {/* Referral code display — pill style */}
                  {!isEditingReferralCode ? (
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium ml-1">Your Referral Code</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCopyLink}
                          className="flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20 active:scale-[0.98] transition-all group"
                        >
                          <span className="text-lg font-bold font-mono text-primary tracking-widest">{referralCode}</span>
                          <Copy className="w-4 h-4 text-primary/60 group-active:text-primary transition-colors" />
                        </button>
                        {!hasChangedCode && (
                          <button
                            onClick={() => { selectionTap(); setIsEditingReferralCode(true); setNewReferralCode(referralCode || ''); }}
                            className="w-10 h-10 rounded-xl bg-muted/50 border border-border flex items-center justify-center active:scale-95 transition-transform"
                          >
                            <Pencil className="w-4 h-4 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground text-center">
                        {hasChangedCode ? '✓ Code customized' : 'Tap code to copy · Tap pencil to change (once)'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium ml-1">Change Referral Code</p>
                      <p className="text-[10px] text-amber-500 ml-1">⚠️ You can only change your code once</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
                          <Input
                            value={newReferralCode}
                            onChange={(e) => setNewReferralCode(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                            placeholder="your_new_code"
                            className="h-11 text-sm font-mono bg-muted/50 pr-12"
                            maxLength={20}
                            autoFocus
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                            {newReferralCode.length}/20
                          </span>
                        </div>
                        <Button size="sm" onClick={handleChangeReferralCode} disabled={savingReferralCode || newReferralCode.length < 3} className="h-11 px-3.5">
                          {savingReferralCode ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setIsEditingReferralCode(false)} className="h-11 px-2.5">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Stats bar */}
                <div className="grid grid-cols-2 divide-x divide-border border-t border-border">
                  <div className="py-3 flex flex-col items-center gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      <p className="text-sm font-bold text-foreground">{affiliate.total_registrations}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Team Members</p>
                  </div>
                  <div className="py-3 flex flex-col items-center gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <Gift className="w-3 h-3 text-primary" />
                      <p className="text-sm font-bold text-primary">{Math.round((affiliate.total_earnings_usd || 0) * 100)}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Team Points</p>
                  </div>
                </div>
              </div>
            )}

            {/* Apply a Friend's Referral Code */}
            {appliedReferral === false && (
              <div className="rounded-2xl bg-card border border-border overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                        <Gift className="w-4.5 h-4.5 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Got a Referral Code?</p>
                        <p className="text-[11px] text-muted-foreground">Apply a friend's code for bonus points</p>
                      </div>
                    </div>
                    {!showApplyReferral && (
                      <Button size="sm" onClick={() => { selectionTap(); setShowApplyReferral(true); }} className="h-8 text-xs px-3 bg-gradient-to-r from-accent/80 to-accent text-accent-foreground border-0 active:scale-95">
                        Apply
                      </Button>
                    )}
                  </div>
                  {showApplyReferral && (
                    <div className="flex items-center gap-2 mt-3">
                      <Input
                        value={applyReferralInput}
                        onChange={(e) => setApplyReferralInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        placeholder="friend's username"
                        className="h-10 text-sm font-mono bg-muted/50 flex-1"
                        maxLength={20}
                        autoFocus
                      />
                      <Button size="sm" onClick={handleApplyReferralCode} disabled={applyingReferral} className="h-10 px-4">
                        {applyingReferral ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setShowApplyReferral(false); setApplyReferralInput(''); }} className="h-10 px-2.5">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
            {appliedReferral === true && (
              <div className="rounded-2xl bg-card border border-accent/20 p-4 bg-gradient-to-br from-accent/5 to-transparent">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center">
                    <Check className="w-4.5 h-4.5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Referral Applied ✓</p>
                    <p className="text-[11px] text-muted-foreground">You're earning bonus points with a friend</p>
                  </div>
                </div>
              </div>
            )}


            {/* Quick Links */}
            <div className="rounded-2xl bg-card border border-border divide-y divide-border overflow-hidden">
              <button
                onClick={() => { selectionTap(); navigate('/app/challenges'); }}
                className="w-full flex items-center justify-between p-3.5 hover:bg-muted/30 active:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Target className="w-4.5 h-4.5 text-blue-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">Challenges</p>
                    <p className="text-[11px] text-muted-foreground">Complete tasks, earn rewards</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

          </TabsContent>

          {/* ═══ eSIMs Tab ═══ */}
          <TabsContent value="orders" className="mt-0 space-y-3">
            {orders.length === 0 ? (
              <div className="rounded-2xl bg-card border border-dashed border-border p-8 text-center">
                <EmptyStateIllustration type="orders" className="mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">No eSIMs yet</p>
                <p className="text-xs text-muted-foreground mb-4">Your travel plans will appear here</p>
                <Button onClick={() => navigate('/app/shop')} size="sm">Browse Plans</Button>
              </div>
            ) : (
              orders.map((order) => {
                const getStatusDisplay = (status: string) => {
                  switch (status) {
                    case 'completed': case 'active': return { label: 'Active', color: 'bg-green-500/15 text-green-400 border-green-500/20' };
                    case 'failed': case 'cancelled': return { label: 'Failed', color: 'bg-red-500/15 text-red-400 border-red-500/20' };
                    case 'expired': return { label: 'Expired', color: 'bg-muted text-muted-foreground border-border' };
                    default: return { label: 'Processing', color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' };
                  }
                };
                const statusDisplay = getStatusDisplay(order.status);
                return (
                  <div key={order.id} className="rounded-xl bg-card border border-border p-3.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{order.package_name || 'eSIM Plan'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{order.data_amount}</p>
                      </div>
                      <Badge variant="outline" className={cn('text-[10px] font-medium border', statusDisplay.color)}>
                        {statusDisplay.label}
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>

          {/* ═══ Settings Tab ═══ */}
          <TabsContent value="settings" className="mt-0 space-y-4">
            {/* Speed Test History */}
            <div className="rounded-2xl bg-card border border-border overflow-hidden">
              <div className="p-4">
                <SpeedTestHistory limit={5} compact />
              </div>
            </div>

            {/* Data Collection Controls */}
            <DataCollectionControls />

            {/* Notification Settings */}
            <NotificationSettings />

            {/* Wallet */}
            <div className="rounded-2xl bg-card border border-border overflow-hidden">
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
                      <Wallet className="w-4.5 h-4.5 text-violet-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Rewards Wallet</p>
                      <p className="text-[11px] text-muted-foreground">Optional — for token claims</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditingWallet(!isEditingWallet)} className="text-xs h-7 px-2">
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
                  <p className="text-xs font-mono text-muted-foreground truncate bg-muted/30 rounded-lg px-3 py-2">
                    {profile.solana_wallet.slice(0, 8)}...{profile.solana_wallet.slice(-8)}
                  </p>
                )}
              </div>
            </div>

            {/* Privacy Controls */}
            <PrivacyControls />

            {/* Help & FAQ */}
            <div className="rounded-2xl bg-card border border-border overflow-hidden">
              <button
                onClick={() => { selectionTap(); setShowHelpCenter(true); }}
                className="w-full flex items-center justify-between p-3.5 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <HelpCircle className="w-4.5 h-4.5 text-blue-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">Help & FAQ</p>
                    <p className="text-[11px] text-muted-foreground">Get answers to common questions</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Danger zone */}
            <div className="rounded-2xl border border-destructive/20 overflow-hidden">
              <div className="p-4">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Account</p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-destructive/5 text-left transition-colors">
                      <Trash2 className="w-4.5 h-4.5 text-destructive/70" />
                      <div>
                        <p className="text-sm font-medium text-destructive/80">Delete Account</p>
                        <p className="text-[11px] text-muted-foreground">Permanently remove your data</p>
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
              </div>
            </div>

            {/* Dev only */}
            {import.meta.env.DEV && (
              <>
                <PermissionDebugPanel />
                <Card className="border-destructive/30 bg-destructive/5">
                  <CardContent className="p-4">
                    <p className="text-xs text-destructive mb-3 font-medium">🧪 DEV ONLY - Sentry Testing</p>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => { throw new Error('Test Sentry Crash - React Error'); }}
                      >
                        Test Crash
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs border-destructive/30 text-destructive"
                        onClick={() => {
                          captureError(new Error('Test Sentry - Handled Error'), { test: true, timestamp: new Date().toISOString() });
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
