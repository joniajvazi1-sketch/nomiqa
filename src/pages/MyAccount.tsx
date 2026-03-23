import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SiteNavigation } from "@/components/SiteNavigation";
import { SupportChatbot } from "@/components/SupportChatbot";
import { NetworkBackground } from "@/components/NetworkBackground";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, User, Award, Package, Gift, Crown, Star, TrendingUp, Zap, Sparkles, RefreshCw, Wallet, DollarSign, Copy, Pencil, Check, X, Shield, Coins } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/contexts/TranslationContext";
import { localizedPath } from "@/utils/localizedLinks";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Confetti } from "@/components/Confetti";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ReferralPointsSection } from "@/components/ReferralPointsSection";
import { ReferralCodeSection } from "@/components/ReferralCodeSection";

interface UserProfile {
  username: string;
  email: string;
  solana_wallet: string | null;
}


interface AffiliateData {
  total_earnings_usd: number;
  total_conversions: number;
  tier_level: number;
  total_registrations: number;
  miner_boost_percentage: number;
  registration_milestone_level: number;
}

interface UserPointsData {
  total_points: number;
  pending_points: number;
}


export default function MyAccount() {
  const navigate = useNavigate();
  const { language, t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [membership, setMembership] = useState<MembershipData | null>(null);
  const [affiliateData, setAffiliateData] = useState<AffiliateData | null>(null);
  const [userPoints, setUserPoints] = useState<UserPointsData | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showClaimDialog, setShowClaimDialog] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [claimMessage, setClaimMessage] = useState("");
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [walletError, setWalletError] = useState("");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [editedUsername, setEditedUsername] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);
  const [solanaWallet, setSolanaWallet] = useState("");
  const [isEditingWallet, setIsEditingWallet] = useState(false);
  const [savingWallet, setSavingWallet] = useState(false);
  const [walletValidationError, setWalletValidationError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate(localizedPath('/auth', language));
        return;
      }

      // Fetch profile - use profiles_safe view to exclude sensitive fields
      const { data: profileData } = await supabase
        .from('profiles_safe')
        .select('username, solana_wallet')
        .eq('user_id', session.user.id)
        .maybeSingle();

      const username = profileData?.username || session.user.email?.split('@')[0] || 'User';
      setProfile({
        username,
        email: session.user.email || '',
        solana_wallet: profileData?.solana_wallet || null
      });
      setEditedUsername(username);
      setSolanaWallet(profileData?.solana_wallet || '');

      // Fetch or create membership data
      let { data: membershipData } = await supabase
        .from('user_spending')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!membershipData) {
        // Create initial membership record
        const { data: newMembership, error } = await supabase
          .from('user_spending')
          .insert({
            user_id: session.user.id,
            total_spent_usd: 0
          })
          .select()
          .single();

        if (error) throw error;
        membershipData = newMembership;
      }

      setMembership(membershipData);

      // Fetch ALL affiliate accounts for this user (query by both user_id and email)
      // Using affiliates_safe view to exclude sensitive verification fields
      const { data: affiliateAccounts } = await supabase
        .from('affiliates_safe')
        .select('total_earnings_usd, total_conversions, tier_level, total_registrations, miner_boost_percentage, registration_milestone_level')
        .or(`user_id.eq.${session.user.id}`);

      // Calculate total earnings and conversions from all affiliate accounts
      if (affiliateAccounts && affiliateAccounts.length > 0) {
        const totalEarnings = affiliateAccounts.reduce((sum, acc) => sum + (acc.total_earnings_usd || 0), 0);
        const totalConversions = affiliateAccounts.reduce((sum, acc) => sum + (acc.total_conversions || 0), 0);
        const highestTier = Math.max(...affiliateAccounts.map(acc => acc.tier_level || 1));
        const totalRegistrations = affiliateAccounts.reduce((sum, acc) => sum + (acc.total_registrations || 0), 0);
        const highestBoost = Math.max(...affiliateAccounts.map(acc => acc.miner_boost_percentage || 0));
        const highestMilestone = Math.max(...affiliateAccounts.map(acc => acc.registration_milestone_level || 0));
        
        setAffiliateData({
          total_earnings_usd: totalEarnings,
          total_conversions: totalConversions,
          tier_level: highestTier,
          total_registrations: totalRegistrations,
          miner_boost_percentage: highestBoost,
          registration_milestone_level: highestMilestone
        });
      }

      // Fetch user points from app
      const { data: pointsData } = await supabase
        .from('user_points')
        .select('total_points, pending_points')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (pointsData) {
        setUserPoints({
          total_points: pointsData.total_points || 0,
          pending_points: pointsData.pending_points || 0
        });
      }

      // Check if user is admin
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      setIsAdmin(!!roleData);

      // Check for tier upgrade
      const previousTier = localStorage.getItem('previousTier');
      if (previousTier && previousTier !== membershipData.membership_tier) {
        const tierOrder = ['bronze', 'silver', 'gold', 'platinum'];
        const previousIndex = tierOrder.indexOf(previousTier);
        const currentIndex = tierOrder.indexOf(membershipData.membership_tier);
        
        if (currentIndex > previousIndex) {
          setShowConfetti(true);
          const tierKey = `tier${membershipData.membership_tier.charAt(0).toUpperCase() + membershipData.membership_tier.slice(1)}`;
          toast.success(`🎉 Congratulations! You've unlocked ${t(tierKey)} tier!`);
        }
      }
      localStorage.setItem('previousTier', membershipData.membership_tier);
    } catch (error: any) {
      console.error('Error loading account:', error);
      toast.error('Failed to load account data');
    } finally {
      setLoading(false);
    }
  };

  const getNextTierInfo = () => {
    if (!membership) return null;
    
    const tiers = [
      { name: 'beginner', threshold: 0, rate: 5 },
      { name: 'traveler', threshold: 20, rate: 6 },
      { name: 'adventurer', threshold: 50, rate: 7 },
      { name: 'explorer', threshold: 150, rate: 10 }
    ];

    const currentTier = membership.membership_tier;
    const currentIndex = tiers.findIndex(t => t.name === currentTier);
    if (currentIndex === tiers.length - 1) return null; // Already at max tier

    const nextTier = tiers[currentIndex + 1];
    const remaining = nextTier.threshold - membership.total_spent_usd;
    const progress = Math.min((membership.total_spent_usd / nextTier.threshold) * 100, 100);

    return { ...nextTier, remaining, progress };
  };

  const refreshMembership = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: membershipData } = await supabase
        .from('user_spending')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (membershipData) {
        setMembership(membershipData);
        toast.success('Membership data refreshed');
      }
    } catch (error) {
      console.error('Error refreshing membership:', error);
      toast.error('Failed to refresh membership data');
    }
  };

  const handleSaveUsername = async () => {
    if (!editedUsername.trim() || editedUsername.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }

    setSavingUsername(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Check if username is already taken - use profiles_safe view
      const { data: existingUser } = await supabase
        .from('profiles_safe')
        .select('id')
        .eq('username', editedUsername.trim())
        .neq('user_id', session.user.id)
        .maybeSingle();

      if (existingUser) {
        toast.error('Username is already taken');
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
      toast.success('Username updated successfully');
    } catch (error: any) {
      console.error('Error updating username:', error);
      toast.error('Failed to update username');
    } finally {
      setSavingUsername(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedUsername(profile?.username || '');
    setIsEditingUsername(false);
  };

  const validateSolanaWallet = (address: string): boolean => {
    if (!address) return true; // Empty is valid (clearing wallet)
    // Base58 check: only valid characters, length 32-44
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    return base58Regex.test(address);
  };

  const handleSaveWallet = async () => {
    const trimmedWallet = solanaWallet.trim();
    
    if (trimmedWallet && !validateSolanaWallet(trimmedWallet)) {
      setWalletValidationError('Invalid Solana wallet address format');
      return;
    }

    setSavingWallet(true);
    setWalletValidationError('');
    
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
      toast.success(trimmedWallet ? 'Wallet address saved successfully' : 'Wallet address removed');
    } catch (error: any) {
      console.error('Error updating wallet:', error);
      toast.error('Failed to update wallet address');
    } finally {
      setSavingWallet(false);
    }
  };

  const handleCancelWalletEdit = () => {
    setSolanaWallet(profile?.solana_wallet || '');
    setIsEditingWallet(false);
    setWalletValidationError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const nextTier = getNextTierInfo();
  const TierIcon = membership ? TIER_ICONS[membership.membership_tier as keyof typeof TIER_ICONS] : Star;
  
  // Calculate total cashback earned
  const totalCashbackEarned = membership 
    ? (membership.total_spent_usd * membership.cashback_rate) / 100 
    : 0;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <NetworkBackground color="rgb(251, 146, 60)" />
      
      {/* Premium Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-orange-500/30 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-neon-coral/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 left-1/4 w-[500px] h-[500px] bg-amber-500/20 rounded-full blur-3xl"></div>
      </div>
      
      <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
      
      <main className="container mx-auto px-4 pt-32 md:pt-24 pb-16 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Premium Header with Gradient */}
          <div className="text-center mb-12 space-y-3 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
              {t("myAccount")}
            </h1>
            {profile && (
              <p className="text-lg text-muted-foreground">
                Welcome back, <span className="font-semibold text-foreground">{profile.username}</span>
              </p>
            )}
          </div>

          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-4 md:grid-cols-7 mb-8 h-auto bg-card/50 backdrop-blur-sm border border-border/50 p-1 gap-1">
              <TabsTrigger 
                value="points" 
                className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-1 sm:px-2 data-[state=active]:bg-neon-cyan/10 data-[state=active]:text-neon-cyan transition-all duration-300 hover:scale-105"
              >
                <Coins className="w-4 h-4" />
                <span className="text-[9px] sm:text-sm font-medium leading-tight">{t("referralPointsTab")}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="info" 
                className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-1 sm:px-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all duration-300 hover:scale-105"
              >
                <User className="w-4 h-4" />
                <span className="text-[9px] sm:text-sm font-medium leading-tight">{t("accountInfo")}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="membership" 
                className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-1 sm:px-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all duration-300 hover:scale-105"
              >
                <Award className="w-4 h-4" />
                <span className="text-[9px] sm:text-sm font-medium leading-tight">{t("membershipTab")}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="orders" 
                className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-1 sm:px-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all duration-300 hover:scale-105"
              >
                <Package className="w-4 h-4" />
                <span className="text-[9px] sm:text-sm font-medium leading-tight">{t("myEsimsTab")}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="wallet" 
                className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-1 sm:px-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all duration-300 hover:scale-105"
              >
                <Wallet className="w-4 h-4" />
                <span className="text-[9px] sm:text-sm font-medium leading-tight">{t("walletTab")}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="earnings" 
                className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-1 sm:px-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all duration-300 hover:scale-105"
              >
                <DollarSign className="w-4 h-4" />
                <span className="text-[9px] sm:text-sm font-medium leading-tight">{t("claimEarnings")}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="earn" 
                className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-1 sm:px-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all duration-300 hover:scale-105"
              >
                <Gift className="w-4 h-4" />
                <span className="text-[9px] sm:text-sm font-medium leading-tight">{t("referEarnTab")}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="animate-fade-in">
              <Card className="bg-white/[0.03] backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-br from-neon-cyan/10 via-transparent to-neon-violet/10 border-b border-white/10">
                  <CardTitle className="flex items-center gap-3 text-2xl text-white">
                    <div className="p-2 bg-neon-cyan/10 rounded-lg border border-neon-cyan/20">
                      <User className="w-6 h-6 text-neon-cyan" />
                    </div>
                    {t("accountInformation")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="group p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-300">
                    <p className="text-sm text-white/60 mb-2 font-medium">{t("username")}</p>
                    {isEditingUsername ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editedUsername}
                          onChange={(e) => setEditedUsername(e.target.value)}
                          className="text-lg font-bold max-w-xs bg-white/[0.05] border-white/20 text-white placeholder:text-white/40 focus:border-neon-cyan/50"
                          placeholder="Enter username"
                          autoFocus
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={handleSaveUsername}
                          disabled={savingUsername}
                          className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                        >
                          {savingUsername ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          disabled={savingUsername}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <p className="text-2xl font-bold text-neon-cyan">{profile?.username}</p>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setIsEditingUsername(true)}
                          className="text-white/50 hover:text-neon-cyan hover:bg-neon-cyan/10"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="group p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-300 hover:scale-[1.02]">
                    <p className="text-sm text-white/60 mb-2 font-medium">{t("emailLabel")}</p>
                    <p className="text-lg font-medium text-white/90">{profile?.email}</p>
                  </div>
                  
                  {/* Admin Dashboard Link - Only visible to admins */}
                  {isAdmin && (
                    <div className="group p-4 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/30">
                            <Shield className="w-5 h-5 text-purple-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-purple-300">Admin Dashboard</p>
                            <p className="text-sm text-white/50">Manage users and view analytics</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => navigate('/admin/users')}
                          variant="outline"
                          className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20 hover:text-purple-200"
                        >
                          Open Dashboard
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="membership">
              <div className="space-y-6">
                {/* Current Tier Card - Large and Prominent */}
                <Card className={`${membership ? TIER_COLORS[membership.membership_tier as keyof typeof TIER_COLORS] : ''} ${membership ? TIER_GLOW[membership.membership_tier as keyof typeof TIER_GLOW] : ''} text-white border-0 overflow-hidden relative animate-scale-in`}>
                  {/* Animated Background Pattern */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.4),transparent_60%)] animate-pulse" />
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_30%,rgba(255,255,255,0.1)_50%,transparent_70%)] bg-[length:200%_200%] animate-[shimmer_3s_ease-in-out_infinite]" />
                  </div>
                  
                  <CardHeader className="relative z-10 pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full">
                          <div className="relative shrink-0">
                            <div className="absolute inset-0 bg-white/30 rounded-full blur-2xl animate-pulse" />
                            <div className="absolute inset-0 bg-white/20 rounded-full blur-xl" />
                            <TierIcon className="w-16 h-16 sm:w-20 sm:h-20 relative z-10 drop-shadow-2xl animate-[float_3s_ease-in-out_infinite]" />
                          </div>
                          <div className="flex-1">
                            <div className="text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-wider flex flex-wrap items-center gap-2 sm:gap-3 animate-fade-in mb-2">
                              {t(`tier${membership?.membership_tier.charAt(0).toUpperCase() + membership?.membership_tier.slice(1)}`)}
                              <Badge variant="secondary" className="bg-white/30 text-white border-0 text-xs sm:text-sm backdrop-blur-sm">
                                {t("active")}
                              </Badge>
                            </div>
                            <div className="text-base sm:text-lg md:text-xl opacity-95 flex flex-wrap items-center gap-2">
                              <Zap className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                              <span className="font-semibold">{membership?.cashback_rate}% {t("cashback")}</span>
                              <span className="opacity-80">{t("onEveryPurchase")}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  
                    <CardContent className="relative z-10 space-y-4 sm:space-y-6 pt-4 sm:pt-8">
                     <div className="flex items-center justify-between gap-4 mb-4">
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={refreshMembership}
                         className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                       >
                         <RefreshCw className="w-4 h-4 mr-2" />
                         {t("refresh")}
                       </Button>
                     </div>
                     
                     {/* Cashback Balance - Prominent Display */}
                     <div className="bg-gradient-to-br from-white/25 via-white/20 to-white/15 backdrop-blur-lg rounded-2xl p-5 sm:p-8 border-2 border-white/40 shadow-2xl animate-fade-in">
                       <div className="flex items-center justify-between mb-3">
                         <div className="flex items-center gap-2">
                           <div className="p-2 bg-white/30 rounded-lg backdrop-blur-sm">
                             <Gift className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
                           </div>
                           <p className="text-sm sm:text-base font-bold uppercase tracking-wider opacity-95">{t("totalCashbackEarned")}</p>
                         </div>
                       </div>
                       <div className="flex items-baseline gap-2">
                         <span className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight drop-shadow-2xl">
                           ${totalCashbackEarned.toFixed(2)}
                         </span>
                       </div>
                       <p className="text-xs sm:text-sm mt-3 opacity-90 font-medium">
                         💰 {t("earnedFromAllPurchases")}
                       </p>
                     </div>
                     
                     <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-white/30">
                       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                         <p className="text-sm sm:text-base opacity-90 font-medium">{t("lifetimeSpending")}</p>
                         <p className="text-2xl sm:text-3xl font-bold tracking-tight">${membership?.total_spent_usd.toFixed(2)}</p>
                       </div>
                     </div>

                    {nextTier && (
                      <div className="space-y-3 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                            <p className="text-xs sm:text-sm font-medium">{t("nextTierProgress")}</p>
                          </div>
                          <p className="text-xs sm:text-sm font-bold">
                            {Math.round(nextTier.progress)}%
                          </p>
                        </div>
                        
                        <div className="relative">
                          {/* Progress bar with glow effect */}
                          <div className="h-3 sm:h-4 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/30">
                            <div 
                              className="h-full bg-gradient-to-r from-white via-white to-white/90 rounded-full transition-all duration-1000 ease-out relative shadow-[0_0_20px_rgba(255,255,255,0.5)]"
                              style={{ width: `${nextTier.progress}%` }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_2s_ease-in-out_infinite]" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm">
                          <p className="opacity-90">
                            ${nextTier.remaining.toFixed(2)} {t("awayFrom")} {t(`tier${nextTier.name.charAt(0).toUpperCase() + nextTier.name.slice(1)}`)}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {!nextTier && (
                      <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-white/30 animate-fade-in">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <Crown className="w-6 h-6 sm:w-8 sm:h-8 animate-[float_3s_ease-in-out_infinite]" />
                          <p className="text-base sm:text-xl font-semibold">🎉 {t("reachedHighestTier")}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* All Tiers Overview */}
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-2xl">
                      <Award className="w-6 h-6 text-primary" />
                      {t("allMembershipTiers")}
                    </CardTitle>
                    <CardDescription className="text-base">{t("unlockBetterRewards")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Beginner Tier */}
                      <div className={`group p-4 sm:p-6 border-2 rounded-2xl transition-all duration-300 hover:scale-[1.03] hover:shadow-xl ${
                        membership?.membership_tier === 'beginner' 
                          ? 'border-amber-600 bg-gradient-to-br from-amber-100/90 via-amber-50/60 to-amber-100/40 dark:from-amber-900/40 dark:via-amber-950/20 dark:to-amber-900/30 shadow-lg ring-2 ring-amber-500/20' 
                          : 'border-border/60 hover:border-amber-600/40 bg-card/30'
                      }`}>
                        <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                          <div className="relative">
                            <Star className={`w-7 h-7 sm:w-9 sm:h-9 ${membership?.membership_tier === 'beginner' ? 'text-amber-700 dark:text-amber-400' : TIER_TEXT_COLOR.beginner} transition-all duration-300 group-hover:scale-125 group-hover:rotate-12`} />
                            {membership?.membership_tier === 'beginner' && (
                              <div className="absolute inset-0 bg-amber-500/30 rounded-full blur-xl animate-pulse" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className={`font-bold text-lg sm:text-xl ${membership?.membership_tier === 'beginner' ? 'text-amber-800 dark:text-amber-300' : TIER_TEXT_COLOR.beginner} tracking-wide`}>{t("tierBeginner")}</h3>
                            {membership?.membership_tier === 'beginner' && (
                              <Badge variant="secondary" className="text-xs mt-1 bg-amber-200 dark:bg-amber-800/70 text-amber-900 dark:text-amber-100 font-semibold">{t("currentTier")}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                          <p className={`text-xs sm:text-sm flex flex-wrap items-center gap-1 sm:gap-2 ${
                            membership?.membership_tier === 'beginner' 
                              ? 'text-amber-900 dark:text-amber-100' 
                              : 'text-muted-foreground'
                          }`}>
                            <span className="font-semibold">{t("entryLevel")}</span>
                            <span className="opacity-60">•</span>
                            <span>$0+ {t("spent")}</span>
                          </p>
                          <div className="flex items-baseline gap-2">
                            <p className={`text-3xl sm:text-4xl font-bold ${
                              membership?.membership_tier === 'beginner' 
                                ? 'text-amber-900 dark:text-amber-100' 
                                : 'text-foreground'
                            }`}>5%</p>
                            <p className={`text-sm sm:text-base font-medium ${
                              membership?.membership_tier === 'beginner' 
                                ? 'text-amber-800 dark:text-amber-200' 
                                : 'text-muted-foreground'
                            }`}>{t("cashback")}</p>
                          </div>
                        </div>
                      </div>

                      {/* Traveler Tier */}
                      <div className={`group p-4 sm:p-6 border-2 rounded-2xl transition-all duration-300 hover:scale-[1.03] hover:shadow-xl ${
                        membership?.membership_tier === 'traveler' 
                          ? 'border-slate-500 bg-gradient-to-br from-slate-100/90 via-slate-50/60 to-slate-100/40 dark:from-slate-800/40 dark:via-slate-900/20 dark:to-slate-800/30 shadow-lg ring-2 ring-slate-400/20' 
                          : 'border-border/60 hover:border-slate-500/40 bg-card/30'
                      }`}>
                        <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                          <div className="relative">
                            <Award className={`w-7 h-7 sm:w-9 sm:h-9 ${membership?.membership_tier === 'traveler' ? 'text-slate-700 dark:text-slate-300' : TIER_TEXT_COLOR.traveler} transition-all duration-300 group-hover:scale-125 group-hover:rotate-12`} />
                            {membership?.membership_tier === 'traveler' && (
                              <div className="absolute inset-0 bg-slate-400/30 rounded-full blur-xl animate-pulse" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className={`font-bold text-lg sm:text-xl ${membership?.membership_tier === 'traveler' ? 'text-slate-800 dark:text-slate-200' : TIER_TEXT_COLOR.traveler} tracking-wide`}>{t("tierTraveler")}</h3>
                            {membership?.membership_tier === 'traveler' && (
                              <Badge variant="secondary" className="text-xs mt-1 bg-slate-200 dark:bg-slate-700/70 text-slate-900 dark:text-slate-100 font-semibold">{t("currentTier")}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                          <p className={`text-xs sm:text-sm flex flex-wrap items-center gap-1 sm:gap-2 ${
                            membership?.membership_tier === 'traveler' 
                              ? 'text-slate-900 dark:text-slate-100' 
                              : 'text-muted-foreground'
                          }`}>
                            <span className="font-semibold">{t("upgradeAt")}</span>
                            <span className="opacity-60">•</span>
                            <span>$20+ {t("spent")}</span>
                          </p>
                          <div className="flex items-baseline gap-2">
                            <p className={`text-3xl sm:text-4xl font-bold ${
                              membership?.membership_tier === 'traveler' 
                                ? 'text-slate-900 dark:text-slate-100' 
                                : 'text-foreground'
                            }`}>6%</p>
                            <p className={`text-sm sm:text-base font-medium ${
                              membership?.membership_tier === 'traveler' 
                                ? 'text-slate-800 dark:text-slate-200' 
                                : 'text-muted-foreground'
                            }`}>{t("cashback")}</p>
                          </div>
                        </div>
                      </div>

                      {/* Adventurer Tier */}
                      <div className={`group p-4 sm:p-6 border-2 rounded-2xl transition-all duration-300 hover:scale-[1.03] hover:shadow-xl ${
                        membership?.membership_tier === 'adventurer' 
                          ? 'border-yellow-600 bg-gradient-to-br from-yellow-100/90 via-yellow-50/60 to-yellow-100/40 dark:from-yellow-900/40 dark:via-yellow-950/20 dark:to-yellow-900/30 shadow-lg ring-2 ring-yellow-500/20' 
                          : 'border-border/60 hover:border-yellow-500/40 bg-card/30'
                      }`}>
                        <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                          <div className="relative">
                            <Crown className={`w-7 h-7 sm:w-9 sm:h-9 ${membership?.membership_tier === 'adventurer' ? 'text-yellow-700 dark:text-yellow-400' : TIER_TEXT_COLOR.adventurer} transition-all duration-300 group-hover:scale-125 group-hover:rotate-12`} />
                            {membership?.membership_tier === 'adventurer' && (
                              <div className="absolute inset-0 bg-yellow-500/30 rounded-full blur-xl animate-pulse" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className={`font-bold text-lg sm:text-xl ${membership?.membership_tier === 'adventurer' ? 'text-yellow-800 dark:text-yellow-300' : TIER_TEXT_COLOR.adventurer} tracking-wide`}>{t("tierAdventurer")}</h3>
                            {membership?.membership_tier === 'adventurer' && (
                              <Badge variant="secondary" className="text-xs mt-1 bg-yellow-200 dark:bg-yellow-800/70 text-yellow-900 dark:text-yellow-100 font-semibold">{t("currentTier")}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                          <p className={`text-xs sm:text-sm flex flex-wrap items-center gap-1 sm:gap-2 ${
                            membership?.membership_tier === 'adventurer' 
                              ? 'text-yellow-900 dark:text-yellow-100' 
                              : 'text-muted-foreground'
                          }`}>
                            <span className="font-semibold">{t("premium")}</span>
                            <span className="opacity-60">•</span>
                            <span>$50+ {t("spent")}</span>
                          </p>
                          <div className="flex items-baseline gap-2">
                            <p className={`text-3xl sm:text-4xl font-bold ${
                              membership?.membership_tier === 'adventurer' 
                                ? 'text-yellow-900 dark:text-yellow-100' 
                                : 'text-foreground'
                            }`}>7%</p>
                            <p className={`text-sm sm:text-base font-medium ${
                              membership?.membership_tier === 'adventurer' 
                                ? 'text-yellow-800 dark:text-yellow-200' 
                                : 'text-muted-foreground'
                            }`}>{t("cashback")}</p>
                          </div>
                        </div>
                      </div>

                      {/* Explorer Tier */}
                      <div className={`group p-4 sm:p-6 border-2 rounded-2xl transition-all duration-300 hover:scale-[1.03] hover:shadow-xl ${
                        membership?.membership_tier === 'explorer' 
                          ? 'border-purple-600 bg-gradient-to-br from-purple-100/90 via-purple-50/60 to-purple-100/40 dark:from-purple-900/40 dark:via-purple-950/20 dark:to-purple-900/30 shadow-lg ring-2 ring-purple-500/20' 
                          : 'border-border/60 hover:border-purple-500/40 bg-card/30'
                      }`}>
                        <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                          <div className="relative">
                            <Sparkles className={`w-7 h-7 sm:w-9 sm:h-9 ${membership?.membership_tier === 'explorer' ? 'text-purple-700 dark:text-purple-400' : TIER_TEXT_COLOR.explorer} transition-all duration-300 group-hover:scale-125 group-hover:rotate-12`} />
                            {membership?.membership_tier === 'explorer' && (
                              <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-xl animate-pulse" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className={`font-bold text-lg sm:text-xl ${membership?.membership_tier === 'explorer' ? 'text-purple-800 dark:text-purple-300' : TIER_TEXT_COLOR.explorer} tracking-wide`}>{t("tierExplorer")}</h3>
                            {membership?.membership_tier === 'explorer' && (
                              <Badge variant="secondary" className="text-xs mt-1 bg-purple-200 dark:bg-purple-800/70 text-purple-900 dark:text-purple-100 font-semibold">{t("currentTier")}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                          <p className={`text-xs sm:text-sm flex flex-wrap items-center gap-1 sm:gap-2 ${
                            membership?.membership_tier === 'explorer' 
                              ? 'text-purple-900 dark:text-purple-100' 
                              : 'text-muted-foreground'
                          }`}>
                            <span className="font-semibold">{t("elite")}</span>
                            <span className="opacity-60">•</span>
                            <span>$150+ {t("spent")}</span>
                          </p>
                          <div className="flex items-baseline gap-2">
                            <p className={`text-3xl sm:text-4xl font-bold ${
                              membership?.membership_tier === 'explorer' 
                                ? 'text-purple-900 dark:text-purple-100' 
                                : 'text-foreground'
                            }`}>10%</p>
                            <p className={`text-sm sm:text-base font-medium ${
                              membership?.membership_tier === 'explorer' 
                                ? 'text-purple-800 dark:text-purple-200' 
                                : 'text-muted-foreground'
                            }`}>{t("cashback")}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="orders" className="animate-fade-in">
              <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-br from-primary/10 via-transparent to-accent/10 border-b border-border/50">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Package className="w-6 h-6 text-primary" />
                    </div>
                    {t("myEsimsTab")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <Button 
                    onClick={() => navigate(localizedPath('/orders', language))}
                    className="w-full h-auto py-3 px-4 text-sm md:text-base lg:text-lg font-light bg-white/[0.05] backdrop-blur-xl border-2 border-neon-cyan/30 text-white hover:bg-neon-cyan/10 hover:border-neon-cyan/50 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-neon-cyan/20"
                  >
                    <Package className="w-4 h-4 md:w-5 md:h-5 mr-2 shrink-0" />
                    <span className="break-words">{t("viewAllOrders")}</span>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="wallet" className="animate-fade-in">
              <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-br from-neon-violet/10 via-transparent to-neon-cyan/10 border-b border-border/50">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="p-2 bg-neon-violet/10 rounded-lg border border-neon-violet/20">
                      <Wallet className="w-6 h-6 text-neon-violet" />
                    </div>
                    {t("solanaWallet")}
                  </CardTitle>
                  <CardDescription className="mt-2 text-sm">
                    {t("walletDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="group p-6 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-white/60 font-medium flex items-center gap-2">
                        <Wallet className="w-4 h-4" />
                        {t("walletAddress")}
                      </p>
                      {!isEditingWallet && profile?.solana_wallet && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText(profile.solana_wallet || '');
                            toast.success('Wallet address copied!');
                          }}
                          className="text-white/50 hover:text-neon-cyan hover:bg-neon-cyan/10"
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          {t("copy")}
                        </Button>
                      )}
                    </div>
                    
                    {isEditingWallet ? (
                      <div className="space-y-4">
                        <Input
                          value={solanaWallet}
                          onChange={(e) => {
                            setSolanaWallet(e.target.value);
                            setWalletValidationError('');
                          }}
                          className="text-lg font-mono bg-white/[0.05] border-white/20 text-white placeholder:text-white/40 focus:border-neon-violet/50"
                          placeholder="Enter your Solana wallet address"
                          autoFocus
                        />
                        {walletValidationError && (
                          <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
                            <AlertDescription>{walletValidationError}</AlertDescription>
                          </Alert>
                        )}
                        <div className="flex gap-2">
                          <Button
                            onClick={handleSaveWallet}
                            disabled={savingWallet}
                            className="bg-neon-violet hover:bg-neon-violet/80"
                          >
                            {savingWallet ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                            {t("save")}
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={handleCancelWalletEdit}
                            disabled={savingWallet}
                            className="text-white/70 hover:text-white hover:bg-white/10"
                          >
                            <X className="w-4 h-4 mr-2" />
                            {t("cancel")}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        {profile?.solana_wallet ? (
                          <p className="text-xl font-mono text-neon-violet break-all">
                            {profile.solana_wallet}
                          </p>
                        ) : (
                          <p className="text-lg text-white/40 italic">
                            {t("noWalletConnected")}
                          </p>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setIsEditingWallet(true)}
                          className="text-white/50 hover:text-neon-violet hover:bg-neon-violet/10 shrink-0"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <Alert className="bg-neon-violet/5 border-neon-violet/20">
                    <Wallet className="h-4 w-4 text-neon-violet" />
                    <AlertDescription className="text-white/70">
                      {t("walletRewardInfo")}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="earnings" className="animate-fade-in">
              <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-br from-primary/10 via-transparent to-accent/10 border-b border-border/50">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <DollarSign className="w-6 h-6 text-primary" />
                    </div>
                    {t("claimEarnings")}
                  </CardTitle>
                  <CardDescription className="mt-2 text-sm">
                    {t("claimEarningsNote")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Earnings Overview */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className="border-border/30 bg-gradient-to-br from-primary/5 to-transparent">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Gift className="w-5 h-5 text-primary" />
                          Total Points
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-primary">
                          {(userPoints?.total_points || 0).toLocaleString()} pts
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Convertible to $NOMIQA
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-border/30 bg-gradient-to-br from-accent/5 to-transparent">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Award className="w-5 h-5 text-accent" />
                          {t("cashbackEarnings")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-accent">
                          ${totalCashbackEarned.toFixed(2)}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Total Earnings */}
                  <Card className="border-primary/50 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent">
                    <CardContent className="pt-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-1">{t("totalEarningsLabel")}</p>
                          <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                            {(userPoints?.total_points || 0).toLocaleString()} pts
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Points claimable after token launch
                          </p>
                        </div>
                        <Dialog open={showClaimDialog} onOpenChange={setShowClaimDialog}>
                           <DialogTrigger asChild>
                            <Button
                              size="lg"
                              className="w-full md:w-auto h-auto py-4 px-6 md:px-8 text-base md:text-lg font-light bg-white/[0.05] backdrop-blur-xl border-2 border-neon-violet/40 text-white hover:bg-neon-violet/10 hover:border-neon-violet/60 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-neon-violet/20 disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={(userPoints?.total_points || 0) < 500}
                            >
                              <Wallet className="w-5 h-5 md:w-6 md:h-6 mr-2 shrink-0" />
                              <span className="break-words">{t("claimAll")}</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>{t("claimEarnings")}</DialogTitle>
                              <DialogDescription>
                                {t("enterSolanaWallet")}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              {/* Minimum Withdrawal Notice */}
                              <Alert className="border-primary/20 bg-primary/5">
                                <AlertDescription className="text-sm font-medium">
                                  💰 Minimum claim: 500 pts
                                </AlertDescription>
                              </Alert>

                              <div className="space-y-2">
                                <Label htmlFor="wallet">{t("solanaWalletAddress")}</Label>
                                <Input
                                  id="wallet"
                                  placeholder="Ex: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
                                  value={walletAddress}
                                  onChange={(e) => {
                                    const value = e.target.value.trim();
                                    setWalletAddress(value);
                                    
                                    // Validate Solana wallet address format (base58, 32-44 chars)
                                    const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
                                    if (value && !solanaAddressRegex.test(value)) {
                                      setWalletError("Invalid Solana wallet address format. Must be 32-44 base58 characters.");
                                    } else {
                                      setWalletError("");
                                    }
                                  }}
                                  className={`font-mono text-sm ${walletError ? 'border-red-500' : ''}`}
                                />
                                {walletError && (
                                  <p className="text-xs text-red-500 mt-1">{walletError}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                  Solana wallet addresses are 32-44 characters long and use base58 encoding.
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="message">{t("requestMessage")}</Label>
                                <Textarea
                                  id="message"
                                  placeholder={t("requestMessage")}
                                  value={claimMessage}
                                  onChange={(e) => setClaimMessage(e.target.value)}
                                  rows={3}
                                />
                              </div>
                              {((affiliateData?.total_earnings_usd || 0) + totalCashbackEarned) < 5 && (
                                <Alert variant="destructive">
                                  <AlertDescription className="text-sm">
                                    ⚠️ No withdrawal under $5. Current total: ${((affiliateData?.total_earnings_usd || 0) + totalCashbackEarned).toFixed(2)}
                                  </AlertDescription>
                                </Alert>
                              )}
                              <Button
                                className="w-full"
                                disabled={
                                  !walletAddress.trim() || 
                                  walletError !== "" ||
                                  submittingClaim ||
                                  ((affiliateData?.total_earnings_usd || 0) + totalCashbackEarned) < 5
                                }
                                onClick={async () => {
                                  // Validate wallet address format
                                  const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
                                  if (!walletAddress.trim()) {
                                    toast.error(t("walletAddressRequired"));
                                    return;
                                  }
                                  
                                  if (!solanaAddressRegex.test(walletAddress.trim())) {
                                    toast.error("Invalid Solana wallet address format");
                                    setWalletError("Invalid Solana wallet address format. Must be 32-44 base58 characters.");
                                    return;
                                  }
                                  
                                  const totalAmount = (affiliateData?.total_earnings_usd || 0) + totalCashbackEarned;
                                  
                                  if (totalAmount < 5) {
                                    toast.error("Minimum withdrawal is $5.00");
                                    return;
                                  }
                                  
                                  setSubmittingClaim(true);
                                  try {
                                    const { error } = await supabase.functions.invoke('submit-claim-request', {
                                      body: {
                                        walletAddress: walletAddress.trim(),
                                        message: claimMessage,
                                        affiliateEarnings: affiliateData?.total_earnings_usd || 0,
                                        cashbackEarnings: totalCashbackEarned,
                                        totalAmount: totalAmount,
                                        userEmail: profile?.email,
                                        username: profile?.username
                                      }
                                    });

                                    if (error) throw error;

                                    toast.success(t("claimRequestSubmitted"));
                                    setShowClaimDialog(false);
                                    setWalletAddress("");
                                    setWalletError("");
                                    setClaimMessage("");
                                  } catch (error: any) {
                                    console.error('Error submitting claim:', error);
                                    const errorMsg = error?.message || "Failed to submit claim request";
                                    toast.error(errorMsg);
                                  } finally {
                                    setSubmittingClaim(false);
                                  }
                                }}
                              >
                                {submittingClaim ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {t("checkoutProcessing")}
                                  </>
                                ) : (
                                  <>
                                    <Wallet className="w-4 h-4 mr-2" />
                                    {t("submitClaimRequest")}
                                  </>
                                )}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="earn" className="animate-fade-in">
              <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-br from-primary/10 via-transparent to-accent/10 border-b border-border/50">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Gift className="w-6 h-6 text-primary" />
                    </div>
                    {t("referEarnTab")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Total Points Display */}
                  <div className="p-5 rounded-xl bg-gradient-to-br from-neon-cyan/10 to-neon-violet/10 border border-white/10 text-center">
                    <p className="text-4xl font-bold bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-cyan bg-clip-text text-transparent">
                      {(userPoints?.total_points || 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{t("totalPoints")}</p>
                    <p className="text-xs text-muted-foreground/70 mt-2">
                      {t("cryptoConversionMessage")}
                    </p>
                  </div>

                  {/* Your Referral Code */}
                  <ReferralCodeSection username={profile?.username || ''} />

                  <Button 
                    onClick={() => navigate(localizedPath('/affiliate', language))}
                    className="w-full h-auto py-3 px-4 text-sm md:text-base lg:text-lg font-light bg-white/[0.05] backdrop-blur-xl border-2 border-neon-coral/30 text-white hover:bg-neon-coral/10 hover:border-neon-coral/50 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-neon-coral/20"
                  >
                    <Gift className="w-4 h-4 md:w-5 md:h-5 mr-2 shrink-0" />
                    <span className="break-words">{t("goToAffiliateProgram")}</span>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="points" className="animate-fade-in">
              <ReferralPointsSection
                totalPoints={userPoints?.total_points || 0}
                totalRegistrations={affiliateData?.total_registrations || 0}
                minerBoostPercentage={affiliateData?.miner_boost_percentage || 0}
                milestoneLevel={affiliateData?.registration_milestone_level || 0}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <SiteNavigation />
      <SupportChatbot />
    </div>
  );
}
