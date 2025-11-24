import { useState } from "react";
import { useTranslation } from "@/contexts/TranslationContext";
import { ChevronDown } from "lucide-react";

export const SiteNavigation = () => {
  const { t } = useTranslation();
  const [openSections, setOpenSections] = useState<string[]>([]);

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  return (
    <section className="relative bg-gradient-to-b from-black/60 via-deep-space/80 to-black/90 text-white overflow-hidden border-t border-white/10">
      {/* Premium decorative glows */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-cyan rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-violet rounded-full blur-3xl"></div>
      </div>
      
      <div className="container px-4 sm:px-6 md:px-8 relative z-10 py-12 md:py-16">
        {/* Navigation Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6 text-center md:text-left">
          {/* Our eSIMs */}
          <div>
            <button 
              onClick={() => toggleSection('esims')}
              className="flex items-center justify-between w-full font-normal mb-4 text-white text-sm md:text-base hover:text-neon-cyan transition-colors group"
            >
              <span>{t("footerOurEsims")}</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openSections.includes('esims') ? 'rotate-180' : ''}`} />
            </button>
            <ul className={`space-y-2.5 text-white/60 text-xs md:text-sm transition-all duration-300 overflow-hidden ${openSections.includes('esims') ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
              <li><a href="/shop" className="hover:text-neon-cyan transition-colors duration-300 font-light">{t("footerStore")}</a></li>
              <li><a href="/shop" className="hover:text-neon-cyan transition-colors duration-300 font-light">{t("footerUnlimitedData")}</a></li>
              <li><a href="/affiliate" className="hover:text-neon-cyan transition-colors duration-300 font-light">{t("footerReferEarn")}</a></li>
              <li><a href="/rewards" className="hover:text-neon-cyan transition-colors duration-300 font-light">{t("footerLoyaltyPrograms")}</a></li>
            </ul>
          </div>

          {/* Explore */}
          <div>
            <button 
              onClick={() => toggleSection('explore')}
              className="flex items-center justify-between w-full font-normal mb-4 text-white text-sm md:text-base hover:text-neon-cyan transition-colors group"
            >
              <span>{t("footerExplore")}</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openSections.includes('explore') ? 'rotate-180' : ''}`} />
            </button>
            <ul className={`space-y-2.5 text-white/60 text-xs md:text-sm transition-all duration-300 overflow-hidden ${openSections.includes('explore') ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
              <li><a href="/shop" className="hover:text-neon-cyan transition-colors duration-300 font-light">{t("footerEsims")}</a></li>
              <li><a href="/getting-started" className="hover:text-neon-cyan transition-colors duration-300 font-light">{t("footerDeviceCompatibility")}</a></li>
            </ul>
          </div>

          {/* Get Help */}
          <div>
            <button 
              onClick={() => toggleSection('help')}
              className="flex items-center justify-between w-full font-normal mb-4 text-white text-sm md:text-base hover:text-neon-cyan transition-colors group"
            >
              <span>{t("footerGetHelp")}</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openSections.includes('help') ? 'rotate-180' : ''}`} />
            </button>
            <ul className={`space-y-2.5 text-white/60 text-xs md:text-sm transition-all duration-300 overflow-hidden ${openSections.includes('help') ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
              <li><a href="/help" className="hover:text-neon-cyan transition-colors duration-300 font-light">{t("footerContactUs")}</a></li>
              <li><a href="/help" className="hover:text-neon-cyan transition-colors duration-300 font-light">{t("footerHelp")}</a></li>
            </ul>
          </div>

          {/* About */}
          <div>
            <button 
              onClick={() => toggleSection('about')}
              className="flex items-center justify-between w-full font-normal mb-4 text-white text-sm md:text-base hover:text-neon-cyan transition-colors group"
            >
              <span>{t("footerAbout")}</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openSections.includes('about') ? 'rotate-180' : ''}`} />
            </button>
            <ul className={`space-y-2.5 text-white/60 text-xs md:text-sm transition-all duration-300 overflow-hidden ${openSections.includes('about') ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
              <li><a href="/about" className="hover:text-neon-cyan transition-colors duration-300 font-light">{t("footerAboutNomiqa")}</a></li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
