import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import { SiteNavigation } from "@/components/SiteNavigation";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Copy, TrendingUp, Users, DollarSign, CheckCircle2, Loader2, 
  XCircle, AlertCircle, Award, UserPlus, Share2, ArrowRight,
  Coins, Zap, Gift, Network, ChevronRight, Link
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAffiliateTracking } from "@/hooks/useAffiliateTracking";
import { useTranslation } from "@/contexts/TranslationContext";
import { EmailVerification } from "@/components/EmailVerification";
import { localizedPath } from "@/utils/localizedLinks";

const SupportChatbot = lazy(() => import("@/components/SupportChatbot").then(m => ({ default: m.SupportChatbot })));
const MiningRewardsSection = lazy(() => import("@/components/MiningRewardsSection").then(m => ({ default: m.MiningRewardsSection })));
const ConversionRewardsSection = lazy(() => import("@/components/ConversionRewardsSection").then(m => ({ default: m.ConversionRewardsSection })));
const ReferralsList = lazy(() => import("@/components/ReferralsList").then(m => ({ default: m.ReferralsList })));

interface AffiliateData {
  id: string;
  affiliate_code: string;
  username: string | null;
  total_registrations: number;
  total_conversions: number;
  total_earnings_usd: number;
  commission_rate: number;
  status: string;
  tier_level: number;
  registration_milestone_level: number;
  miner_boost_percentage: number;
}

