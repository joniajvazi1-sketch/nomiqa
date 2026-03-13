import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronRight, Users, Sparkles, Gift, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PostSignupSuccessProps {
  username: string;
  onContinue: () => void;
}

export const PostSignupSuccess = memo(({ username, onContinue }: PostSignupSuccessProps) => {
  const navigate = useNavigate();
  const [referralCode, setReferralCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  const validateCode = async (inputCode: string) => {
    if (!inputCode.trim()) {
      setIsValid(null);
      setError(null);
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('affiliates_safe')
        .select('id, username')
        .eq('username', inputCode.toLowerCase().trim())
        .eq('status', 'active')
        .maybeSingle();

      if (queryError) throw queryError;

      if (data) {
        // Check it's not self-referral
        if (data.username?.toLowerCase() === username.toLowerCase()) {
          setIsValid(false);
          setError("You can't refer yourself");
          return;
        }
        setIsValid(true);
      } else {
        // Also check by affiliate_code
        const { data: codeData } = await supabase
          .from('affiliates_safe')
          .select('id, username')
          .eq('affiliate_code', inputCode.toLowerCase().trim())
          .eq('status', 'active')
          .maybeSingle();

        if (codeData) {
          if (codeData.username?.toLowerCase() === username.toLowerCase()) {
            setIsValid(false);
            setError("You can't refer yourself");
            return;
          }
          setIsValid(true);
        } else {
          setIsValid(false);
          setError('Invalid referral code');
        }
      }
    } catch (err) {
      console.error('Code validation error:', err);
      setIsValid(false);
      setError('Unable to verify code');
    } finally {
      setIsValidating(false);
    }
  };

  const handleCodeChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setReferralCode(sanitized);
    setIsValid(null);
    setError(null);

    if (sanitized.length >= 3) {
      const timer = setTimeout(() => validateCode(sanitized), 500);
      return () => clearTimeout(timer);
    }
  };

  const handleApplyCode = async () => {
    if (!isValid || !referralCode.trim()) return;

    try {
      const { error } = await supabase.functions.invoke('apply-referral-code', {
        body: { referralCode: referralCode.trim() },
      });

      if (error) throw error;

      setApplied(true);
      toast.success('Referral code applied! You both earn bonus points 🎉');
    } catch (err: any) {
      console.error('Error applying referral code:', err);
      toast.error(err.message || 'Failed to apply referral code');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 flex items-center justify-center mb-6"
        >
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </motion.div>

        {/* Welcome Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-black text-foreground mb-2">
            You're In, {username}! 🎉
          </h1>
          <p className="text-muted-foreground">
            Welcome to the Nomiqa network. Let's get you started.
          </p>
        </motion.div>

        {/* Referral Code Entry */}
        {!applied && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-6"
          >
            <div className="rounded-2xl bg-card border border-border p-5">
              <div className="flex items-center gap-2 mb-3">
                <Gift className="w-5 h-5 text-accent" />
                <span className="font-bold text-foreground">Got a Referral Code?</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Enter your friend's username to earn bonus points together!
              </p>

              <div className="relative mb-3">
                <Input
                  type="text"
                  value={referralCode}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  placeholder="Enter username or code"
                  className={cn(
                    "pr-12",
                    isValid === true && "border-green-500 focus-visible:ring-green-500",
                    isValid === false && "border-destructive focus-visible:ring-destructive"
                  )}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isValidating && (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                  {!isValidating && isValid === true && (
                    <Check className="w-4 h-4 text-green-500" />
                  )}
                  {!isValidating && isValid === false && (
                    <X className="w-4 h-4 text-destructive" />
                  )}
                </div>
              </div>

              {error && (
                <p className="text-xs text-destructive mb-3">{error}</p>
              )}
              {isValid && (
                <p className="text-xs text-green-600 dark:text-green-400 mb-3">
                  ✓ You'll both earn 50 bonus points!
                </p>
              )}

              <Button
                onClick={handleApplyCode}
                disabled={!isValid || isValidating}
                className="w-full"
                size="sm"
              >
                Apply Referral Code
              </Button>
            </div>
          </motion.div>
        )}

        {applied && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 rounded-2xl bg-green-500/10 border border-green-500/30 text-center"
          >
            <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="font-semibold text-foreground">Referral Code Applied!</p>
            <p className="text-sm text-muted-foreground">You and your friend both earned 50 bonus points</p>
          </motion.div>
        )}

        {/* Your Referral Code Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-card to-accent/10 border border-primary/30 p-6">
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-primary" />
                <span className="font-bold text-primary">Your Referral Code</span>
              </div>

              <div className="bg-background/60 rounded-xl p-4 mb-4 text-center">
                <p className="text-2xl font-bold font-mono text-primary">{username}</p>
                <p className="text-xs text-muted-foreground mt-1">Share this code with friends</p>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Friends enter your code when they sign up → you both earn bonus points!
              </p>

              <Button 
                onClick={() => {
                  navigator.clipboard.writeText(username);
                  toast.success('Referral code copied!');
                }}
                className="w-full gap-2 bg-primary hover:bg-primary/90"
              >
                <Users className="w-4 h-4" />
                Copy Your Code
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button 
            onClick={onContinue}
            variant="outline"
            className="w-full gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Continue to Dashboard
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
});

PostSignupSuccess.displayName = 'PostSignupSuccess';
