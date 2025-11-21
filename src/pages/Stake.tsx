import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
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
      <section className="relative pt-32 pb-20 px-4 overflow-hidden min-h-[80vh] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-deep-space/80 via-midnight-blue/60 to-deep-space/80 backdrop-blur-sm"></div>
        
        <div className="container max-w-6xl mx-auto relative z-10">
          <div className="text-center animate-fade-in-up">
            <div className="inline-block mb-8">
              <div className="relative">
                <div className="relative bg-gradient-to-r from-neon-coral/20 to-neon-violet/20 backdrop-blur-xl border border-neon-violet/30 px-8 py-4 rounded-full">
                  <span className="text-lg font-semibold bg-gradient-to-r from-neon-coral to-neon-violet bg-clip-text text-transparent">
                    {t("stakeComingSoon")}
                  </span>
                </div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 font-display">
              <span className="block bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-coral bg-clip-text text-transparent">
                {t("stakeTitle1")}
              </span>
              <span className="block bg-gradient-to-r from-neon-coral via-neon-violet to-neon-cyan bg-clip-text text-transparent mt-2">
                {t("stakeTitle2")}
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-foreground/80 max-w-3xl mx-auto mb-8">
              {t("stakeDescription")}
            </p>

            {/* Features Preview */}
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-16 mb-12">
              <div className="group p-6 md:p-8 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-neon-cyan/30 hover:border-neon-cyan/50 transition-all">
                <div className="relative inline-block mb-4">
                  <div className="absolute inset-0 bg-neon-cyan/20 rounded-full blur-xl group-hover:bg-neon-cyan/30 transition-all"></div>
                  <TrendingUp className="relative w-12 h-12 text-neon-cyan mx-auto" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-neon-cyan">{t("stakeHighAPY")}</h3>
                <p className="text-sm text-foreground/70">{t("stakeHighAPYDesc")}</p>
              </div>
              
              <div className="group p-6 md:p-8 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-neon-violet/30 hover:border-neon-violet/50 transition-all">
                <div className="relative inline-block mb-4">
                  <div className="absolute inset-0 bg-neon-violet/20 rounded-full blur-xl group-hover:bg-neon-violet/30 transition-all"></div>
                  <Zap className="relative w-12 h-12 text-neon-violet mx-auto" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-neon-violet">{t("stakeFreeData")}</h3>
                <p className="text-sm text-foreground/70">{t("stakeFreeDataDesc")}</p>
              </div>
              
              <div className="group p-6 md:p-8 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-neon-coral/30 hover:border-neon-coral/50 transition-all">
                <div className="relative inline-block mb-4">
                  <div className="absolute inset-0 bg-neon-coral/20 rounded-full blur-xl group-hover:bg-neon-coral/30 transition-all"></div>
                  <Users className="relative w-12 h-12 text-neon-coral mx-auto" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-neon-coral">{t("stakeAffiliateBoost")}</h3>
                <p className="text-sm text-foreground/70">{t("stakeAffiliateBoostDesc")}</p>
              </div>
            </div>

            {/* CTA */}
            <Card className="bg-white/[0.02] backdrop-blur-xl border-neon-violet/30 max-w-2xl mx-auto overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-neon-violet/5 via-transparent to-neon-coral/5 pointer-events-none"></div>
              <CardContent className="pt-8 pb-8 text-center relative">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-neon-coral/20 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '3s' }}></div>
                  <Coins className="relative w-16 h-16 text-neon-coral mx-auto" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-coral bg-clip-text text-transparent">
                  {t("stakeBeFirstTitle")}
                </h3>
                <p className="text-foreground/80 mb-6 max-w-lg mx-auto">
                  {t("stakeBeFirstDesc")}
                </p>
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-neon-coral to-neon-violet hover:from-neon-coral/90 hover:to-neon-violet/90 text-white shadow-lg font-semibold"
                >
                  {t("stakeNotifyButton")}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}