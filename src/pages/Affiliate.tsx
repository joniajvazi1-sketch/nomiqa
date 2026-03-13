import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import { SiteNavigation } from "@/components/SiteNavigation";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Copy, TrendingUp, Users, DollarSign, CheckCircle2, Loader2, 
  Award, Share2, ArrowRight, Network, Pencil, Check, X, AlertTriangle
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
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [savingCode, setSavingCode] = useState(false);
  const [codeError, setCodeError] = useState('');
  
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
    // Using _safe view for SELECT to exclude sensitive verification fields
    let query = supabase.from('affiliates_safe').select('*');
    query = query.eq('user_id', userId);
    const { data, error } = await query.order('created_at', { ascending: true });
    if (!error && data && data.length > 0) {
      setAllAffiliates(data);
      const highestTierAffiliate = data.reduce((prev, current) => 
        (current.tier_level > prev.tier_level) ? current : prev
      );
      setAffiliate(highestTierAffiliate);
      setSelectedAffiliateId(highestTierAffiliate.id);
      setAffiliateLink(highestTierAffiliate.affiliate_code);
      setUsername(highestTierAffiliate.username || '');
      if (highestTierAffiliate.username) {
        setCustomLink(highestTierAffiliate.username);
      }
    }
  };

  const tierInfo = useMemo(() => {
    if (!affiliate) return null;
    const tiers = [
      { level: 1, nameKey: 'affiliateTierStarter', conversions: 0, color: 'text-neon-cyan' },
      { level: 2, nameKey: 'affiliateTierPro', conversions: 10, color: 'text-neon-violet' },
      { level: 3, nameKey: 'affiliateTierElite', conversions: 30, color: 'text-neon-coral' },
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
      setAffiliateLink(selected.affiliate_code);
      setUsername(selected.username || '');
      if (selected.username) {
        setCustomLink(selected.username);
      }
    }
  }, [allAffiliates]);
  
  const copyCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Referral code copied!");
  }, []);

  const handleChangeReferralCode = async () => {
    if (!newCode.trim() || newCode.length < 3) {
      setCodeError('Code must be at least 3 characters');
      return;
    }
    setSavingCode(true);
    setCodeError('');
    try {
      const { data, error } = await supabase.functions.invoke('update-referral-code', {
        body: { referralCode: newCode.trim() },
      });
      const errMsg = data?.error || (error ? await error?.context?.json?.().then((b: any) => b?.error).catch(() => null) : null);
      if (errMsg) {
        setCodeError(errMsg === 'Referral code already taken' ? 'This code is already taken, please choose another' : errMsg);
        setSavingCode(false);
        return;
      }
      if (error) throw error;
      toast.success('Referral code updated!');
      setIsEditingCode(false);
      if (user) await fetchAffiliates(user.id, user.email || undefined);
    } catch (err: any) {
      setCodeError(err.message || 'Failed to update code');
    } finally {
      setSavingCode(false);
    }
  };

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
      setCustomLink(username.toLowerCase());
      toast.success("Referral code updated!");
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
        // Use profiles_safe view to exclude sensitive fields
        const { data: profile } = await supabase.from('profiles_safe').select('username').eq('user_id', user.id).maybeSingle();
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
      setCustomLink(affiliateData.username);
      setAffiliateLink(affiliateData.affiliate_code);
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

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <SEO page="affiliate" />
      
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,255,200,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.08),transparent_50%)]" />

      {/* Hero Section */}
      <section className="pt-28 pb-12 md:pt-36 md:pb-16 px-4 relative z-10">
        <div className="container max-w-5xl mx-auto text-center">
          {/* Coming Soon Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-coral/15 border border-neon-coral/40 mb-4 animate-pulse">
            <span className="text-neon-coral text-sm font-semibold">🚀 {t("downloadComingSoon")}</span>
          </div>
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 mb-6 ml-2">
            <Users className="w-4 h-4 text-neon-cyan" strokeWidth={2.5} />
            <span className="text-sm font-medium text-neon-cyan">{t("affiliateHeroBadge")}</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-foreground">{t("affiliateHeroTitle1")}</span>{" "}
            <span className="bg-gradient-to-r from-neon-cyan to-neon-violet bg-clip-text text-transparent">{t("affiliateHeroTitle2")}</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            {t("affiliateHeroDescription")}
          </p>

          {/* Main Value Props */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
            <div className="px-5 py-3 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30">
              <span className="text-2xl font-bold text-neon-cyan">+100%</span>
              <span className="text-sm text-muted-foreground ml-2">{t("affiliateMaxBoost")}</span>
            </div>
            <div className="px-5 py-3 rounded-xl bg-neon-violet/10 border border-neon-violet/30">
              <span className="text-2xl font-bold text-neon-violet">5%</span>
              <span className="text-sm text-muted-foreground ml-2">{t("affiliateFromNetwork")}</span>
            </div>
            <div className="px-5 py-3 rounded-xl bg-muted/50 border border-border">
              <span className="text-2xl font-bold text-foreground">9%</span>
              <span className="text-sm text-muted-foreground ml-2">{t("affiliateSalesCommission")}</span>
            </div>
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
                <p className="text-muted-foreground mb-6">Create your referral code to start earning boosts and passive rewards</p>
                <Button onClick={createAffiliate} size="lg" disabled={creating} className="bg-primary hover:bg-primary/90">
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("affiliateCreateButton")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* Has Affiliate - Dashboard */
            <div className="space-y-6">

              {/* Your Referral Code - FIRST */}
              <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 overflow-hidden">
                <div className="p-5 md:p-6 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20">
                      <Share2 className="w-5 h-5 text-primary" strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="text-lg font-light text-white">Your Referral Code</h3>
                      <p className="text-sm text-white/50">Share this code with friends to earn rewards</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 md:p-6">
                  {affiliate.username ? (
                    <div className="space-y-3">
                      {!isEditingCode ? (
                        <>
                          <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-center">
                            <p className="text-3xl font-bold font-mono text-primary tracking-wider mb-2">
                              {customLink}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Friends enter this code when they sign up
                            </p>
                          </div>
                          <Button onClick={() => copyCode(customLink)} className="w-full" variant="outline">
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Referral Code
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full text-muted-foreground"
                            onClick={() => { setNewCode(customLink); setIsEditingCode(true); setCodeError(''); }}
                          >
                            <Pencil className="w-4 h-4 mr-1" /> Change Referral Code
                          </Button>
                        </>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                            <p className="text-xs text-destructive">You can only change your referral code once. This cannot be undone.</p>
                          </div>
                          <Input
                            value={newCode}
                            onChange={(e) => { setNewCode(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')); setCodeError(''); }}
                            placeholder="New referral code"
                            className="font-mono"
                          />
                          {codeError && <p className="text-xs text-destructive">{codeError}</p>}
                          <div className="flex gap-2">
                            <Button onClick={handleChangeReferralCode} disabled={savingCode} size="sm" className="flex-1">
                              {savingCode ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                              Save
                            </Button>
                            <Button onClick={() => { setIsEditingCode(false); setCodeError(''); }} variant="outline" size="sm">
                              <X className="h-4 h-4 mr-1" /> Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                        <p className="text-sm text-white mb-1 font-medium">Set your referral code</p>
                        <p className="text-xs text-white/50">Choose a unique username as your referral code</p>
                      </div>
                      <div className="flex gap-2">
                        <Input 
                          value={username}
                          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                          placeholder="your-username"
                          className="bg-white/[0.03] border-white/10 text-white font-mono"
                        />
                        <Button onClick={updateUsername} disabled={updatingUsername || !username.trim()}>
                          {updatingUsername ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                        </Button>
                      </div>
                      {username && (
                        <p className="text-xs text-white/50">
                          Your code will be: <span className="text-primary font-mono">{username}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Referrals List - SECOND */}
              <Suspense fallback={<div className="h-40 animate-pulse bg-white/5 rounded-xl" />}>
                <ReferralsList affiliateId={affiliate.id} />
              </Suspense>

              {/* Tier Progress */}
              {tierInfo && tierInfo.nextTier && (
                <div className="p-5 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10">
                  <div className="flex flex-col gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                        <Award className={`w-5 h-5 ${tierInfo.currentTier.color}`} strokeWidth={2.5} />
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0 flex-1">
                        <p className="font-medium text-white text-sm sm:text-base">{t("affiliateProgressTo")} {t(tierInfo.nextTier.nameKey)}</p>
                        <Badge variant="outline" className="border-primary/30 text-primary text-xs shrink-0 w-fit">
                          {tierInfo.remaining} {t("affiliateRegistrationsNeeded")}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-neon-cyan to-neon-violet rounded-full transition-all"
                      style={{ width: `${tierInfo.progress}%` }}
                    />
                  </div>
                </div>
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