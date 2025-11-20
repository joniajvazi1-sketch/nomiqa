import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, User, Award, Package, Gift, Crown, Star, TrendingUp, Zap, Sparkles } from "lucide-react";
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
}

const TIER_COLORS = {
  bronze: "bg-gradient-to-br from-amber-800 via-amber-600 to-orange-700",
  silver: "bg-gradient-to-br from-slate-400 via-slate-300 to-slate-500",
  gold: "bg-gradient-to-br from-yellow-500 via-amber-400 to-yellow-600",
  platinum: "bg-gradient-to-br from-purple-600 via-violet-500 to-purple-700"
};

const TIER_GLOW = {
  bronze: "shadow-[0_0_50px_rgba(217,119,6,0.5),0_0_100px_rgba(217,119,6,0.3)]",
  silver: "shadow-[0_0_50px_rgba(148,163,184,0.5),0_0_100px_rgba(148,163,184,0.3)]",
  gold: "shadow-[0_0_60px_rgba(234,179,8,0.6),0_0_120px_rgba(234,179,8,0.4)]",
  platinum: "shadow-[0_0_70px_rgba(168,85,247,0.7),0_0_140px_rgba(168,85,247,0.5)]"
};

const TIER_ICONS = {
  bronze: Star,
  silver: Award,
  gold: Crown,
  platinum: Sparkles
};

