import InteractiveGlobe from './InteractiveGlobe';
import coverageGroupSunset from '@/assets/coverage-group-sunset.png';
import { useTranslation } from "@/contexts/TranslationContext";

export const CoverageSection = () => {
  const { t } = useTranslation();
  
  return <section id="coverage" className="py-12 md:py-20 relative overflow-hidden">
      {/* Background image with very light overlay for maximum visibility */}
      <div className="absolute inset-0">
        <img src={coverageGroupSunset} alt="People connected at sunset" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-br from-deep-space/10 via-midnight-blue/10 to-deep-space/10"></div>
      </div>
      
      <div className="container px-4 relative z-10">
        <div className="text-center mb-6 md:mb-8 mt-12 md:mt-16">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 bg-gradient-neon bg-clip-text text-transparent">
            {t("coverageTitle")}
          </h2>
          <p className="text-base md:text-xl text-white/95 max-w-2xl mx-auto px-4 mb-4">
            {t("coverageSubtitle1")}
          </p>
          <p className="text-sm md:text-lg text-white/90 max-w-2xl mx-auto px-4">
            {t("coverageSubtitle2")}
          </p>
          <p className="text-xs md:text-base text-neon-cyan/80 italic mt-4 max-w-2xl mx-auto px-4">{t("coverageQuote")}</p>
        </div>
        
        <div className="max-w-4xl mx-auto mb-8 md:mb-12">
          <InteractiveGlobe />
        </div>
        
        <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-4xl mx-auto mt-8 md:mt-12 text-center">
          <div>
            <div className="text-2xl md:text-4xl font-bold text-neon-cyan mb-1 md:mb-2">190+</div>
            <div className="text-foreground/80 text-xs md:text-base">{t("coverageCountries")}</div>
          </div>
          <div>
            <div className="text-2xl md:text-4xl font-bold text-neon-violet mb-1 md:mb-2">99.9%</div>
            <div className="text-foreground/80 text-xs md:text-base">{t("coverageUptime")}</div>
          </div>
          <div>
            <div className="text-2xl md:text-4xl font-bold text-neon-pink mb-1 md:mb-2">5G</div>
            <div className="text-foreground/80 text-xs md:text-base">{t("coverageSpeed")}</div>
          </div>
        </div>
      </div>
    </section>;
};