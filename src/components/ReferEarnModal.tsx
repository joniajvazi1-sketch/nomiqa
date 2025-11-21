import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Copy, CheckCircle2, Loader2, Users, DollarSign, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/contexts/TranslationContext";

interface AffiliateData {
  id: string;
  affiliate_code: string;
  username: string | null;
  total_clicks: number;
  total_conversions: number;
  total_earnings_usd: number;
}

interface ReferEarnModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
}

export const ReferEarnModal = ({ open, onOpenChange, product }: ReferEarnModalProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [affiliates, setAffiliates] = useState<AffiliateData[]>([]);
  const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateData | null>(null);

  useEffect(() => {
    if (open) {
      checkUserAndFetchAffiliates();
    }
  }, [open]);

  const checkUserAndFetchAffiliates = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data, error } = await supabase
          .from('affiliates')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (!error && data) {
          setAffiliates(data);
          if (data.length > 0) {
            setSelectedAffiliate(data[0]); // Default to first link
          }
        }
      }
    } catch (error) {
      console.error('Error fetching affiliates:', error);
    } finally {
      setLoading(false);
    }
  };

  const getReferralLink = (affiliate: AffiliateData) => {
    const username = affiliate.username || affiliate.affiliate_code;
    return `${window.location.origin}/${username}?product=${product?.id}`;
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("Referral link copied!");
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("affiliateAuthTitle")}</DialogTitle>
            <DialogDescription>
              {t("affiliateAuthDesc")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-primary/5 rounded-lg">
                <DollarSign className="w-6 h-6 text-primary mx-auto mb-2" />
                <h3 className="font-bold text-sm">{t("affiliateMultiLevel")}</h3>
                <p className="text-xs text-muted-foreground">{t("affiliateCommissionTiers")}</p>
              </div>
              <div className="text-center p-3 bg-primary/5 rounded-lg">
                <Users className="w-6 h-6 text-primary mx-auto mb-2" />
                <h3 className="font-bold text-sm">{t("affiliateTrackStats")}</h3>
                <p className="text-xs text-muted-foreground">{t("affiliateRealTime")}</p>
              </div>
              <div className="text-center p-3 bg-primary/5 rounded-lg">
                <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
                <h3 className="font-bold text-sm">{t("affiliateThreeLinks")}</h3>
                <p className="text-xs text-muted-foreground">{t("affiliatePerAccount")}</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-6 text-center">
              <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-bold mb-2">{t("affiliateReadyTitle")}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t("affiliateReadyDesc")}
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => {
                  onOpenChange(false);
                  navigate('/auth?mode=signup');
                }} size="sm">
                  {t("affiliateRegisterNow")}
                </Button>
                <Button onClick={() => {
                  onOpenChange(false);
                  navigate('/auth');
                }} size="sm" variant="outline">
                  {t("affiliateLogIn")}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (affiliates.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Your First Affiliate Link</DialogTitle>
            <DialogDescription>
              Get started with affiliate marketing by creating your first link
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">You're logged in</span>
              </div>
              <p className="text-sm text-muted-foreground">
                You need to create at least one affiliate link to share products. 
                Visit the Affiliate page to get started.
              </p>
            </div>

            <Button 
              onClick={() => {
                onOpenChange(false);
                navigate('/affiliate');
              }}
              className="w-full"
            >
              Go to Affiliate Page
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Refer & Earn</DialogTitle>
          <DialogDescription>
            Share {product?.name} and earn commissions on every sale
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Info */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{product?.name}</h3>
                <p className="text-sm text-muted-foreground">{product?.data_amount} • {product?.validity_days} days</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">${product?.price_usd.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Earn 9% commission</p>
              </div>
            </div>
          </div>

          {/* Select Affiliate Link */}
          <div>
            <h3 className="font-semibold mb-3">Choose your affiliate link</h3>
            <div className="space-y-2">
              {affiliates.map((affiliate, index) => (
                <button
                  key={affiliate.id}
                  onClick={() => setSelectedAffiliate(affiliate)}
                  className={`w-full p-3 border rounded-lg text-left transition-colors ${
                    selectedAffiliate?.id === affiliate.id 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        {index === 0 ? 'Primary Link' : `Link ${index + 1}`}
                      </span>
                      {index === 0 && <Badge variant="outline" className="text-xs">Auto-created</Badge>}
                    </div>
                    {selectedAffiliate?.id === affiliate.id && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <span>{affiliate.total_clicks} clicks</span>
                    <span>{affiliate.total_conversions} conversions</span>
                    <span>${affiliate.total_earnings_usd.toFixed(2)} earned</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Generated Referral Link */}
          {selectedAffiliate && (
            <div className="space-y-3">
              <h3 className="font-semibold">Your referral link</h3>
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">Share this link to earn commissions:</p>
                <div className="flex gap-2">
                  <div className="flex-1 p-2 bg-background rounded text-xs md:text-sm break-all font-mono">
                    {getReferralLink(selectedAffiliate)}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => copyLink(getReferralLink(selectedAffiliate))}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-xs text-green-700 dark:text-green-600">
                  <strong>Tip:</strong> When someone uses this link, they'll be taken directly to this product. 
                  You'll earn a 9% commission on their purchase!
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
