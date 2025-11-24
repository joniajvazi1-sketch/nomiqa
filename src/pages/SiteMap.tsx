import { useTranslation } from "@/contexts/TranslationContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";

const SiteMap = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <SEO page="shop" />
      <Navbar />
      
      <div className="pt-32 pb-20 px-4 sm:px-6 md:px-8">
        <div className="container max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-light mb-4 bg-gradient-to-r from-neon-cyan via-white to-neon-violet bg-clip-text text-transparent">
              Site Navigation
            </h1>
            <p className="text-white/60 text-lg">
              Everything you need, organized for you
            </p>
          </div>

          {/* Sections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Our eSIMs */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/[0.05] transition-all duration-300">
              <h2 className="text-xl font-normal mb-6 text-white">
                {t("footerOurEsims")}
              </h2>
              <ul className="space-y-3 text-white/60">
                <li>
                  <a href="/shop" className="hover:text-neon-cyan transition-colors duration-300 font-light flex items-center group">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan/50 mr-3 group-hover:bg-neon-cyan transition-colors"></span>
                    {t("footerStore")}
                  </a>
                </li>
                <li>
                  <a href="/shop" className="hover:text-neon-cyan transition-colors duration-300 font-light flex items-center group">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan/50 mr-3 group-hover:bg-neon-cyan transition-colors"></span>
                    {t("footerUnlimitedData")}
                  </a>
                </li>
                <li>
                  <a href="/affiliate" className="hover:text-neon-cyan transition-colors duration-300 font-light flex items-center group">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan/50 mr-3 group-hover:bg-neon-cyan transition-colors"></span>
                    {t("footerReferEarn")}
                  </a>
                </li>
                <li>
                  <a href="/rewards" className="hover:text-neon-cyan transition-colors duration-300 font-light flex items-center group">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan/50 mr-3 group-hover:bg-neon-cyan transition-colors"></span>
                    {t("footerLoyaltyPrograms")}
                  </a>
                </li>
              </ul>
            </div>

            {/* Explore */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/[0.05] transition-all duration-300">
              <h2 className="text-xl font-normal mb-6 text-white">
                {t("footerExplore")}
              </h2>
              <ul className="space-y-3 text-white/60">
                <li>
                  <a href="/shop" className="hover:text-neon-cyan transition-colors duration-300 font-light flex items-center group">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-violet/50 mr-3 group-hover:bg-neon-violet transition-colors"></span>
                    {t("footerEsims")}
                  </a>
                </li>
                <li>
                  <a href="/getting-started" className="hover:text-neon-cyan transition-colors duration-300 font-light flex items-center group">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-violet/50 mr-3 group-hover:bg-neon-violet transition-colors"></span>
                    {t("footerDeviceCompatibility")}
                  </a>
                </li>
              </ul>
            </div>

            {/* Get Help */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/[0.05] transition-all duration-300">
              <h2 className="text-xl font-normal mb-6 text-white">
                {t("footerGetHelp")}
              </h2>
              <ul className="space-y-3 text-white/60">
                <li>
                  <a href="/help" className="hover:text-neon-cyan transition-colors duration-300 font-light flex items-center group">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-coral/50 mr-3 group-hover:bg-neon-coral transition-colors"></span>
                    {t("footerContactUs")}
                  </a>
                </li>
                <li>
                  <a href="/help" className="hover:text-neon-cyan transition-colors duration-300 font-light flex items-center group">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-coral/50 mr-3 group-hover:bg-neon-coral transition-colors"></span>
                    {t("footerHelp")}
                  </a>
                </li>
              </ul>
            </div>

            {/* About */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/[0.05] transition-all duration-300">
              <h2 className="text-xl font-normal mb-6 text-white">
                {t("footerAbout")}
              </h2>
              <ul className="space-y-3 text-white/60">
                <li>
                  <a href="/about" className="hover:text-neon-cyan transition-colors duration-300 font-light flex items-center group">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-orange/50 mr-3 group-hover:bg-neon-orange transition-colors"></span>
                    {t("footerAboutNomiqa")}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SiteMap;
