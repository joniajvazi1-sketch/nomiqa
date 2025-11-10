import { Shield, Zap, Globe } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";

export const WhyNomiqa = () => {
  const { t } = useTranslation();
  
  const values = [
    {
      icon: Shield,
      title: "True Privacy. Zero Compromise.",
      description: "Your data is YOURS. No ID checks, no surveillance, no digital footprints.",
      gradient: "from-neon-cyan to-neon-violet",
    },
    {
      icon: Zap,
      title: "Instant Access. Real Freedom.",
      description: "Pay with crypto. Activate in seconds. No banks watching. No delays.",
      gradient: "from-neon-violet to-neon-coral",
    },
    {
      icon: Globe,
      title: "Borderless Connection. Limitless Possibilities.",
      description: "190+ countries. One eSIM. The world is yours to explore freely.",
      gradient: "from-neon-coral to-warm-sand",
    },
  ];

  return (
    <section className="relative py-24 md:py-32 bg-gradient-to-b from-background via-deep-space to-background overflow-hidden">
      {/* Decorative glows */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-neon-cyan/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-neon-coral/10 rounded-full blur-3xl"></div>
      
      <div className="container relative z-10 px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 font-display">
            <span className="bg-gradient-freedom bg-clip-text text-transparent">
              This Is Why You Need Nomiqa
            </span>
          </h2>
          <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto">
            Because your freedom shouldn't come with surveillance.
          </p>
        </div>

        {/* Value cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {values.map((value, index) => (
            <div
              key={index}
              className="group relative p-8 rounded-3xl bg-card/40 backdrop-blur-sm border border-border/50 hover:border-neon-cyan/50 transition-all duration-500 hover:shadow-lg hover:shadow-neon-cyan/20 text-center"
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${value.gradient} p-0.5 mb-6 mx-auto`}>
                <div className="w-full h-full bg-card rounded-2xl flex items-center justify-center">
                  <value.icon className="w-8 h-8 text-neon-cyan" />
                </div>
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 text-foreground">
                {value.title}
              </h3>
              <p className="text-foreground/60">
                {value.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
