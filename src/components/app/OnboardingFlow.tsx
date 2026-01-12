import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { 
  Signal, 
  Coins, 
  Lock,
  ChevronRight,
  MapPin,
  Smartphone
} from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { cn } from '@/lib/utils';

interface OnboardingFlowProps {
  onComplete: () => void;
}

interface OnboardingSlide {
  id: number;
  icon: React.ElementType;
  title: string;
  description: string;
  accentColor: string;
}

// Competitor-inspired: 3 slides max, value prop first
const slides: OnboardingSlide[] = [
  {
    id: 1,
    icon: Signal,
    title: 'Turn Your Signal Into Rewards',
    description: 'Contribute network data while you travel. Earn points. Redeem for eSIMs.',
    accentColor: 'text-primary'
  },
  {
    id: 2,
    icon: Smartphone,
    title: "It's This Simple",
    description: '1. Open app  2. Connect to cellular  3. Earn automatically',
    accentColor: 'text-green-400'
  },
  {
    id: 3,
    icon: Lock,
    title: 'Your Privacy Matters',
    description: 'Location maps coverage, not you. Data is anonymized. Never sold.',
    accentColor: 'text-blue-400'
  }
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [currentIndex, setCurrentIndex] = useState(0);
  const { mediumTap, lightTap, success } = useHaptics();

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) {
      emblaApi.scrollTo(index);
    }
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const index = emblaApi.selectedScrollSnap();
    setCurrentIndex(index);
    lightTap();
  }, [emblaApi, lightTap]);

  React.useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  const handleNext = () => {
    mediumTap();
    if (currentIndex < slides.length - 1) {
      scrollTo(currentIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    lightTap();
    handleComplete();
  };

  const handleComplete = () => {
    success();
    localStorage.setItem('hasSeenOnboarding', 'true');
    onComplete();
  };

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background"
    >
      {/* Skip button - small text link */}
      <div className="absolute top-0 left-0 right-0 z-10 px-4 pt-12">
        <button
          onClick={handleSkip}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Carousel */}
      <div 
        className="h-full flex flex-col"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex-1 overflow-hidden" ref={emblaRef}>
          <div className="flex h-full">
            {slides.map((slide, index) => {
              const Icon = slide.icon;
              return (
                <div 
                  key={slide.id} 
                  className="flex-[0_0_100%] min-w-0 flex flex-col items-center justify-center px-8"
                >
                  {/* Simple Icon */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ 
                      scale: currentIndex === index ? 1 : 0.8,
                      opacity: currentIndex === index ? 1 : 0.5
                    }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="mb-8"
                  >
                    <div className={cn(
                      "w-20 h-20 rounded-2xl flex items-center justify-center",
                      "bg-card border border-border"
                    )}>
                      <Icon className={cn("w-10 h-10", slide.accentColor)} strokeWidth={1.5} />
                    </div>
                  </motion.div>

                  {/* Text content - clean and minimal */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ 
                      opacity: currentIndex === index ? 1 : 0.3,
                      y: currentIndex === index ? 0 : 20
                    }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                    className="text-center max-w-[300px]"
                  >
                    <h2 className="text-2xl font-bold text-foreground mb-3 leading-tight">
                      {slide.title}
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {slide.description}
                    </p>
                  </motion.div>
                </div>
              );
            })}
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
                  currentIndex === index 
                    ? "w-6 bg-primary" 
                    : "w-2 bg-muted"
                )}
              />
            ))}
          </div>

          {/* Action button - solid, no glow */}
          <button
            onClick={handleNext}
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
      </div>
    </motion.div>
  );
};

export default OnboardingFlow;
