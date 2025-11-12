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
    <section className="relative py-12 md:py-24 overflow-hidden">
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
      
      <div className="container relative z-10 px-4 py-6 md:py-8">
        <div className="text-center mb-4 md:mb-8 px-2">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-3 font-display leading-tight">
            <span className="bg-gradient-freedom bg-clip-text text-transparent">
              {t("whyNomiqaMainTitle")}
            </span>
          </h2>
          <p className="text-sm md:text-lg text-white/90 max-w-2xl mx-auto leading-snug">
            {t("whyNomiqaMainSubtitle")}
          </p>
        </div>

        {/* Value cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 max-w-4xl md:max-w-6xl mx-auto px-2">
          <div className="group relative p-4 md:p-6 rounded-xl bg-background/50 backdrop-blur-sm border border-white/10 hover:border-neon-cyan/30 transition-all duration-500 hover:shadow-lg hover:shadow-neon-cyan/10">
            <div className="flex justify-center mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-gradient-to-br from-neon-cyan to-neon-violet p-0.5">
                <div className="w-full h-full bg-background/80 rounded-lg md:rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 md:w-7 md:h-7 text-neon-cyan" />
                </div>
              </div>
            </div>
            <h3 className="text-base md:text-xl font-bold mb-2 md:mb-3 text-white text-center leading-tight">
              {t("whyNomiqaPrivacyTitle")}
            </h3>
            <p className="text-white/80 text-center text-xs md:text-sm leading-snug md:leading-relaxed">
              {t("whyNomiqaPrivacyDesc")}
            </p>
          </div>

          <div className="group relative p-4 md:p-6 rounded-xl bg-background/50 backdrop-blur-sm border border-white/10 hover:border-neon-cyan/30 transition-all duration-500 hover:shadow-lg hover:shadow-neon-cyan/10">
            <div className="flex justify-center mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-gradient-to-br from-neon-violet to-neon-coral p-0.5">
                <div className="w-full h-full bg-background/80 rounded-lg md:rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 md:w-7 md:h-7 text-neon-cyan" />
                </div>
              </div>
            </div>
            <h3 className="text-base md:text-xl font-bold mb-2 md:mb-3 text-white text-center leading-tight">
              {t("whyNomiqaAccessTitle")}
            </h3>
            <p className="text-white/80 text-center text-xs md:text-sm leading-snug md:leading-relaxed">
              {t("whyNomiqaAccessDesc")}
            </p>
          </div>

          <div className="group relative p-4 md:p-6 rounded-xl bg-background/50 backdrop-blur-sm border border-white/10 hover:border-neon-cyan/30 transition-all duration-500 hover:shadow-lg hover:shadow-neon-cyan/10">
            <div className="flex justify-center mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-gradient-to-br from-neon-coral to-warm-sand p-0.5">
                <div className="w-full h-full bg-background/80 rounded-lg md:rounded-xl flex items-center justify-center">
                  <Globe className="w-5 h-5 md:w-7 md:h-7 text-neon-cyan" />
                </div>
              </div>
            </div>
            <h3 className="text-base md:text-xl font-bold mb-2 md:mb-3 text-white text-center leading-tight">
              {t("whyNomiqaBorderlessTitle")}
            </h3>
            <p className="text-white/80 text-center text-xs md:text-sm leading-snug md:leading-relaxed">
              {t("whyNomiqaBorderlessDesc")}
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};
