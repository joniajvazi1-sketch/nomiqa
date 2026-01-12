import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { 
  Signal, 
  Coins, 
  Lock,
  ChevronRight,
  Smartphone,
  ArrowRight
} from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { cn } from '@/lib/utils';
import OnboardingSlide from './onboarding/OnboardingSlide';
import LocationPermissionRequest from './onboarding/LocationPermissionRequest';
import ReferralCodeEntry from './onboarding/ReferralCodeEntry';
import WelcomeBonus from './onboarding/WelcomeBonus';

interface OnboardingFlowProps {
  onComplete: () => void;
}

type OnboardingStep = 
  | 'slides' 
  | 'permissions' 
  | 'referral' 
  | 'welcome';

interface SlideContent {
  id: number;
  icon: React.ElementType;
  iconColor: string;
  title: string;
  description: string;
}

// 3 informational slides - concise and impactful
const slides: SlideContent[] = [
  {
    id: 1,
    icon: Signal,
    iconColor: 'text-primary',
    title: 'Turn Your Signal Into Rewards',
    description: 'Contribute network data while you travel. Earn points. Redeem for eSIMs & tokens.',
  },
  {
    id: 2,
    icon: Smartphone,
    iconColor: 'text-success',
    title: "It's This Simple",
    description: '1. Open app  2. Connect to cellular  3. Earn automatically in the background',
  },
  {
    id: 3,
    icon: Lock,
    iconColor: 'text-secondary',
    title: 'Your Privacy Matters',
    description: 'Location maps coverage, not you. Data is anonymized and never sold.',
  }
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [currentSlide, setCurrentSlide] = useState(0);
  const [step, setStep] = useState<OnboardingStep>('slides');
  const [referralApplied, setReferralApplied] = useState(false);
  const { mediumTap, lightTap, success } = useHaptics();

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) {
      emblaApi.scrollTo(index);
    }
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const index = emblaApi.selectedScrollSnap();
    setCurrentSlide(index);
    lightTap();
  }, [emblaApi, lightTap]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  const handleNextSlide = () => {
    mediumTap();
    if (currentSlide < slides.length - 1) {
      scrollTo(currentSlide + 1);
    } else {
      // Move to permissions step
      setStep('permissions');
    }
  };

  const handleSkipToEnd = () => {
    lightTap();
    setStep('permissions');
  };

  const handlePermissionGranted = () => {
    setStep('referral');
  };

  const handlePermissionSkipped = () => {
    setStep('referral');
  };

  const handleReferralContinue = (code: string | null) => {
    setReferralApplied(!!code);
    setStep('welcome');
  };

  const handleReferralSkip = () => {
    setStep('welcome');
  };

  const handleComplete = () => {
    success();
    localStorage.setItem('hasSeenOnboarding', 'true');
    onComplete();
  };

  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background"
    >
      <AnimatePresence mode="wait">
        {step === 'slides' && (
          <motion.div
            key="slides"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -50 }}
            className="h-full flex flex-col"
            style={{ 
              paddingTop: 'env(safe-area-inset-top, 0px)', 
              paddingBottom: 'env(safe-area-inset-bottom, 0px)' 
            }}
          >
            {/* Skip button */}
            <div className="absolute top-0 left-0 right-0 z-10 px-4 pt-12">
              <button
                onClick={handleSkipToEnd}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip
              </button>
            </div>

            {/* Carousel */}
            <div className="flex-1 overflow-hidden" ref={emblaRef}>
              <div className="flex h-full">
                {slides.map((slide, index) => (
                  <OnboardingSlide
                    key={slide.id}
                    icon={slide.icon}
                    iconColor={slide.iconColor}
                    title={slide.title}
                    description={slide.description}
                    isActive={currentSlide === index}
                  />
                ))}
              </div>
            </div>

            {/* Bottom controls */}
            <div className="px-6 pb-6 space-y-4">
              {/* Pagination dots */}
              <div className="flex items-center justify-center gap-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => { lightTap(); scrollTo(index); }}
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      currentSlide === index 
                        ? "w-6 bg-primary" 
                        : "w-2 bg-muted"
                    )}
                  />
                ))}
              </div>

              {/* Next button */}
              <button
                onClick={handleNextSlide}
                className={cn(
                  "w-full h-12 rounded-xl font-semibold text-sm",
                  "flex items-center justify-center gap-2",
                  "active:scale-[0.98] transition-transform",
                  isLastSlide 
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-foreground"
                )}
              >
                {isLastSlide ? 'Get Started' : 'Next'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 'permissions' && (
          <motion.div
            key="permissions"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="h-full"
            style={{ 
              paddingTop: 'env(safe-area-inset-top, 0px)', 
              paddingBottom: 'env(safe-area-inset-bottom, 0px)' 
            }}
          >
            <LocationPermissionRequest
              onPermissionGranted={handlePermissionGranted}
              onSkip={handlePermissionSkipped}
            />
          </motion.div>
        )}

        {step === 'referral' && (
          <motion.div
            key="referral"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="h-full"
            style={{ 
              paddingTop: 'env(safe-area-inset-top, 0px)', 
              paddingBottom: 'env(safe-area-inset-bottom, 0px)' 
            }}
          >
            <ReferralCodeEntry
              onContinue={handleReferralContinue}
              onSkip={handleReferralSkip}
            />
          </motion.div>
        )}

        {step === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="h-full"
            style={{ 
              paddingTop: 'env(safe-area-inset-top, 0px)', 
              paddingBottom: 'env(safe-area-inset-bottom, 0px)' 
            }}
          >
            <WelcomeBonus
              referralApplied={referralApplied}
              onComplete={handleComplete}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OnboardingFlow;
