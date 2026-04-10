import { SiteNavigation } from "@/components/SiteNavigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { Shield } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { SEO } from "@/components/SEO";
import { LegalPrivacyPolicy } from "@/components/privacy/LegalPrivacyPolicy";

export default function Privacy() {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <SEO page="privacy" />
      <NetworkBackground color="rgb(34, 211, 238)" />
      
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,hsl(var(--primary)/0.08),transparent_50%)]" />

      {/* Simple Hero */}
      <section className="relative pt-8 pb-6 md:pt-16 md:pb-10 px-4">
        <div className="container max-w-5xl mx-auto relative z-10">
          <div className="text-center">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-neon-cyan/20 rounded-2xl blur-xl"></div>
              <div className="relative w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-neon-violet/20 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                <Shield className="w-8 h-8 text-neon-cyan" />
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-light mb-4">
              <span className="bg-gradient-to-r from-primary via-white to-accent bg-clip-text text-transparent">
                {t("privacyLegalTitle")}
              </span>
            </h1>
            
            <p className="text-sm text-muted-foreground">
              {t("privacyLegalEffective")}
            </p>
          </div>
        </div>
      </section>

      {/* Legal Privacy Policy Content */}
      <LegalPrivacyPolicy />
      
      <SiteNavigation />
    </div>
  );
}
