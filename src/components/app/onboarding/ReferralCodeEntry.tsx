import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, ChevronRight, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';
import { useAffiliateTracking } from '@/hooks/useAffiliateTracking';
import { supabase } from '@/integrations/supabase/client';

interface ReferralCodeEntryProps {
  onContinue: (code: string | null) => void;
  onSkip: () => void;
}

export const ReferralCodeEntry: React.FC<ReferralCodeEntryProps> = ({
  onContinue,
  onSkip,
}) => {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { mediumTap, success, lightTap } = useHaptics();
  const { referralCode: existingCode, setReferralCode } = useAffiliateTracking();

  // Pre-fill if user came via referral link
  useEffect(() => {
    if (existingCode) {
      setCode(existingCode);
      setIsValid(true);
    }
  }, [existingCode]);

  const validateCode = async (inputCode: string) => {
    if (!inputCode.trim()) {
      setIsValid(null);
      setError(null);
      return;
    }

    setIsValidating(true);
    setError(null);
    
    try {
      // Check if the referral code exists by username OR affiliate_code
      const { data, error: queryError } = await supabase
        .from('affiliates_safe')
        .select('id, username')
        .or(`username.eq.${inputCode.toLowerCase().trim()},affiliate_code.eq.${inputCode.toLowerCase().trim()}`)
        .eq('status', 'active')
        .maybeSingle();

      if (queryError) throw queryError;

      if (data) {
        setIsValid(true);
        success();
        // Store the code
        setReferralCode(inputCode.toLowerCase().trim());
      } else {
        setIsValid(false);
        setError('Invalid referral code');
        lightTap();
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
    setCode(value);
    setIsValid(null);
    setError(null);
    
    // Debounce validation
    if (value.length >= 3) {
      const timer = setTimeout(() => validateCode(value), 500);
      return () => clearTimeout(timer);
    }
  };

  const handleContinue = () => {
    mediumTap();
    onContinue(isValid ? code : null);
  };

  const handleSkip = () => {
    lightTap();
    onSkip();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center px-6 py-8 min-h-full"
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="mb-6"
      >
        <div className="w-20 h-20 rounded-2xl bg-accent/20 flex items-center justify-center">
          <Gift className="w-10 h-10 text-accent" strokeWidth={1.5} />
        </div>
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-bold text-foreground text-center mb-2"
      >
        Got a Referral Code?
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="text-sm text-muted-foreground text-center mb-8 max-w-[280px]"
      >
        Enter your friend's username to earn bonus points together!
      </motion.p>

      {/* Input field */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-[320px] mb-6"
      >
        <div className="relative">
          <input
            type="text"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder="Enter username"
            className={cn(
              "w-full h-14 px-4 pr-12 rounded-xl",
              "bg-card border-2 transition-colors",
              "text-foreground placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-0",
              isValid === true && "border-success",
              isValid === false && "border-destructive",
              isValid === null && "border-border focus:border-primary"
            )}
          />
          
          {/* Status indicator */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {isValidating && (
              <motion.div
                className="w-5 h-5 border-2 border-muted-foreground/30 border-t-primary rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            )}
            {!isValidating && isValid === true && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-6 h-6 rounded-full bg-success flex items-center justify-center"
              >
                <Check className="w-4 h-4 text-background" />
              </motion.div>
            )}
            {!isValidating && isValid === false && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-6 h-6 rounded-full bg-destructive flex items-center justify-center"
              >
                <X className="w-4 h-4 text-background" />
              </motion.div>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-destructive mt-2 ml-1"
          >
            {error}
          </motion.p>
        )}

        {/* Success message */}
        {isValid && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-success mt-2 ml-1"
          >
            ✓ You'll both earn 50 bonus points!
          </motion.p>
        )}
      </motion.div>

      {/* Bonus info card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-[320px] p-4 rounded-xl bg-accent/10 border border-accent/20 mb-8"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
            <span className="text-lg">🎁</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Referral Bonus</p>
            <p className="text-xs text-muted-foreground">
              Both you and your friend earn 50 points + 5% ongoing commission
            </p>
          </div>
        </div>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-[320px] space-y-3"
      >
        <button
          onClick={handleContinue}
          className={cn(
            "w-full h-12 rounded-xl font-semibold text-sm",
            "flex items-center justify-center gap-2",
            "active:scale-[0.98] transition-transform",
            isValid 
              ? "bg-accent text-accent-foreground" 
              : "bg-card border border-border text-foreground"
          )}
        >
          {isValid ? 'Apply Code & Continue' : 'Continue Without Code'}
          <ChevronRight className="w-4 h-4" />
        </button>

        {!isValid && code.length > 0 && (
          <button
            onClick={handleSkip}
            className="w-full h-10 rounded-xl font-medium text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for Now
          </button>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ReferralCodeEntry;
