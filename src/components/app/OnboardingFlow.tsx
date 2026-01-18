import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { 
  Signal, 
  Coins, 
  ArrowRight,
  LogIn,
  UserPlus,
  MapPin,
  Users,
  Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHaptics } from '@/hooks/useHaptics';
import { cn } from '@/lib/utils';

interface OnboardingFlowProps {
  onComplete: () => void;
}

interface OnboardingSlide {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    icon: <Signal className="w-8 h-8 text-white" />,
    iconBg: 'from-primary to-primary/70',
    title: 'Tap Scan to Start',
    subtitle: 'Begin contributing network data with one tap'
  },
  {
    icon: <MapPin className="w-8 h-8 text-white" />,
    iconBg: 'from-green-500 to-green-600',
    title: 'Walk Normally',
    subtitle: 'Earn points passively as you go about your day'
  },
  {
    icon: <Users className="w-8 h-8 text-white" />,
    iconBg: 'from-violet-500 to-violet-600',
    title: 'Invite Friends',
    subtitle: 'Get bonus points for every friend who joins'
  },
  {
    icon: <Globe className="w-8 h-8 text-white" />,
    iconBg: 'from-cyan-500 to-cyan-600',
    title: 'Improve Coverage',
    subtitle: 'Help build better network maps for everyone'
  }
];

const SWIPE_THRESHOLD = 50;

/**
 * Horizontal swipe carousel onboarding - NO vertical scrolling
 * Only swipe left/right with dots indicator
 */
export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const navigate = useNavigate();
  const { mediumTap, success } = useHaptics();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isLastSlide = currentSlide === SLIDES.length - 1;

  // Prevent all vertical scrolling on this component
  useEffect(() => {
    const preventScroll = (e: TouchEvent) => {
      // Allow horizontal swipes, prevent vertical
      if (containerRef.current?.contains(e.target as Node)) {
        e.preventDefault();
      }
    };

    // Disable body scroll
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';

    document.addEventListener('touchmove', preventScroll, { passive: false });
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.removeEventListener('touchmove', preventScroll);
    };
  }, []);

  const goToSlide = (index: number) => {
    mediumTap();
    setCurrentSlide(Math.max(0, Math.min(index, SLIDES.length - 1)));
  };

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      goToSlide(currentSlide + 1);
    }
  };

  const handleSwipe = (info: PanInfo) => {
    if (Math.abs(info.offset.x) > SWIPE_THRESHOLD) {
      if (info.offset.x > 0 && currentSlide > 0) {
        // Swipe right - go back
        goToSlide(currentSlide - 1);
      } else if (info.offset.x < 0 && currentSlide < SLIDES.length - 1) {
        // Swipe left - go forward
        goToSlide(currentSlide + 1);
      }
    }
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

  const handleSkip = () => {
    success();
    localStorage.setItem('hasSeenOnboarding', 'true');
    onComplete();
  };

  const slide = SLIDES[currentSlide];

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background touch-none select-none"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        height: '100dvh',
        overflow: 'hidden'
      }}
    >
      {/* Skip button - top left */}
      <div 
        className="absolute top-0 left-0 right-0 z-20 px-5 flex justify-between items-center"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      >
        <button
          onClick={handleSkip}
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          Skip
        </button>
        
        {/* Dots indicator */}
        <div className="flex gap-2">
          {SLIDES.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === currentSlide 
                  ? "bg-primary w-6" 
                  : "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
        
        {/* Spacer for balance */}
        <div className="w-10" />
      </div>

      {/* Swipeable content area */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        style={{ 
          top: 'calc(env(safe-area-inset-top, 0px) + 60px)',
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 180px)'
        }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => handleSwipe(info)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex flex-col items-center text-center px-8"
          >
            {/* Icon */}
            <div className="relative mb-8">
              <div className={cn(
                "w-24 h-24 rounded-3xl flex items-center justify-center",
                "bg-gradient-to-br shadow-2xl",
                slide.iconBg
              )}>
                {slide.icon}
              </div>
              
              {/* Decorative ring */}
              <div className="absolute -inset-3 rounded-[2rem] border-2 border-primary/20 animate-pulse" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-foreground mb-3">
              {slide.title}
            </h1>

            {/* Subtitle */}
            <p className="text-base text-muted-foreground max-w-[280px]">
              {slide.subtitle}
            </p>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Bottom controls */}
      <div 
        className="absolute bottom-0 left-0 right-0 px-5"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
      >
        {isLastSlide ? (
          // Last slide: Show Register / Login CTAs
          <div className="space-y-3">
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

            <p className="text-center text-xs text-muted-foreground pt-1">
              By continuing, you agree to our Terms of Service
            </p>
          </div>
        ) : (
          // Not last slide: Show Next button
          <button
            onClick={handleNext}
            className={cn(
              "w-full h-14 rounded-2xl font-bold text-lg",
              "flex items-center justify-center gap-2",
              "bg-primary text-primary-foreground",
              "shadow-lg shadow-primary/30",
              "active:scale-[0.98] transition-all"
            )}
          >
            Next
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default OnboardingFlow;
