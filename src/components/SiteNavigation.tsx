import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslation } from "@/contexts/TranslationContext";
import { memo, useState } from "react";
import { Link } from "react-router-dom";
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
            {/* The Network - DePIN First */}
            <AccordionItem value="network" className="border-0 will-change-auto" style={{ contain: 'layout style' }}>
              <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4"></div>
              <AccordionTrigger className="text-left text-lg md:text-xl font-normal text-white hover:text-neon-cyan transition-colors duration-200 py-4 hover:no-underline bg-black/40 px-3 rounded-md">
                {t("footerTheNetwork")}
              </AccordionTrigger>
              <AccordionContent className="pb-8">
                <ul className="space-y-4 text-white/60 text-sm md:text-base pl-0">
                  <li><Link to="/getting-started" className="hover:text-neon-cyan transition-colors duration-200 font-light block">{t("footerHowDepinWorks")}</Link></li>
                  <li><Link to="/download" className="hover:text-neon-cyan transition-colors duration-200 font-light block">{t("footerDownloadApp")}</Link></li>
                  <li><Link to="/#datamarketplace" className="hover:text-neon-cyan transition-colors duration-200 font-light block">{t("footerDataMarketplace")}</Link></li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Earn With Nomiqa */}
            <AccordionItem value="earn" className="border-0 will-change-auto" style={{ contain: 'layout style' }}>
              <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4"></div>
              <AccordionTrigger className="text-left text-lg md:text-xl font-normal text-white hover:text-neon-cyan transition-colors duration-200 py-4 hover:no-underline bg-black/40 px-3 rounded-md">
                {t("footerEarnWithNomiqa")}
              </AccordionTrigger>
              <AccordionContent className="pb-8">
                <ul className="space-y-4 text-white/60 text-sm md:text-base pl-0">
                  <li><Link to="/affiliate" className="hover:text-neon-cyan transition-colors duration-200 font-light block">{t("footerReferEarn")}</Link></li>
                  <li><Link to="/rewards" className="hover:text-neon-cyan transition-colors duration-200 font-light block">{t("footerLoyaltyPrograms")}</Link></li>
                  <li><Link to="/token" className="hover:text-neon-cyan transition-colors duration-200 font-light block">{t("footerNomiqaToken")}</Link></li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Network Utilities (eSIMs) */}
            <AccordionItem value="utilities" className="border-0 will-change-auto" style={{ contain: 'layout style' }}>
              <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4"></div>
              <AccordionTrigger className="text-left text-lg md:text-xl font-normal text-white hover:text-neon-cyan transition-colors duration-200 py-4 hover:no-underline bg-black/40 px-3 rounded-md">
                {t("footerNetworkUtilities")}
              </AccordionTrigger>
              <AccordionContent className="pb-8">
                <ul className="space-y-4 text-white/60 text-sm md:text-base pl-0">
                  <li><Link to="/shop" className="hover:text-neon-cyan transition-colors duration-200 font-light block">{t("navEsimPlans")}</Link></li>
                  <li><Link to="/shop?type=regional" className="hover:text-neon-cyan transition-colors duration-200 font-light block">{t("footerRegionalData")}</Link></li>
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

            {/* Support */}
            <AccordionItem value="support" className="border-0 will-change-auto" style={{ contain: 'layout style' }}>
              <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4"></div>
              <AccordionTrigger className="text-left text-lg md:text-xl font-normal text-white hover:text-neon-cyan transition-colors duration-200 py-4 hover:no-underline bg-black/40 px-3 rounded-md">
                {t("footerSupport")}
              </AccordionTrigger>
              <AccordionContent className="pb-8">
                <ul className="space-y-4 text-white/60 text-sm md:text-base pl-0">
                  <li><Link to="/help" className="hover:text-neon-cyan transition-colors duration-200 font-light block">{t("footerContactUs")}</Link></li>
                  <li><Link to="/getting-started" className="hover:text-neon-cyan transition-colors duration-200 font-light block">{t("footerGettingStarted")}</Link></li>
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
                  <li><Link to="/about" className="hover:text-neon-cyan transition-colors duration-200 font-light block">{t("footerAboutNomiqa")}</Link></li>
                  <li><Link to="/privacy" className="hover:text-neon-cyan transition-colors duration-200 font-light block">{t("footerPrivacySecurity")}</Link></li>
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
