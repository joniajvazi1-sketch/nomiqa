import { Signal, MapPin, Activity, Building, Wifi, TrendingUp, Shield, CheckCircle2 } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { useEffect, useRef, useState } from "react";

export const DataMarketplace = () => {
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

  const dataTypes = [
    { icon: Signal, label: t("dataMarketplaceSignal"), color: "text-neon-cyan" },
    { icon: MapPin, label: t("dataMarketplaceLocation"), color: "text-neon-violet" },
    { icon: Activity, label: t("dataMarketplaceLatency"), color: "text-neon-coral" },
    { icon: Wifi, label: t("dataMarketplaceNetwork"), color: "text-warm-sand" },
  ];

  const buyers = [
    { icon: Building, name: t("dataMarketplaceBuyer1"), desc: t("dataMarketplaceBuyer1Desc") },
    { icon: TrendingUp, name: t("dataMarketplaceBuyer2"), desc: t("dataMarketplaceBuyer2Desc") },
    { icon: Wifi, name: t("dataMarketplaceBuyer3"), desc: t("dataMarketplaceBuyer3Desc") },
  ];

  return (
    <section ref={sectionRef} className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-b from-background to-background/95">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--neon-violet)/0.08),transparent_60%)]"></div>
        <div className="absolute inset-0 bg-grid-white/[0.01] bg-[size:60px_60px]"></div>
      </div>
      
      <div className="container relative z-10 px-4 sm:px-6 md:px-8">
        {/* Header */}
        <div className={`text-center mb-16 md:mb-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-violet/10 border border-neon-violet/20 mb-6">
            <TrendingUp className="w-4 h-4 text-neon-violet" />
            <span className="text-sm font-medium text-neon-violet">{t("dataMarketplaceBadge")}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            <span className="text-foreground">{t("dataMarketplaceTitle")}</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t("dataMarketplaceSubtitle")}
          </p>
        </div>

        {/* Main Content Grid */}
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 max-w-6xl mx-auto transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          
          {/* Left: What Data You Contribute */}
          <div>
            <h3 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-3">
              <Shield className="w-6 h-6 text-neon-cyan" />
              {t("dataMarketplaceYourData")}
            </h3>
            
            {/* Data types grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {dataTypes.map((item, index) => (
                <div key={index} className="p-5 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/30 transition-all duration-300">
                  <item.icon className={`w-8 h-8 ${item.color} mb-3`} />
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Privacy note */}
            <div className="p-4 rounded-xl bg-neon-cyan/5 border border-neon-cyan/20">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-neon-cyan flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">{t("dataMarketplacePrivacyTitle")}</p>
                  <p className="text-xs text-muted-foreground">{t("dataMarketplacePrivacyDesc")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Who Buys This Data */}
          <div>
            <h3 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-3">
              <Building className="w-6 h-6 text-neon-violet" />
              {t("dataMarketplaceWhoBuys")}
            </h3>
            
            <div className="space-y-4">
              {buyers.map((buyer, index) => (
                <div key={index} className="p-5 rounded-2xl bg-card/50 border border-border/50 hover:border-neon-violet/30 transition-all duration-300 group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-neon-violet/10 flex items-center justify-center group-hover:bg-neon-violet/20 transition-colors">
                      <buyer.icon className="w-6 h-6 text-neon-violet" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">{buyer.name}</h4>
                      <p className="text-sm text-muted-foreground">{buyer.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom: Value proposition */}
        <div className={`mt-16 text-center transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-neon-cyan/10 via-neon-violet/10 to-neon-coral/10 border border-white/10">
            <span className="text-lg font-medium text-foreground">{t("dataMarketplaceValueProp")}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
