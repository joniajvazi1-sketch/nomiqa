import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, LogIn, UserPlus, Signal, MapPin, Users, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHaptics } from '@/hooks/useHaptics';
import { cn } from '@/lib/utils';
import FullscreenPortal from '@/components/app/FullscreenPortal';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface OnboardingFlowProps {
  onComplete: () => void;
}

interface OnboardingSlide {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    icon: <Signal className="w-8 h-8 text-primary-foreground" />,
    title: 'Tap Scan to Start',
    subtitle: 'Begin contributing network data with one tap',
  },
  {
    icon: <MapPin className="w-8 h-8 text-primary-foreground" />,
    title: 'Walk Normally',
    subtitle: 'Contribute data automatically as you go about your day',
  },
  {
    icon: <Users className="w-8 h-8 text-primary-foreground" />,
    title: 'Invite Contributors',
    subtitle: 'Share in the value your network helps create',
  },
  {
    icon: <Globe className="w-8 h-8 text-primary-foreground" />,
    title: 'Improve Coverage',
    subtitle: 'Help build better network maps for everyone',
  },
];

/**
 * First-install onboarding:
 * - Full-screen standalone overlay (portaled to <body>)
 * - No vertical scrolling/bounce
 * - Controls: LEFT = Skip, RIGHT = Next
 */
export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const navigate = useNavigate();
  const { mediumTap, success } = useHaptics();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  const isLastSlide = currentSlide === SLIDES.length - 1;
  const slide = SLIDES[currentSlide];

  // Lock background scroll while onboarding is mounted
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevPosition = document.body.style.position;
    const prevWidth = document.body.style.width;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.position = prevPosition;
      document.body.style.width = prevWidth;
    };
  }, []);

  const goToSlide = (index: number) => {
    mediumTap();
    setCurrentSlide(Math.max(0, Math.min(index, SLIDES.length - 1)));
  };

  const handleNext = () => {
    if (!isLastSlide) goToSlide(currentSlide + 1);
  };

  const handleSkip = () => {
    success();
    localStorage.setItem('hasSeenOnboarding', 'true');
    onComplete();
  };

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

  return (
    <FullscreenPortal>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-background select-none"
        style={{
          height: '100dvh',
          overflow: 'hidden',
          overscrollBehavior: 'none',
          touchAction: 'none',
        }}
      >
        {/* Top: dots */}
        <div
          className="absolute top-0 left-0 right-0 z-20 px-5 flex justify-center"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
        >
          <div className="flex gap-2">
            {SLIDES.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  index === currentSlide ? 'bg-primary w-6' : 'bg-muted-foreground/30 w-2'
                )}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Center content */}
        <div
          className="absolute inset-0 flex items-center justify-center px-8"
          style={{
            top: 'calc(env(safe-area-inset-top, 0px) + 52px)',
            bottom: 'calc(env(safe-area-inset-bottom, 0px) + 140px)',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex flex-col items-center text-center"
            >
              <div className="relative mb-8">
                <div
                  className={cn(
                    'w-24 h-24 rounded-3xl flex items-center justify-center',
                    'bg-gradient-primary shadow-2xl'
                  )}
                >
                  {slide.icon}
                </div>
                <div className="absolute -inset-3 rounded-[2rem] border-2 border-primary/20 animate-pulse" />
              </div>

              <h1 className="text-2xl font-bold text-foreground mb-3">{slide.title}</h1>
              <p className="text-base text-muted-foreground max-w-[280px]">{slide.subtitle}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom controls */}
        <div
          className="absolute bottom-0 left-0 right-0 px-5"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
        >
          {isLastSlide ? (
            <div className="space-y-3">
              <button
                onClick={handleSignUp}
                disabled={isNavigating}
                className={cn(
                  'w-full h-14 rounded-2xl font-bold text-lg',
                  'flex items-center justify-center gap-3',
                  'bg-primary text-primary-foreground',
                  'shadow-lg shadow-primary/30',
                  'active:scale-[0.98] transition-all',
                  isNavigating && 'opacity-70'
                )}
              >
                <UserPlus className="w-5 h-5" />
                Create Account
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={handleLogin}
                disabled={isNavigating}
                className={cn(
                  'w-full h-14 rounded-2xl font-bold text-lg',
                  'flex items-center justify-center gap-3',
                  'bg-card border-2 border-border text-foreground',
                  'active:scale-[0.98] transition-all',
                  isNavigating && 'opacity-70'
                )}
              >
                <LogIn className="w-5 h-5" />
                I Have an Account
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className={cn(
                  'flex-1 h-14 rounded-2xl font-semibold text-base',
                  'bg-card border-2 border-border text-foreground',
                  'active:scale-[0.98] transition-all'
                )}
              >
                Skip
              </button>
              <button
                onClick={handleNext}
                className={cn(
                  'flex-1 h-14 rounded-2xl font-semibold text-base',
                  'bg-primary text-primary-foreground',
                  'shadow-lg shadow-primary/20',
                  'active:scale-[0.98] transition-all'
                )}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </FullscreenPortal>
  );
};

export default OnboardingFlow;

