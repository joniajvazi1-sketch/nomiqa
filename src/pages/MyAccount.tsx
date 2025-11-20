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
  bronze: "bg-gradient-to-br from-amber-700 via-amber-600 to-amber-900",
  silver: "bg-gradient-to-br from-slate-300 via-slate-400 to-slate-600",
  gold: "bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600",
  platinum: "bg-gradient-to-br from-purple-400 via-purple-500 to-purple-700"
};

const TIER_GLOW = {
  bronze: "shadow-[0_0_30px_rgba(217,119,6,0.4)]",
  silver: "shadow-[0_0_30px_rgba(148,163,184,0.4)]",
  gold: "shadow-[0_0_40px_rgba(234,179,8,0.5)]",
  platinum: "shadow-[0_0_50px_rgba(168,85,247,0.6)]"
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
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.8),transparent_50%)] animate-pulse" />
                  </div>
                  
                  <CardHeader className="relative z-10">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse" />
                          <TierIcon className="w-16 h-16 relative z-10 drop-shadow-2xl" />
                        </div>
                        <div>
                          <div className="text-3xl md:text-4xl font-bold uppercase tracking-wide flex items-center gap-2 animate-fade-in">
                            {membership?.membership_tier} 
                            <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
                              Active
                            </Badge>
                          </div>
                          <div className="text-base md:text-lg opacity-90 mt-1 flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            Earning {membership?.cashback_rate}% cashback on every purchase
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="relative z-10 space-y-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm opacity-80">Lifetime Spending</p>
                        <p className="text-2xl font-bold">${membership?.total_spent_usd.toFixed(2)}</p>
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
                          <div className="h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                            <div 
                              className="h-full bg-gradient-to-r from-white via-white/90 to-white/80 rounded-full transition-all duration-1000 ease-out relative"
                              style={{ width: `${nextTier.progress}%` }}
                            >
                              <div className="absolute inset-0 bg-white/30 animate-pulse" />
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
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 animate-fade-in">
                        <div className="flex items-center gap-3">
                          <Crown className="w-6 h-6" />
                          <p className="text-lg font-medium">🎉 You've reached the highest tier!</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* All Tiers Overview */}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      All Membership Tiers
                    </CardTitle>
                    <CardDescription>Unlock better rewards as you spend more</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Bronze Tier */}
                      <div className={`group p-5 border-2 rounded-xl transition-all duration-300 hover:scale-105 ${
                        membership?.membership_tier === 'bronze' 
                          ? 'border-amber-700/50 bg-gradient-to-br from-amber-50 to-transparent dark:from-amber-950/20' 
                          : 'border-border hover:border-amber-700/30'
                      }`}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="relative">
                            <Star className={`w-7 h-7 ${TIER_TEXT_COLOR.bronze} transition-transform group-hover:scale-110 group-hover:rotate-12`} />
                            {membership?.membership_tier === 'bronze' && (
                              <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-lg animate-pulse" />
                            )}
                          </div>
                          <div>
                            <h3 className={`font-bold text-lg ${TIER_TEXT_COLOR.bronze}`}>BRONZE</h3>
                            {membership?.membership_tier === 'bronze' && (
                              <Badge variant="secondary" className="text-xs mt-1">Current Tier</Badge>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <span className="font-medium">Entry level</span> • $0+ spent
                          </p>
                          <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-bold text-foreground">5%</p>
                            <p className="text-sm text-muted-foreground">cashback</p>
                          </div>
                        </div>
                      </div>

                      {/* Silver Tier */}
                      <div className={`group p-5 border-2 rounded-xl transition-all duration-300 hover:scale-105 ${
                        membership?.membership_tier === 'silver' 
                          ? 'border-slate-500/50 bg-gradient-to-br from-slate-50 to-transparent dark:from-slate-900/20' 
                          : 'border-border hover:border-slate-500/30'
                      }`}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="relative">
                            <Award className={`w-7 h-7 ${TIER_TEXT_COLOR.silver} transition-transform group-hover:scale-110 group-hover:rotate-12`} />
                            {membership?.membership_tier === 'silver' && (
                              <div className="absolute inset-0 bg-slate-400/20 rounded-full blur-lg animate-pulse" />
                            )}
                          </div>
                          <div>
                            <h3 className={`font-bold text-lg ${TIER_TEXT_COLOR.silver}`}>SILVER</h3>
                            {membership?.membership_tier === 'silver' && (
                              <Badge variant="secondary" className="text-xs mt-1">Current Tier</Badge>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <span className="font-medium">Upgrade at</span> • $20+ spent
                          </p>
                          <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-bold text-foreground">6%</p>
                            <p className="text-sm text-muted-foreground">cashback</p>
                          </div>
                        </div>
                      </div>

                      {/* Gold Tier */}
                      <div className={`group p-5 border-2 rounded-xl transition-all duration-300 hover:scale-105 ${
                        membership?.membership_tier === 'gold' 
                          ? 'border-yellow-500/50 bg-gradient-to-br from-yellow-50 to-transparent dark:from-yellow-950/20' 
                          : 'border-border hover:border-yellow-500/30'
                      }`}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="relative">
                            <Crown className={`w-7 h-7 ${TIER_TEXT_COLOR.gold} transition-transform group-hover:scale-110 group-hover:rotate-12`} />
                            {membership?.membership_tier === 'gold' && (
                              <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-lg animate-pulse" />
                            )}
                          </div>
                          <div>
                            <h3 className={`font-bold text-lg ${TIER_TEXT_COLOR.gold}`}>GOLD</h3>
                            {membership?.membership_tier === 'gold' && (
                              <Badge variant="secondary" className="text-xs mt-1">Current Tier</Badge>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <span className="font-medium">Premium</span> • $50+ spent
                          </p>
                          <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-bold text-foreground">7%</p>
                            <p className="text-sm text-muted-foreground">cashback</p>
                          </div>
                        </div>
                      </div>

                      {/* Platinum Tier */}
                      <div className={`group p-5 border-2 rounded-xl transition-all duration-300 hover:scale-105 ${
                        membership?.membership_tier === 'platinum' 
                          ? 'border-purple-500/50 bg-gradient-to-br from-purple-50 to-transparent dark:from-purple-950/20' 
                          : 'border-border hover:border-purple-500/30'
                      }`}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="relative">
                            <Sparkles className={`w-7 h-7 ${TIER_TEXT_COLOR.platinum} transition-transform group-hover:scale-110 group-hover:rotate-12`} />
                            {membership?.membership_tier === 'platinum' && (
                              <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-lg animate-pulse" />
                            )}
                          </div>
                          <div>
                            <h3 className={`font-bold text-lg ${TIER_TEXT_COLOR.platinum}`}>PLATINUM</h3>
                            {membership?.membership_tier === 'platinum' && (
                              <Badge variant="secondary" className="text-xs mt-1">Current Tier</Badge>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <span className="font-medium">Elite</span> • $150+ spent
                          </p>
                          <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-bold text-foreground">10%</p>
                            <p className="text-sm text-muted-foreground">cashback</p>
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
