import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, TrendingUp, Users, DollarSign, CheckCircle2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAffiliateTracking } from "@/hooks/useAffiliateTracking";

interface AffiliateData {
  id: string;
  affiliate_code: string;
  total_clicks: number;
  total_conversions: number;
  total_earnings_usd: number;
  commission_rate: number;
  status: string;
}

export default function Affiliate() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [affiliateLink, setAffiliateLink] = useState("");
  const [email, setEmail] = useState("");
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

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
          parent_affiliate_id: parentAffiliateId,
        })
        .select()
        .single();

      if (error) throw error;

      setAffiliate(data);
      setAffiliateLink(`${window.location.origin}/r/${data.affiliate_code}`);
      
      // Store in localStorage for guest users
      if (!user) {
        localStorage.setItem('guest_affiliate_code', data.affiliate_code);
      }
      
      toast.success("Affiliate account created!");
    } catch (error: any) {
      toast.error(error.message || "Failed to create affiliate account");
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
                  Get your unique referral link instantly - no account required!
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

                  {!user && (
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
                <CardContent>
                  <div className="flex gap-2">
                    <Input value={affiliateLink} readOnly className="font-mono" />
                    <Button onClick={copyLink}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    Status: <Badge variant={affiliate.status === 'active' ? 'default' : 'secondary'}>
                      {affiliate.status}
                    </Badge>
                  </p>
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