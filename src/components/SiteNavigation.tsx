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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {/* Our eSIMs */}
            <div className="space-y-4">
              <h3 className="text-sm md:text-base font-semibold text-white mb-4">
                {t("footerOurEsims")}
              </h3>
              <div className="w-full h-px bg-gradient-to-r from-white/20 via-white/10 to-transparent mb-4"></div>
              <ul className="space-y-3 text-white/60 text-xs md:text-sm">
                <li><a href="/shop" className="hover:text-neon-cyan transition-colors duration-300 font-light">{t("footerStore")}</a></li>
                <li><a href="/shop" className="hover:text-neon-cyan transition-colors duration-300 font-light">{t("footerUnlimitedData")}</a></li>
                <li><a href="/affiliate" className="hover:text-neon-cyan transition-colors duration-300 font-light">{t("footerReferEarn")}</a></li>
                <li><a href="/rewards" className="hover:text-neon-cyan transition-colors duration-300 font-light">{t("footerLoyaltyPrograms")}</a></li>
              </ul>
            </div>

            {/* Explore */}
            <div className="space-y-4">
              <h3 className="text-sm md:text-base font-semibold text-white mb-4">
                {t("footerExplore")}
              </h3>
              <div className="w-full h-px bg-gradient-to-r from-white/20 via-white/10 to-transparent mb-4"></div>
              <ul className="space-y-3 text-white/60 text-xs md:text-sm">
                <li><a href="/shop" className="hover:text-neon-cyan transition-colors duration-300 font-light">{t("footerEsims")}</a></li>
                <li><a href="/getting-started" className="hover:text-neon-cyan transition-colors duration-300 font-light">{t("footerDeviceCompatibility")}</a></li>
              </ul>
            </div>

            {/* Get Help */}
            <div className="space-y-4">
              <h3 className="text-sm md:text-base font-semibold text-white mb-4">
                {t("footerGetHelp")}
              </h3>
              <div className="w-full h-px bg-gradient-to-r from-white/20 via-white/10 to-transparent mb-4"></div>
              <ul className="space-y-3 text-white/60 text-xs md:text-sm">
                <li><a href="/help" className="hover:text-neon-cyan transition-colors duration-300 font-light">{t("footerContactUs")}</a></li>
                <li><a href="/help" className="hover:text-neon-cyan transition-colors duration-300 font-light">{t("footerHelp")}</a></li>
              </ul>
            </div>

            {/* About */}
            <div className="space-y-4">
              <h3 className="text-sm md:text-base font-semibold text-white mb-4">
                {t("footerAbout")}
              </h3>
              <div className="w-full h-px bg-gradient-to-r from-white/20 via-white/10 to-transparent mb-4"></div>
              <ul className="space-y-3 text-white/60 text-xs md:text-sm">
                <li><a href="/about" className="hover:text-neon-cyan transition-colors duration-300 font-light">{t("footerAboutNomiqa")}</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
