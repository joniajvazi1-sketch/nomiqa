import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, TrendingUp, Users, DollarSign, CheckCircle2, Loader2, XCircle, AlertCircle, BarChart3, Share2 } from "lucide-react";
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
  const [affiliateLink, setAffiliateLink] = useState("");
  const [customLink, setCustomLink] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [updatingUsername, setUpdatingUsername] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [usernameAvailability, setUsernameAvailability] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  // Debounced username availability check
  useEffect(() => {
    if (!username || username === affiliate?.username) {
      setUsernameAvailability('idle');
      return;
    }

    // Validate username format
    if (username.length < 3 || username.length > 30) {
      setUsernameAvailability('invalid');
      return;
    }

    if (!/^[a-z0-9-]+$/.test(username)) {
      setUsernameAvailability('invalid');
      return;
    }

    setUsernameAvailability('checking');

    const timeoutId = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('affiliates')
          .select('id')
          .eq('username', username.toLowerCase())
          .maybeSingle();

        if (error) throw error;

        setUsernameAvailability(data ? 'taken' : 'available');
      } catch (error) {
        console.error('Error checking username:', error);
        setUsernameAvailability('idle');
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username, affiliate?.username]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUser(user);
        await fetchAffiliate(user.email!);
      } else {
        // Check if guest affiliate exists in localStorage
        const guestAffiliateCode = localStorage.getItem('guest_affiliate_code');
        if (guestAffiliateCode) {
          const { data } = await supabase
            .from('affiliates')
            .select('*')
            .eq('affiliate_code', guestAffiliateCode)
            .maybeSingle();
          
          if (data) {
            setAffiliate(data);
            setAffiliateLink(`${window.location.origin}/?ref=${data.affiliate_code}`);
            setIsGuest(true);
          }
        } else {
          setIsGuest(true);
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAffiliate = async (email: string) => {
    const { data, error } = await supabase
      .from('affiliates')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (!error && data) {
      setAffiliate(data);
      setAffiliateLink(`${window.location.origin}/r/${data.affiliate_code}`);
      setUsername(data.username || '');
      if (data.username) {
        setCustomLink(`${window.location.origin}/${data.username}`);
      }
      
      // Fetch analytics
      fetchAnalytics(data.id);
    }
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
    if (!email && !user) {
      toast.error("Please enter your email");
      return;
    }

    setCreating(true);
    try {
      const code = generateCode();
      const affiliateEmail = user?.email || email;
      
      // Auto-generate username from email
      const autoUsername = affiliateEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

      // Get referrer's affiliate ID if user signed up with a ref code
      const { referralCode } = useAffiliateTracking.getState();
      let parentAffiliateId = null;

      if (referralCode) {
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
          user_id: user?.id || null,
          email: affiliateEmail,
          affiliate_code: code,
          username: autoUsername,
          parent_affiliate_id: parentAffiliateId,
        })
        .select()
        .single();

      if (error) throw error;

      setAffiliate(data);
      setUsername(data.username || '');
      setCustomLink(`${window.location.origin}/${data.username}`);
      setAffiliateLink(`${window.location.origin}/r/${data.affiliate_code}`);
      
      // Store in localStorage for guest users
      if (!user) {
        localStorage.setItem('guest_affiliate_code', data.affiliate_code);
      }
      
      toast.success("Affiliate account created!");
    } catch (error: any) {
      // If username is taken, add random number
      if (error.code === '23505') {
        try {
          const code = generateCode();
          const affiliateEmail = user?.email || email;
          const autoUsername = affiliateEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 999);

          const { data, error: retryError } = await supabase
            .from('affiliates')
            .insert({
              user_id: user?.id || null,
              email: affiliateEmail,
              affiliate_code: code,
              username: autoUsername,
            })
            .select()
            .single();

          if (retryError) throw retryError;

          setAffiliate(data);
          setUsername(data.username || '');
          setCustomLink(`${window.location.origin}/${data.username}`);
          setAffiliateLink(`${window.location.origin}/r/${data.affiliate_code}`);
          
          if (!user) {
            localStorage.setItem('guest_affiliate_code', data.affiliate_code);
          }
          
          toast.success("Affiliate account created!");
        } catch (retryError: any) {
          toast.error(retryError.message || "Failed to create affiliate account");
        }
      } else {
        toast.error(error.message || "Failed to create affiliate account");
      }
    } finally {
      setCreating(false);
    }
  };

  const copyLink = () => {
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
      
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 animate-fade-in-up">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 font-display">
              <span className="bg-gradient-sunset bg-clip-text text-transparent">
                Invite. Earn. Travel Together.
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-foreground/80 mb-2">
              Join the borderless generation
            </p>
            <p className="text-lg text-warm-sand/80">
              Freedom is no longer physical — it's digital.
            </p>
          </div>

          {!affiliate ? (
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Start Earning Today</CardTitle>
                <CardDescription>
                  {user 
                    ? "Get your unique referral link instantly using your account!"
                    : "Get your unique referral link instantly - no account required!"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-primary/5 rounded-lg">
                      <DollarSign className="w-8 h-8 text-primary mx-auto mb-2" />
                      <h3 className="font-bold">Multi-Level Rewards</h3>
                      <p className="text-sm text-muted-foreground">9% → 6% → 3%</p>
                    </div>
                    <div className="text-center p-4 bg-primary/5 rounded-lg">
                      <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                      <h3 className="font-bold">Track Referrals</h3>
                      <p className="text-sm text-muted-foreground">Real-time stats</p>
                    </div>
                    <div className="text-center p-4 bg-primary/5 rounded-lg">
                      <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
                      <h3 className="font-bold">Earn More</h3>
                      <p className="text-sm text-muted-foreground">No limits</p>
                    </div>
                  </div>

                  {user ? (
                    <div className="space-y-2 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-semibold">You're logged in!</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Your affiliate account will be automatically linked to <strong>{user.email}</strong>
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">
                        Email (to track your earnings)
                      </label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        💡 Tip: <a href="/auth" className="text-primary hover:underline">Sign up for an account</a> to automatically track all your referrals!
                      </p>
                    </div>
                  )}

                  <Button 
                    onClick={createAffiliate} 
                    className="w-full" 
                    size="lg"
                    disabled={creating || (!user && !email)}
                  >
                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Get My Affiliate Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid md:grid-cols-4 gap-4 mb-8 text-center">
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Total Clicks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{affiliate.total_clicks}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Conversions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-500">
                      {affiliate.total_conversions}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Total Earnings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">
                      ${affiliate.total_earnings_usd.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Commission Rates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div className="text-lg font-bold">L1: 9%</div>
                      <div className="text-sm text-muted-foreground">L2: 6% • L3: 3%</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="mb-8">
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
              <Card className="mb-8">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Analytics Dashboard
                      </CardTitle>
                      <CardDescription>Track your performance and traffic sources</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingAnalytics ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : analytics ? (
                    <div className="space-y-8">
                      {/* Traffic Sources */}
                      <div>
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                          <Share2 className="w-4 h-4" />
                          Traffic Sources
                        </h3>
                        {analytics.sourceBreakdown.length > 0 ? (
                          <div className="space-y-3">
                            {analytics.sourceBreakdown.map((source) => {
                              const conversionRate = source.clicks > 0 
                                ? ((source.conversions / source.clicks) * 100).toFixed(1)
                                : '0.0';
                              
                              return (
                                <div key={source.source} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                      <Badge variant={source.source === 'direct' ? 'default' : 'secondary'} className="capitalize">
                                        {source.source}
                                      </Badge>
                                      <span className="text-sm text-muted-foreground">
                                        {source.clicks} clicks • {source.conversions} conversions
                                      </span>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                      <div className="flex-1 bg-background rounded-full h-2 overflow-hidden">
                                        <div 
                                          className="h-full bg-primary transition-all"
                                          style={{ width: `${Math.min(parseFloat(conversionRate), 100)}%` }}
                                        />
                                      </div>
                                      <span className="text-xs font-semibold text-primary min-w-12">
                                        {conversionRate}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No traffic data yet. Start sharing your link!
                          </p>
                        )}
                      </div>

                      {/* Commission Levels */}
                      <div className="pt-6 border-t">
                        <h3 className="font-semibold mb-4">Multi-Level Conversions</h3>
                        {analytics.levelBreakdown.length > 0 ? (
                          <div className="grid md:grid-cols-3 gap-4">
                            {[1, 2, 3].map(level => {
                              const levelData = analytics.levelBreakdown.find(l => l.level === level);
                              const conversions = levelData?.conversions || 0;
                              const earnings = levelData?.earnings || 0;
                              const commissionRate = level === 1 ? '9%' : level === 2 ? '6%' : '3%';
                              
                              return (
                                <Card key={level} className={conversions > 0 ? 'border-primary' : ''}>
                                  <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                      <CardTitle className="text-sm">Level {level}</CardTitle>
                                      <Badge variant={level === 1 ? 'default' : level === 2 ? 'secondary' : 'outline'}>
                                        {commissionRate}
                                      </Badge>
                                    </div>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-2">
                                      <div className="flex justify-between items-baseline">
                                        <span className="text-sm text-muted-foreground">Conversions</span>
                                        <span className="text-2xl font-bold">{conversions}</span>
                                      </div>
                                      <div className="flex justify-between items-baseline">
                                        <span className="text-sm text-muted-foreground">Earnings</span>
                                        <span className="text-lg font-bold text-primary">
                                          ${earnings.toFixed(2)}
                                        </span>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No conversions yet. Keep sharing your link!
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Analytics will appear here once you have referral data
                    </p>
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
                        <h4 className="font-semibold mb-1">Earn Commission</h4>
                        <p className="text-sm text-muted-foreground">
                          Earn 9% on direct referrals, 6% on level 2, and 3% on level 3
                        </p>
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