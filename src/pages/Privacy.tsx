import { useEffect } from "react";
import { useTranslation } from "@/contexts/TranslationContext";
import { SEO } from "@/components/SEO";
import { LegalPrivacyPolicy } from "@/components/privacy/LegalPrivacyPolicy";

export default function Privacy() {
  const { t } = useTranslation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  return (
    <div className="min-h-screen bg-background">
      <SEO page="privacy" />

      {/* Clean legal header — no icons, no gradients */}
      <section className="pt-12 pb-6 md:pt-20 md:pb-10 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-2">
            {t("privacyLegalTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("privacyLegalEffective")}
          </p>
        </div>
      </section>

      {/* Legal content */}
      <LegalPrivacyPolicy />
    </div>
  );
}
