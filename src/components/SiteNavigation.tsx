import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslation } from "@/contexts/TranslationContext";
import { memo, useState } from "react";
import { CompatibilityChecker } from "./CompatibilityChecker";

export const SiteNavigation = memo(() => {
  const { t } = useTranslation();
  const [compatibilityOpen, setCompatibilityOpen] = useState(false);

  return (
    <section className="relative bg-gradient-to-b from-black/60 via-deep-space/80 to-black/90 text-white overflow-hidden border-t border-white/10">
      {/* Premium decorative glows - optimized */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-cyan rounded-full blur-3xl transform-gpu"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-violet rounded-full blur-3xl transform-gpu"></div>
      </div>
      
      <div className="container px-4 sm:px-6 md:px-8 relative z-10 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="w-full" style={{ contain: 'layout style paint' }}>
            {/* Our eSIMs */}
            <AccordionItem value="esims" className="border-0 will-change-auto" style={{ contain: 'layout style' }}>
              <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4"></div>
              <AccordionTrigger className="text-left text-lg md:text-xl font-normal text-white hover:text-neon-cyan transition-colors duration-200 py-4 hover:no-underline bg-black/40 px-3 rounded-md">
                {t("footerOurEsims")}
              </AccordionTrigger>
              <AccordionContent className="pb-8">
                <ul className="space-y-4 text-white/60 text-sm md:text-base pl-0">
                  <li><a href="/shop" className="hover:text-neon-cyan transition-colors duration-200 font-light block">{t("footerStore")}</a></li>
                  <li><a href="/shop?type=regional" className="hover:text-neon-cyan transition-colors duration-200 font-light block">{t("footerRegionalData")}</a></li>
                  <li>
                    <button 
                      onClick={() => setCompatibilityOpen(true)} 
                      className="hover:text-neon-cyan transition-colors duration-200 font-light block text-left"
                    >
                      {t("footerDeviceCompatibility")}
                    </button>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Explore */}
            <AccordionItem value="explore" className="border-0 will-change-auto" style={{ contain: 'layout style' }}>
              <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4"></div>
              <AccordionTrigger className="text-left text-lg md:text-xl font-normal text-white hover:text-neon-cyan transition-colors duration-200 py-4 hover:no-underline bg-black/40 px-3 rounded-md">
                {t("footerExplore")}
              </AccordionTrigger>
              <AccordionContent className="pb-8">
                <ul className="space-y-4 text-white/60 text-sm md:text-base pl-0">
                  <li><a href="/affiliate" className="hover:text-neon-cyan transition-colors duration-200 font-light block">{t("footerReferEarn")}</a></li>
                  <li><a href="/rewards" className="hover:text-neon-cyan transition-colors duration-200 font-light block">{t("footerLoyaltyPrograms")}</a></li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Get Help */}
            <AccordionItem value="help" className="border-0 will-change-auto" style={{ contain: 'layout style' }}>
              <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4"></div>
              <AccordionTrigger className="text-left text-lg md:text-xl font-normal text-white hover:text-neon-cyan transition-colors duration-200 py-4 hover:no-underline bg-black/40 px-3 rounded-md">
                {t("footerGetHelp")}
              </AccordionTrigger>
              <AccordionContent className="pb-8">
                <ul className="space-y-4 text-white/60 text-sm md:text-base pl-0">
                  <li><a href="/help" className="hover:text-neon-cyan transition-colors duration-200 font-light block">{t("footerContactUs")}</a></li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* About */}
            <AccordionItem value="about" className="border-0 will-change-auto" style={{ contain: 'layout style' }}>
              <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4"></div>
              <AccordionTrigger className="text-left text-lg md:text-xl font-normal text-white hover:text-neon-cyan transition-colors duration-200 py-4 hover:no-underline bg-black/40 px-3 rounded-md">
                {t("footerAbout")}
              </AccordionTrigger>
              <AccordionContent className="pb-8">
                <ul className="space-y-4 text-white/60 text-sm md:text-base pl-0">
                  <li><a href="/about" className="hover:text-neon-cyan transition-colors duration-200 font-light block">{t("footerAboutNomiqa")}</a></li>
                </ul>
              </AccordionContent>
              <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mt-4"></div>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      <CompatibilityChecker open={compatibilityOpen} onOpenChange={setCompatibilityOpen} />
    </section>
  );
});
