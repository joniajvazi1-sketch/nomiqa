import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Copy, Check, Facebook, Twitter, Linkedin, Mail, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any | null;
}

export const ShareModal = ({ open, onOpenChange, product }: ShareModalProps) => {
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);
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
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Fetch affiliate by user email
        const { data } = await supabase
          .from('affiliates')
          .select('affiliate_code')
          .eq('email', user.email)
          .maybeSingle();
        
        if (data) {
          setAffiliateCode(data.affiliate_code);
        }
      } else {
        // Check localStorage for guest affiliate
        const guestCode = localStorage.getItem('guest_affiliate_code');
        if (guestCode) {
          setAffiliateCode(guestCode);
        }
      }
    } catch (error) {
      console.error('Error checking affiliate:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const createAffiliateQuick = async () => {
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setCreating(true);
    try {
      const code = generateCode();

      const { data, error } = await supabase
        .from('affiliates')
        .insert({
          email,
          affiliate_code: code,
        })
        .select()
        .single();

      if (error) throw error;

      setAffiliateCode(data.affiliate_code);
      localStorage.setItem('guest_affiliate_code', data.affiliate_code);
      toast.success("Affiliate account created!");
    } catch (error: any) {
      toast.error(error.message || "Failed to create affiliate account");
    } finally {
      setCreating(false);
    }
  };

  if (!product) return null;

  const affiliateLink = affiliateCode 
    ? `${window.location.origin}/?ref=${affiliateCode}&product=${product.id}`
    : '';

  const shareText = `Check out this amazing eSIM plan: ${product.name} - ${product.data_amount} for ${product.validity_days} days in ${product.country_name}! Only $${product.price_usd.toFixed(2)}`;

  const copyLink = () => {
    if (affiliateLink) {
      navigator.clipboard.writeText(affiliateLink);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareVia = (platform: string) => {
    if (!affiliateLink) return;

    const encodedLink = encodeURIComponent(affiliateLink);
    const encodedText = encodeURIComponent(shareText);

    let url = '';
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedLink}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedLink}`;
        break;
      case 'email':
        url = `mailto:?subject=${encodeURIComponent(`Great eSIM Deal: ${product.name}`)}&body=${encodedText}%0A%0A${encodedLink}`;
        break;
    }

    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share & Earn</DialogTitle>
          <DialogDescription>
            Share this product and earn commissions on every sale
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !affiliateCode ? (
          <div className="space-y-4">
            <div className="bg-primary/5 p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">Get Your Affiliate Link</p>
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
                <span className="font-bold text-primary">${product.price_usd.toFixed(2)}</span>
              </div>
            </div>

            {/* Affiliate Link */}
            <div className="space-y-2">
              <Label htmlFor="affiliate-link">Your Affiliate Link</Label>
              <div className="flex gap-2">
                <Input
                  id="affiliate-link"
                  value={affiliateLink}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button onClick={copyLink} size="icon" variant="outline">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Share Message */}
            <div className="space-y-2">
              <Label htmlFor="share-message">Share Message</Label>
              <Textarea
                id="share-message"
                value={shareText}
                readOnly
                rows={3}
                className="text-sm"
              />
            </div>

            {/* Social Share Buttons */}
            <div className="space-y-2">
              <Label>Share via</Label>
              <div className="grid grid-cols-4 gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => shareVia('facebook')}
                  className="h-12"
                >
                  <Facebook className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => shareVia('twitter')}
                  className="h-12"
                >
                  <Twitter className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => shareVia('linkedin')}
                  className="h-12"
                >
                  <Linkedin className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => shareVia('email')}
                  className="h-12"
                >
                  <Mail className="h-5 w-5" />
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