export default function Affiliate() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [allAffiliates, setAllAffiliates] = useState<AffiliateData[]>([]);
  const [affiliateLink, setAffiliateLink] = useState("");
  const [customLink, setCustomLink] = useState("");
  const [username, setUsername] = useState("");
  const [newLinkUsername, setNewLinkUsername] = useState("");
  const [showNewLinkInput, setShowNewLinkInput] = useState(false);
  const [updatingUsername, setUpdatingUsername] = useState(false);
  const [usernameAvailability, setUsernameAvailability] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [showVerification, setShowVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [selectedAffiliateId, setSelectedAffiliateId] = useState<string>("");
  
  const selectedAffiliate = allAffiliates.find(a => a.id === selectedAffiliateId) || affiliate;
  
  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (!newLinkUsername || !showNewLinkInput) {
      setUsernameAvailability('idle');
      return;
    }
    if (newLinkUsername.length < 3 || newLinkUsername.length > 30) {
      setUsernameAvailability('invalid');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(newLinkUsername)) {
      setUsernameAvailability('invalid');
      return;
    }
    setUsernameAvailability('checking');
    const timeoutId = setTimeout(async () => {
      try {
        const { data, error } = await supabase.from('affiliates').select('id').eq('username', newLinkUsername.toLowerCase()).maybeSingle();
        if (error) throw error;
        setUsernameAvailability(data ? 'taken' : 'available');
      } catch (error) {
        console.error('Error checking username:', error);
        setUsernameAvailability('idle');
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [newLinkUsername, showNewLinkInput]);

  const checkUser = async () => {
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 8000);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      clearTimeout(timeoutId);
      
      if (!user) {
        // Redirect to auth if not signed in
        navigate('/auth?mode=signup&redirect=/affiliate');
        return;
      }
      
      setUser(user);
      await fetchAffiliates(user.id, user.email || undefined);
    } catch (error) {
      console.error('Error checking user:', error);
      // Redirect on error as well
      navigate('/auth?mode=signup&redirect=/affiliate');
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const fetchAffiliates = async (userId: string, userEmail?: string) => {
    let query = supabase.from('affiliates').select('*');
    if (userEmail) {
      query = query.or(`user_id.eq.${userId},email.eq.${userEmail}`);
    } else {
      query = query.eq('user_id', userId);
    }
    const { data, error } = await query.order('created_at', { ascending: true });
    if (!error && data && data.length > 0) {
      setAllAffiliates(data);
      const highestTierAffiliate = data.reduce((prev, current) => 
        (current.tier_level > prev.tier_level) ? current : prev
      );
      setAffiliate(highestTierAffiliate);
      setSelectedAffiliateId(highestTierAffiliate.id);
      setAffiliateLink(`${window.location.origin}/r/${highestTierAffiliate.affiliate_code}`);
      setUsername(highestTierAffiliate.username || '');
      if (highestTierAffiliate.username) {
        setCustomLink(`${window.location.origin}/${highestTierAffiliate.username}`);
      }
    }
  };

  const tierInfo = useMemo(() => {
    if (!affiliate) return null;
    const tiers = [
      { level: 1, name: 'Starter', conversions: 0, description: '9% on direct sales', color: 'text-neon-cyan' },
      { level: 2, name: 'Pro', conversions: 10, description: 'Additional 6% on 2nd level', color: 'text-neon-violet' },
      { level: 3, name: 'Elite', conversions: 30, description: 'Additional 3% on 3rd level', color: 'text-neon-coral' },
    ];
    const currentTier = tiers.find(t => t.level === affiliate.tier_level) || tiers[0];
    const nextTier = tiers.find(t => t.level === affiliate.tier_level + 1);
    const totalConversions = affiliate.total_conversions || 0;
    if (!nextTier) {
      return { currentTier, nextTier: null, progress: 100, remaining: 0, totalConversions };
    }
    const remaining = nextTier.conversions - totalConversions;
    const progress = Math.min((totalConversions / nextTier.conversions) * 100, 100);
    return { currentTier, nextTier, progress, remaining, totalConversions };
  }, [affiliate]);

  const handleAffiliateChange = useCallback((affiliateId: string) => {
    const selected = allAffiliates.find(a => a.id === affiliateId);
    if (selected) {
      setSelectedAffiliateId(affiliateId);
      setAffiliate(selected);
      setAffiliateLink(`${window.location.origin}/r/${selected.affiliate_code}`);
      setUsername(selected.username || '');
      if (selected.username) {
        setCustomLink(`${window.location.origin}/${selected.username}`);
      }
    }
  }, [allAffiliates]);
  
  const copyLink = useCallback((link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard!");
  }, []);

  const updateUsername = async () => {
    if (!username || !affiliate) return;
    if (!/^[a-z0-9-]+$/.test(username)) {
      toast.error("Username can only contain lowercase letters, numbers, and hyphens");
      return;
    }
    if (username.length < 3 || username.length > 30) {
      toast.error("Username must be between 3 and 30 characters");
      return;
    }
    setUpdatingUsername(true);
    try {
      const { error } = await supabase.from('affiliates').update({ username: username.toLowerCase() }).eq('id', affiliate.id);
      if (error) {
        if (error.code === '23505') {
          toast.error("Username already taken. Please choose another.");
        } else {
          throw error;
        }
        return;
      }
      setAffiliate({ ...affiliate, username: username.toLowerCase() });
      setCustomLink(`${window.location.origin}/${username.toLowerCase()}`);
      toast.success("Custom link updated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update username");
    } finally {
      setUpdatingUsername(false);
    }
  };

  const createAffiliate = async () => {
    if (!user) {
      navigate('/auth?mode=signup');
      return;
    }
    if (showNewLinkInput && !newLinkUsername) {
      toast.error("Please enter a username for your new affiliate link");
      return;
    }
    if (showNewLinkInput && usernameAvailability !== 'available') {
      toast.error("Please choose a valid and available username");
      return;
    }
    setCreating(true);
    try {
      const { data: existingAffiliates, error: countError } = await supabase.from('affiliates').select('id').eq('user_id', user.id);
      if (countError) throw countError;
      if (existingAffiliates && existingAffiliates.length >= 3) {
        toast.error("You've reached the maximum of 3 affiliate links");
        setCreating(false);
        return;
      }
      const isFirstAffiliate = !existingAffiliates || existingAffiliates.length === 0;
      let affiliateUsername = newLinkUsername.toLowerCase() || username;
      if (isFirstAffiliate) {
        const { data: profile } = await supabase.from('profiles').select('username').eq('user_id', user.id).maybeSingle();
        if (profile?.username) {
          affiliateUsername = profile.username;
        } else {
          affiliateUsername = user.email!.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        }
      }
      const { referralCode } = useAffiliateTracking.getState();
      let parentAffiliateId = null;
      if (referralCode && isFirstAffiliate) {
        const { data: parentAffiliate } = await supabase.from('affiliates').select('id').eq('affiliate_code', referralCode).maybeSingle();
        if (parentAffiliate) {
          parentAffiliateId = parentAffiliate.id;
        }
      }
      const { data: result, error: edgeFunctionError } = await supabase.functions.invoke('create-affiliate', {
        body: { email: user.email!, username: affiliateUsername, userId: user.id }
      });
      if (edgeFunctionError) throw edgeFunctionError;
      if (!result?.affiliate) throw new Error('Failed to create affiliate');
      const affiliateData = result.affiliate;
      if (result.requiresVerification) {
        setPendingEmail(user.email!);
        setShowVerification(true);
        toast.info("Check your email for verification code!");
        setCreating(false);
        return;
      }
      if (parentAffiliateId) {
        await supabase.from('affiliates').update({ parent_affiliate_id: parentAffiliateId }).eq('id', affiliateData.id);
      }
      setAffiliate(affiliateData);
      setUsername(affiliateData.username || '');
      setCustomLink(`${window.location.origin}/${affiliateData.username}`);
      setAffiliateLink(`${window.location.origin}/r/${affiliateData.affiliate_code}`);
      setShowNewLinkInput(false);
      setNewLinkUsername('');
      setUsernameAvailability('idle');
      await fetchAffiliates(user.id, user.email || undefined);
      toast.success(`Affiliate link ${existingAffiliates.length + 1} created!`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create affiliate link");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (showVerification) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,255,200,0.08),transparent_50%)]" />
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4 py-12">
          <EmailVerification
            email={pendingEmail}
            type="affiliate"
            onVerified={() => {
              setShowVerification(false);
              toast.success("Affiliate account verified! Refreshing...");
              if (user) fetchAffiliates(user.id, user.email || undefined);
            }}
            onBack={() => setShowVerification(false)}
          />
        </div>
      </div>
    );
  }

  const benefits = [
    { icon: Zap, title: "Up to +100% Boost", desc: "Earn more from YOUR contributions", color: "from-neon-cyan to-neon-cyan/50" },
    { icon: TrendingUp, title: "5% Passive Earnings", desc: "From all your referrals' points", color: "from-neon-violet to-neon-violet/50" },
    { icon: DollarSign, title: "Sales Commissions", desc: "9% / 6% / 3% on eSIM purchases", color: "from-neon-coral to-neon-coral/50" },
    { icon: Link, title: "Your Unique Link", desc: "One personalized invite link", color: "from-primary to-primary/50" },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <SEO page="affiliate" />
      
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,255,200,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.08),transparent_50%)]" />

      {/* Hero Section - Updated messaging */}
      <section className="pt-28 pb-12 md:pt-36 md:pb-16 px-4 relative z-10">
        <div className="container max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 mb-6">
            <Users className="w-4 h-4 text-neon-cyan" />
            <span className="text-sm font-medium text-neon-cyan">Grow Your Network, Boost Your Rewards</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-foreground">Invite Friends.</span>{" "}
            <span className="bg-gradient-to-r from-neon-cyan to-neon-violet bg-clip-text text-transparent">Earn More.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            The more users you invite, the higher YOUR reward boost. Plus earn 5% of everything your network earns — forever.
          </p>

          {/* Main Value Props */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
            <div className="px-5 py-3 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30">
              <span className="text-2xl font-bold text-neon-cyan">+100%</span>
              <span className="text-sm text-muted-foreground ml-2">Max Boost</span>
            </div>
            <div className="px-5 py-3 rounded-xl bg-neon-violet/10 border border-neon-violet/30">
              <span className="text-2xl font-bold text-neon-violet">5%</span>
              <span className="text-sm text-muted-foreground ml-2">From Network</span>
            </div>
            <div className="px-5 py-3 rounded-xl bg-muted/50 border border-border">
              <span className="text-2xl font-bold text-foreground">9%</span>
              <span className="text-sm text-muted-foreground ml-2">Sales Commission</span>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-12 md:py-16 px-4 relative z-10">
        <div className="container max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div key={index} className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-primary/30 transition-all group">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${benefit.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-base font-medium text-white mb-1">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content - Logged in users only now */}
      <section className="py-12 md:py-16 px-4 relative z-10">
        <div className="container max-w-4xl mx-auto">
          {!affiliate ? (
            /* Logged In - No Affiliate Yet */
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-medium text-foreground mb-2">Welcome, {user?.email}</h2>
                <p className="text-muted-foreground mb-6">Create your first invite link to start earning boosts and passive rewards</p>
                <Button onClick={createAffiliate} size="lg" disabled={creating} className="bg-primary hover:bg-primary/90">
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("affiliateCreateButton")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* Has Affiliate - Dashboard */
            <div className="space-y-6">
              {/* Account Selector */}
              {allAffiliates.length > 1 && (
                <Card className="bg-white/[0.02] backdrop-blur-xl border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Users className="w-5 h-5 text-primary" />
                      <Select value={selectedAffiliateId} onValueChange={handleAffiliateChange}>
                        <SelectTrigger className="flex-1 bg-background/50 border-white/10">
                          <SelectValue placeholder="Select affiliate account" />
                        </SelectTrigger>
                        <SelectContent>
                          {allAffiliates.map((aff) => (
                            <SelectItem key={aff.id} value={aff.id}>
                              {aff.username || aff.affiliate_code} • Tier {aff.tier_level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Stats Grid - Updated labels */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-card/50 border border-border/50 text-center">
                  <p className="text-2xl font-bold text-neon-cyan">{affiliate.total_registrations}</p>
                  <p className="text-xs text-muted-foreground">Network Users</p>
                </div>
                <div className="p-4 rounded-xl bg-card/50 border border-border/50 text-center">
                  <p className="text-2xl font-bold text-neon-violet">+{affiliate.miner_boost_percentage}%</p>
                  <p className="text-xs text-muted-foreground">Your Boost</p>
                </div>
                <div className="p-4 rounded-xl bg-card/50 border border-border/50 text-center">
                  <p className="text-2xl font-bold text-neon-coral">{affiliate.total_conversions}</p>
                  <p className="text-xs text-muted-foreground">Purchases</p>
                </div>
                <div className="p-4 rounded-xl bg-card/50 border border-border/50 text-center">
                  <p className="text-2xl font-bold text-primary">${affiliate.total_earnings_usd.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Earned</p>
                </div>
              </div>

              {/* Your Link - Single username-based link */}
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-primary" />
                    Your Invite Link
                  </CardTitle>
                  <CardDescription>Share this personalized link to grow your network</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {affiliate.username ? (
                    /* Has username - show the clean link */
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input 
                          value={customLink} 
                          readOnly 
                          className="bg-background/50 border-border font-medium"
                        />
                        <Button onClick={() => copyLink(customLink)} variant="outline">
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Your personalized link: <span className="text-primary font-medium">nomiqa.app/{affiliate.username}</span>
                      </p>
                    </div>
                  ) : (
                    /* No username yet - prompt to create one */
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                        <p className="text-sm text-foreground mb-1 font-medium">Create your personalized link</p>
                        <p className="text-xs text-muted-foreground">Choose a unique username for your invite link (e.g., nomiqa.app/yourname)</p>
                      </div>
                      <div className="flex gap-2">
                        <Input 
                          value={username}
                          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                          placeholder="your-username"
                          className="bg-background/50 border-border"
                        />
                        <Button onClick={updateUsername} disabled={updatingUsername || !username.trim()}>
                          {updatingUsername ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Link"}
                        </Button>
                      </div>
                      {username && (
                        <p className="text-xs text-muted-foreground">
                          Preview: <span className="text-primary">nomiqa.app/{username}</span>
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tier Progress */}
              {tierInfo && (
                <Card className="bg-card/50 border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Award className={`w-5 h-5 ${tierInfo.currentTier.color}`} />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{tierInfo.currentTier.name} Tier</p>
                          <p className="text-xs text-muted-foreground">{tierInfo.currentTier.description}</p>
                        </div>
                      </div>
                      {tierInfo.nextTier && (
                        <Badge variant="outline" className="border-primary/30 text-primary">
                          {tierInfo.remaining} to {tierInfo.nextTier.name}
                        </Badge>
                      )}
                    </div>
                    {tierInfo.nextTier && (
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-neon-cyan to-neon-violet rounded-full transition-all"
                          style={{ width: `${tierInfo.progress}%` }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Rewards Sections */}
              <Suspense fallback={<div className="h-40 animate-pulse bg-white/5 rounded-xl" />}>
                <MiningRewardsSection 
                  totalRegistrations={affiliate.total_registrations}
                  currentMilestoneLevel={affiliate.registration_milestone_level}
                  minerBoostPercentage={affiliate.miner_boost_percentage}
                />
              </Suspense>
              <Suspense fallback={<div className="h-40 animate-pulse bg-white/5 rounded-xl" />}>
                <ConversionRewardsSection 
                  totalConversions={affiliate.total_conversions}
                  currentTierLevel={affiliate.tier_level}
                  totalEarnings={affiliate.total_earnings_usd}
                />
              </Suspense>
              <Suspense fallback={<div className="h-40 animate-pulse bg-white/5 rounded-xl" />}>
                <ReferralsList affiliateId={affiliate.id} />
              </Suspense>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section - Updated */}
      {!affiliate && (
        <section className="py-16 md:py-20 px-4 relative z-10">
          <div className="container max-w-4xl mx-auto">
            <div className="p-8 md:p-12 rounded-2xl bg-card/50 border border-border/50 text-center">
              <Network className="w-12 h-12 text-primary mx-auto mb-6" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Start Building Your Network
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Every user you invite boosts YOUR earning power. The more your network grows, the more you earn from your own contributions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => navigate(localizedPath('/download', language))}
                  className="bg-primary hover:bg-primary/90 px-8 py-6 rounded-xl"
                >
                  Download the App
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  onClick={() => navigate(localizedPath('/getting-started', language))}
                  variant="outline" 
                  className="px-8 py-6 rounded-xl"
                >
                  Learn How It Works
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      <SiteNavigation />
      <Suspense fallback={null}>
        <SupportChatbot />
      </Suspense>
    </div>
  );
}