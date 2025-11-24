import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslation } from "@/contexts/TranslationContext";

export const SiteNavigation = () => {
  const { t } = useTranslation();

  return (
    <section className="relative bg-gradient-to-b from-black/60 via-deep-space/80 to-black/90 text-white overflow-hidden border-t border-white/10">
      {/* Premium decorative glows */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-cyan rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-violet rounded-full blur-3xl"></div>
      </div>
      
      <div className="container px-4 sm:px-6 md:px-8 relative z-10 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {/* Our eSIMs */}
            <AccordionItem value="esims" className="border-0">
              <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4"></div>
              <AccordionTrigger className="text-left text-lg md:text-xl font-normal text-white hover:text-neon-cyan transition-colors py-4 hover:no-underline">
                {t("footerOurEsims")}
              </AccordionTrigger>
              <AccordionContent className="pb-8">
                <ul className="space-y-4 text-white/60 text-sm md:text-base pl-0">
                  <li><a href="/shop" className="hover:text-neon-cyan transition-colors duration-300 font-light block">{t("footerStore")}</a></li>
                  <li><a href="/shop" className="hover:text-neon-cyan transition-colors duration-300 font-light block">{t("footerUnlimitedData")}</a></li>
                  <li><a href="/affiliate" className="hover:text-neon-cyan transition-colors duration-300 font-light block">{t("footerReferEarn")}</a></li>
                  <li><a href="/rewards" className="hover:text-neon-cyan transition-colors duration-300 font-light block">{t("footerLoyaltyPrograms")}</a></li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Explore */}
            <AccordionItem value="explore" className="border-0">
              <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4"></div>
              <AccordionTrigger className="text-left text-lg md:text-xl font-normal text-white hover:text-neon-cyan transition-colors py-4 hover:no-underline">
                {t("footerExplore")}
              </AccordionTrigger>
              <AccordionContent className="pb-8">
                <ul className="space-y-4 text-white/60 text-sm md:text-base pl-0">
                  <li><a href="/shop" className="hover:text-neon-cyan transition-colors duration-300 font-light block">{t("footerEsims")}</a></li>
                  <li><a href="/getting-started" className="hover:text-neon-cyan transition-colors duration-300 font-light block">{t("footerDeviceCompatibility")}</a></li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Get Help */}
            <AccordionItem value="help" className="border-0">
              <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4"></div>
              <AccordionTrigger className="text-left text-lg md:text-xl font-normal text-white hover:text-neon-cyan transition-colors py-4 hover:no-underline">
                {t("footerGetHelp")}
              </AccordionTrigger>
              <AccordionContent className="pb-8">
                <ul className="space-y-4 text-white/60 text-sm md:text-base pl-0">
                  <li><a href="/help" className="hover:text-neon-cyan transition-colors duration-300 font-light block">{t("footerContactUs")}</a></li>
                  <li><a href="/help" className="hover:text-neon-cyan transition-colors duration-300 font-light block">{t("footerHelp")}</a></li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* About */}
            <AccordionItem value="about" className="border-0">
              <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4"></div>
              <AccordionTrigger className="text-left text-lg md:text-xl font-normal text-white hover:text-neon-cyan transition-colors py-4 hover:no-underline">
                {t("footerAbout")}
              </AccordionTrigger>
              <AccordionContent className="pb-8">
                <ul className="space-y-4 text-white/60 text-sm md:text-base pl-0">
                  <li><a href="/about" className="hover:text-neon-cyan transition-colors duration-300 font-light block">{t("footerAboutNomiqa")}</a></li>
                </ul>
              </AccordionContent>
              <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mt-4"></div>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </section>
  );
};
