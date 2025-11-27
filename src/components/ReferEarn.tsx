import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { DollarSign, Coins, XCircle } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { localizedPath } from "@/utils/localizedLinks";
import { useEffect, useRef, useState } from "react";

export const ReferEarn = () => {
  const navigate = useNavigate();
  const { language, t } = useTranslation();
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

  return (
    <section ref={sectionRef} className="py-16 md:py-24 lg:py-32 px-4 sm:px-6 relative overflow-hidden bg-gradient-to-br from-black/40 via-deep-space/60 to-black/40 border-y border-white/5">
      {/* Premium background decorations */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-cyan/3 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-coral/3 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Header */}
        <div className={`text-center mb-12 md:mb-16 lg:mb-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-block mb-3 md:mb-4">
            <span className="text-neon-coral text-[10px] sm:text-xs md:text-sm font-light tracking-[0.25em] uppercase">
              {t("referEarnBadge")}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light mb-4 md:mb-6 px-4">
            <span className="block bg-gradient-to-r from-white via-white/95 to-white/90 bg-clip-text text-transparent">
              {t("referEarnTitle")}
            </span>
            <span className="block text-lg sm:text-xl md:text-2xl lg:text-3xl text-white/70 mt-3 md:mt-4 font-extralight">
              {t("referEarnSubtitle")}
            </span>
          </h2>
        </div>

        {/* Comparison Cards */}
        <div className={`grid md:grid-cols-2 gap-5 sm:gap-6 md:gap-8 mb-12 md:mb-16 lg:mb-20 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Competitors */}
          <div className="relative p-6 sm:p-7 md:p-8 rounded-2xl md:rounded-3xl bg-white/[0.02] backdrop-blur-xl border-2 border-red-500/20 hover:border-red-500/30 transition-all duration-500">
            <div className="absolute top-4 right-4 sm:top-5 sm:right-5 md:top-6 md:right-6">
              <XCircle className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-red-500/70" />
            </div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-light text-white mb-5 md:mb-6">{t("otherPlatforms")}</h3>
            <ul className="space-y-3 sm:space-y-4 text-white/60">
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-red-500 text-sm sm:text-base flex-shrink-0">✗</span>
                <span className="text-xs sm:text-sm md:text-base font-light">{t("creditsLocked")}</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-red-500 text-sm sm:text-base flex-shrink-0">✗</span>
                <span className="text-xs sm:text-sm md:text-base font-light">{t("cantWithdraw")}</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-red-500 text-sm sm:text-base flex-shrink-0">✗</span>
                <span className="text-xs sm:text-sm md:text-base font-light">{t("onlyTheirProducts")}</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-red-500 text-sm sm:text-base flex-shrink-0">✗</span>
                <span className="text-xs sm:text-sm md:text-base font-light">{t("noFinancialValue")}</span>
              </li>
            </ul>
          </div>

          {/* Nomiqa */}
          <div className="relative p-6 sm:p-7 md:p-8 rounded-2xl md:rounded-3xl bg-gradient-to-br from-neon-coral/5 to-neon-violet/5 backdrop-blur-xl border-2 border-neon-coral/30 hover:border-neon-coral/50 transition-all duration-500 hover-lift">
            <div className="absolute top-4 right-4 sm:top-5 sm:right-5 md:top-6 md:right-6">
              <Coins className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-neon-coral" />
            </div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-light text-neon-coral mb-5 md:mb-6">{t("nomiqaAffiliate")}</h3>
            <ul className="space-y-3 sm:space-y-4 text-white">
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-neon-coral text-sm sm:text-base flex-shrink-0">✓</span>
                <span className="text-xs sm:text-sm md:text-base font-light">{t("earnUsdcSol")}</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-neon-coral text-sm sm:text-base flex-shrink-0">✓</span>
                <span className="text-xs sm:text-sm md:text-base font-light">{t("withdrawAnytime")}</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-neon-coral text-sm sm:text-base flex-shrink-0">✓</span>
                <span className="text-xs sm:text-sm md:text-base font-light">{t("realMoneyFreedom")}</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-neon-coral text-sm sm:text-base flex-shrink-0">✓</span>
                <span className="text-xs sm:text-sm md:text-base font-light">{t("multiLevelCommission")}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Earnings Cascade */}
        <div className="border border-white/10 bg-white/[0.02] backdrop-blur-xl rounded-2xl md:rounded-3xl mb-10 md:mb-12">
          <div className="p-6 sm:p-8 md:p-10 lg:p-12">
            <div className="text-center mb-10 md:mb-12 lg:mb-16 max-w-2xl mx-auto">
              <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-white mb-3 md:mb-5 px-4">
                {t("passiveIncomeTitle")}
              </h3>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/70 font-light leading-relaxed px-4">
                {t("passiveIncomeSubtitle")}
              </p>
            </div>

            <div className="space-y-6 sm:space-y-7 md:space-y-8 max-w-3xl mx-auto">
              {/* Level 1 */}
              <div className="group">
                <div className="flex flex-col md:flex-row md:items-start gap-3 sm:gap-4 md:gap-6 p-5 sm:p-6 md:p-7 bg-gradient-to-r from-neon-coral/5 to-transparent border-l-4 border-neon-coral rounded-xl md:rounded-2xl hover:from-neon-coral/10 transition-all duration-500 hover-lift text-center md:text-left">
                  <div className="flex items-center gap-3 md:block justify-center md:justify-start">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-neon-coral/10 border-2 border-neon-coral/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg sm:text-xl md:text-2xl font-light text-neon-coral">1</span>
                    </div>
                    <p className="text-[10px] sm:text-xs md:text-sm text-neon-coral/80 font-light uppercase tracking-[0.2em] md:mt-3">{t("directReferral")}</p>
                  </div>
                  <div className="flex-1 space-y-2 sm:space-y-3">
                    <p className="text-sm sm:text-base md:text-lg font-light text-white">{t("sarahBuysEsim")}</p>
                    <div className="flex items-baseline gap-2 pt-1 sm:pt-2 justify-center md:justify-start">
                      <span className="text-2xl sm:text-3xl md:text-4xl font-extralight text-neon-coral">$4.50</span>
                      <span className="text-xs sm:text-sm text-white/60 font-light">{t("commission9Percent")}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="relative py-2 sm:py-3">
                <div className="absolute left-1/2 md:left-7 top-0 bottom-0 w-px bg-gradient-to-b from-white/10 via-neon-coral/30 to-white/10 -translate-x-1/2 md:translate-x-0"></div>
                <div className="flex justify-center md:justify-start md:pl-20">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-neon-coral/10 border border-neon-coral/20 rounded-full text-[10px] sm:text-xs md:text-sm font-light text-neon-coral">
                    {t("passiveStarts")}
                  </div>
                </div>
              </div>

              {/* Level 2 */}
              <div className="group">
                <div className="flex flex-col md:flex-row md:items-start gap-3 sm:gap-4 md:gap-6 p-5 sm:p-6 md:p-7 bg-gradient-to-r from-neon-violet/5 to-transparent border-l-4 border-neon-violet rounded-xl md:rounded-2xl hover:from-neon-violet/10 transition-all duration-500 hover-lift text-center md:text-left">
                  <div className="flex items-center gap-3 md:block justify-center md:justify-start">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-neon-violet/10 border-2 border-neon-violet/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg sm:text-xl md:text-2xl font-light text-neon-violet">2</span>
                    </div>
                    <p className="text-[10px] sm:text-xs md:text-sm text-neon-violet/80 font-light uppercase tracking-[0.2em] md:mt-3">{t("tier2Passive")}</p>
                  </div>
                  <div className="flex-1 space-y-2 sm:space-y-3">
                    <div>
                      <p className="text-sm sm:text-base md:text-lg font-light text-white">{t("sarahInvitesMike")}</p>
                      <p className="text-xs sm:text-sm text-white/60 font-light mt-1 sm:mt-1.5">{t("dontKnowMike")}</p>
                    </div>
                    <div className="flex items-baseline gap-2 pt-1 sm:pt-2 justify-center md:justify-start">
                      <span className="text-2xl sm:text-3xl md:text-4xl font-extralight text-neon-violet">$3.00</span>
                      <span className="text-xs sm:text-sm text-white/60 font-light">{t("commission6Percent")}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="relative py-1 sm:py-2">
                <div className="absolute left-1/2 md:left-7 top-0 bottom-0 w-px bg-gradient-to-b from-white/10 via-neon-violet/30 to-white/10 -translate-x-1/2 md:translate-x-0"></div>
              </div>

              {/* Level 3 */}
              <div className="group">
                <div className="flex flex-col md:flex-row md:items-start gap-3 sm:gap-4 md:gap-6 p-5 sm:p-6 md:p-7 bg-gradient-to-r from-neon-cyan/5 to-transparent border-l-4 border-neon-cyan rounded-xl md:rounded-2xl hover:from-neon-cyan/10 transition-all duration-500 hover-lift text-center md:text-left">
                  <div className="flex items-center gap-3 md:block justify-center md:justify-start">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-neon-cyan/10 border-2 border-neon-cyan/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg sm:text-xl md:text-2xl font-light text-neon-cyan">3</span>
                    </div>
                    <p className="text-[10px] sm:text-xs md:text-sm text-neon-cyan/80 font-light uppercase tracking-[0.2em] md:mt-3">{t("tier3Passive")}</p>
                  </div>
                  <div className="flex-1 space-y-2 sm:space-y-3">
                    <div>
                      <p className="text-sm sm:text-base md:text-lg font-light text-white">{t("mikeInvitesLisa")}</p>
                      <p className="text-xs sm:text-sm text-white/60 font-light mt-1 sm:mt-1.5">{t("neverHeardLisa")}</p>
                    </div>
                    <div className="flex items-baseline gap-2 pt-1 sm:pt-2 justify-center md:justify-start">
                      <span className="text-2xl sm:text-3xl md:text-4xl font-extralight text-neon-cyan">$1.50</span>
                      <span className="text-xs sm:text-sm text-white/60 font-light">{t("commission3Percent")}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="mt-8 sm:mt-10 md:mt-12 p-6 sm:p-7 md:p-9 bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 rounded-xl md:rounded-2xl">
                <div className="flex flex-col items-center gap-5 md:gap-6 md:flex-row md:justify-between text-center md:text-left">
                  <div className="w-full md:w-auto">
                    <p className="text-xs sm:text-sm text-white/60 font-light mb-2">{t("totalFrom3Sales")}</p>
                    <div className="flex items-baseline gap-2 justify-center md:justify-start flex-wrap">
                      <span className="text-3xl sm:text-4xl md:text-5xl font-extralight bg-gradient-to-r from-neon-coral via-neon-violet to-neon-cyan bg-clip-text text-transparent">
                        $9.00
                      </span>
                      <span className="text-sm sm:text-base text-white/60 font-light">{t("usdcOrSol")}</span>
                    </div>
                  </div>
                  <div className="flex gap-4 sm:gap-5 md:flex-col md:gap-2">
                    <div className="text-xs sm:text-sm font-light text-white/80">
                      {t("yourWork")}
                    </div>
                    <div className="text-xs sm:text-sm font-light text-neon-coral">
                      {t("passiveIncome450")}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 sm:mt-10 md:mt-14 max-w-2xl mx-auto space-y-6 sm:space-y-7 md:space-y-8">
              <div className="p-5 sm:p-6 md:p-8 bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-xl md:rounded-2xl text-center md:text-left">
                <p className="text-sm sm:text-base md:text-lg text-white/80 font-light leading-relaxed">
                  {t("networkGrowth")}
                  <span className="block mt-3 sm:mt-4 font-light text-neon-coral text-sm sm:text-base md:text-lg">
                    {t("earnFromAll")}
                  </span>
                </p>
              </div>
              
              <div className="text-center">
                <Button 
                  onClick={() => navigate(localizedPath('/affiliate', language))}
                  size="lg"
                  className="h-auto py-3 px-4 sm:px-8 md:px-12 sm:py-5 md:py-7 text-sm sm:text-base md:text-lg font-light bg-white/[0.05] backdrop-blur-xl border-2 border-neon-coral/30 text-white hover:bg-neon-coral/10 hover:border-neon-coral/50 rounded-xl md:rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-neon-coral/20 w-full sm:w-auto"
                >
                  <span className="break-words">{t("getStarted")}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
