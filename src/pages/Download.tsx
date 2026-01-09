import { Smartphone, Wifi, Coins, MapPin, Shield, Zap, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/contexts/TranslationContext";
import { SiteNavigation } from "@/components/SiteNavigation";
import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const SupportChatbot = lazy(() => import("@/components/SupportChatbot").then(m => ({ default: m.SupportChatbot })));

const Download = () => {
  const { t } = useTranslation();

  const benefits = [
    { icon: Coins, titleKey: "downloadBenefit1Title", descKey: "downloadBenefit1Desc" },
    { icon: MapPin, titleKey: "downloadBenefit2Title", descKey: "downloadBenefit2Desc" },
    { icon: Shield, titleKey: "downloadBenefit3Title", descKey: "downloadBenefit3Desc" },
    { icon: Zap, titleKey: "downloadBenefit4Title", descKey: "downloadBenefit4Desc" },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Helmet>
        <title>{t("downloadPageTitle")} | Nomiqa</title>
        <meta name="description" content={t("downloadPageSubtitle")} />
      </Helmet>
      
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,255,200,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,200,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,200,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

      {/* Hero Section */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-24 px-4 relative z-10">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-16">
            {/* Coming Soon Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-coral/10 border border-neon-coral/30 mb-6">
              <Clock className="w-4 h-4 text-neon-coral" />
              <span className="text-sm font-medium text-neon-coral">{t("downloadComingSoon")}</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light mb-6">
              <span className="bg-gradient-to-r from-neon-cyan via-white to-neon-violet bg-clip-text text-transparent">
                {t("downloadPageTitle")}
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              {t("downloadPageSubtitle")}
            </p>

            {/* App Store Badges Placeholder */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/20 to-neon-violet/20 rounded-xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative flex items-center gap-3 px-6 py-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-white/60">{t("downloadOnThe")}</div>
                    <div className="text-lg font-medium text-white">App Store</div>
                  </div>
                </div>
              </div>
              
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-neon-violet/20 to-neon-cyan/20 rounded-xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative flex items-center gap-3 px-6 py-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                      <path d="m3 20.5 10.5-8.5L3 3.5v17zm11 0 7-8.5-7-8.5v17z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-white/60">{t("downloadGetItOn")}</div>
                    <div className="text-lg font-medium text-white">Google Play</div>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code Placeholder */}
            <div className="flex flex-col items-center gap-4 mb-12">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/30 to-neon-violet/30 rounded-2xl blur-2xl" />
                <div className="relative w-48 h-48 bg-white/5 border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center backdrop-blur-sm">
                  <Smartphone className="w-12 h-12 text-white/40 mb-3" />
                  <span className="text-sm text-white/40">{t("downloadQRPlaceholder")}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{t("downloadScanQR")}</p>
            </div>
          </div>

          {/* Phone Mockup */}
          <div className="relative max-w-sm mx-auto mb-20">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/20 to-neon-violet/20 rounded-[3rem] blur-3xl" />
            <div className="relative bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-[3rem] p-4 backdrop-blur-xl">
              <div className="bg-black rounded-[2.5rem] aspect-[9/19] flex flex-col items-center justify-center p-8">
                {/* Notch */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-20 h-6 bg-black rounded-full border border-white/10" />
                
                {/* App Preview Content */}
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-violet flex items-center justify-center">
                    <Wifi className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Nomiqa</h3>
                  <p className="text-sm text-white/60 mb-6">{t("downloadAppTagline")}</p>
                  
                  {/* Scanning animation preview */}
                  <div className="relative w-32 h-32 mx-auto">
                    <div className="absolute inset-0 border-2 border-neon-cyan/30 rounded-full animate-ping" />
                    <div className="absolute inset-4 border-2 border-neon-cyan/50 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
                    <div className="absolute inset-8 bg-neon-cyan/20 rounded-full flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-neon-cyan" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 px-4 relative z-10">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light mb-4">
              <span className="bg-gradient-to-r from-neon-cyan to-neon-violet bg-clip-text text-transparent">
                {t("downloadBenefitsTitle")}
              </span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {t("downloadBenefitsSubtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div 
                  key={index}
                  className="relative group p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-neon-cyan/30 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-violet/20 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-neon-cyan" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">{t(benefit.titleKey)}</h3>
                    <p className="text-sm text-muted-foreground">{t(benefit.descKey)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 px-4 relative z-10">
        <div className="container max-w-4xl mx-auto">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/10 to-neon-violet/10 rounded-3xl blur-2xl" />
            <div className="relative p-8 md:p-12 rounded-3xl bg-white/[0.02] border border-white/10 text-center">
              <h2 className="text-2xl md:text-3xl font-light mb-4 text-white">
                {t("downloadCTATitle")}
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                {t("downloadCTASubtitle")}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/how-it-works">
                  <Button className="bg-gradient-to-r from-neon-cyan to-neon-violet hover:opacity-90 text-white px-8 py-6 rounded-xl">
                    {t("downloadLearnHowItWorks")}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/shop">
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/5 px-8 py-6 rounded-xl">
                    {t("downloadBrowsePlans")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteNavigation />
      <Suspense fallback={null}>
        <SupportChatbot />
      </Suspense>
    </div>
  );
};

export default Download;