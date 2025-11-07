import { Shield, Zap, Globe } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";

export const ValuePropositions = () => {
  const { t } = useTranslation();
  
  const values = [
    {
      icon: Shield,
      title: "Anonymous eSIMs",
      subtitle: "No KYC, no tracking",
      gradient: "from-neon-cyan to-neon-blue"
    },
    {
      icon: Zap,
      title: "Crypto Checkout",
      subtitle: "Payment in seconds",
      gradient: "from-neon-violet to-neon-pink"
    },
    {
      icon: Globe,
      title: "Instant Activation",
      subtitle: "190+ countries",
      gradient: "from-neon-coral to-neon-orange"
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-background to-midnight-blue relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-cyan/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-violet/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      
      <div className="container px-4 relative z-10">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <div 
                key={index}
                className="group text-center animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`relative inline-block mb-6`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${value.gradient} opacity-20 blur-xl rounded-full group-hover:opacity-40 transition-opacity duration-300`}></div>
                  <div className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${value.gradient} flex items-center justify-center shadow-lg group-hover:shadow-glow-neon transition-all duration-300 group-hover:scale-110`}>
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                </div>
                <div className={`text-2xl font-bold bg-gradient-to-r ${value.gradient} bg-clip-text text-transparent mb-2 font-display`}>
                  {value.title}
                </div>
                <div className="text-muted-foreground text-sm">
                  {value.subtitle}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
