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
        <div className="max-w-6xl mx-auto">
          <Accordion type="single" collapsible className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Our eSIMs */}
            <AccordionItem 
              value="esims"
              className="bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-neon-cyan/30 rounded-xl px-4 md:px-6 transition-all hover:bg-white/[0.04]"
            >
              <AccordionTrigger className="text-left text-sm md:text-base font-semibold text-white hover:text-neon-cyan transition-colors py-4">
                {t("footerOurEsims")}
              </AccordionTrigger>
              <AccordionContent className="space-y-2.5 text-white/60 text-xs md:text-sm pb-4">
                <a href="/shop" className="block hover:text-neon-cyan transition-colors duration-300 font-light">{t("footerStore")}</a>
                <a href="/shop" className="block hover:text-neon-cyan transition-colors duration-300 font-light">{t("footerUnlimitedData")}</a>
                <a href="/affiliate" className="block hover:text-neon-cyan transition-colors duration-300 font-light">{t("footerReferEarn")}</a>
                <a href="/rewards" className="block hover:text-neon-cyan transition-colors duration-300 font-light">{t("footerLoyaltyPrograms")}</a>
              </AccordionContent>
            </AccordionItem>

            {/* Explore */}
            <AccordionItem 
              value="explore"
              className="bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-neon-cyan/30 rounded-xl px-4 md:px-6 transition-all hover:bg-white/[0.04]"
            >
              <AccordionTrigger className="text-left text-sm md:text-base font-semibold text-white hover:text-neon-cyan transition-colors py-4">
                {t("footerExplore")}
              </AccordionTrigger>
              <AccordionContent className="space-y-2.5 text-white/60 text-xs md:text-sm pb-4">
                <a href="/shop" className="block hover:text-neon-cyan transition-colors duration-300 font-light">{t("footerEsims")}</a>
                <a href="/getting-started" className="block hover:text-neon-cyan transition-colors duration-300 font-light">{t("footerDeviceCompatibility")}</a>
              </AccordionContent>
            </AccordionItem>

            {/* Get Help */}
            <AccordionItem 
              value="help"
              className="bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-neon-cyan/30 rounded-xl px-4 md:px-6 transition-all hover:bg-white/[0.04]"
            >
              <AccordionTrigger className="text-left text-sm md:text-base font-semibold text-white hover:text-neon-cyan transition-colors py-4">
                {t("footerGetHelp")}
              </AccordionTrigger>
              <AccordionContent className="space-y-2.5 text-white/60 text-xs md:text-sm pb-4">
                <a href="/help" className="block hover:text-neon-cyan transition-colors duration-300 font-light">{t("footerContactUs")}</a>
                <a href="/help" className="block hover:text-neon-cyan transition-colors duration-300 font-light">{t("footerHelp")}</a>
              </AccordionContent>
            </AccordionItem>

            {/* About */}
            <AccordionItem 
              value="about"
              className="bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-neon-cyan/30 rounded-xl px-4 md:px-6 transition-all hover:bg-white/[0.04]"
            >
              <AccordionTrigger className="text-left text-sm md:text-base font-semibold text-white hover:text-neon-cyan transition-colors py-4">
                {t("footerAbout")}
              </AccordionTrigger>
              <AccordionContent className="space-y-2.5 text-white/60 text-xs md:text-sm pb-4">
                <a href="/about" className="block hover:text-neon-cyan transition-colors duration-300 font-light">{t("footerAboutNomiqa")}</a>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </section>
  );
};
