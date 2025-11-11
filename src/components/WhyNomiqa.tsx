import { Shield, Zap, Globe } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import whyNomiqaDesktop from "@/assets/why-nomiqa-desktop.png";
import whyNomiqaMobile from "@/assets/why-nomiqa-mobile.png";

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
    <section className="relative py-16 md:py-24 overflow-hidden">
      {/* Background images with very light overlay */}
      <div className="absolute inset-0">
        {/* Desktop background */}
        <img src={whyNomiqaDesktop} alt="Happy travelers at sunset" className="hidden md:block w-full h-full object-cover object-center" />
        {/* Mobile background - show full image */}
        <img src={whyNomiqaMobile} alt="Connected travelers at sunset" className="md:hidden w-full h-full object-contain object-center bg-deep-space" />
        <div className="absolute inset-0 bg-gradient-to-br from-deep-space/10 via-background/5 to-deep-space/10"></div>
      </div>
      
      {/* Decorative glows */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-neon-coral/5 rounded-full blur-3xl"></div>
      
      <div className="container relative z-10 px-4 pt-4">
        <div className="text-center mb-6">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 font-display">
            <span className="bg-gradient-freedom bg-clip-text text-transparent">
              This Is Why You Need Nomiqa
            </span>
          </h2>
          <p className="text-base md:text-lg text-foreground/80 max-w-2xl mx-auto">
            Because your freedom shouldn't come with surveillance.
          </p>
        </div>

        {/* Value cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-6 max-w-4xl md:max-w-6xl mx-auto">
          {values.map((value, index) => (
            <div
              key={index}
              className="group relative p-3 md:p-6 rounded-lg md:rounded-xl bg-background/40 backdrop-blur-sm border border-white/10 hover:border-neon-cyan/30 transition-all duration-500 hover:shadow-lg hover:shadow-neon-cyan/10"
            >
              <div className="flex justify-center mb-2 md:mb-4">
                <div className={`w-8 h-8 md:w-14 md:h-14 rounded-md md:rounded-xl bg-gradient-to-br ${value.gradient} p-0.5`}>
                  <div className="w-full h-full bg-background/80 rounded-md md:rounded-xl flex items-center justify-center">
                    <value.icon className="w-4 h-4 md:w-7 md:h-7 text-neon-cyan" />
                  </div>
                </div>
              </div>
              <h3 className="text-sm md:text-xl font-bold mb-1.5 md:mb-3 text-white text-center leading-tight">
                {value.title}
              </h3>
              <p className="text-white/70 text-center text-xs md:text-sm leading-snug md:leading-relaxed">
                {value.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
