import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { SiteNavigation } from "@/components/SiteNavigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, User, Award, Package, Gift, Crown, Star, TrendingUp, Zap, Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/contexts/TranslationContext";
import { localizedPath } from "@/utils/localizedLinks";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Confetti } from "@/components/Confetti";

interface UserProfile {
  username: string;
  email: string;
}

interface MembershipData {
  total_spent_usd: number;
  membership_tier: string;
  cashback_rate: number;
  cashback_balance?: number; // Calculated on frontend
}

const TIER_COLORS = {
  beginner: "bg-gradient-to-br from-amber-900 via-amber-700 to-orange-800",
  traveler: "bg-gradient-to-br from-slate-500 via-slate-400 to-slate-600",
  adventurer: "bg-gradient-to-br from-yellow-600 via-amber-500 to-yellow-700",
  explorer: "bg-gradient-to-br from-purple-700 via-violet-600 to-purple-800"
};

const TIER_GLOW = {
  beginner: "shadow-[0_0_50px_rgba(217,119,6,0.6),0_0_100px_rgba(217,119,6,0.4)]",
  traveler: "shadow-[0_0_50px_rgba(148,163,184,0.6),0_0_100px_rgba(148,163,184,0.4)]",
  adventurer: "shadow-[0_0_60px_rgba(234,179,8,0.7),0_0_120px_rgba(234,179,8,0.5)]",
  explorer: "shadow-[0_0_70px_rgba(168,85,247,0.8),0_0_140px_rgba(168,85,247,0.6)]"
};

const TIER_ICONS = {
  beginner: Star,
  traveler: Award,
  adventurer: Crown,
  explorer: Sparkles
};

const TIER_TEXT_COLOR = {
  beginner: "text-amber-600 dark:text-amber-500",
  traveler: "text-slate-700 dark:text-slate-400",
  adventurer: "text-yellow-700 dark:text-yellow-500",
  explorer: "text-purple-700 dark:text-purple-500"
};

export default function MyAccount() {
  const navigate = useNavigate();
  const { language, t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [membership, setMembership] = useState<MembershipData | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

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

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', session.user.id)
        .single();

      setProfile({
        username: profileData?.username || 'User',
        email: session.user.email || ''
      });

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
      {/* Premium Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,hsl(var(--accent)/0.1),transparent_40%)]" />
      
      <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-16 relative z-10">
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
            <TabsList className="grid w-full grid-cols-4 mb-8 h-auto bg-card/50 backdrop-blur-sm border border-border/50 p-1">
              <TabsTrigger 
                value="info" 
                className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 sm:py-3 px-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all duration-300 hover:scale-105"
              >
                <User className="w-5 h-5 sm:w-4 sm:h-4" />
                <span className="text-[10px] sm:text-sm font-medium">{t("accountInfo")}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="membership" 
                className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 sm:py-3 px-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all duration-300 hover:scale-105"
              >
                <Award className="w-5 h-5 sm:w-4 sm:h-4" />
                <span className="text-[10px] sm:text-sm font-medium">{t("membershipTab")}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="orders" 
                className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 sm:py-3 px-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all duration-300 hover:scale-105"
              >
                <Package className="w-5 h-5 sm:w-4 sm:h-4" />
                <span className="text-[10px] sm:text-sm font-medium">{t("myEsimsTab")}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="earn" 
                className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-3 sm:py-3 px-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all duration-300 hover:scale-105"
              >
                <Gift className="w-5 h-5 sm:w-4 sm:h-4" />
                <span className="text-[10px] sm:text-sm font-medium">{t("referEarnTab")}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="animate-fade-in">
              <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-br from-primary/10 via-transparent to-accent/10 border-b border-border/50">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    {t("accountInformation")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="group p-4 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/50 transition-all duration-300 hover:scale-[1.02]">
                    <p className="text-sm text-muted-foreground mb-2 font-medium">{t("username")}</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{profile?.username}</p>
                  </div>
                  <div className="group p-4 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/50 transition-all duration-300 hover:scale-[1.02]">
                    <p className="text-sm text-muted-foreground mb-2 font-medium">{t("emailLabel")}</p>
                    <p className="text-lg font-medium text-foreground/90">{profile?.email}</p>
                  </div>
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
                    className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    <Package className="w-5 h-5 mr-2" />
                    {t("viewAllOrders")}
                  </Button>
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
                <CardContent className="pt-6">
                  <Button 
                    onClick={() => navigate(localizedPath('/affiliate', language))}
                    className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    <Gift className="w-5 h-5 mr-2" />
                    {t("goToAffiliateProgram")}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <SiteNavigation />
      <Footer />
    </div>
  );
}
