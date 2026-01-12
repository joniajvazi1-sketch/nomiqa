import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ChevronRight, Wifi, Signal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';
import { TOKENOMICS } from '@/utils/tokenomics';

interface WelcomeBonusProps {
  referralApplied: boolean;
  onComplete: () => void;
}

export const WelcomeBonus: React.FC<WelcomeBonusProps> = ({
  referralApplied,
  onComplete,
}) => {
  const [displayedPoints, setDisplayedPoints] = useState(0);
  const [showSignal, setShowSignal] = useState(false);
  const { success } = useHaptics();

  const totalBonus = referralApplied 
    ? TOKENOMICS.WELCOME_BONUS_POINTS + TOKENOMICS.REFERRAL_BONUS_POINTS 
    : TOKENOMICS.WELCOME_BONUS_POINTS;

  // Animate points counter
  useEffect(() => {
    const duration = 1500;
    const steps = 30;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easedProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      setDisplayedPoints(Math.round(totalBonus * easedProgress));

      if (currentStep >= steps) {
        clearInterval(interval);
        success();
        setTimeout(() => setShowSignal(true), 300);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [totalBonus, success]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center px-6 py-8 min-h-full"
    >
      {/* Confetti-like particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${20 + Math.random() * 60}%`,
              background: i % 3 === 0 
                ? 'hsl(var(--primary))' 
                : i % 3 === 1 
                  ? 'hsl(var(--accent))' 
                  : 'hsl(var(--secondary))',
            }}
            initial={{ 
              y: -20, 
              opacity: 0,
              scale: 0.5,
            }}
            animate={{ 
              y: ['0%', '100%'],
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{ 
              duration: 2 + Math.random() * 2,
              delay: 0.5 + Math.random() * 1,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>

      {/* Celebration icon */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
        className="mb-6 relative"
      >
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
          <Sparkles className="w-12 h-12 text-primary-foreground" strokeWidth={1.5} />
        </div>
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 rounded-3xl bg-primary/30 blur-xl -z-10"
          animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-2xl font-bold text-foreground text-center mb-2"
      >
        You're All Set!
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="text-sm text-muted-foreground text-center mb-6"
      >
        Here's your welcome bonus 🎉
      </motion.p>

      {/* Points display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
        className="mb-8"
      >
        <div className="relative">
          <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary">
            +{displayedPoints}
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="text-sm text-muted-foreground text-center mt-1"
          >
            points added to your balance
          </motion.p>
        </div>
      </motion.div>

      {/* Bonus breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-[320px] space-y-2 mb-6"
      >
        <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎁</span>
            <span className="text-sm text-foreground">Welcome Bonus</span>
          </div>
          <span className="text-sm font-semibold text-primary">+{TOKENOMICS.WELCOME_BONUS_POINTS}</span>
        </div>
        
        {referralApplied && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="flex items-center justify-between p-3 rounded-xl bg-accent/10 border border-accent/20"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">👥</span>
              <span className="text-sm text-foreground">Referral Bonus</span>
            </div>
            <span className="text-sm font-semibold text-accent">+{TOKENOMICS.REFERRAL_BONUS_POINTS}</span>
          </motion.div>
        )}
      </motion.div>

      {/* Live signal indicator */}
      {showSignal && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[320px] p-4 rounded-xl bg-card border border-border mb-8"
        >
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Signal className="w-5 h-5 text-success" />
            </motion.div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Wifi className="w-3 h-3 text-success" />
                <span className="text-xs text-success font-medium">LIVE</span>
              </div>
              <p className="text-sm font-medium text-foreground">
                You're already earning!
              </p>
              <p className="text-xs text-muted-foreground">
                Signal quality is being recorded
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Continue button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8 }}
        className="w-full max-w-[320px]"
      >
        <button
          onClick={onComplete}
          className={cn(
            "w-full h-12 rounded-xl font-semibold text-sm",
            "flex items-center justify-center gap-2",
            "bg-primary text-primary-foreground",
            "active:scale-[0.98] transition-transform"
          )}
        >
          Start Earning
          <ChevronRight className="w-4 h-4" />
        </button>
      </motion.div>
    </motion.div>
  );
};

export default WelcomeBonus;
