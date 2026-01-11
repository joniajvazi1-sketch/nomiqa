import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { 
  Signal, 
  ShoppingBag, 
  Gift, 
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { useTranslation } from '@/contexts/TranslationContext';
import { cn } from '@/lib/utils';

interface OnboardingFlowProps {
  onComplete: () => void;
}

interface OnboardingSlide {
  id: number;
  icon: React.ElementType;
  gradient: string;
  titleKey: string;
  descriptionKey: string;
  accentColor: string;
}

const slides: OnboardingSlide[] = [
  {
    id: 1,
    icon: Sparkles,
    gradient: 'from-primary/30 via-neon-cyan/20 to-transparent',
    titleKey: 'app.onboarding.welcome.title',
    descriptionKey: 'app.onboarding.welcome.description',
    accentColor: 'text-neon-cyan'
  },
  {
    id: 2,
    icon: Signal,
    gradient: 'from-green-500/30 via-emerald-500/20 to-transparent',
    titleKey: 'app.onboarding.earn.title',
    descriptionKey: 'app.onboarding.earn.description',
    accentColor: 'text-green-400'
  },
  {
    id: 3,
    icon: ShoppingBag,
    gradient: 'from-blue-500/30 via-indigo-500/20 to-transparent',
    titleKey: 'app.onboarding.shop.title',
    descriptionKey: 'app.onboarding.shop.description',
    accentColor: 'text-blue-400'
  },
  {
    id: 4,
    icon: Gift,
    gradient: 'from-amber-500/30 via-orange-500/20 to-transparent',
    titleKey: 'app.onboarding.rewards.title',
    descriptionKey: 'app.onboarding.rewards.description',
    accentColor: 'text-amber-400'
  }
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [currentIndex, setCurrentIndex] = useState(0);
  const { mediumTap, lightTap, success } = useHaptics();
  const { t } = useTranslation();

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
      {/* Background gradient effects - smaller */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className={cn(
            "absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full",
            `bg-gradient-to-b ${slides[currentIndex].gradient}`
          )}
          style={{ filter: 'blur(80px)' }}
        />
      </div>

      {/* Skip button */}
      <div className="absolute top-0 left-0 right-0 z-10 px-4 pt-12">
        <button
          onClick={handleSkip}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {t('app.onboarding.skip')}
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
                  className="flex-[0_0_100%] min-w-0 flex flex-col items-center justify-center px-6"
                >
                  {/* Animated Icon - smaller */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ 
                      scale: currentIndex === index ? 1 : 0.8,
                      rotate: currentIndex === index ? 0 : -30,
                      opacity: currentIndex === index ? 1 : 0.5
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 200,
                      damping: 20,
                      delay: currentIndex === index ? 0.1 : 0
                    }}
                    className="relative mb-6"
                  >
                    {/* Glow ring */}
                    <div 
                      className={cn(
                        "absolute inset-0 rounded-full blur-xl opacity-50",
                        slide.accentColor.replace('text-', 'bg-')
                      )}
                      style={{ transform: 'scale(1.3)' }}
                    />
                    
                    {/* Icon container - optimized for small screens */}
                    <div className={cn(
                      "relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center",
                      "bg-white/[0.05] backdrop-blur-xl border border-white/[0.1]",
                      "shadow-xl"
                    )}>
                      <Icon className={cn("w-8 h-8 sm:w-10 sm:h-10", slide.accentColor)} strokeWidth={1.5} />
                    </div>

                    {/* Floating particles - fewer */}
                    {currentIndex === index && (
                      <>
                        {[...Array(3)].map((_, i) => (
                          <motion.div
                            key={i}
                            className={cn("absolute w-1.5 h-1.5 rounded-full", slide.accentColor.replace('text-', 'bg-'))}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{
                              opacity: [0, 1, 0],
                              scale: [0, 1, 0],
                              x: [0, (i % 2 === 0 ? 1 : -1) * (30 + i * 8)],
                              y: [0, -25 - i * 10]
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              delay: i * 0.4,
                              ease: 'easeOut'
                            }}
                            style={{ left: '50%', top: '50%' }}
                          />
                        ))}
                      </>
                    )}
                  </motion.div>

                  {/* Text content - smaller */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ 
                      opacity: currentIndex === index ? 1 : 0.3,
                      y: currentIndex === index ? 0 : 20
                    }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="text-center max-w-[280px] px-2"
                  >
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2 sm:mb-3 leading-tight">
                      {t(slide.titleKey)}
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {t(slide.descriptionKey)}
                    </p>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom controls - more compact */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
          {/* Pagination dots */}
          <div className="flex items-center justify-center gap-1.5">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => { lightTap(); scrollTo(index); }}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  currentIndex === index 
                    ? "w-6 bg-primary" 
                    : "w-1.5 bg-white/20 hover:bg-white/30"
                )}
              />
            ))}
          </div>

          {/* Action button - smaller */}
          <motion.button
            onClick={handleNext}
            style={{ minHeight: '44px' }}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "w-full h-12 rounded-xl font-bold text-base",
              "flex items-center justify-center gap-2",
              "transition-all duration-300",
              isLastSlide 
                ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30"
                : "bg-white/[0.08] backdrop-blur-xl border border-white/[0.1] text-foreground"
            )}
          >
            {isLastSlide ? (
              <>
                {t('app.onboarding.getStarted')}
                <Sparkles className="w-4 h-4" />
              </>
            ) : (
              <>
                {t('app.onboarding.next')}
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default OnboardingFlow;
