import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Signal, 
  Coins, 
  ArrowRight,
  LogIn,
  UserPlus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHaptics } from '@/hooks/useHaptics';
import { cn } from '@/lib/utils';

interface OnboardingFlowProps {
  onComplete: () => void;
}

/**
 * Single-page App Intro - Bold headline, prominent Login/Signup buttons
 * No scrolling, no carousel - just impact
 */
export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const navigate = useNavigate();
  const { mediumTap, success } = useHaptics();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleLogin = () => {
    mediumTap();
    setIsNavigating(true);
    localStorage.setItem('hasSeenOnboarding', 'true');
    navigate('/app/auth?mode=login');
  };

  const handleSignUp = () => {
    mediumTap();
    setIsNavigating(true);
    localStorage.setItem('hasSeenOnboarding', 'true');
    navigate('/app/auth?mode=signup');
  };

  const handleSkip = () => {
    success();
    localStorage.setItem('hasSeenOnboarding', 'true');
    onComplete();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background overflow-hidden"
    >
      {/* Opaque background to prevent bleed-through */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-primary/5" />
      
      <div 
        className="relative h-full flex flex-col items-center justify-center px-6 overflow-hidden"
        style={{ 
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)', 
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' 
        }}
      >
        {/* Skip button - top left, positioned absolutely */}
        <div 
          className="absolute top-0 left-0 right-0 z-10 px-6"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}
        >
          <button
            onClick={handleSkip}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for now
          </button>
        </div>

        {/* Icon + Branding - Compact, no extra padding */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center mb-6"
        >
          {/* Animated icon */}
          <div className="relative mb-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-xl shadow-primary/20">
              <Signal className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center shadow-md">
              <Coins className="w-4 h-4 text-white" />
            </div>
          </div>
          
          <h2 className="text-base font-bold text-primary tracking-wide">NOMIQA</h2>
        </motion.div>

        {/* Center: Bold Headline */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center space-y-3 mb-8"
        >
          <h1 className="text-3xl font-extrabold text-foreground leading-tight tracking-tight">
            Turn Your Signal<br />
            <span className="text-primary">Into Rewards</span>
          </h1>
          
          <p className="text-base text-muted-foreground font-medium max-w-[280px] mx-auto">
            Earn points just by carrying your phone. No effort needed.
          </p>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <div className="flex items-center gap-1.5 text-xs text-green-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Privacy First
            </div>
            <div className="flex items-center gap-1.5 text-xs text-green-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Low Battery
            </div>
          </div>
        </motion.div>

        {/* Bottom: Auth Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full space-y-3 max-w-sm"
        >
          {/* Sign Up - Primary CTA */}
          <button
            onClick={handleSignUp}
            disabled={isNavigating}
            className={cn(
              "w-full h-14 rounded-2xl font-bold text-lg",
              "flex items-center justify-center gap-3",
              "bg-primary text-primary-foreground",
              "shadow-lg shadow-primary/30",
              "active:scale-[0.98] transition-all",
              isNavigating && "opacity-70"
            )}
          >
            <UserPlus className="w-5 h-5" />
            Create Account
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* Login - Secondary */}
          <button
            onClick={handleLogin}
            disabled={isNavigating}
            className={cn(
              "w-full h-14 rounded-2xl font-bold text-lg",
              "flex items-center justify-center gap-3",
              "bg-card border-2 border-border text-foreground",
              "hover:border-primary/50 hover:bg-primary/5",
              "active:scale-[0.98] transition-all",
              isNavigating && "opacity-70"
            )}
          >
            <LogIn className="w-5 h-5" />
            I Have an Account
          </button>

          {/* Fine print */}
          <p className="text-center text-xs text-muted-foreground pt-1">
            By continuing, you agree to our Terms of Service
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default OnboardingFlow;
