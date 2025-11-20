import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, TrendingUp, Users, DollarSign, CheckCircle2, Loader2, XCircle, AlertCircle, BarChart3, Share2, Award, Lock, Unlock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAffiliateTracking } from "@/hooks/useAffiliateTracking";

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
  sourceBreakdown: { source: string; clicks: number; conversions: number }[];
  levelBreakdown: { level: number; conversions: number; earnings: number }[];
}

export default function Affiliate() {
  const navigate = useNavigate();
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
        const { data, error } = await supabase
          .from('affiliates')
          .select('id')
          .eq('username', newLinkUsername.toLowerCase())
          .maybeSingle();

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
      const { data: { user } } = await supabase.auth.getUser();
      
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
    const { data, error } = await supabase
      .from('affiliates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (!error && data && data.length > 0) {
      setAllAffiliates(data);
      // Set the first (primary) affiliate as the main one
      setAffiliate(data[0]);
      setAffiliateLink(`${window.location.origin}/r/${data[0].affiliate_code}`);
      setUsername(data[0].username || '');
      if (data[0].username) {
        setCustomLink(`${window.location.origin}/${data[0].username}`);
      }
      
      // Fetch analytics for primary affiliate
      fetchAnalytics(data[0].id);
    }
  };

  const getTierInfo = () => {
    if (!affiliate) return null;
    
    const tiers = [
      { level: 1, name: 'Starter', conversions: 0, description: '9% on direct sales', color: 'text-blue-500' },
      { level: 2, name: 'Pro', conversions: 10, description: 'Additional 6% on 2nd level', color: 'text-purple-500' },
      { level: 3, name: 'Elite', conversions: 30, description: 'Additional 3% on 3rd level', color: 'text-amber-500' }
    ];

    const currentTier = tiers.find(t => t.level === affiliate.tier_level) || tiers[0];
    const nextTier = tiers.find(t => t.level === affiliate.tier_level + 1);
    
    const totalConversions = allAffiliates.reduce((sum, aff) => sum + (aff.total_conversions || 0), 0);
    
    if (!nextTier) {
      return { currentTier, nextTier: null, progress: 100, remaining: 0, totalConversions };
    }
    
    const remaining = nextTier.conversions - totalConversions;
    const progress = (totalConversions / nextTier.conversions) * 100;
    
    return { currentTier, nextTier, progress, remaining, totalConversions };
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard!");
  };


  const fetchAnalytics = async (affiliateId: string) => {
    setLoadingAnalytics(true);
    try {
      // Get source breakdown
      const { data: referrals } = await supabase
        .from('affiliate_referrals')
        .select('source, status, commission_level, commission_amount_usd')
        .eq('affiliate_id', affiliateId);

      if (referrals) {
        // Group by source
        const sourceMap = new Map<string, { clicks: number; conversions: number }>();
        referrals.forEach(ref => {
          const current = sourceMap.get(ref.source) || { clicks: 0, conversions: 0 };
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
        const levelMap = new Map<number, { conversions: number; earnings: number }>();
        referrals.filter(r => r.status === 'converted').forEach(ref => {
          const level = ref.commission_level || 1;
          const current = levelMap.get(level) || { conversions: 0, earnings: 0 };
          current.conversions += 1;
          current.earnings += ref.commission_amount_usd || 0;
          levelMap.set(level, current);
        });

        const levelBreakdown = Array.from(levelMap.entries()).map(([level, data]) => ({
          level,
          conversions: data.conversions,
          earnings: data.earnings
        })).sort((a, b) => a.level - b.level);

        setAnalytics({ sourceBreakdown, levelBreakdown });
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
      const { error } = await supabase
        .from('affiliates')
        .update({ username: username.toLowerCase() })
        .eq('id', affiliate.id);

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

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
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
      const { data: existingAffiliates, error: countError } = await supabase
        .from('affiliates')
        .select('id')
        .eq('user_id', user.id);

      if (countError) throw countError;

      if (existingAffiliates && existingAffiliates.length >= 3) {
        toast.error("You've reached the maximum of 3 affiliate links");
        setCreating(false);
        return;
      }

      const code = generateCode();
      const isFirstAffiliate = !existingAffiliates || existingAffiliates.length === 0;
      
      // For first affiliate, use username from profile
      let affiliateUsername = newLinkUsername.toLowerCase() || username;
      if (isFirstAffiliate) {
        // Get username from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile?.username) {
          affiliateUsername = profile.username;
        } else {
          // Auto-generate from email if no profile username
          affiliateUsername = user.email!.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        }
      }

      // Get referrer's affiliate ID if user signed up with a ref code
      const { referralCode } = useAffiliateTracking.getState();
      let parentAffiliateId = null;

      if (referralCode && isFirstAffiliate) {
        const { data: parentAffiliate } = await supabase
          .from('affiliates')
          .select('id')
          .eq('affiliate_code', referralCode)
          .maybeSingle();

        if (parentAffiliate) {
          parentAffiliateId = parentAffiliate.id;
        }
      }

      const { data, error } = await supabase
        .from('affiliates')
        .insert({
          user_id: user.id,
          email: user.email!,
          affiliate_code: code,
          username: affiliateUsername,
          parent_affiliate_id: isFirstAffiliate ? parentAffiliateId : null,
        })
        .select()
        .single();

      if (error) {
        // If username is taken, add random number
        if (error.code === '23505') {
          const retryUsername = affiliateUsername + Math.floor(Math.random() * 999);
          const { data: retryData, error: retryError } = await supabase
            .from('affiliates')
            .insert({
              user_id: user.id,
              email: user.email!,
              affiliate_code: code,
              username: retryUsername,
              parent_affiliate_id: isFirstAffiliate ? parentAffiliateId : null,
            })
            .select()
            .single();

          if (retryError) throw retryError;
          
          setAffiliate(retryData);
          setUsername(retryData.username || '');
          setCustomLink(`${window.location.origin}/${retryData.username}`);
          setAffiliateLink(`${window.location.origin}/r/${retryData.affiliate_code}`);
          toast.success(`Affiliate link ${existingAffiliates.length + 1} created!`);
          
          // Reset form
          setShowNewLinkInput(false);
          setNewLinkUsername("");
          setUsernameAvailability('idle');
          
          // Refresh all affiliates
          await fetchAffiliates(user.id);
          return;
        }
        throw error;
      }

      setAffiliate(data);
      setUsername(data.username || '');
      setCustomLink(`${window.location.origin}/${data.username}`);
      setAffiliateLink(`${window.location.origin}/r/${data.affiliate_code}`);
      
      toast.success(`Affiliate link ${existingAffiliates.length + 1} created!`);
      
      // Reset form
      setShowNewLinkInput(false);
      setNewLinkUsername("");
      setUsernameAvailability('idle');
      
      // Refresh all affiliates
      await fetchAffiliates(user.id);
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
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-deep-space to-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-neon-cyan/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-neon-coral/10 rounded-full blur-3xl"></div>
      
      <Navbar />
      
      <div className="container mx-auto px-3 md:px-4 py-16 md:py-20 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-16 max-w-5xl mx-auto px-4">
            <div className="space-y-4 md:space-y-6 animate-fade-in">
              <div className="inline-block">
                <span className="text-neon-coral text-xs md:text-base font-bold tracking-wider uppercase">🔥 Passive Income Unlocked</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-8xl font-black font-display leading-tight tracking-tight">
                <span className="block bg-gradient-to-r from-warm-sand to-neon-coral bg-clip-text text-transparent mb-2 md:mb-4">Earn While</span>
                <span className="block bg-gradient-to-r from-neon-coral via-neon-purple to-neon-cyan bg-clip-text text-transparent">
                  They Travel
                </span>
              </h1>
              
              <div className="pt-4 md:pt-6 space-y-2 md:space-y-3">
                <p className="text-xl md:text-3xl lg:text-4xl text-foreground font-bold">
                  18% Total Commission Split
                </p>
                <p className="text-base md:text-xl lg:text-2xl text-warm-sand max-w-3xl mx-auto leading-relaxed px-2">
                  9% direct sales • 6% second level • 3% third level
                </p>
              </div>

              <div className="pt-3 md:pt-4">
                <p className="text-base md:text-lg lg:text-xl text-warm-sand/90 max-w-3xl mx-auto leading-relaxed px-2">
                  One link. Infinite potential. Your network works for you — 24/7, worldwide.
                </p>
              </div>
            </div>
          </div>

          {!user ? (
            <Card className="max-w-2xl mx-auto">
              <CardHeader className="pb-3 md:pb-4">
                <CardTitle className="text-center text-lg md:text-xl">Start Earning with Nomiqa</CardTitle>
                <CardDescription className="text-center text-xs md:text-sm">
                  Create an account to get your affiliate links and start earning commissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 md:space-y-6">
                  <div className="grid md:grid-cols-3 gap-3 md:gap-4">
                    <div className="text-center p-3 md:p-4 bg-primary/5 rounded-lg">
                      <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-primary mx-auto mb-2" />
                      <h3 className="font-bold text-sm md:text-base">Multi-Tier System</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">Unlock 3 levels</p>
                    </div>
                    <div className="text-center p-3 md:p-4 bg-primary/5 rounded-lg">
                      <Users className="w-6 h-6 md:w-8 md:h-8 text-primary mx-auto mb-2" />
                      <h3 className="font-bold text-sm md:text-base">Track Referrals</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">Real-time stats</p>
                    </div>
                    <div className="text-center p-3 md:p-4 bg-primary/5 rounded-lg">
                      <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-primary mx-auto mb-2" />
                      <h3 className="font-bold text-sm md:text-base">3 Affiliate Links</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">Per account</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-4 md:p-6 text-center">
                    <CheckCircle2 className="w-10 h-10 md:w-12 md:h-12 text-primary mx-auto mb-3 md:mb-4" />
                    <h3 className="text-lg md:text-xl font-bold mb-2">Ready to Get Started?</h3>
                    <p className="text-xs md:text-sm text-muted-foreground mb-4 md:mb-6">
                      Each account gets 1 automatic link based on your username, 
                      plus you can create 2 additional custom links to track different campaigns.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button onClick={() => navigate('/auth?mode=signup')} size="lg" variant="default" className="w-full sm:w-auto">
                        Register Now
                      </Button>
                      <Button onClick={() => navigate('/auth')} size="lg" variant="outline" className="w-full sm:w-auto">
                        Log In
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : !affiliate ? (
            <Card className="max-w-2xl mx-auto">
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

                  <Button 
                    onClick={createAffiliate} 
                    className="w-full" 
                    size="lg"
                    disabled={creating}
                  >
                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create My First Affiliate Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8 text-center">
                <Card>
                  <CardHeader className="pb-2 md:pb-3">
                    <CardDescription className="text-xs md:text-sm">Total Clicks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl md:text-3xl font-bold">
                      {allAffiliates.reduce((sum, aff) => sum + (aff.total_clicks || 0), 0)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2 md:pb-3">
                    <CardDescription className="text-xs md:text-sm">Conversions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl md:text-3xl font-bold text-green-500">
                      {allAffiliates.reduce((sum, aff) => sum + (aff.total_conversions || 0), 0)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2 md:pb-3">
                    <CardDescription className="text-xs md:text-sm">Total Earnings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl md:text-3xl font-bold text-primary">
                      ${allAffiliates.reduce((sum, aff) => sum + (aff.total_earnings_usd || 0), 0).toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2 md:pb-3">
                    <CardDescription className="text-xs md:text-sm">Current Tier</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div className={`text-xl md:text-2xl font-bold ${getTierInfo()?.currentTier.color}`}>
                        {getTierInfo()?.currentTier.name}
                      </div>
                      <div className="text-[10px] md:text-xs text-muted-foreground">Tier {getTierInfo()?.currentTier.level}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tier Progress Card */}
              {getTierInfo()?.nextTier && (
                <Card className="mb-6 md:mb-8 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardHeader className="pb-3 md:pb-4">
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                      <Award className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                      Unlock Next Tier
                    </CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                      Complete more conversions to unlock higher commission levels
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 md:space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm font-medium">
                        Progress to {getTierInfo()?.nextTier.name}
                      </span>
                      <span className="text-xs md:text-sm font-bold text-primary">
                        {Math.round(getTierInfo()?.progress || 0)}%
                      </span>
                    </div>
                    
                    <div className="h-2 md:h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                        style={{ width: `${getTierInfo()?.progress}%` }}
                      />
                    </div>
                    
                    <p className="text-xs md:text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">{getTierInfo()?.remaining} more conversions</span> to unlock <span className="font-semibold">{getTierInfo()?.nextTier.description}</span>
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Tier System Explanation */}
              <Card className="mb-6 md:mb-8">
                <CardHeader className="pb-3 md:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
                    3-Tier Commission System
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Unlock more earning potential as you grow your network
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 md:space-y-4">
                     {/* Tier 1 - Starter */}
                    <div className={`p-3 md:p-4 rounded-lg border-2 ${
                      affiliate.tier_level >= 1 ? 'border-blue-500/50 bg-blue-500/5' : 'border-muted bg-muted/20'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {affiliate.tier_level >= 1 ? (
                            <Unlock className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
                          ) : (
                            <Lock className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                          )}
                          <h3 className="font-bold text-blue-500 text-sm md:text-base">Tier 1: Starter</h3>
                        </div>
                        <Badge variant={affiliate.tier_level >= 1 ? 'default' : 'secondary'} className="text-xs w-fit">
                          {affiliate.tier_level >= 1 ? 'Unlocked' : 'Start Here'}
                        </Badge>
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3">
                        Everyone starts here (0+ conversions)
                      </p>
                      <div className="space-y-1 text-xs md:text-sm">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-3 h-3 md:w-4 md:h-4 text-green-500 flex-shrink-0" />
                          <span><strong>9%</strong> commission on direct referrals</span>
                        </div>
                      </div>
                    </div>

                    {/* Tier 2 - Pro */}
                    <div className={`p-3 md:p-4 rounded-lg border-2 ${
                      affiliate.tier_level >= 2 ? 'border-purple-500/50 bg-purple-500/5' : 'border-muted bg-muted/20'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {affiliate.tier_level >= 2 ? (
                            <Unlock className="w-4 h-4 md:w-5 md:h-5 text-purple-500" />
                          ) : (
                            <Lock className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                          )}
                          <h3 className="font-bold text-purple-500 text-sm md:text-base">Tier 2: Pro</h3>
                        </div>
                        <Badge variant={affiliate.tier_level >= 2 ? 'default' : 'secondary'} className="text-xs w-fit">
                          {affiliate.tier_level >= 2 ? 'Unlocked' : '10 conversions'}
                        </Badge>
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3">
                        Unlock at 10 total conversions
                      </p>
                      <div className="space-y-2 text-xs md:text-sm">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-3 h-3 md:w-4 md:h-4 text-green-500 flex-shrink-0" />
                          <span><strong>9%</strong> on your direct referrals</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-3 h-3 md:w-4 md:h-4 text-purple-500 flex-shrink-0" />
                          <span><strong>+ 6%</strong> when YOUR referrals refer others</span>
                        </div>
                        <p className="text-[10px] md:text-xs text-muted-foreground pt-2 pl-4 md:pl-6 border-l-2 border-purple-500/30">
                          Level 2 = Sales by people your referrals brought in
                        </p>
                      </div>
                    </div>

                    {/* Tier 3 - Elite */}
                    <div className={`p-3 md:p-4 rounded-lg border-2 ${
                      affiliate.tier_level >= 3 ? 'border-amber-500/50 bg-amber-500/5' : 'border-muted bg-muted/20'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {affiliate.tier_level >= 3 ? (
                            <Unlock className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
                          ) : (
                            <Lock className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                          )}
                          <h3 className="font-bold text-amber-500 text-sm md:text-base">Tier 3: Elite</h3>
                        </div>
                        <Badge variant={affiliate.tier_level >= 3 ? 'default' : 'secondary'} className="text-xs w-fit">
                          {affiliate.tier_level >= 3 ? 'Unlocked' : '30 conversions'}
                        </Badge>
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3">
                        Unlock at 30 total conversions
                      </p>
                      <div className="space-y-2 text-xs md:text-sm">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-3 h-3 md:w-4 md:h-4 text-green-500 flex-shrink-0" />
                          <span><strong>9%</strong> on your direct referrals</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-3 h-3 md:w-4 md:h-4 text-purple-500 flex-shrink-0" />
                          <span><strong>+ 6%</strong> when YOUR referrals refer others</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-3 h-3 md:w-4 md:h-4 text-amber-500 flex-shrink-0" />
                          <span><strong>+ 3%</strong> when THEIR referrals refer others</span>
                        </div>
                        <p className="text-[10px] md:text-xs text-muted-foreground pt-2 pl-4 md:pl-6 border-l-2 border-amber-500/30">
                          Level 2 = Your referrals' sales • Level 3 = Their referrals' sales
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* All Affiliate Links Section */}
              <Card className="mb-6 md:mb-8">
                <CardHeader className="pb-3 md:pb-4">
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-base md:text-lg">
                    <span>Your Affiliate Links</span>
                    <Badge variant="secondary" className="text-xs w-fit">{allAffiliates.length} / 3</Badge>
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    You can have up to 3 affiliate links. Each link has its own tracking and stats.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {allAffiliates.map((aff, index) => {
                    const isFirst = index === 0;
                    const link = aff.username 
                      ? `${window.location.origin}/${aff.username}`
                      : `${window.location.origin}/r/${aff.affiliate_code}`;
                    
                    return (
                      <div key={aff.id} className="p-3 md:p-4 border rounded-lg space-y-3">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm md:text-base">
                              {isFirst ? "Primary Link" : `Link ${index + 1}`}
                            </h3>
                            {isFirst && <Badge className="text-xs">Auto-created</Badge>}
                          </div>
                        </div>
                        
                        {/* Stats - Mobile Friendly */}
                        <div className="grid grid-cols-3 gap-2 py-2">
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground mb-1">Clicks</div>
                            <div className="font-semibold text-sm md:text-base">{aff.total_clicks}</div>
                          </div>
                          <div className="text-center border-x">
                            <div className="text-xs text-muted-foreground mb-1">Conversions</div>
                            <div className="font-semibold text-sm md:text-base text-green-600">{aff.total_conversions}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground mb-1">Earned</div>
                            <div className="font-semibold text-sm md:text-base text-primary">${aff.total_earnings_usd.toFixed(2)}</div>
                          </div>
                        </div>
                        
                        {/* Link */}
                        <div className="space-y-2">
                          <div className="p-2 bg-muted rounded text-xs md:text-sm break-all font-mono">
                            {link}
                          </div>
                          <Button 
                            onClick={() => copyLink(link)} 
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Link
                          </Button>
                          <div className="text-[10px] md:text-xs text-muted-foreground pt-1 border-t">
                            Username: <span className="font-mono">{aff.username}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {allAffiliates.length < 3 && (
                    <div className="pt-4">
                      {!showNewLinkInput ? (
                        <div className="space-y-3">
                          <Button 
                            onClick={() => setShowNewLinkInput(true)} 
                            variant="outline"
                            className="w-full"
                          >
                            Create Additional Link ({allAffiliates.length + 1} / 3)
                          </Button>
                          <p className="text-xs text-muted-foreground text-center">
                            You can create {3 - allAffiliates.length} more affiliate link{3 - allAffiliates.length > 1 ? 's' : ''}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4 p-3 md:p-4 border rounded-lg bg-muted/30">
                          <h3 className="font-semibold text-sm md:text-base">Create Link {allAffiliates.length + 1}</h3>
                          
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs md:text-sm font-medium block mb-2">
                                Choose a username for this link
                              </label>
                              
                              {/* Username input */}
                              <div className="space-y-2">
                                <div className="relative">
                                  <Input
                                    value={newLinkUsername}
                                    onChange={(e) => setNewLinkUsername(e.target.value.toLowerCase())}
                                    placeholder="your-custom-name"
                                    className="font-mono text-sm pr-10"
                                  />
                                  {usernameAvailability === 'checking' && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                  )}
                                  {usernameAvailability === 'available' && (
                                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                                  )}
                                  {usernameAvailability === 'taken' && (
                                    <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                                  )}
                                </div>
                                
                                {/* Live Preview */}
                                {newLinkUsername && (
                                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                                    <p className="text-[10px] md:text-xs text-muted-foreground mb-1 font-medium">Your link preview:</p>
                                    <p className="text-xs md:text-sm font-mono break-all text-primary">
                                      {window.location.origin}/{newLinkUsername}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Validation Messages */}
                            {usernameAvailability === 'invalid' && (
                              <div className="flex items-start gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded">
                                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-red-600">
                                  Username must be 3-30 characters, lowercase letters, numbers, and hyphens only
                                </p>
                              </div>
                            )}
                            {usernameAvailability === 'taken' && (
                              <div className="flex items-start gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded">
                                <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-red-600">
                                  This username is already taken
                                </p>
                              </div>
                            )}
                            {usernameAvailability === 'available' && (
                              <div className="flex items-start gap-2 p-2 bg-green-500/10 border border-green-500/20 rounded">
                                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-green-700 dark:text-green-600">
                                  This username is available!
                                </p>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            <Button 
                              onClick={createAffiliate}
                              disabled={creating || usernameAvailability !== 'available'}
                              className="flex-1"
                              size="sm"
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
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {allAffiliates.length >= 3 && (
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        You've reached the maximum of 3 affiliate links. These links cannot be edited.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="mb-8 hidden">
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
                      <Input 
                        value={customLink || affiliateLink} 
                        readOnly 
                        className="font-mono text-primary font-semibold text-sm sm:text-base break-all"
                      />
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
                            <Input 
                              value={username} 
                              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                              placeholder="yourname"
                              className={`font-mono pr-10 text-sm sm:text-base ${
                                usernameAvailability === 'available' ? 'border-green-500 focus-visible:ring-green-500' :
                                usernameAvailability === 'taken' || usernameAvailability === 'invalid' ? 'border-red-500 focus-visible:ring-red-500' :
                                ''
                              }`}
                              disabled={updatingUsername}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {usernameAvailability === 'checking' && (
                                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                              )}
                              {usernameAvailability === 'available' && (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              )}
                              {usernameAvailability === 'taken' && (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                              {usernameAvailability === 'invalid' && (
                                <AlertCircle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                          </div>
                        </div>
                        {usernameAvailability === 'taken' && (
                          <p className="text-xs text-red-500">Username already taken</p>
                        )}
                        {usernameAvailability === 'invalid' && (
                          <p className="text-xs text-red-500">3-30 characters, lowercase letters, numbers, and hyphens only</p>
                        )}
                        {usernameAvailability === 'available' && (
                          <p className="text-xs text-green-500">Username available!</p>
                        )}
                        {customLink && (
                          <div className="p-3 bg-muted/50 rounded-md">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Your custom link preview:</p>
                            <p className="text-xs sm:text-sm font-mono text-primary break-all">{customLink}</p>
                          </div>
                        )}
                      </div>
                      <Button 
                        onClick={updateUsername} 
                        disabled={!username || updatingUsername || username === affiliate.username || usernameAvailability !== 'available'}
                        className="w-full sm:w-auto"
                      >
                        {updatingUsername && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Update
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Analytics Dashboard */}
              <Card className="mb-8 border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <BarChart3 className="w-5 h-5 text-primary" />
                        </div>
                        Analytics Dashboard
                      </CardTitle>
                      <CardDescription className="text-xs md:text-sm mt-2">Track your performance and earnings</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {loadingAnalytics ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
                      <p className="text-sm text-muted-foreground">Loading analytics...</p>
                    </div>
                  ) : analytics ? (
                    <div className="space-y-8">
                      {/* Traffic Sources */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded bg-primary/10">
                            <Share2 className="w-4 h-4 text-primary" />
                          </div>
                          <h3 className="font-semibold text-base md:text-lg">Traffic Sources</h3>
                        </div>
                        {analytics.sourceBreakdown.length > 0 ? (
                          (() => {
                            const significantSources = analytics.sourceBreakdown.filter(
                              source => source.clicks >= 3 || source.conversions > 0
                            );
                            
                            return significantSources.length > 0 ? (
                              <div className="space-y-3">
                                {significantSources.map((source) => {
                                  const conversionRate = source.clicks > 0 
                                    ? ((source.conversions / source.clicks) * 100).toFixed(1)
                                    : '0.0';
                                  
                                  return (
                                    <div key={source.source} className="group p-4 bg-gradient-to-r from-muted/50 to-muted/30 hover:from-muted/70 hover:to-muted/50 rounded-xl border border-border/50 transition-all duration-300 space-y-3">
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                          <Badge variant={source.source === 'direct' ? 'default' : 'secondary'} className="capitalize text-xs font-medium px-3 py-1">
                                            {source.source}
                                          </Badge>
                                          <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                                            <span className="font-semibold text-foreground">{source.clicks}</span>
                                            <span>clicks</span>
                                            <span className="text-muted-foreground/50">•</span>
                                            <span className="font-semibold text-foreground">{source.conversions}</span>
                                            <span>conversions</span>
                                          </div>
                                        </div>
                                        <span className="text-lg md:text-xl font-bold text-primary">
                                          {conversionRate}%
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-background/80 rounded-full h-2.5 overflow-hidden shadow-inner">
                                          <div 
                                            className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out shadow-[0_0_8px_rgba(var(--primary),0.4)]"
                                            style={{ width: `${Math.min(parseFloat(conversionRate), 100)}%` }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-center py-8 px-4 bg-muted/30 rounded-xl border border-dashed border-border">
                                <Share2 className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                                <p className="text-sm text-muted-foreground font-medium">No significant traffic yet</p>
                                <p className="text-xs text-muted-foreground/70 mt-1">Build momentum by sharing your link!</p>
                              </div>
                            );
                          })()
                        ) : (
                          <div className="text-center py-8 px-4 bg-muted/30 rounded-xl border border-dashed border-border">
                            <Share2 className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground font-medium">No traffic data yet</p>
                            <p className="text-xs text-muted-foreground/70 mt-1">Start sharing your link to see analytics!</p>
                          </div>
                        )}
                      </div>

                      {/* Commission Levels */}
                      <div className="pt-6 border-t border-border/50 space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded bg-primary/10">
                            <TrendingUp className="w-4 h-4 text-primary" />
                          </div>
                          <h3 className="font-semibold text-base md:text-lg">Multi-Level Earnings</h3>
                        </div>
                        {analytics.levelBreakdown.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[1, 2, 3].map(level => {
                              const levelData = analytics.levelBreakdown.find(l => l.level === level);
                              const conversions = levelData?.conversions || 0;
                              const earnings = levelData?.earnings || 0;
                              const commissionRate = level === 1 ? '9%' : level === 2 ? '6%' : '3%';
                              const isActive = conversions > 0;
                              const levelIcon = level === 1 ? '🥇' : level === 2 ? '🥈' : '🥉';
                              
                              return (
                                <Card 
                                  key={level} 
                                  className={`group relative overflow-hidden transition-all duration-300 ${
                                    isActive 
                                      ? 'border-primary/50 bg-gradient-to-br from-primary/10 via-background to-background shadow-xl shadow-primary/20' 
                                      : 'border-border/50 hover:border-primary/30 bg-gradient-to-br from-background to-muted/20'
                                  }`}
                                >
                                  {isActive && (
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full" />
                                  )}
                                  <CardHeader className="pb-3 relative">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg ${
                                          level === 1 ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground' :
                                          level === 2 ? 'bg-gradient-to-br from-primary/70 to-primary/50 text-primary-foreground' :
                                          'bg-gradient-to-br from-primary/50 to-primary/30 text-primary'
                                        }`}>
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
                                      <Badge 
                                        variant={level === 1 ? 'default' : 'secondary'} 
                                        className={`text-xs font-bold px-3 py-1 ${
                                          level === 1 ? 'shadow-md shadow-primary/30' : ''
                                        }`}
                                      >
                                        {commissionRate}
                                      </Badge>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="space-y-4 relative">
                                    <div className="space-y-3">
                                      <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                                        <span className="text-xs md:text-sm text-muted-foreground font-medium">Conversions</span>
                                        <span className={`text-2xl md:text-3xl font-bold ${isActive ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                                          {conversions}
                                        </span>
                                      </div>
                                      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                                      <div className="flex justify-between items-center p-3 rounded-lg bg-primary/5">
                                        <span className="text-xs md:text-sm text-muted-foreground font-medium">Earnings</span>
                                        <span className={`text-xl md:text-2xl font-bold ${isActive ? 'text-primary' : 'text-muted-foreground/50'}`}>
                                          ${earnings.toFixed(2)}
                                        </span>
                                      </div>
                                    </div>
                                    {isActive && (
                                      <div className="pt-3 border-t border-primary/20 bg-gradient-to-r from-primary/5 to-transparent rounded-lg p-2">
                                        <div className="flex items-center gap-1.5 text-xs text-primary">
                                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                          <span className="font-semibold">Active & Earning</span>
                                        </div>
                                      </div>
                                    )}
                                    {!isActive && (
                                      <div className="pt-3 border-t border-dashed border-border/50">
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                                          <Lock className="w-3 h-3" />
                                          <span className="font-medium">Not yet unlocked</span>
                                        </div>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-8 px-4 bg-muted/30 rounded-xl border border-dashed border-border">
                            <TrendingUp className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground font-medium">No conversions yet</p>
                            <p className="text-xs text-muted-foreground/70 mt-1">Keep sharing to unlock all levels!</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 px-4 bg-muted/20 rounded-xl border border-dashed border-border">
                      <BarChart3 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground font-medium">Analytics will appear here</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">Start sharing to track your performance</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>How It Works</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-4">
                    <li className="flex flex-col md:flex-row gap-4 text-center md:text-left items-center md:items-start">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex-shrink-0">
                        1
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Share Your Link</h4>
                        <p className="text-sm text-muted-foreground">
                          Copy your unique affiliate link and share it on social media, blogs, or with friends
                        </p>
                      </div>
                    </li>
                    <li className="flex flex-col md:flex-row gap-4 text-center md:text-left items-center md:items-start">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex-shrink-0">
                        2
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">They Purchase</h4>
                        <p className="text-sm text-muted-foreground">
                          When someone clicks your link and makes a purchase, it is tracked to your account
                        </p>
                      </div>
                    </li>
                    <li className="flex flex-col md:flex-row gap-4 text-center md:text-left items-center md:items-start">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex-shrink-0">
                        3
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Earn Multi-Level Commissions</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Build your network and earn from multiple levels:
                        </p>
                        <div className="space-y-3 text-sm">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Unlock className="w-4 h-4 text-green-500" />
                              <span><strong>Tier 1 (Starter):</strong> 9% on your direct referrals</span>
                            </div>
                            <p className="text-xs text-muted-foreground pl-6">
                              You → Customer (You earn 9%)
                            </p>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Lock className="w-4 h-4 text-muted-foreground" />
                              <span><strong>Tier 2 (Pro):</strong> Additional 6% when your referrals refer others</span>
                            </div>
                            <p className="text-xs text-muted-foreground pl-6">
                              You → Your Referral → Their Customer (You earn 9% + 6%)
                            </p>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Lock className="w-4 h-4 text-muted-foreground" />
                              <span><strong>Tier 3 (Elite):</strong> Additional 3% from 3rd level down</span>
                            </div>
                            <p className="text-xs text-muted-foreground pl-6">
                              You → Referral → Their Referral → Customer (You earn 9% + 6% + 3%)
                            </p>
                          </div>
                        </div>
                      </div>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}