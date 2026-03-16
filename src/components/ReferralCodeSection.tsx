import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Loader2, Gift, X, Pencil } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReferralCodeSectionProps {
  username: string;
}

export const ReferralCodeSection = ({ username }: ReferralCodeSectionProps) => {
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [hasReferral, setHasReferral] = useState(false);
  const [applyCode, setApplyCode] = useState('');
  const [applyError, setApplyError] = useState('');
  const [applying, setApplying] = useState(false);
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [savingCode, setSavingCode] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get affiliate code
      const { data: affiliate } = await supabase
        .from('affiliates_safe')
        .select('affiliate_code, username')
        .eq('user_id', user.id)
        .maybeSingle();

      if (affiliate) {
        setAffiliateCode(affiliate.affiliate_code || affiliate.username);
      }

      // Check if user already has a referral
      const { data: checkData } = await supabase.functions.invoke('apply-referral-code', {
        body: { checkOnly: true },
      });

      if (checkData?.hasReferral) {
        setHasReferral(true);
      }
    } catch (err) {
      console.error('Error loading referral data:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (affiliateCode) {
      navigator.clipboard.writeText(affiliateCode);
      setCopied(true);
      toast.success("Referral code copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const validateApplyCode = async (code: string) => {
    if (!code.trim() || code.length < 3) {
      setIsValid(null);
      setApplyError('');
      return;
    }

    setIsValidating(true);
    setApplyError('');
    try {
      const { data } = await supabase
        .from('affiliates_safe')
        .select('id, username')
        .or(`username.eq.${code.toLowerCase().trim()},affiliate_code.eq.${code.toLowerCase().trim()}`)
        .eq('status', 'active')
        .maybeSingle();

      if (data) {
        if (data.username?.toLowerCase() === username.toLowerCase()) {
          setIsValid(false);
          setApplyError("You can't refer yourself");
        } else {
          setIsValid(true);
        }
      } else {
        setIsValid(false);
        setApplyError('Invalid referral code');
      }
    } catch {
      setIsValid(false);
      setApplyError('Unable to verify code');
    } finally {
      setIsValidating(false);
    }
  };

  const handleApplyCode = async () => {
    if (!isValid || !applyCode.trim()) return;
    setApplying(true);
    try {
      const { error } = await supabase.functions.invoke('apply-referral-code', {
        body: { referralCode: applyCode.trim() },
      });
      if (error) throw error;
      setHasReferral(true);
      toast.success('Referral code applied! You both earn bonus points 🎉');
    } catch (err: any) {
      toast.error(err.message || 'Failed to apply referral code');
    } finally {
      setApplying(false);
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
        body: { referralCode: newCode.trim() },
      });
      // Extract error from response body
      const errMsg = data?.error || (error ? await error?.context?.json?.().then((b: any) => b?.error).catch(() => null) : null);
      if (errMsg) {
        setCodeError(errMsg === 'Referral code already taken' ? 'This code is already taken, please choose another' : errMsg);
        return;
      }
      if (error) throw error;
      toast.success('Referral code updated!');
      setIsEditingCode(false);
      setAffiliateCode(newCode.trim());
    } catch (err: any) {
      setCodeError(err.message || 'Failed to update code');
    } finally {
      setSavingCode(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Your Referral Code */}
      {affiliateCode && (
        <div className="p-5 rounded-xl bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Your Referral Code
          </h3>

          {!isEditingCode ? (
            <div className="text-center">
              <p className="text-3xl font-bold font-mono text-primary tracking-wider mb-2">
                {affiliateCode}
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
                  onClick={() => { setNewCode(affiliateCode); setIsEditingCode(true); }} 
                  variant="outline" 
                  size="sm"
                >
                  <Pencil className="h-4 w-4 mr-1" /> Change
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">⚠️ You can only change your referral code once</p>
              <Input
                value={newCode}
                onChange={(e) => { setNewCode(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')); setCodeError(''); }}
                placeholder="New referral code"
                className="font-mono"
              />
              {codeError && <p className="text-xs text-destructive">{codeError}</p>}
              <div className="flex gap-2">
                <Button onClick={handleChangeCode} disabled={savingCode} size="sm" className="flex-1">
                  {savingCode ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                  Save
                </Button>
                <Button onClick={() => { setIsEditingCode(false); setCodeError(''); }} variant="outline" size="sm">
                  <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Apply Someone's Referral Code */}
      {!hasReferral && (
        <div className="p-5 rounded-xl bg-card border border-border">
          <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <Gift className="w-5 h-5 text-accent" />
            Apply a Referral Code
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Enter a friend's username to earn bonus points together
          </p>
          <div className="relative mb-3">
            <Input
              value={applyCode}
              onChange={(e) => {
                const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                setApplyCode(val);
                setIsValid(null);
                setApplyError('');
                if (val.length >= 3) {
                  setTimeout(() => validateApplyCode(val), 500);
                }
              }}
              placeholder="Enter username or code"
              className={cn(
                "pr-10",
                isValid === true && "border-green-500",
                isValid === false && "border-destructive"
              )}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isValidating && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              {!isValidating && isValid === true && <Check className="w-4 h-4 text-green-500" />}
              {!isValidating && isValid === false && <X className="w-4 h-4 text-destructive" />}
            </div>
          </div>
          {applyError && <p className="text-xs text-destructive mb-2">{applyError}</p>}
          {isValid && <p className="text-xs text-green-600 dark:text-green-400 mb-2">✓ You'll both earn 50 bonus points!</p>}
          <Button onClick={handleApplyCode} disabled={!isValid || applying} size="sm" className="w-full">
            {applying ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Apply Referral Code
          </Button>
        </div>
      )}

      {hasReferral && (
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
          <p className="text-xs text-green-700 dark:text-green-400">✓ Referral code applied</p>
        </div>
      )}
    </div>
  );
};
