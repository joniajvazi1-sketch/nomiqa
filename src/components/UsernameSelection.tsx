import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, User, CheckCircle2, XCircle, Gift } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { z } from "zod";
import { useAffiliateTracking } from "@/hooks/useAffiliateTracking";

interface UsernameSelectionProps {
  userId: string;
  email: string;
  onComplete: () => void;
}

const usernameSchema = z.string()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be less than 20 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed");

export function UsernameSelection({ userId, email, onComplete }: UsernameSelectionProps) {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pre-fill referral code from store/URL
  useEffect(() => {
    const { referralCode: storedCode } = useAffiliateTracking.getState();
    if (storedCode) {
      setReferralCode(storedCode);
    } else {
      const urlParams = new URLSearchParams(window.location.search);
      const urlRef = urlParams.get('ref');
      if (urlRef) setReferralCode(urlRef);
    }
  }, []);

  const checkUsername = async (value: string) => {
    if (value.length < 3) {
      setIsAvailable(null);
      return;
    }

    // Validate format first
    const result = usernameSchema.safeParse(value);
    if (!result.success) {
      setError(result.error.errors[0].message);
      setIsAvailable(false);
      return;
    }

    setChecking(true);
    setError(null);

    try {
      // Using _safe view for username check
      const { data, error: queryError } = await supabase
        .from('profiles_safe')
        .select('id')
        .eq('username', value.toLowerCase())
        .maybeSingle();

      if (queryError) throw queryError;

      setIsAvailable(!data);
      if (data) {
        setError("Username is already taken");
      }
    } catch (err) {
      console.error('Error checking username:', err);
      setIsAvailable(null);
    } finally {
      setChecking(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '');
    setUsername(sanitized);
    setError(null);
    setIsAvailable(null);

    // Debounced check
    const timeoutId = setTimeout(() => checkUsername(sanitized), 500);
    return () => clearTimeout(timeoutId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = usernameSchema.safeParse(username);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    if (!isAvailable) {
      toast.error("Please choose an available username");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ username: username.toLowerCase() })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // Apply referral code if entered
      if (referralCode.trim()) {
        try {
          await supabase.functions.invoke('apply-referral-code', {
            body: { referralCode: referralCode.trim() }
          });
          console.log('Referral code applied:', referralCode.trim());
          // Clear stored referral code
          useAffiliateTracking.getState().clearReferralCode();
        } catch (refErr) {
          console.error('Failed to apply referral code:', refErr);
          // Don't block the flow
        }
      }

      toast.success("Username set successfully!");
      onComplete();
    } catch (err: any) {
      console.error('Error setting username:', err);
      toast.error(err.message || "Failed to set username");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-card backdrop-blur-xl border-border shadow-2xl overflow-hidden animate-fade-in">
      <CardHeader className="text-center pb-4 pt-8">
        <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <User className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl md:text-3xl font-black text-foreground mb-2">
          {t("chooseUsername") || "Choose Your Username"}
        </CardTitle>
        <CardDescription className="text-sm md:text-base text-muted-foreground">
          {t("usernameDescription") || "Pick a unique username for your account"}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">{t("username") || "Username"}</Label>
            <div className="relative">
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="your_username"
                className="pr-10"
                maxLength={20}
                autoComplete="off"
                autoFocus
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {checking && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                {!checking && isAvailable === true && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                {!checking && isAvailable === false && <XCircle className="h-4 w-4 text-red-500" />}
              </div>
            </div>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            {isAvailable && !error && (
              <p className="text-sm text-green-500">Username is available!</p>
            )}
            <p className="text-xs text-muted-foreground">
              3-20 characters, letters, numbers, and underscores only
            </p>
          </div>

          {/* Referral Code (optional) */}
          <div className="space-y-2">
            <Label htmlFor="referralCode">
              {t("referralCode") || "Referral Code"} <span className="text-muted-foreground font-normal">({t("optional") || "optional"})</span>
            </Label>
            <div className="relative">
              <Gift className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="referralCode"
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.trim())}
                placeholder={t("enterReferralCode") || "Enter referral code"}
                className="pl-10"
                maxLength={50}
                autoComplete="off"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-medium rounded-xl transition-all duration-300 hover:scale-105"
            disabled={loading || !isAvailable || !!error}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t("saving") || "Saving..."}
              </>
            ) : (
              t("continue") || "Continue"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
