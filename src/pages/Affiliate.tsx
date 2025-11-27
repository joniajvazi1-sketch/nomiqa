import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { SiteNavigation } from "@/components/SiteNavigation";
import { Footer } from "@/components/Footer";
import { NetworkBackground } from "@/components/NetworkBackground";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, TrendingUp, Users, DollarSign, CheckCircle2, Loader2, XCircle, AlertCircle, BarChart3, Share2, Award, Lock, Unlock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAffiliateTracking } from "@/hooks/useAffiliateTracking";
import { useTranslation } from "@/contexts/TranslationContext";
import { EmailVerification } from "@/components/EmailVerification";
interface AffiliateData {
  id: string;
  affiliate_code: string;
  username: string | null;
  total_clicks: number;
  total_conversions: number;
  total_earnings_usd: number;
  commission_rate: number;
  status: string;
  tier_level: number;
}
interface AnalyticsData {
  sourceBreakdown: {
    source: string;
    clicks: number;
    conversions: number;
  }[];
  levelBreakdown: {
    level: number;
    conversions: number;
    earnings: number;
  }[];
}
export default function Affiliate() {
  const navigate = useNavigate();
  const {
    t
  } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [allAffiliates, setAllAffiliates] = useState<AffiliateData[]>([]);
  const [affiliateLink, setAffiliateLink] = useState("");
  const [customLink, setCustomLink] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [newLinkUsername, setNewLinkUsername] = useState("");
  const [showNewLinkInput, setShowNewLinkInput] = useState(false);
  const [updatingUsername, setUpdatingUsername] = useState(false);
  const [usernameAvailability, setUsernameAvailability] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [selectedAffiliateId, setSelectedAffiliateId] = useState<string>("");
  
  // Derived value: get the currently selected affiliate
  const selectedAffiliate = allAffiliates.find(a => a.id === selectedAffiliateId) || affiliate;
  
  useEffect(() => {
    checkUser();
  }, []);

  // Debounced username availability check for new link
  useEffect(() => {
    if (!newLinkUsername || !showNewLinkInput) {
      setUsernameAvailability('idle');
      return;
    }

    // Validate username format
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
        const {
          data,
          error
        } = await supabase.from('affiliates').select('id').eq('username', newLinkUsername.toLowerCase()).maybeSingle();
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
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await fetchAffiliates(user.id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };
  const fetchAffiliates = async (userId: string) => {
    const {
      data,
      error
    } = await supabase.from('affiliates').select('*').eq('user_id', userId).order('created_at', {
      ascending: true
    });
    if (!error && data && data.length > 0) {
      setAllAffiliates(data);
      
      // Find the affiliate with highest tier level as default
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

      // Fetch analytics for selected affiliate
      fetchAnalytics(highestTierAffiliate.id);
    }
  };
  const getTierInfo = () => {
    if (!affiliate) return null;
    const tiers = [{
      level: 1,
      name: 'Starter',
      conversions: 0,
      description: '9% on direct sales',
      color: 'text-blue-500'
    }, {
      level: 2,
      name: 'Pro',
      conversions: 10,
      description: 'Additional 6% on 2nd level',
      color: 'text-purple-500'
    }, {
      level: 3,
      name: 'Elite',
      conversions: 30,
      description: 'Additional 3% on 3rd level',
      color: 'text-amber-500'
    }];
    
    // Use the selected affiliate's tier level
    const currentTier = tiers.find(t => t.level === affiliate.tier_level) || tiers[0];
    const nextTier = tiers.find(t => t.level === affiliate.tier_level + 1);
    
    // Use only the selected affiliate's conversions
    const totalConversions = affiliate.total_conversions || 0;
    if (!nextTier) {
      return {
        currentTier,
        nextTier: null,
        progress: 100,
        remaining: 0,
        totalConversions
      };
    }
    const remaining = nextTier.conversions - totalConversions;
    const progress = Math.min((totalConversions / nextTier.conversions) * 100, 100);
    return {
      currentTier,
      nextTier,
      progress,
      remaining,
      totalConversions
    };
  };
  
  const handleAffiliateChange = (affiliateId: string) => {
    const selected = allAffiliates.find(a => a.id === affiliateId);
    if (selected) {
      setSelectedAffiliateId(affiliateId);
      setAffiliate(selected);
      setAffiliateLink(`${window.location.origin}/r/${selected.affiliate_code}`);
      setUsername(selected.username || '');
      if (selected.username) {
        setCustomLink(`${window.location.origin}/${selected.username}`);
      }
      fetchAnalytics(selected.id);
    }
  };
  
  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard!");
  };
  const fetchAnalytics = async (affiliateId: string) => {
    setLoadingAnalytics(true);
    try {
      // Get source breakdown
      const {
        data: referrals
      } = await supabase.from('affiliate_referrals').select('source, status, commission_level, commission_amount_usd').eq('affiliate_id', affiliateId);
      if (referrals) {
        // Group by source
        const sourceMap = new Map<string, {
          clicks: number;
          conversions: number;
        }>();
        referrals.forEach(ref => {
          const current = sourceMap.get(ref.source) || {
            clicks: 0,
            conversions: 0
          };
          current.clicks += 1;
          if (ref.status === 'converted') current.conversions += 1;
          sourceMap.set(ref.source, current);
        });
        const sourceBreakdown = Array.from(sourceMap.entries()).map(([source, data]) => ({
          source,
          clicks: data.clicks,
          conversions: data.conversions
        })).sort((a, b) => b.clicks - a.clicks);

        // Group by level
        const levelMap = new Map<number, {
          conversions: number;
          earnings: number;
        }>();
        referrals.filter(r => r.status === 'converted').forEach(ref => {
          const level = ref.commission_level || 1;
          const current = levelMap.get(level) || {
            conversions: 0,
            earnings: 0
          };
          current.conversions += 1;
          current.earnings += ref.commission_amount_usd || 0;
          levelMap.set(level, current);
        });
        const levelBreakdown = Array.from(levelMap.entries()).map(([level, data]) => ({
          level,
          conversions: data.conversions,
          earnings: data.earnings
        })).sort((a, b) => a.level - b.level);
        setAnalytics({
          sourceBreakdown,
          levelBreakdown
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };
  const updateUsername = async () => {
    if (!username || !affiliate) return;

    // Validate username (alphanumeric and hyphens only)
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
      const {
        error
      } = await supabase.from('affiliates').update({
        username: username.toLowerCase()
      }).eq('id', affiliate.id);
      if (error) {
        if (error.code === '23505') {
          toast.error("Username already taken. Please choose another.");
        } else {
          throw error;
        }
        return;
      }
      setAffiliate({
        ...affiliate,
        username: username.toLowerCase()
      });
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

    // Validate custom username for additional links
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
      // Check how many affiliates this user already has
      const {
        data: existingAffiliates,
        error: countError
      } = await supabase.from('affiliates').select('id').eq('user_id', user.id);
      if (countError) throw countError;
      if (existingAffiliates && existingAffiliates.length >= 3) {
        toast.error("You've reached the maximum of 3 affiliate links");
        setCreating(false);
        return;
      }
      
      const isFirstAffiliate = !existingAffiliates || existingAffiliates.length === 0;

      // For first affiliate, use username from profile
      let affiliateUsername = newLinkUsername.toLowerCase() || username;
      if (isFirstAffiliate) {
        // Get username from profiles table
        const {
          data: profile
        } = await supabase.from('profiles').select('username').eq('user_id', user.id).maybeSingle();
        if (profile?.username) {
          affiliateUsername = profile.username;
        } else {
          // Auto-generate from email if no profile username
          affiliateUsername = user.email!.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        }
      }

      // Get referrer's affiliate ID if user signed up with a ref code
      const {
        referralCode
      } = useAffiliateTracking.getState();
      let parentAffiliateId = null;
      if (referralCode && isFirstAffiliate) {
        const {
          data: parentAffiliate
        } = await supabase.from('affiliates').select('id').eq('affiliate_code', referralCode).maybeSingle();
        if (parentAffiliate) {
          parentAffiliateId = parentAffiliate.id;
        }
      }

      // Call edge function to create affiliate with secure code
      const { data: result, error: edgeFunctionError } = await supabase.functions.invoke('create-affiliate', {
        body: {
          email: user.email!,
          username: affiliateUsername,
          userId: user.id,
        }
      });

      if (edgeFunctionError) throw edgeFunctionError;
      if (!result?.affiliate) throw new Error('Failed to create affiliate');

      const affiliateData = result.affiliate;

      // Check if verification is required
      if (result.requiresVerification) {
        setPendingEmail(user.email!);
        setShowVerification(true);
        toast.info("Check your email for verification code!");
        setCreating(false);
        return;
      }

      // Update parent affiliate ID if needed
      if (parentAffiliateId) {
        await supabase
          .from('affiliates')
          .update({ parent_affiliate_id: parentAffiliateId })
          .eq('id', affiliateData.id);
      }

      setAffiliate(affiliateData);
      setUsername(affiliateData.username || '');
      setCustomLink(`${window.location.origin}/${affiliateData.username}`);
      setAffiliateLink(`${window.location.origin}/r/${affiliateData.affiliate_code}`);
      setShowNewLinkInput(false);
      setNewLinkUsername('');
      setUsernameAvailability('idle');
      await fetchAffiliates(user.id);
      toast.success(`Affiliate link ${existingAffiliates.length + 1} created!`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create affiliate link");
    } finally {
      setCreating(false);
    }
  };
  const copyLinkLegacy = () => {
    navigator.clipboard.writeText(affiliateLink);
    toast.success("Link copied to clipboard!");
  };
  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }

  // Show verification modal if needed
  if (showVerification) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <NetworkBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4 py-12">
          <EmailVerification
            email={pendingEmail}
            type="affiliate"
            onVerified={() => {
              setShowVerification(false);
              toast.success("Affiliate account verified! Refreshing...");
              if (user) {
                fetchAffiliates(user.id);
              }
            }}
            onBack={() => setShowVerification(false)}
          />
        </div>
      </div>
    );
  }

  return <div className="min-h-screen bg-gradient-to-br from-black/40 via-deep-space/60 to-black/40 relative">
      {/* Network Background */}
      <NetworkBackground />
      
      {/* Subtle background glows */}
      <div className="fixed inset-0 -z-10 overflow-hidden opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-neon-violet/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-neon-cyan/30 rounded-full blur-3xl"></div>
      </div>

      <Navbar />
      
      <section className="pt-32 md:pt-24 pb-12 md:pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-deep-space/80 via-midnight-blue/60 to-deep-space/80 backdrop-blur-sm"></div>
        
        {/* Subtle accent glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-neon-violet/40 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-neon-coral/40 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <div className="space-y-4 md:space-y-6 animate-fade-in">
              {/* Premium badge */}
              <div className="inline-block">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-neon-coral via-neon-violet to-neon-cyan rounded-full blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
                  <span className="relative block px-8 py-3 bg-gradient-to-r from-neon-coral/10 via-neon-violet/10 to-neon-cyan/10 backdrop-blur-2xl border border-white/20 rounded-full text-sm md:text-base font-bold tracking-widest uppercase">
                    <span className="bg-gradient-to-r from-neon-coral via-neon-violet to-neon-cyan bg-clip-text text-transparent">
                      {t("passiveIncomeUnlocked")}
                    </span>
                  </span>
                </div>
              </div>
              
              {/* Premium headline */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black font-display leading-tight tracking-tight">
                <span className="block bg-gradient-to-r from-white via-neon-violet to-white bg-clip-text text-transparent mb-2 md:mb-4">
                  {t("earnWhileTheyTravel")}
                </span>
              </h1>
              
              {/* Premium commission display */}
              <div className="pt-6 md:pt-8 space-y-4 md:space-y-6">
                <div className="inline-block relative group">
                  <div className="absolute -inset-2 bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-coral rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition duration-500"></div>
                  <div className="relative px-10 py-5 bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-3xl border border-white/30 rounded-3xl shadow-2xl">
                    <p className="text-3xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-neon-cyan via-white to-neon-coral bg-clip-text text-transparent tracking-tight">
                      {t("totalCommissionSplit")}
                    </p>
                  </div>
                </div>
                
                <div className="w-full flex justify-center">
                  <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 text-sm md:text-base lg:text-lg px-4">
                    <span className="px-4 py-2 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan font-semibold backdrop-blur-sm">
                      {t("commissionBreakdown").split(' • ')[0]}
                    </span>
                    
                    <span className="px-4 py-2 rounded-xl bg-neon-violet/10 border border-neon-violet/30 text-neon-violet font-semibold backdrop-blur-sm">
                      {t("commissionBreakdown").split(' • ')[1]}
                    </span>
                    
                    <span className="px-4 py-2 rounded-xl bg-neon-coral/10 border border-neon-coral/30 text-neon-coral font-semibold backdrop-blur-sm">
                      {t("commissionBreakdown").split(' • ')[2]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Premium tagline */}
              <div className="pt-4 md:pt-6">
                <p className="text-base md:text-xl lg:text-2xl text-white/70 max-w-4xl mx-auto leading-relaxed px-4 font-light tracking-wide">
                  {t("infinitePotential")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <div className="container mx-auto px-3 md:px-4 py-8 md:py-12 relative z-10">
        <div className="max-w-6xl mx-auto">

          {!user ? <Card className="max-w-2xl mx-auto bg-white/[0.02] backdrop-blur-xl border-white/10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-neon-violet/5 via-transparent to-neon-cyan/5 pointer-events-none"></div>
              <CardHeader className="pb-3 md:pb-4 relative">
                <CardTitle className="text-center text-xl md:text-2xl bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-coral bg-clip-text text-transparent font-bold">
                  {t("affiliateAuthTitle")}
                </CardTitle>
                <CardDescription className="text-center text-xs md:text-sm text-foreground/80">
                  {t("affiliateAuthDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <div className="space-y-4 md:space-y-6">
                  {/* Feature Cards */}
                  <div className="grid md:grid-cols-3 gap-3 md:gap-4">
                    <div className="group text-center p-4 md:p-5 bg-gradient-to-br from-white/[0.03] to-white/[0.01] backdrop-blur-sm border border-white/10 rounded-xl hover:border-neon-cyan/30 hover:bg-white/[0.05] transition-all">
                      <div className="relative inline-block mb-3">
                        <div className="absolute inset-0 bg-neon-cyan/20 rounded-full blur-xl group-hover:bg-neon-cyan/30 transition-all"></div>
                        <DollarSign className="relative w-8 h-8 md:w-10 md:h-10 text-neon-cyan" />
                      </div>
                      <h3 className="font-bold text-sm md:text-base mb-1">{t("multiTierSystem")}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">{t("unlockLevels")}</p>
                    </div>
                    <div className="group text-center p-4 md:p-5 bg-gradient-to-br from-white/[0.03] to-white/[0.01] backdrop-blur-sm border border-white/10 rounded-xl hover:border-neon-violet/30 hover:bg-white/[0.05] transition-all">
                      <div className="relative inline-block mb-3">
                        <div className="absolute inset-0 bg-neon-violet/20 rounded-full blur-xl group-hover:bg-neon-violet/30 transition-all"></div>
                        <Users className="relative w-8 h-8 md:w-10 md:h-10 text-neon-violet" />
                      </div>
                      <h3 className="font-bold text-sm md:text-base mb-1">{t("trackReferrals")}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">{t("realTimeStats")}</p>
                    </div>
                    <div className="group text-center p-4 md:p-5 bg-gradient-to-br from-white/[0.03] to-white/[0.01] backdrop-blur-sm border border-white/10 rounded-xl hover:border-neon-coral/30 hover:bg-white/[0.05] transition-all">
                      <div className="relative inline-block mb-3">
                        <div className="absolute inset-0 bg-neon-coral/20 rounded-full blur-xl group-hover:bg-neon-coral/30 transition-all"></div>
                        <TrendingUp className="relative w-8 h-8 md:w-10 md:h-10 text-neon-coral" />
                      </div>
                      <h3 className="font-bold text-sm md:text-base mb-1">{t("threeAffiliateLinks")}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">{t("affiliatePerAccount")}</p>
                    </div>
                  </div>

                  {/* CTA Section */}
                  <div className="relative bg-gradient-to-br from-neon-violet/10 via-neon-coral/5 to-neon-cyan/10 border border-neon-violet/20 rounded-2xl p-6 md:p-8 text-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-neon-violet/10 via-transparent to-neon-cyan/10 animate-pulse" style={{
                  animationDuration: '3s'
                }}></div>
                    <div className="relative">
                      <div className="inline-block mb-4">
                        <CheckCircle2 className="w-12 h-12 md:w-14 md:h-14 text-neon-violet" />
                      </div>
                      <h3 className="text-lg md:text-xl font-bold mb-3 bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-coral bg-clip-text text-transparent">
                        {t("affiliateReadyTitle")}
                      </h3>
                      <p className="text-xs md:text-sm text-foreground/80 mb-6 max-w-lg mx-auto leading-relaxed">
                        {t("affiliateReadyDesc")}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button onClick={() => navigate('/auth?mode=signup')} size="lg" className="w-full sm:w-auto bg-gradient-to-r from-neon-violet to-neon-coral hover:from-neon-violet/90 hover:to-neon-coral/90 transition-all shadow-lg hover:shadow-neon-violet/50 font-semibold">
                          {t("affiliateRegisterNow")}
                        </Button>
                        <Button onClick={() => navigate('/auth')} size="lg" variant="outline" className="w-full sm:w-auto border-white/20 bg-white/[0.02] hover:bg-white/[0.05] backdrop-blur-sm font-semibold">
                          {t("affiliateLogIn")}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card> : !affiliate ? <Card className="max-w-2xl mx-auto bg-white/[0.02] backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle>Create Your First Affiliate Link</CardTitle>
                <CardDescription>
                  Get started with your automatic affiliate link based on your username
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-semibold">You're logged in as {user.email}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Your first affiliate link will be created automatically using your username. 
                      You can create 2 more custom links later for a total of 3 links.
                    </p>
                  </div>

                  <Button onClick={createAffiliate} className="w-full" size="lg" disabled={creating}>
                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create My First Affiliate Link
                  </Button>
                </div>
              </CardContent>
            </Card> : <>
              {/* Affiliate Account Selector */}
              {allAffiliates.length > 1 && (
                <Card className="mb-6 bg-card/80 backdrop-blur-xl border-border/50">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base md:text-lg flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      {t("selectAffiliateAccount")}
                    </CardTitle>
                    <CardDescription>
                      {t("youHave")} {allAffiliates.length} {allAffiliates.length === 1 ? t("affiliateAccount") : t("affiliateAccounts")}. {t("affiliateAccountsDesc")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select value={selectedAffiliateId} onValueChange={handleAffiliateChange}>
                      <SelectTrigger className="w-full bg-background/80 backdrop-blur-sm border-border/50 z-50">
                        <SelectValue placeholder={t("selectAnAffiliateAccount")} />
                      </SelectTrigger>
                      <SelectContent className="bg-card backdrop-blur-xl border-border/50 z-50">
                        {allAffiliates.map((aff) => (
                          <SelectItem key={aff.id} value={aff.id} className="hover:bg-muted/50">
                            <div className="flex items-center justify-between gap-4 w-full">
                              <span className="font-medium">
                                {aff.username || aff.affiliate_code}
                              </span>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Badge variant="outline" className="text-xs">
                                  Tier {aff.tier_level}
                                </Badge>
                                <span>{aff.total_conversions} conversions</span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 text-center">
                <Card className="group bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-xl border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:scale-105 relative overflow-hidden">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <CardHeader className="pb-3 md:pb-4 relative z-10">
                    <CardDescription className="text-xs md:text-sm font-medium flex items-center justify-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      {t("totalClicks")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      {affiliate.total_clicks || 0}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="group bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-xl border border-border/50 hover:border-green-500/50 transition-all duration-300 hover:shadow-xl hover:scale-105 relative overflow-hidden">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 via-green-500/5 to-green-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <CardHeader className="pb-3 md:pb-4 relative z-10">
                    <CardDescription className="text-xs md:text-sm font-medium flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      {t("conversions")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl md:text-4xl font-bold text-green-500">
                      {affiliate.total_conversions || 0}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="group bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-xl border border-border/50 hover:border-accent/50 transition-all duration-300 hover:shadow-xl hover:scale-105 relative overflow-hidden">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/0 via-accent/5 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <CardHeader className="pb-3 md:pb-4 relative z-10">
                    <CardDescription className="text-xs md:text-sm font-medium flex items-center justify-center gap-2">
                      <DollarSign className="w-4 h-4 text-accent" />
                      {t("totalEarnings")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                      ${(affiliate.total_earnings_usd || 0).toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="group bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-xl border border-border/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:scale-105 relative overflow-hidden">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <CardHeader className="pb-3 md:pb-4 relative z-10">
                    <CardDescription className="text-xs md:text-sm font-medium flex items-center justify-center gap-2">
                      <Award className="w-4 h-4 text-blue-500" />
                      {t("currentTier")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="space-y-1">
                      <div className={`text-2xl md:text-3xl font-bold ${getTierInfo()?.currentTier.color}`}>
                        {getTierInfo()?.currentTier.name}
                      </div>
                      <div className="text-[10px] md:text-xs text-muted-foreground font-medium">Tier {getTierInfo()?.currentTier.level}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tier Progress Card - Premium */}
              {getTierInfo()?.nextTier && <Card className="mb-6 md:mb-8 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 backdrop-blur-xl border border-primary/30 shadow-xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden group">
                  {/* Premium glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <CardHeader className="pb-4 relative z-10">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <CardTitle className="flex items-center gap-3 text-lg md:text-xl">
                          <div className="p-2 bg-primary/20 rounded-lg backdrop-blur-sm">
                            <Award className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                          </div>
                          <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent font-bold">
                            {t("unlockNextTier")}
                          </span>
                        </CardTitle>
                        <CardDescription className="text-sm md:text-base text-muted-foreground">
                          {t("completeMoreConversions")}
                        </CardDescription>
                      </div>
                      <Badge className="bg-primary/20 text-primary border-primary/30 backdrop-blur-sm font-bold">
                        {Math.round(getTierInfo()?.progress || 0)}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 md:space-y-5 relative z-10">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm md:text-base font-semibold text-foreground">
                          {t("progressToPro")}
                        </span>
                        <span className="text-xs md:text-sm font-medium text-muted-foreground">
                          {getTierInfo()?.totalConversions} / {getTierInfo()?.nextTier?.conversions}
                        </span>
                      </div>
                      
                      <div className="relative h-3 md:h-4 bg-muted/50 rounded-full overflow-hidden backdrop-blur-sm border border-border/50">
                        <div 
                          className="h-full bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-gradient transition-all duration-500 relative shadow-lg"
                          style={{ width: `${getTierInfo()?.progress}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-card/80 backdrop-blur-sm rounded-lg border border-border/50">
                      <p className="text-sm md:text-base">
                        <span className="font-bold text-primary">{Math.max(0, getTierInfo()?.remaining || 0)}</span>{" "}
                        <span className="text-muted-foreground">{t("moreConversionsToUnlock")}</span>{" "}
                        <span className="font-semibold text-foreground">{t("additionalOnSecondLevel")}</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>}

              {/* Tier System Explanation - Premium */}
              <Card className="mb-6 md:mb-8 bg-card/80 backdrop-blur-xl border-border/50 shadow-xl hover:shadow-2xl transition-all duration-500">
                <CardHeader className="pb-4 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 border-b border-border/50">
                  <CardTitle className="flex items-center gap-3 text-lg md:text-xl">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                    </div>
                    <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent font-bold">
                      {t("threeTierCommissionSystem")}
                    </span>
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base pl-11">
                    {t("unlockMoreEarningPotential")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4 md:space-y-5">
                     {/* Tier 1 - Starter */}
                    <div className={`p-4 md:p-5 rounded-xl border-2 transition-all duration-300 ${
                      (selectedAffiliate?.tier_level || 1) >= 1 
                        ? 'border-blue-500/50 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent shadow-lg shadow-blue-500/10' 
                        : 'border-muted bg-muted/20 hover:bg-muted/30'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${(selectedAffiliate?.tier_level || 1) >= 1 ? 'bg-blue-500/20' : 'bg-muted'}`}>
                            {(selectedAffiliate?.tier_level || 1) >= 1 
                              ? <Unlock className="w-5 h-5 md:w-6 md:h-6 text-blue-500" /> 
                              : <Lock className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground" />
                            }
                          </div>
                          <h3 className="font-bold text-blue-500 text-base md:text-lg">{t("tierStarter")}</h3>
                        </div>
                        <Badge variant={(selectedAffiliate?.tier_level || 1) >= 1 ? 'default' : 'secondary'} className="text-xs md:text-sm w-fit bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30">
                          {(selectedAffiliate?.tier_level || 1) >= 1 ? t("unlocked") : t("startHere")}
                        </Badge>
                      </div>
                      <p className="text-sm md:text-base text-muted-foreground mb-3 md:mb-4">
                        {t("everyoneStartsHere")}
                      </p>
                      <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                        <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm md:text-base font-medium">{t("ninePercentDirectCommission")}</span>
                      </div>
                    </div>

                    {/* Tier 2 - Pro */}
                    <div className={`p-4 md:p-5 rounded-xl border-2 transition-all duration-300 ${
                      (selectedAffiliate?.tier_level || 1) >= 2 
                        ? 'border-purple-500/50 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent shadow-lg shadow-purple-500/10' 
                        : 'border-muted bg-muted/20 hover:bg-muted/30'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${(selectedAffiliate?.tier_level || 1) >= 2 ? 'bg-purple-500/20' : 'bg-muted'}`}>
                            {(selectedAffiliate?.tier_level || 1) >= 2 
                              ? <Unlock className="w-5 h-5 md:w-6 md:h-6 text-purple-500" /> 
                              : <Lock className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground" />
                            }
                          </div>
                          <h3 className="font-bold text-purple-500 text-base md:text-lg">{t("tierPro")}</h3>
                        </div>
                        <Badge variant={(selectedAffiliate?.tier_level || 1) >= 2 ? 'default' : 'secondary'} className="text-xs md:text-sm w-fit bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30">
                          {(selectedAffiliate?.tier_level || 1) >= 2 ? t("unlocked") : "10 conversions"}
                        </Badge>
                      </div>
                      <p className="text-sm md:text-base text-muted-foreground mb-3 md:mb-4">
                        {t("unlockAtConversions").replace("{count}", "10")}
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                          <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm md:text-base font-medium">{t("onYourDirectReferrals")}</span>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                          <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-purple-500 flex-shrink-0" />
                          <span className="text-sm md:text-base font-medium">{t("whenYourReferralsRefer")}</span>
                        </div>
                        <p className="text-xs md:text-sm text-muted-foreground pt-2 pl-4 md:pl-6 border-l-2 border-purple-500/30 italic">
                          {t("level2Explanation")}
                        </p>
                      </div>
                    </div>

                    {/* Tier 3 - Elite */}
                    <div className={`p-4 md:p-5 rounded-xl border-2 transition-all duration-300 ${
                      (selectedAffiliate?.tier_level || 1) >= 3 
                        ? 'border-amber-500/50 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent shadow-lg shadow-amber-500/10' 
                        : 'border-muted bg-muted/20 hover:bg-muted/30'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${(selectedAffiliate?.tier_level || 1) >= 3 ? 'bg-amber-500/20' : 'bg-muted'}`}>
                            {(selectedAffiliate?.tier_level || 1) >= 3 
                              ? <Unlock className="w-5 h-5 md:w-6 md:h-6 text-amber-500" /> 
                              : <Lock className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground" />
                            }
                          </div>
                          <h3 className="font-bold text-amber-500 text-base md:text-lg">{t("tierElite")}</h3>
                        </div>
                        <Badge variant={(selectedAffiliate?.tier_level || 1) >= 3 ? 'default' : 'secondary'} className="text-xs md:text-sm w-fit bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30">
                          {(selectedAffiliate?.tier_level || 1) >= 3 ? t("unlocked") : "30 conversions"}
                        </Badge>
                      </div>
                      <p className="text-sm md:text-base text-muted-foreground mb-3 md:mb-4">
                        {t("unlockAtConversions").replace("{count}", "30")}
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                          <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm md:text-base font-medium">{t("onYourDirectReferrals")}</span>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                          <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-purple-500 flex-shrink-0" />
                          <span className="text-sm md:text-base font-medium">{t("whenYourReferralsRefer")}</span>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                          <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-amber-500 flex-shrink-0" />
                          <span className="text-sm md:text-base font-medium">{t("whenTheirReferralsRefer")}</span>
                        </div>
                        <p className="text-xs md:text-sm text-muted-foreground pt-2 pl-4 md:pl-6 border-l-2 border-amber-500/30 italic">
                          {t("level3Explanation")}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* All Affiliate Links Section - Premium */}
              <Card className="mb-6 md:mb-8 bg-card/80 backdrop-blur-xl border-border/50 shadow-xl hover:shadow-2xl transition-all duration-500">
                <CardHeader className="pb-4 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 border-b border-border/50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-2">
                      <CardTitle className="flex items-center gap-3 text-lg md:text-xl">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Share2 className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                        </div>
                        <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent font-bold">
                          {t("yourAffiliateLinks")}
                        </span>
                      </CardTitle>
                      <CardDescription className="text-sm md:text-base pl-11">
                        {t("upToThreeLinks")}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="text-sm w-fit bg-primary/10 text-primary border-primary/30 font-semibold">
                      {allAffiliates.length} / 3
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  {allAffiliates.map((aff, index) => {
                const isFirst = index === 0;
                const link = aff.username ? `${window.location.origin}/${aff.username}` : `${window.location.origin}/r/${aff.affiliate_code}`;
                return <div 
                  key={aff.id} 
                  className="group p-4 md:p-5 bg-gradient-to-br from-muted/50 via-muted/30 to-transparent backdrop-blur-sm border border-border/50 rounded-xl space-y-4 hover:shadow-lg hover:border-primary/30 transition-all duration-300 animate-fade-in"
                >
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="font-bold text-base md:text-lg bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                              {isFirst ? t("primaryLink") : `Link ${index + 1}`}
                            </h3>
                            {isFirst && <Badge className="text-xs bg-primary/20 text-primary border-primary/30">
                              {t("autoCreated")}
                            </Badge>}
                          </div>
                        </div>
                        
                        {/* Stats - Premium Grid */}
                        <div className="grid grid-cols-3 gap-3 py-3">
                          <div className="p-3 bg-card/50 backdrop-blur-sm rounded-lg border border-border/30 text-center hover:scale-105 transition-transform">
                            <div className="text-xs text-muted-foreground mb-1.5 font-medium">{t("clicks")}</div>
                            <div className="font-bold text-base md:text-lg">{aff.total_clicks}</div>
                          </div>
                          <div className="p-3 bg-card/50 backdrop-blur-sm rounded-lg border border-border/30 text-center hover:scale-105 transition-transform">
                            <div className="text-xs text-muted-foreground mb-1.5 font-medium">{t("conversions")}</div>
                            <div className="font-bold text-base md:text-lg text-green-600 dark:text-green-500">{aff.total_conversions}</div>
                          </div>
                          <div className="p-3 bg-card/50 backdrop-blur-sm rounded-lg border border-border/30 text-center hover:scale-105 transition-transform">
                            <div className="text-xs text-muted-foreground mb-1.5 font-medium">{t("earned")}</div>
                            <div className="font-bold text-base md:text-lg text-primary">${aff.total_earnings_usd.toFixed(2)}</div>
                          </div>
                        </div>
                        
                        {/* Link Section */}
                        <div className="space-y-3">
                          <div className="p-3 md:p-4 bg-muted/80 backdrop-blur-sm rounded-lg border border-border/50 text-sm md:text-base break-all font-mono shadow-inner">
                            {link}
                          </div>
                          <Button 
                            onClick={() => copyLink(link)} 
                            variant="outline" 
                            size="default"
                            className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 h-11 font-semibold"
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            {t("copyLink")}
                          </Button>
                          <div className="flex items-center gap-2 pt-2 px-2 text-xs md:text-sm text-muted-foreground border-t border-border/50">
                            <span className="font-medium">Username:</span>
                            <span className="font-mono font-semibold text-foreground/80">{aff.username}</span>
                          </div>
                        </div>
                      </div>;
              })}
                  
                  {allAffiliates.length < 3 && <div className="pt-4">
                      {!showNewLinkInput ? <div className="space-y-4 p-5 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-xl border border-border/50">
                          <Button 
                            onClick={() => setShowNewLinkInput(true)} 
                            variant="outline" 
                            className="w-full h-12 font-semibold text-base hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                          >
                            {t("createAdditionalLink").replace("{current}", String(allAffiliates.length + 1)).replace("{max}", "3")}
                          </Button>
                          <p className="text-sm text-muted-foreground text-center">
                            {t("canCreateMoreLinks").replace("{count}", String(3 - allAffiliates.length))}
                          </p>
                        </div> : <div className="space-y-4 p-4 md:p-5 border-2 border-primary/30 rounded-xl bg-gradient-to-br from-primary/10 via-accent/5 to-transparent backdrop-blur-sm shadow-lg animate-scale-in">
                          <h3 className="font-bold text-base md:text-lg bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            Create Link {allAffiliates.length + 1}
                          </h3>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm md:text-base font-semibold block mb-3 text-foreground">
                                Choose a username for this link
                              </label>
                              
                              {/* Username input */}
                              <div className="space-y-3">
                                <div className="relative">
                                  <Input 
                                    value={newLinkUsername} 
                                    onChange={e => setNewLinkUsername(e.target.value.toLowerCase())} 
                                    placeholder="your-custom-name" 
                                    className="font-mono text-sm md:text-base pr-10 h-12 border-border/50 bg-card/50 backdrop-blur-sm" 
                                  />
                                  {usernameAvailability === 'checking' && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />}
                                  {usernameAvailability === 'available' && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />}
                                  {usernameAvailability === 'taken' && <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500" />}
                                </div>
                                
                                {/* Live Preview */}
                                {newLinkUsername && <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg backdrop-blur-sm">
                                    <p className="text-xs md:text-sm text-muted-foreground mb-2 font-semibold">Your link preview:</p>
                                    <p className="text-sm md:text-base font-mono break-all text-primary font-semibold">
                                      {window.location.origin}/{newLinkUsername}
                                    </p>
                                  </div>}
                              </div>
                            </div>
                            
                            {/* Validation Messages */}
                            {usernameAvailability === 'invalid' && <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-red-600 dark:text-red-500">
                                  Username must be 3-30 characters, lowercase letters, numbers, and hyphens only
                                </p>
                              </div>}
                            {usernameAvailability === 'taken' && <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-red-600 dark:text-red-500">
                                  This username is already taken
                                </p>
                              </div>}
                            {usernameAvailability === 'available' && <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-green-700 dark:text-green-600 font-medium">
                                  This username is available!
                                </p>
                              </div>}
                          </div>
                          
                          <div className="flex gap-3 pt-2">
                            <Button 
                              onClick={createAffiliate} 
                              disabled={creating || usernameAvailability !== 'available'} 
                              className="flex-1 h-11 font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90"
                            >
                              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Create Link
                            </Button>
                            <Button 
                              onClick={() => {
                      setShowNewLinkInput(false);
                      setNewLinkUsername("");
                      setUsernameAvailability('idle');
                    }} 
                              variant="outline" 
                              className="h-11 font-semibold"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>}
                    </div>}
                  
                  {allAffiliates.length >= 3 && <div className="p-5 bg-muted/50 rounded-xl border border-border/50 text-center space-y-3">
                      <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto" />
                      <p className="text-sm md:text-base text-muted-foreground font-medium">
                        You've reached the maximum of 3 affiliate links. These links cannot be edited.
                      </p>
                    </div>}
                </CardContent>
              </Card>

              <Card className="mb-8 hidden bg-white/[0.02] backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle>Your Affiliate Link</CardTitle>
                  <CardDescription>
                    Share this link to earn commissions on every sale
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold">Your Personalized Link</h3>
                      <Badge variant="secondary">Ready to Share</Badge>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input value={customLink || affiliateLink} readOnly className="font-mono text-primary font-semibold text-sm sm:text-base break-all" />
                      <Button onClick={() => {
                    navigator.clipboard.writeText(customLink || affiliateLink);
                    toast.success("Link copied!");
                  }} className="w-full sm:w-auto whitespace-nowrap">
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                  </div>

                  {/* Username customization */}
                  <div className="space-y-3 pt-4 border-t">
                    <h3 className="text-sm font-semibold">Customize Your Link</h3>
                    <p className="text-xs text-muted-foreground">
                      Change your username to create a memorable link
                    </p>
                    <div className="flex flex-col gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <span className="flex items-center px-3 py-2 bg-muted text-muted-foreground rounded-md text-xs sm:text-sm whitespace-nowrap">
                            {window.location.origin}/
                          </span>
                          <div className="flex-1 relative">
                            <Input value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="yourname" className={`font-mono pr-10 text-sm sm:text-base ${usernameAvailability === 'available' ? 'border-green-500 focus-visible:ring-green-500' : usernameAvailability === 'taken' || usernameAvailability === 'invalid' ? 'border-red-500 focus-visible:ring-red-500' : ''}`} disabled={updatingUsername} />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {usernameAvailability === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                              {usernameAvailability === 'available' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                              {usernameAvailability === 'taken' && <XCircle className="w-4 h-4 text-red-500" />}
                              {usernameAvailability === 'invalid' && <AlertCircle className="w-4 h-4 text-red-500" />}
                            </div>
                          </div>
                        </div>
                        {usernameAvailability === 'taken' && <p className="text-xs text-red-500">Username already taken</p>}
                        {usernameAvailability === 'invalid' && <p className="text-xs text-red-500">3-30 characters, lowercase letters, numbers, and hyphens only</p>}
                        {usernameAvailability === 'available' && <p className="text-xs text-green-500">Username available!</p>}
                        {customLink && <div className="p-3 bg-muted/50 rounded-md">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Your custom link preview:</p>
                            <p className="text-xs sm:text-sm font-mono text-primary break-all">{customLink}</p>
                          </div>}
                      </div>
                      <Button onClick={updateUsername} disabled={!username || updatingUsername || username === affiliate.username || usernameAvailability !== 'available'} className="w-full sm:w-auto">
                        {updatingUsername && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Update
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Analytics Dashboard - Premium */}
              <Card className="mb-8 bg-card/80 backdrop-blur-xl border-border/50 shadow-xl hover:shadow-2xl transition-all duration-500">
                <CardHeader className="pb-5 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <CardTitle className="flex items-center gap-3 text-xl md:text-2xl">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <BarChart3 className="w-6 h-6 md:w-7 md:h-7 text-primary" />
                        </div>
                        <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent font-bold">
                          {t("analyticsDashboard")}
                        </span>
                      </CardTitle>
                      <CardDescription className="text-sm md:text-base pl-11">{t("trackYourPerformance")}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8 pt-6">
                  {loadingAnalytics ? <div className="flex flex-col items-center justify-center py-16">
                      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                      <p className="text-base text-muted-foreground font-medium">Loading analytics...</p>
                    </div> : analytics ? <div className="space-y-8">
                      {/* Traffic Sources - Premium */}
                      <div className="space-y-5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Share2 className="w-5 h-5 text-primary" />
                          </div>
                          <h3 className="font-bold text-lg md:text-xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            {t("trafficSources")}
                          </h3>
                        </div>
                        {analytics.sourceBreakdown.length > 0 ? (() => {
                    const significantSources = analytics.sourceBreakdown.filter(source => source.clicks >= 3 || source.conversions > 0);
                    return significantSources.length > 0 ? <div className="space-y-4">
                                {significantSources.map(source => {
                        const conversionRate = source.clicks > 0 ? (source.conversions / source.clicks * 100).toFixed(1) : '0.0';
                        return <div 
                          key={source.source} 
                          className="group p-5 md:p-6 bg-gradient-to-br from-muted/60 via-muted/40 to-transparent backdrop-blur-sm rounded-xl border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 space-y-4"
                        >
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                          <Badge 
                                            variant={source.source === 'direct' ? 'default' : 'secondary'} 
                                            className="capitalize text-sm font-semibold px-4 py-1.5 bg-primary/20 text-primary border-primary/30"
                                          >
                                            {source.source}
                                          </Badge>
                                          <div className="flex flex-wrap items-center gap-3 text-sm md:text-base">
                                            <div className="flex items-center gap-1.5">
                                              <span className="font-bold text-foreground">{source.clicks}</span>
                                              <span className="text-muted-foreground">clicks</span>
                                            </div>
                                            <span className="text-muted-foreground/40">•</span>
                                            <div className="flex items-center gap-1.5">
                                              <span className="font-bold text-green-600 dark:text-green-500">{source.conversions}</span>
                                              <span className="text-muted-foreground">conversions</span>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                            {conversionRate}%
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <div className="flex-1 bg-muted/50 rounded-full h-3 overflow-hidden shadow-inner border border-border/30">
                                          <div 
                                            className="h-full bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-gradient transition-all duration-500 ease-out shadow-lg"
                                            style={{ width: `${Math.min(parseFloat(conversionRate), 100)}%` }}
                                          >
                                            <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                                          </div>
                                        </div>
                                      </div>
                                    </div>;
                      })}
                              </div> : <div className="text-center py-12 px-6 bg-muted/30 rounded-xl border-2 border-dashed border-border/50">
                                <Share2 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                                <p className="text-base text-muted-foreground font-semibold">No significant traffic yet</p>
                                <p className="text-xs text-muted-foreground/70 mt-1">Build momentum by sharing your link!</p>
                              </div>;
                  })() : <div className="text-center py-8 px-4 bg-muted/30 rounded-xl border border-dashed border-border">
                            <Share2 className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground font-medium">No traffic data yet</p>
                            <p className="text-xs text-muted-foreground/70 mt-1">Start sharing your link to see analytics!</p>
                          </div>}
                      </div>

                      {/* Commission Levels */}
                      <div className="pt-6 border-t border-border/50 space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded bg-primary/10">
                            <TrendingUp className="w-4 h-4 text-primary" />
                          </div>
                          <h3 className="font-semibold text-base md:text-lg">{t("multiLevelEarnings")}</h3>
                        </div>
                        {analytics.levelBreakdown.length > 0 ? <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[1, 2, 3].map(level => {
                      const levelData = analytics.levelBreakdown.find(l => l.level === level);
                      const conversions = levelData?.conversions || 0;
                      const earnings = levelData?.earnings || 0;
                      const commissionRate = level === 1 ? '9%' : level === 2 ? '6%' : '3%';
                      // Check if tier is unlocked based on affiliate tier_level
                      const isUnlocked = level <= (selectedAffiliate?.tier_level || 1);
                      const isActive = conversions > 0;
                      const levelIcon = level === 1 ? '🥇' : level === 2 ? '🥈' : '🥉';
                      return <Card key={level} className={`group relative overflow-hidden transition-all duration-300 ${isUnlocked ? 'border-primary/50 bg-gradient-to-br from-primary/10 via-background to-background shadow-xl shadow-primary/20' : 'border-border/50 hover:border-primary/30 bg-gradient-to-br from-background to-muted/20'}`}>
                                  {isUnlocked && <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full" />}
                                  <CardHeader className="pb-3 relative">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg ${level === 1 ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground' : level === 2 ? 'bg-gradient-to-br from-primary/70 to-primary/50 text-primary-foreground' : 'bg-gradient-to-br from-primary/50 to-primary/30 text-primary'}`}>
                                          {levelIcon}
                                        </div>
                                        <div>
                                          <CardTitle className="text-sm md:text-base flex items-center gap-1.5">
                                            Level {level}
                                          </CardTitle>
                                          <p className="text-[10px] md:text-xs text-muted-foreground font-medium">
                                            {level === 1 ? 'Direct Referrals' : level === 2 ? 'Second Tier' : 'Third Tier'}
                                          </p>
                                        </div>
                                      </div>
                                      <Badge variant={level === 1 ? 'default' : 'secondary'} className={`text-xs font-bold px-3 py-1 ${level === 1 ? 'shadow-md shadow-primary/30' : ''}`}>
                                        {commissionRate}
                                      </Badge>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="space-y-4 relative">
                                    <div className="space-y-3">
                                      <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                                        <span className="text-xs md:text-sm text-muted-foreground font-medium">Conversions</span>
                                        <span className={`text-2xl md:text-3xl font-bold ${isUnlocked ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                                          {conversions}
                                        </span>
                                      </div>
                                      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                                      <div className="flex justify-between items-center p-3 rounded-lg bg-primary/5">
                                        <span className="text-xs md:text-sm text-muted-foreground font-medium">Earnings</span>
                                        <span className={`text-xl md:text-2xl font-bold ${isUnlocked ? 'text-primary' : 'text-muted-foreground/50'}`}>
                                          ${earnings.toFixed(2)}
                                        </span>
                                      </div>
                                    </div>
                                    {isUnlocked && isActive && <div className="pt-3 border-t border-primary/20 bg-gradient-to-r from-primary/5 to-transparent rounded-lg p-2">
                                        <div className="flex items-center gap-1.5 text-xs text-primary">
                                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                          <span className="font-semibold">Active & Earning</span>
                                        </div>
                                      </div>}
                                    {isUnlocked && !isActive && <div className="pt-3 border-t border-primary/20 bg-gradient-to-r from-green-500/5 to-transparent rounded-lg p-2">
                                        <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-500">
                                          <Unlock className="w-3 h-3" />
                                          <span className="font-semibold">Unlocked - Ready to Earn</span>
                                        </div>
                                      </div>}
                                    {!isUnlocked && <div className="pt-3 border-t border-dashed border-border/50">
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                                          <Lock className="w-3 h-3" />
                                          <span className="font-medium">Not yet unlocked</span>
                                        </div>
                                      </div>}
                                  </CardContent>
                                </Card>;
                    })}
                          </div> : <div className="text-center py-8 px-4 bg-muted/30 rounded-xl border border-dashed border-border">
                            <TrendingUp className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground font-medium">{t("noConversionsYet")}</p>
                            <p className="text-xs text-muted-foreground/70 mt-1">{t("keepSharingToUnlock")}</p>
                          </div>}
                      </div>
                    </div> : <div className="text-center py-12 px-4 bg-muted/20 rounded-xl border border-dashed border-border">
                      <BarChart3 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground font-medium">Analytics will appear here</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">Start sharing to track your performance</p>
                    </div>}
                </CardContent>
              </Card>

              <Card className="bg-white/[0.02] backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-coral bg-clip-text text-transparent">
                    {t("howItWorks")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-8">
                    {/* Step 1 */}
                    <li className="group relative">
                      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                        {/* Number Badge */}
                        <div className="relative flex-shrink-0">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-neon-violet/20 backdrop-blur-xl border border-neon-cyan/30 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-neon-cyan/50">
                            <span className="text-2xl font-black bg-gradient-to-br from-neon-cyan to-neon-violet bg-clip-text text-transparent">1</span>
                          </div>
                          <div className="absolute -inset-1 bg-gradient-to-r from-neon-cyan to-neon-violet rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 space-y-3 text-center md:text-left">
                          <h4 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent group-hover:from-neon-cyan group-hover:to-neon-violet transition-all duration-300">
                            {t("shareYourLink")}
                          </h4>
                          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                            {t("shareYourLinkDesc")}
                          </p>
                        </div>
                      </div>
                    </li>

                    {/* Step 2 */}
                    <li className="group relative">
                      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                        {/* Number Badge */}
                        <div className="relative flex-shrink-0">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-violet/20 to-neon-coral/20 backdrop-blur-xl border border-neon-violet/30 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-neon-violet/50">
                            <span className="text-2xl font-black bg-gradient-to-br from-neon-violet to-neon-coral bg-clip-text text-transparent">2</span>
                          </div>
                          <div className="absolute -inset-1 bg-gradient-to-r from-neon-violet to-neon-coral rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 space-y-3 text-center md:text-left">
                          <h4 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent group-hover:from-neon-violet group-hover:to-neon-coral transition-all duration-300">
                            {t("theyPurchase")}
                          </h4>
                          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                            {t("theyPurchaseDesc")}
                          </p>
                        </div>
                      </div>
                    </li>

                    {/* Step 3 */}
                    <li className="group relative">
                      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                        {/* Number Badge */}
                        <div className="relative flex-shrink-0">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-coral/20 to-neon-cyan/20 backdrop-blur-xl border border-neon-coral/30 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-neon-coral/50">
                            <span className="text-2xl font-black bg-gradient-to-br from-neon-coral to-neon-cyan bg-clip-text text-transparent">3</span>
                          </div>
                          <div className="absolute -inset-1 bg-gradient-to-r from-neon-coral to-neon-cyan rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 space-y-4 text-center md:text-left">
                          <h4 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent group-hover:from-neon-coral group-hover:to-neon-cyan transition-all duration-300">
                            {t("earnMultiLevelCommissions")}
                          </h4>
                          <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-4">
                            {t("buildYourNetworkDesc")}
                          </p>
                          
                          {/* Tier Examples */}
                          <div className="space-y-4 pl-0 md:pl-4">
                            {/* Tier 1 */}
                            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/5 to-blue-500/10 border border-blue-500/20 backdrop-blur-sm hover:border-blue-500/40 transition-all duration-300">
                              <div className="flex items-start gap-3 mb-2">
                                <Unlock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                <span className="text-sm md:text-base font-semibold text-foreground">
                                  {t("tierStarterEarn")}
                                </span>
                              </div>
                              <p className="text-xs md:text-sm text-muted-foreground pl-8">
                                {t("tierStarterExample")}
                              </p>
                            </div>

                            {/* Tier 2 */}
                            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/5 to-purple-500/10 border border-purple-500/20 backdrop-blur-sm hover:border-purple-500/40 transition-all duration-300">
                              <div className="flex items-start gap-3 mb-2">
                                <Lock className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                                <span className="text-sm md:text-base font-semibold text-foreground">
                                  {t("tierProEarn")}
                                </span>
                              </div>
                              <p className="text-xs md:text-sm text-muted-foreground pl-8">
                                {t("tierProExample")}
                              </p>
                            </div>

                            {/* Tier 3 */}
                            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/5 to-amber-500/10 border border-amber-500/20 backdrop-blur-sm hover:border-amber-500/40 transition-all duration-300">
                              <div className="flex items-start gap-3 mb-2">
                                <Lock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                <span className="text-sm md:text-base font-semibold text-foreground">
                                  {t("tierEliteEarn")}
                                </span>
                              </div>
                              <p className="text-xs md:text-sm text-muted-foreground pl-8">
                                {t("tierEliteExample")}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            </>}
        </div>
      </div>

      <SiteNavigation />
      <Footer />
    </div>;
}