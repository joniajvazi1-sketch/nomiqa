import { CheckCircle, QrCode, Wifi } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";

export const HowItWorksSteps = () => {
  const { t } = useTranslation();
  
  const steps = [
    {
      icon: CheckCircle,
      number: "1",
      title: "Select your plan",
      color: "neon-cyan"
    },
    {
      icon: QrCode,
      number: "2",
      title: "Scan QR code",
      color: "neon-violet"
    },
    {
      icon: Wifi,
      number: "3",
      title: "Connect instantly",
      color: "neon-coral"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-midnight-blue to-background relative overflow-hidden">
      {/* Decorative grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a2e_1px,transparent_1px),linear-gradient(to_bottom,#1a1a2e_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>
      
      <div className="container px-4 relative z-10">
        <div className="text-center mb-16 animate-fade-in-up">
          <p className="text-neon-cyan uppercase tracking-[0.3em] text-sm font-semibold mb-4">How It Works</p>
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">
            <span className="bg-gradient-neon bg-clip-text text-transparent">Three Simple Steps</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Get connected in under 60 seconds. No paperwork, no waiting.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div 
                key={index}
                className="relative group animate-fade-in-up"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                {/* Connection line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-[60%] w-full h-0.5 bg-gradient-to-r from-neon-cyan via-neon-violet to-transparent opacity-30"></div>
                )}
                
                <div className="relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 hover:border-neon-cyan/50 transition-all duration-300 hover:shadow-glow-cyan">
                  {/* Number badge */}
                  <div className={`absolute -top-4 -left-4 w-12 h-12 rounded-xl bg-gradient-to-br from-${step.color} to-neon-violet flex items-center justify-center text-white font-bold text-xl shadow-glow-${step.color}`}>
                    {step.number}
                  </div>
                  
                  <div className="mb-6 flex justify-center">
                    <div className={`w-20 h-20 rounded-2xl bg-${step.color}/10 flex items-center justify-center border border-${step.color}/20 group-hover:border-${step.color}/50 group-hover:shadow-glow-${step.color} transition-all duration-300`}>
                      <Icon className={`w-10 h-10 text-${step.color}`} />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-center mb-3 font-display">{step.title}</h3>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
