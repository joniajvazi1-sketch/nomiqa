import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, User, Award, Package, Gift, Crown, Star } from "lucide-react";
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
  bronze: "bg-gradient-to-r from-amber-700 to-amber-900",
  silver: "bg-gradient-to-r from-slate-400 to-slate-600",
  gold: "bg-gradient-to-r from-yellow-400 to-yellow-600",
  platinum: "bg-gradient-to-r from-purple-400 to-purple-600"
};

const TIER_ICONS = {
  bronze: Star,
  silver: Award,
  gold: Crown,
  platinum: Crown
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
                <Card className={`${membership ? TIER_COLORS[membership.membership_tier as keyof typeof TIER_COLORS] : ''} text-white`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <TierIcon className="w-8 h-8" />
                      <div>
                        <div className="text-2xl uppercase">{membership?.membership_tier} Member</div>
                        <div className="text-sm opacity-90">Earning {membership?.cashback_rate}% cashback</div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-lg">Total Spent: ${membership?.total_spent_usd.toFixed(2)}</p>
                      {nextTier && (
                        <div className="mt-4">
                          <p className="text-sm mb-2">
                            ${nextTier.remaining.toFixed(2)} away from {nextTier.name.toUpperCase()} ({nextTier.rate}% cashback)
                          </p>
                          <Progress value={nextTier.progress} className="h-2" />
                        </div>
                      )}
                      {!nextTier && (
                        <p className="text-sm mt-2">🎉 You've reached the highest tier!</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Membership Tiers</CardTitle>
                    <CardDescription>Earn more as you spend more</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="w-5 h-5 text-amber-700" />
                          <h3 className="font-bold text-amber-700">BRONZE</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">$0+ spent</p>
                        <p className="text-lg font-bold">5% cashback</p>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="w-5 h-5 text-slate-500" />
                          <h3 className="font-bold text-slate-500">SILVER</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">$20+ spent</p>
                        <p className="text-lg font-bold">6% cashback</p>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Crown className="w-5 h-5 text-yellow-500" />
                          <h3 className="font-bold text-yellow-500">GOLD</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">$50+ spent</p>
                        <p className="text-lg font-bold">7% cashback</p>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Crown className="w-5 h-5 text-purple-500" />
                          <h3 className="font-bold text-purple-500">PLATINUM</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">$150+ spent</p>
                        <p className="text-lg font-bold">10% cashback</p>
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
