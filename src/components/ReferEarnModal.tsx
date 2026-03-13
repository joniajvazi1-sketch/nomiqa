import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Copy, CheckCircle2, Loader2, Users, DollarSign, TrendingUp, Pickaxe, Zap, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/contexts/TranslationContext";

interface AffiliateData {
  id: string;
  affiliate_code: string;
  username: string | null;
  total_registrations: number;
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
  const { t, formatPrice } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [copied, setCopied] = useState(false);
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [savingCode, setSavingCode] = useState(false);
  const [codeError, setCodeError] = useState('');

  useEffect(() => {
    if (open) {
      checkUserAndFetchAffiliate();
    }
  }, [open]);

  const checkUserAndFetchAffiliate = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data, error } = await supabase
          .from('affiliates_safe')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          setAffiliate(data);
        }
      }
    } catch (error) {
      console.error('Error fetching affiliate:', error);
    } finally {
      setLoading(false);
    }
  };

  const referralCode = affiliate?.username || affiliate?.affiliate_code || '';

  const copyCode = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      setCopied(true);
      toast.success("Referral code copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleChangeCode = async () => {
    if (!newCode.trim() || newCode.length < 3) {
      setCodeError('Code must be at least 3 characters');
      return;
    }

    setSavingCode(true);
    setCodeError('');
    try {
      const { data, error } = await supabase.functions.invoke('update-referral-code', {
        body: { newCode: newCode.trim() },
      });

      if (error) throw error;
      if (data?.error) {
        setCodeError(data.error);
        return;
      }

      toast.success('Referral code updated!');
      setIsEditingCode(false);
      // Refresh data
      checkUserAndFetchAffiliate();
    } catch (err: any) {
      setCodeError(err.message || 'Failed to update code');
    } finally {
      setSavingCode(false);
    }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Refer & Earn</DialogTitle>
          <DialogDescription>
            Share your referral code and earn commissions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Product Info */}
          {product && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{product?.name}</h3>
                  <p className="text-sm text-muted-foreground">{product?.data_amount} • {product?.validity_days} days</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{formatPrice(product?.price_usd)}</div>
                  <p className="text-xs text-muted-foreground">Earn 9% commission</p>
                </div>
              </div>
            </div>
          )}

          {/* Referral Code Display */}
          <div className="space-y-3">
            <h3 className="font-semibold">Your Referral Code</h3>
            
            {!isEditingCode ? (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-center">
                <p className="text-3xl font-bold font-mono text-primary tracking-wider mb-2">
                  {referralCode}
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  Friends enter this code when they sign up
                </p>
                <div className="flex gap-2">
                  <Button onClick={copyCode} className="flex-1" size="sm">
                    {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copied ? 'Copied!' : 'Copy Code'}
                  </Button>
                  <Button 
                    onClick={() => {
                      setNewCode(referralCode);
                      setIsEditingCode(true);
                    }} 
                    variant="outline" 
                    size="sm"
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Change
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-muted/50 border border-border rounded-xl space-y-3">
                <p className="text-xs text-muted-foreground">
                  ⚠️ You can only change your referral code once
                </p>
                <Input
                  value={newCode}
                  onChange={(e) => {
                    setNewCode(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                    setCodeError('');
                  }}
                  placeholder="New referral code"
                  className="font-mono"
                />
                {codeError && (
                  <p className="text-xs text-destructive">{codeError}</p>
                )}
                <div className="flex gap-2">
                  <Button onClick={handleChangeCode} disabled={savingCode} size="sm" className="flex-1">
                    {savingCode ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                    Save
                  </Button>
                  <Button onClick={() => { setIsEditingCode(false); setCodeError(''); }} variant="outline" size="sm">
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Mining Rewards Info */}
          <div className="p-4 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-yellow-500/10 border border-amber-500/20 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Pickaxe className="w-5 h-5 text-amber-500" />
              <h4 className="font-semibold text-amber-400">Mining Rewards</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Unlock miner boosts</strong> by getting friends to sign up — up to +50% mining speed!
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Users className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Earn 5%</strong> of what your referrals mine — they don't lose anything!
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-xs text-green-700 dark:text-green-400">
              💰 You earn 9% on direct referrals, 6% on level 2, and 3% on level 3
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