const TIER_TEXT_COLOR = {
  bronze: "text-amber-700",
  silver: "text-slate-600",
  gold: "text-yellow-600",
  platinum: "text-purple-600"
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
        .single();

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
          toast.success(`🎉 Congratulations! You've unlocked ${membershipData.membership_tier.toUpperCase()} tier!`);
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
      { name: 'bronze', threshold: 0, rate: 5 },
      { name: 'silver', threshold: 20, rate: 6 },
      { name: 'gold', threshold: 50, rate: 7 },
      { name: 'platinum', threshold: 150, rate: 10 }
    ];

    const currentIndex = tiers.findIndex(t => t.name === membership.membership_tier);
    if (currentIndex === tiers.length - 1) return null; // Already at max tier

    const nextTier = tiers[currentIndex + 1];
    const remaining = nextTier.threshold - membership.total_spent_usd;
    const progress = (membership.total_spent_usd / nextTier.threshold) * 100;

    return { ...nextTier, remaining, progress };
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

  return (
    <div className="min-h-screen bg-background">
      <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-neon bg-clip-text text-transparent">
            My Account
          </h1>

          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="info" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Account Info</span>
              </TabsTrigger>
              <TabsTrigger value="membership" className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span className="hidden sm:inline">Membership</span>
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                <span className="hidden sm:inline">My eSIMs</span>
              </TabsTrigger>
              <TabsTrigger value="earn" className="flex items-center gap-2">
                <Gift className="w-4 h-4" />
                <span className="hidden sm:inline">Refer & Earn</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Account Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Username</p>
                    <p className="text-lg font-medium">{profile?.username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="text-lg font-medium">{profile?.email}</p>
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
                  
                  <CardHeader className="relative z-10">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-6">
                          <div className="relative">
                            <div className="absolute inset-0 bg-white/30 rounded-full blur-2xl animate-pulse" />
                            <div className="absolute inset-0 bg-white/20 rounded-full blur-xl" />
                            <TierIcon className="w-20 h-20 relative z-10 drop-shadow-2xl animate-[float_3s_ease-in-out_infinite]" />
                          </div>
                          <div>
                            <div className="text-4xl md:text-5xl font-bold uppercase tracking-wider flex items-center gap-3 animate-fade-in mb-2">
                              {membership?.membership_tier} 
                              <Badge variant="secondary" className="bg-white/30 text-white border-0 text-sm backdrop-blur-sm">
                                Active
                              </Badge>
                            </div>
                            <div className="text-lg md:text-xl opacity-95 flex items-center gap-2">
                              <Zap className="w-5 h-5 animate-pulse" />
                              <span className="font-semibold">{membership?.cashback_rate}% cashback</span>
                              <span className="opacity-80">on every purchase</span>
                            </div>
                          </div>
                        </div>
                      </div>
                  </CardHeader>
                  
                  <CardContent className="relative z-10 space-y-6 pt-8">
                    <div className="bg-white/15 backdrop-blur-md rounded-xl p-6 border border-white/30">
                      <div className="flex items-center justify-between">
                        <p className="text-base opacity-90 font-medium">Lifetime Spending</p>
                        <p className="text-3xl font-bold tracking-tight">${membership?.total_spent_usd.toFixed(2)}</p>
                      </div>
                    </div>

                    {nextTier && (
                      <div className="space-y-3 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            <p className="text-sm font-medium">Next Tier Progress</p>
                          </div>
                          <p className="text-sm font-bold">
                            {Math.round(nextTier.progress)}%
                          </p>
                        </div>
                        
                        <div className="relative">
                          {/* Progress bar with glow effect */}
                          <div className="h-4 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/30">
                            <div 
                              className="h-full bg-gradient-to-r from-white via-white to-white/90 rounded-full transition-all duration-1000 ease-out relative shadow-[0_0_20px_rgba(255,255,255,0.5)]"
                              style={{ width: `${nextTier.progress}%` }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_2s_ease-in-out_infinite]" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <p className="opacity-90">
                            ${nextTier.remaining.toFixed(2)} away from {nextTier.name.toUpperCase()}
                          </p>
                          <Badge variant="secondary" className="bg-white/20 text-white border-0">
                            +{(nextTier.rate - (membership?.cashback_rate || 0)).toFixed(0)}% cashback
                          </Badge>
                        </div>
                      </div>
                    )}
                    
                    {!nextTier && (
                      <div className="bg-white/15 backdrop-blur-md rounded-xl p-6 border border-white/30 animate-fade-in">
                        <div className="flex items-center gap-4">
                          <Crown className="w-8 h-8 animate-[float_3s_ease-in-out_infinite]" />
                          <p className="text-xl font-semibold">🎉 You've reached the highest tier!</p>
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
                      All Membership Tiers
                    </CardTitle>
                    <CardDescription className="text-base">Unlock better rewards as you spend more</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Bronze Tier */}
                      <div className={`group p-6 border-2 rounded-2xl transition-all duration-300 hover:scale-[1.03] hover:shadow-xl ${
                        membership?.membership_tier === 'bronze' 
                          ? 'border-amber-600/60 bg-gradient-to-br from-amber-50/80 via-amber-50/40 to-transparent dark:from-amber-950/30 dark:via-amber-950/10 shadow-lg' 
                          : 'border-border/60 hover:border-amber-600/40 bg-card/30'
                      }`}>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="relative">
                            <Star className={`w-9 h-9 ${TIER_TEXT_COLOR.bronze} transition-all duration-300 group-hover:scale-125 group-hover:rotate-12`} />
                            {membership?.membership_tier === 'bronze' && (
                              <div className="absolute inset-0 bg-amber-500/30 rounded-full blur-xl animate-pulse" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className={`font-bold text-xl ${TIER_TEXT_COLOR.bronze} tracking-wide`}>BRONZE</h3>
                            {membership?.membership_tier === 'bronze' && (
                              <Badge variant="secondary" className="text-xs mt-1 bg-amber-100 dark:bg-amber-950/50">Current Tier</Badge>
                            )}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <span className="font-semibold">Entry level</span>
                            <span className="opacity-60">•</span>
                            <span>$0+ spent</span>
                          </p>
                          <div className="flex items-baseline gap-2">
                            <p className="text-4xl font-bold text-foreground">5%</p>
                            <p className="text-base text-muted-foreground font-medium">cashback</p>
                          </div>
                        </div>
                      </div>

                      {/* Silver Tier */}
                      <div className={`group p-6 border-2 rounded-2xl transition-all duration-300 hover:scale-[1.03] hover:shadow-xl ${
                        membership?.membership_tier === 'silver' 
                          ? 'border-slate-500/60 bg-gradient-to-br from-slate-50/80 via-slate-50/40 to-transparent dark:from-slate-900/30 dark:via-slate-900/10 shadow-lg' 
                          : 'border-border/60 hover:border-slate-500/40 bg-card/30'
                      }`}>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="relative">
                            <Award className={`w-9 h-9 ${TIER_TEXT_COLOR.silver} transition-all duration-300 group-hover:scale-125 group-hover:rotate-12`} />
                            {membership?.membership_tier === 'silver' && (
                              <div className="absolute inset-0 bg-slate-400/30 rounded-full blur-xl animate-pulse" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className={`font-bold text-xl ${TIER_TEXT_COLOR.silver} tracking-wide`}>SILVER</h3>
                            {membership?.membership_tier === 'silver' && (
                              <Badge variant="secondary" className="text-xs mt-1 bg-slate-100 dark:bg-slate-950/50">Current Tier</Badge>
                            )}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <span className="font-semibold">Upgrade at</span>
                            <span className="opacity-60">•</span>
                            <span>$20+ spent</span>
                          </p>
                          <div className="flex items-baseline gap-2">
                            <p className="text-4xl font-bold text-foreground">6%</p>
                            <p className="text-base text-muted-foreground font-medium">cashback</p>
                          </div>
                        </div>
                      </div>

                      {/* Gold Tier */}
                      <div className={`group p-6 border-2 rounded-2xl transition-all duration-300 hover:scale-[1.03] hover:shadow-xl ${
                        membership?.membership_tier === 'gold' 
                          ? 'border-yellow-500/60 bg-gradient-to-br from-yellow-50/80 via-yellow-50/40 to-transparent dark:from-yellow-950/30 dark:via-yellow-950/10 shadow-lg' 
                          : 'border-border/60 hover:border-yellow-500/40 bg-card/30'
                      }`}>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="relative">
                            <Crown className={`w-9 h-9 ${TIER_TEXT_COLOR.gold} transition-all duration-300 group-hover:scale-125 group-hover:rotate-12`} />
                            {membership?.membership_tier === 'gold' && (
                              <div className="absolute inset-0 bg-yellow-500/30 rounded-full blur-xl animate-pulse" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className={`font-bold text-xl ${TIER_TEXT_COLOR.gold} tracking-wide`}>GOLD</h3>
                            {membership?.membership_tier === 'gold' && (
                              <Badge variant="secondary" className="text-xs mt-1 bg-yellow-100 dark:bg-yellow-950/50">Current Tier</Badge>
                            )}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <span className="font-semibold">Premium</span>
                            <span className="opacity-60">•</span>
                            <span>$50+ spent</span>
                          </p>
                          <div className="flex items-baseline gap-2">
                            <p className="text-4xl font-bold text-foreground">7%</p>
                            <p className="text-base text-muted-foreground font-medium">cashback</p>
                          </div>
                        </div>
                      </div>

                      {/* Platinum Tier */}
                      <div className={`group p-6 border-2 rounded-2xl transition-all duration-300 hover:scale-[1.03] hover:shadow-xl ${
                        membership?.membership_tier === 'platinum' 
                          ? 'border-purple-500/60 bg-gradient-to-br from-purple-50/80 via-purple-50/40 to-transparent dark:from-purple-950/30 dark:via-purple-950/10 shadow-lg' 
                          : 'border-border/60 hover:border-purple-500/40 bg-card/30'
                      }`}>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="relative">
                            <Sparkles className={`w-9 h-9 ${TIER_TEXT_COLOR.platinum} transition-all duration-300 group-hover:scale-125 group-hover:rotate-12`} />
                            {membership?.membership_tier === 'platinum' && (
                              <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-xl animate-pulse" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className={`font-bold text-xl ${TIER_TEXT_COLOR.platinum} tracking-wide`}>PLATINUM</h3>
                            {membership?.membership_tier === 'platinum' && (
                              <Badge variant="secondary" className="text-xs mt-1 bg-purple-100 dark:bg-purple-950/50">Current Tier</Badge>
                            )}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <span className="font-semibold">Elite</span>
                            <span className="opacity-60">•</span>
                            <span>$150+ spent</span>
                          </p>
                          <div className="flex items-baseline gap-2">
                            <p className="text-4xl font-bold text-foreground">10%</p>
                            <p className="text-base text-muted-foreground font-medium">cashback</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    My eSIMs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => navigate(localizedPath('/orders', language))}>
                    View All Orders
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="earn">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="w-5 h-5" />
                    Refer & Earn
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => navigate(localizedPath('/affiliate', language))}>
                    Go to Affiliate Program
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
