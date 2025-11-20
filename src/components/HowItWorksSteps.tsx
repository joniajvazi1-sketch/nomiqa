import { CheckCircle, QrCode, Wifi } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { useEffect, useRef, useState } from "react";

export const HowItWorksSteps = () => {
  const { t } = useTranslation();
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);
  
  const steps = [
    {
      icon: CheckCircle,
      number: "1",
      titleKey: "howItWorksStep1",
      color: "neon-cyan"
    },
    {
      icon: QrCode,
      number: "2",
      titleKey: "howItWorksStep2",
      color: "neon-violet"
    },
    {
      icon: Wifi,
      number: "3",
      titleKey: "howItWorksStep3",
      color: "neon-coral"
    }
  ];

  useEffect(() => {
    const observers = stepsRef.current.map((step, index) => {
      if (!step) return null;
      
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setTimeout(() => {
                setVisibleSteps((prev) => {
                  if (!prev.includes(index)) {
                    return [...prev, index];
                  }
                  return prev;
                });
              }, index * 200); // Stagger the animations
            }
          });
        },
        { threshold: 0.3 }
      );
      
      observer.observe(step);
      return observer;
    });

    return () => {
      observers.forEach((observer) => observer?.disconnect());
    };
  }, []);

  return (
    <section className="py-16 md:py-28 lg:py-36 bg-gradient-to-b from-black/30 via-deep-space/50 to-black/30 relative overflow-hidden">
      {/* Subtle premium grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30"></div>
      
      <div className="container px-4 sm:px-6 md:px-8 relative z-10">
        <div className="text-center mb-12 md:mb-20 lg:mb-24 animate-fade-in-up">
          <p className="text-white/40 uppercase tracking-[0.25em] text-[10px] sm:text-xs md:text-sm font-light mb-3 md:mb-5">
            {t("howItWorksTag")}
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light mb-4 md:mb-6 px-4">
            <span className="bg-gradient-to-r from-white via-white/95 to-white/90 bg-clip-text text-transparent">
              {t("howItWorksTitle")}
            </span>
          </h2>
          <p className="text-white/60 text-base sm:text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed px-4">
            {t("howItWorksSubtitle")}
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-12 md:gap-16 max-w-6xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isVisible = visibleSteps.includes(index);
            return (
              <div 
                key={index}
                ref={(el) => (stepsRef.current[index] = el)}
                className={`relative group transition-all duration-1000 ${
                  isVisible 
                    ? 'opacity-100 translate-y-0 scale-100' 
                    : 'opacity-0 translate-y-12 scale-90'
                }`}
                style={{
                  transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(48px) scale(0.9)',
                  transition: 'all 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >
                {/* Connection line - refined */}
                {index < steps.length - 1 && (
                  <div className={`hidden md:block absolute top-20 left-[60%] w-full h-px bg-gradient-to-r from-white/20 via-white/10 to-transparent transition-opacity duration-700 ${
                    isVisible ? 'opacity-30' : 'opacity-0'
                  }`}></div>
                )}
                
                <div className={`relative bg-white/[0.02] backdrop-blur-xl border rounded-2xl md:rounded-3xl p-8 sm:p-10 md:p-12 transition-all duration-1000 hover-lift ${
                  isVisible 
                    ? 'border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]' 
                    : 'border-white/5'
                }`}>
                  {/* Elegant number badge */}
                  <div className={`absolute -top-4 -left-4 md:-top-5 md:-left-5 w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-white font-light text-xl md:text-2xl border border-white/10 backdrop-blur-xl transition-all duration-1000 ${
                    isVisible 
                      ? 'scale-100' 
                      : 'scale-0'
                  }`}
                  style={{
                    transform: isVisible ? 'scale(1) rotate(0deg)' : 'scale(0) rotate(-180deg)',
                    transition: 'all 1s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                  }}
                  >
                    {step.number}
                  </div>
                  
                  <div className="mb-6 md:mb-8 flex justify-center">
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl md:rounded-3xl bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center border transition-all duration-1000 ${
                      isVisible 
                        ? 'border-white/10' 
                        : 'border-white/5'
                    }`}
                    style={{
                      transform: isVisible ? 'scale(1)' : 'scale(0.3)',
                      transition: 'all 1s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                      transitionDelay: '0.2s',
                    }}
                    >
                      <Icon className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white transition-all duration-1000 ${
                        isVisible ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                      }`}
                      style={{
                        transform: isVisible ? 'scale(1) rotate(0deg)' : 'scale(0) rotate(-180deg)',
                        transition: 'all 1s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                        transitionDelay: '0.3s',
                      }}
                      />
                    </div>
                  </div>
                  
                  <h3 className={`text-xl sm:text-2xl md:text-3xl font-light text-center mb-4 text-white leading-tight transition-all duration-700 px-2 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}>
                    {t(step.titleKey)}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
