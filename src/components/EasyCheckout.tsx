import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Heart, Shield, Users } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { useEffect, useRef, useState } from "react";

export const EasyCheckout = () => {
  const navigate = useNavigate();
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
  
  return <section ref={sectionRef} className="py-16 md:py-24 lg:py-32 bg-gradient-to-b from-black/40 via-deep-space/60 to-black/40 relative overflow-hidden border-y border-white/5">
      {/* Premium decorative glows */}
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-neon-violet/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl"></div>
      
      <div className="container px-4 sm:px-6 md:px-8 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className={`text-center mb-12 md:mb-16 lg:mb-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-neon-violet/80 uppercase tracking-[0.25em] font-light mb-4 md:mb-5 text-xs sm:text-sm md:text-base">
              {t("ourStoryTag")}
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light mb-5 md:mb-6 lg:mb-8 bg-gradient-to-r from-white via-white/95 to-white/90 bg-clip-text text-transparent px-4">
              {t("ourStorySubtitle")}
            </h2>
          </div>

          {/* Premium value cards */}
          <div className={`grid md:grid-cols-3 gap-5 sm:gap-6 md:gap-8 mb-10 md:mb-12 lg:mb-16 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="group p-6 sm:p-7 md:p-8 rounded-2xl md:rounded-3xl bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-neon-cyan/30 hover:bg-white/[0.04] transition-all duration-500 hover-lift">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-neon-cyan/10 to-neon-violet/10 flex items-center justify-center mb-5 md:mb-6 mx-auto group-hover:scale-110 transition-transform duration-500">
                <Heart className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-neon-cyan" />
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-light mb-3 md:mb-4 text-center text-white">{t("privacyFirstTitle")}</h3>
              <p className="text-xs sm:text-sm md:text-base text-white/70 font-light text-center leading-relaxed">
                {t("privacyFirstDesc")}
              </p>
            </div>

            <div className="group p-6 sm:p-7 md:p-8 rounded-2xl md:rounded-3xl bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-neon-violet/30 hover:bg-white/[0.04] transition-all duration-500 hover-lift">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-neon-violet/10 to-neon-coral/10 flex items-center justify-center mb-5 md:mb-6 mx-auto group-hover:scale-110 transition-transform duration-500">
                <Shield className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-neon-violet" />
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-light mb-3 md:mb-4 text-center text-white">{t("cryptoNativeTitle")}</h3>
              <p className="text-xs sm:text-sm md:text-base text-white/70 font-light text-center leading-relaxed">
                {t("cryptoNativeDesc")}
              </p>
            </div>

            <div className="group p-6 sm:p-7 md:p-8 rounded-2xl md:rounded-3xl bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-neon-coral/30 hover:bg-white/[0.04] transition-all duration-500 hover-lift">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-neon-coral/10 to-white/10 flex items-center justify-center mb-5 md:mb-6 mx-auto group-hover:scale-110 transition-transform duration-500">
                <Users className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-neon-coral" />
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-light mb-3 md:mb-4 text-center text-white">{t("communityOwnedTitle")}</h3>
              <p className="text-xs sm:text-sm md:text-base text-white/70 font-light text-center leading-relaxed">
                {t("communityOwnedDesc")}
              </p>
            </div>
          </div>
          
          <div className={`flex justify-center transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <Button 
              onClick={() => navigate('/about')} 
              className="bg-white text-black hover:bg-white/90 font-light text-sm sm:text-base md:text-lg px-8 sm:px-10 md:px-12 py-5 sm:py-6 md:py-7 rounded-xl md:rounded-2xl shadow-lg hover:scale-105 transition-all duration-300 w-full sm:w-auto max-w-xs sm:max-w-none"
            >
              {t("learnMoreAbout")}
            </Button>
          </div>
        </div>
      </div>
    </section>;
};