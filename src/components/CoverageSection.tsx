import InteractiveGlobe from './InteractiveGlobe';
import coverageGroupSunset from '@/assets/coverage-group-sunset.png';
import { useTranslation } from "@/contexts/TranslationContext";
import { useEffect, useRef, useState } from "react";

export const CoverageSection = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return <section ref={sectionRef} id="coverage" className="py-16 md:py-24 lg:py-32 relative overflow-hidden">
      {/* Premium background with enhanced overlay */}
      <div className="absolute inset-0">
        <img 
          src={coverageGroupSunset} 
          alt="People connected at sunset" 
          className="w-full h-full object-cover object-center" 
          loading="lazy"
        />
        {/* Ultra minimal overlay for maximum background visibility */}
        <div className="absolute inset-0 bg-black/10"></div>
      </div>
      
      <div className="container px-4 sm:px-6 md:px-8 relative z-10">
        <div className={`text-center mb-10 md:mb-14 lg:mb-16 mt-8 md:mt-12 lg:mt-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light mb-4 md:mb-5 lg:mb-6 bg-gradient-to-r from-white via-white/95 to-white/90 bg-clip-text text-transparent px-4">
            {t("coverageTitle")}
          </h2>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 font-light max-w-2xl mx-auto px-4 mb-3 md:mb-4 leading-relaxed">
            {t("coverageSubtitle1")}
          </p>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/80 font-light max-w-2xl mx-auto px-4 leading-relaxed">
            {t("coverageSubtitle2")}
          </p>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-neon-cyan/90 font-light italic mt-4 md:mt-5 lg:mt-6 max-w-2xl mx-auto px-4">
            {t("coverageQuote")}
          </p>
        </div>
        
        <div className={`max-w-4xl mx-auto mb-10 md:mb-14 lg:mb-16 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <InteractiveGlobe />
        </div>
        
        <div className={`grid grid-cols-3 gap-4 sm:gap-6 md:gap-8 lg:gap-10 max-w-4xl mx-auto mt-10 md:mt-14 lg:mt-16 text-center transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="p-4 sm:p-5 md:p-6 rounded-xl md:rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-neon-cyan/30 hover:bg-white/[0.04] transition-all duration-500 hover-lift">
            <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extralight text-white mb-2 md:mb-3">200+</div>
            <div className="text-white/70 text-xs sm:text-sm md:text-base font-light">{t("coverageCountries")}</div>
          </div>
          <div className="p-4 sm:p-5 md:p-6 rounded-xl md:rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-neon-violet/30 hover:bg-white/[0.04] transition-all duration-500 hover-lift">
            <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extralight text-white mb-2 md:mb-3">99.9%</div>
            <div className="text-white/70 text-xs sm:text-sm md:text-base font-light">{t("coverageUptime")}</div>
          </div>
          <div className="p-4 sm:p-5 md:p-6 rounded-xl md:rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-neon-coral/30 hover:bg-white/[0.04] transition-all duration-500 hover-lift">
            <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extralight text-white mb-2 md:mb-3">5G</div>
            <div className="text-white/70 text-xs sm:text-sm md:text-base font-light">{t("coverageSpeed")}</div>
          </div>
        </div>
      </div>
    </section>;
};