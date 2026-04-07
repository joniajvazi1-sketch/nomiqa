import { SiteNavigation } from "@/components/SiteNavigation";

import { NetworkBackground } from "@/components/NetworkBackground";
import { useTranslation } from "@/contexts/TranslationContext";
import { SEO } from "@/components/SEO";
import { useEffect, useState } from "react";
import { TermsLegalNotice } from "@/components/terms/TermsLegalNotice";
import { TermsESIM } from "@/components/terms/TermsESIM";
import { TermsPrivacy } from "@/components/terms/TermsPrivacy";
import { TermsWithdrawal } from "@/components/terms/TermsWithdrawal";
import { TermsTokenV3 } from "@/components/terms/TermsTokenV3";

export default function Terms() {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black/40 via-deep-space/60 to-black/40 relative overflow-hidden">
      <SEO page="terms" />
      <NetworkBackground />
      
      {/* Premium glowing orbs background */}
      <div className="fixed inset-0 -z-10 overflow-hidden opacity-20">
        <div className="absolute top-40 left-20 w-96 h-96 bg-neon-cyan/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-[500px] h-[500px] bg-neon-violet/30 rounded-full blur-3xl"></div>
      </div>
      <div className="pt-8 pb-20 px-4">
        <div className={`max-w-4xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="font-light text-4xl md:text-5xl mb-4 bg-gradient-to-r from-neon-cyan via-white to-neon-violet bg-clip-text text-transparent">
              {t("termsTitle")}
            </h1>
            <p className="text-muted-foreground text-lg">
              {t("termsSubtitle")}
            </p>
          </div>

          {/* Content Container */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-12 space-y-12">
            <TermsLegalNotice />
            <TermsESIM />
            <TermsPrivacy />
            <TermsWithdrawal />
            <TermsTokenV3 />

            {/* Last Updated */}
            <div className="pt-8 border-t border-white/10 text-center text-muted-foreground text-sm">
              {t("termsLastUpdated")}
            </div>
          </div>
        </div>
      </div>

      <SiteNavigation />
      
    </div>
  );
}
