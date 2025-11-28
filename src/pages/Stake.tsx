import { Navbar } from "@/components/Navbar";
import { SiteNavigation } from "@/components/SiteNavigation";
import { Footer } from "@/components/Footer";
import { SupportChatbot } from "@/components/SupportChatbot";
import { NetworkBackground } from "@/components/NetworkBackground";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, TrendingUp, Shield, Zap, Users, Network } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";

export default function Stake() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-black/40 via-deep-space/60 to-black/40 relative">
      <NetworkBackground />
      
      <div className="fixed inset-0 -z-10 overflow-hidden opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-neon-violet/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-neon-coral/30 rounded-full blur-3xl"></div>
      </div>
      
      <Navbar />
      
      {/* Hero Section - Coming Soon */}
      <section className="relative pt-24 md:pt-32 pb-20 px-4 overflow-hidden min-h-[80vh] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-deep-space/40 to-black/60"></div>
        
        <div className="container max-w-6xl mx-auto relative z-10">
          <div className="text-center animate-fade-in-up">
            {/* Premium badge */}
            <div className="inline-block mb-6 md:mb-8">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-neon-coral via-neon-violet to-neon-cyan rounded-full blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
                <span className="relative block px-6 md:px-8 py-2.5 md:py-3 bg-white/[0.03] backdrop-blur-2xl border border-white/20 rounded-full text-xs md:text-sm font-light tracking-widest uppercase">
                  <span className="bg-gradient-to-r from-neon-coral via-neon-violet to-neon-cyan bg-clip-text text-transparent">
                    {t("stakeComingSoon")}
                  </span>
                </span>
              </div>
            </div>
            
            {/* Premium headline */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-extralight tracking-tight mb-6 md:mb-8">
              <span className="block bg-gradient-to-r from-white via-neon-cyan to-white bg-clip-text text-transparent mb-2 md:mb-4">
                {t("stakeTitle1")}
              </span>
              <span className="block bg-gradient-to-r from-white via-neon-violet to-white bg-clip-text text-transparent">
                {t("stakeTitle2")}
              </span>
            </h1>
            
            <p className="text-lg md:text-xl lg:text-2xl text-white/70 max-w-4xl mx-auto mb-12 md:mb-16 font-light leading-relaxed">
              {t("stakeDescription")}
            </p>

            {/* Features Preview - Premium cards */}
            <div className="grid md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto mt-12 md:mt-16">
              <div className="group relative bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl p-6 md:p-8 transition-all duration-500 hover:bg-white/[0.04] hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="relative inline-block mb-4 md:mb-6">
                    <div className="absolute inset-0 bg-neon-cyan/20 rounded-full blur-xl group-hover:bg-neon-cyan/30 transition-all"></div>
                    <TrendingUp className="relative w-10 h-10 md:w-12 md:h-12 text-neon-cyan mx-auto" />
                  </div>
                  <h3 className="text-lg md:text-xl font-light text-white mb-2 md:mb-3 tracking-wide">{t("stakeHighAPY")}</h3>
                  <p className="text-sm md:text-base text-white/60 font-light leading-relaxed">{t("stakeHighAPYDesc")}</p>
                </div>
              </div>
              
              <div className="group relative bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl p-6 md:p-8 transition-all duration-500 hover:bg-white/[0.04] hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-br from-neon-violet/5 via-transparent to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="relative inline-block mb-4 md:mb-6">
                    <div className="absolute inset-0 bg-neon-violet/20 rounded-full blur-xl group-hover:bg-neon-violet/30 transition-all"></div>
                    <Zap className="relative w-10 h-10 md:w-12 md:h-12 text-neon-violet mx-auto" />
                  </div>
                  <h3 className="text-lg md:text-xl font-light text-white mb-2 md:mb-3 tracking-wide">{t("stakeFreeData")}</h3>
                  <p className="text-sm md:text-base text-white/60 font-light leading-relaxed">{t("stakeFreeDataDesc")}</p>
                </div>
              </div>
              
              <div className="group relative bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl p-6 md:p-8 transition-all duration-500 hover:bg-white/[0.04] hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-br from-neon-coral/5 via-transparent to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="relative inline-block mb-4 md:mb-6">
                    <div className="absolute inset-0 bg-neon-coral/20 rounded-full blur-xl group-hover:bg-neon-coral/30 transition-all"></div>
                    <Users className="relative w-10 h-10 md:w-12 md:h-12 text-neon-coral mx-auto" />
                  </div>
                  <h3 className="text-lg md:text-xl font-light text-white mb-2 md:mb-3 tracking-wide">{t("stakeAffiliateBoost")}</h3>
                  <p className="text-sm md:text-base text-white/60 font-light leading-relaxed">{t("stakeAffiliateBoostDesc")}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
      
      <SiteNavigation />
      <Footer />
      <SupportChatbot />
    </div>
  );
}