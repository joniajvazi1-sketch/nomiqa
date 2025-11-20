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
    <section className="relative py-24 md:py-32 overflow-hidden min-h-screen md:min-h-0">
      {/* Premium background with elegant overlay */}
      <div className="absolute inset-0">
        <img 
          src={whyNomiqaDesktop} 
          alt="Happy travelers at sunset" 
          className="hidden md:block w-full h-full object-cover object-center" 
          loading="lazy"
        />
        <img 
          src={whyNomiqaMobile} 
          alt="Connected travelers at sunset" 
          className="md:hidden w-full h-full object-cover object-center" 
          loading="lazy"
        />
        {/* Sophisticated dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-deep-space/70 via-transparent to-midnight-blue/50"></div>
      </div>
      
      {/* Subtle decorative glows */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-neon-cyan/3 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-neon-violet/3 rounded-full blur-3xl"></div>
      
      <div className="container relative z-10 px-6 md:px-8 py-12 md:py-16">
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white via-white/95 to-white/90 bg-clip-text text-transparent">
              {t("whyNomiqaMainTitle")}
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-white/80 font-light max-w-3xl mx-auto leading-relaxed">
            {t("whyNomiqaMainSubtitle")}
          </p>
        </div>

        {/* Premium value cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 max-w-7xl mx-auto">
          {/* Privacy Card */}
          <div className="group relative p-10 md:p-12 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-700 hover:bg-white/[0.05] hover-lift">
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 md:w-18 md:h-18 rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-neon-violet/20 p-0.5">
                <div className="w-full h-full bg-black/40 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Shield className="w-8 h-8 md:w-9 md:h-9 text-white" />
                </div>
              </div>
            </div>
            <h3 className="text-2xl md:text-3xl font-light mb-5 text-white text-center leading-tight">
              {t("whyNomiqaPrivacyTitle")}
            </h3>
            <p className="text-white/70 text-center text-base md:text-lg font-light leading-relaxed">
              {t("whyNomiqaPrivacyDesc")}
            </p>
          </div>

          {/* Freedom Card */}
          <div className="group relative p-10 md:p-12 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-700 hover:bg-white/[0.05] hover-lift">
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 md:w-18 md:h-18 rounded-2xl bg-gradient-to-br from-neon-violet/20 to-neon-coral/20 p-0.5">
                <div className="w-full h-full bg-black/40 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Zap className="w-8 h-8 md:w-9 md:h-9 text-white" />
                </div>
              </div>
            </div>
            <h3 className="text-2xl md:text-3xl font-light mb-5 text-white text-center leading-tight">
              {t("whyNomiqaFreedomTitle")}
            </h3>
            <p className="text-white/70 text-center text-base md:text-lg font-light leading-relaxed">
              {t("whyNomiqaFreedomDesc")}
            </p>
          </div>

          {/* Borderless Card */}
          <div className="group relative p-10 md:p-12 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-700 hover:bg-white/[0.05] hover-lift">
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 md:w-18 md:h-18 rounded-2xl bg-gradient-to-br from-neon-coral/20 to-white/20 p-0.5">
                <div className="w-full h-full bg-black/40 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Globe className="w-8 h-8 md:w-9 md:h-9 text-white" />
                </div>
              </div>
            </div>
            <h3 className="text-2xl md:text-3xl font-light mb-5 text-white text-center leading-tight">
              {t("whyNomiqaBorderlessTitle")}
            </h3>
            <p className="text-white/70 text-center text-base md:text-lg font-light leading-relaxed">
              {t("whyNomiqaBorderlessDesc")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
