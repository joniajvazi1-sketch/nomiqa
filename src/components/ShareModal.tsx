import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/contexts/TranslationContext";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any | null;
}

export const ShareModal = ({ open, onOpenChange, product }: ShareModalProps) => {
  const { formatPrice } = useTranslation();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (open) {
      checkAffiliate();
    }
  }, [open]);

  const checkAffiliate = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data } = await supabase
          .from('affiliates_safe')
          .select('affiliate_code, username')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (data) {
          setReferralCode(data.username || data.affiliate_code);
        }
      } else {
        const guestCode = localStorage.getItem('guest_affiliate_code');
        if (guestCode) {
          setReferralCode(guestCode);
        }
      }
    } catch (error) {
      console.error('Error checking affiliate:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAffiliateQuick = async () => {
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setCreating(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('create-affiliate', {
        body: { email },
      });

      if (error) throw error;
      if (!result?.affiliate) throw new Error('Failed to create affiliate');

      const affiliateData = result.affiliate;
      setReferralCode(affiliateData.username || affiliateData.affiliate_code);
      localStorage.setItem('guest_affiliate_code', affiliateData.affiliate_code);
      toast.success("Affiliate account created!");
    } catch (error: any) {
      toast.error(error.message || "Failed to create affiliate account");
    } finally {
      setCreating(false);
    }
  };

  if (!product) return null;

  const copyCode = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      setCopied(true);
      toast.success("Referral code copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share & Earn</DialogTitle>
          <DialogDescription>
            Share your referral code and earn commissions on every sale
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !referralCode ? (
          <div className="space-y-4">
            <div className="bg-primary/5 p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">Get Your Referral Code</p>
              <p className="text-xs text-muted-foreground">
                Enter your email to create an affiliate account and start earning 9% → 6% → 3% on all referrals
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <Button 
              onClick={createAffiliateQuick} 
              className="w-full"
              disabled={creating || !email}
            >
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Affiliate Account
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Product Preview */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <h3 className="font-semibold">{product.country_name}</h3>
              <p className="text-sm text-muted-foreground">{product.name}</p>
              <div className="flex items-center gap-4 text-sm">
                <span>📊 {product.data_amount}</span>
                <span>📅 {product.validity_days} days</span>
                <span className="font-bold text-primary">{formatPrice(product.price_usd)}</span>
              </div>
            </div>

            {/* Referral Code */}
            <div className="space-y-2">
              <Label>Your Referral Code</Label>
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-center">
                <p className="text-3xl font-bold font-mono text-primary tracking-wider mb-3">
                  {referralCode}
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  Friends enter this code when they sign up
                </p>
                <Button onClick={copyCode} className="w-full" size="sm">
                  {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  {copied ? 'Copied!' : 'Copy Code'}
                </Button>
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-lg">
              <p className="text-xs text-green-700 dark:text-green-400">
                💰 You earn 9% on direct referrals, 6% on level 2, and 3% on level 3
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
