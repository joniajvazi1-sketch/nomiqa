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
    <section className="py-14 md:py-20 bg-gradient-to-b from-background via-card/20 to-background relative overflow-hidden">
      <div className="container px-4 sm:px-6 relative z-10">
        <div className="text-center mb-10 md:mb-14 animate-fade-in">
          <p className="text-muted-foreground uppercase tracking-widest text-xs font-medium mb-3">
            {t("howItWorksTag")}
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 text-foreground">
            {t("howItWorksTitle")}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
            {t("howItWorksSubtitle")}
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-4xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isVisible = visibleSteps.includes(index);
            return (
              <div 
                key={index}
                ref={(el) => (stepsRef.current[index] = el)}
                className={`relative group transition-all duration-700 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                {/* Connection line */}
                {index < steps.length - 1 && (
                  <div className={`hidden md:block absolute top-16 left-[60%] w-full h-px bg-gradient-to-r from-border via-border/50 to-transparent ${
                    isVisible ? 'opacity-100' : 'opacity-0'
                  }`} />
                )}
                
                <div className="relative bg-card/50 border border-border/50 rounded-xl p-6 sm:p-8 hover:border-primary/30 transition-all duration-300">
                  {/* Number badge */}
                  <div className="absolute -top-3 -left-3 w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {step.number}
                  </div>
                  
                  <div className="mb-4 flex justify-center pt-2">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-muted/50 flex items-center justify-center">
                      <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-foreground" />
                    </div>
                  </div>
                  
                  <h3 className="text-lg sm:text-xl font-semibold text-center text-foreground">
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
