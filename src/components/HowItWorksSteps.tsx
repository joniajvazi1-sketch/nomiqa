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
    <section className="py-20 bg-gradient-to-b from-midnight-blue to-background relative overflow-hidden">
      {/* Decorative grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a2e_1px,transparent_1px),linear-gradient(to_bottom,#1a1a2e_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>
      
      <div className="container px-4 relative z-10">
        <div className="text-center mb-16 animate-fade-in-up">
          <p className="text-neon-cyan uppercase tracking-[0.3em] text-sm font-semibold mb-4">{t("howItWorksTag")}</p>
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">
            <span className="bg-gradient-neon bg-clip-text text-transparent">{t("howItWorksTitle")}</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
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
                {/* Connection line */}
                {index < steps.length - 1 && (
                  <div className={`hidden md:block absolute top-16 left-[60%] w-full h-0.5 bg-gradient-to-r from-neon-cyan via-neon-violet to-transparent transition-opacity duration-700 ${
                    isVisible ? 'opacity-30' : 'opacity-0'
                  }`}></div>
                )}
                
                <div className={`relative bg-card/50 backdrop-blur-sm border rounded-2xl p-8 transition-all duration-1000 ${
                  isVisible 
                    ? 'border-neon-cyan/70 shadow-[0_0_50px_rgba(6,182,212,0.5),0_0_100px_rgba(6,182,212,0.3)]' 
                    : 'border-border/50'
                }`}
                style={{
                  animation: isVisible ? 'pulse 3s ease-in-out infinite' : 'none',
                }}
                >
                  {/* Number badge with lightning glow */}
                  <div className={`absolute -top-4 -left-4 w-12 h-12 rounded-xl bg-gradient-to-br from-${step.color} to-neon-violet flex items-center justify-center text-white font-bold text-xl transition-all duration-1000 ${
                    isVisible 
                      ? 'scale-100 shadow-[0_0_60px_rgba(6,182,212,1),0_0_100px_rgba(6,182,212,0.6)]' 
                      : 'scale-0'
                  }`}
                  style={{
                    transform: isVisible ? 'scale(1) rotate(360deg)' : 'scale(0) rotate(0deg)',
                    transition: 'all 1s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                  }}
                  >
                    {step.number}
                  </div>
                  
                  <div className="mb-6 flex justify-center">
                    <div className={`w-20 h-20 rounded-2xl bg-${step.color}/10 flex items-center justify-center border transition-all duration-1000 ${
                      isVisible 
                        ? `border-${step.color}/70 shadow-[0_0_50px_rgba(6,182,212,0.6),0_0_80px_rgba(6,182,212,0.4)]` 
                        : `border-${step.color}/20`
                    }`}
                    style={{
                      transform: isVisible ? 'scale(1)' : 'scale(0.3)',
                      transition: 'all 1s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                      transitionDelay: '0.2s',
                    }}
                    >
                      <Icon className={`w-10 h-10 text-${step.color} transition-all duration-1000 ${
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
                  
                  <h3 className={`text-xl font-bold text-center mb-3 font-display transition-all duration-700 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}>{t(step.titleKey)}</h3>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
