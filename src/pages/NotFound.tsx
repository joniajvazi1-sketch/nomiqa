import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { SiteNavigation } from "@/components/SiteNavigation";
import { NetworkBackground } from "@/components/NetworkBackground";
import { useTranslation } from "@/contexts/TranslationContext";
import { localizedPath } from "@/utils/localizedLinks";
import { Button } from "@/components/ui/button";
import { Home, ShoppingBag, HelpCircle, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const { language, t } = useTranslation();

  // Detect if this looks like a former referral/username link (single path segment, no dots/extensions)
  const pathSegment = location.pathname.replace(/^\//, '').replace(/\/$/, '');
  const looksLikeReferralLink = pathSegment.length > 0 
    && !pathSegment.includes('/') 
    && !pathSegment.includes('.')
    && !/^(app|auth|shop|checkout|orders|privacy|terms|about|token|help|rewards|affiliate|roadmap|download|network|mobile-only|social-rewards|payment-success|getting-started|how-it-works|admin|deutsch|english|francais|espanol|portugues|russian|chinese|japanese|arabic|italiano)$/i.test(pathSegment);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-deep-space to-black relative overflow-hidden">
      <NetworkBackground />
      
      {/* Background decorations */}
      <div className="fixed inset-0 -z-10 overflow-hidden opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-neon-cyan/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-neon-violet/30 rounded-full blur-3xl" />
      </div>

      <main className="relative z-10 pt-32 pb-20 px-4 min-h-screen flex items-center justify-center">
        <div className="container mx-auto max-w-2xl text-center">
          {/* 404 Number */}
          <div className="mb-8">
            <span className="text-8xl md:text-9xl font-light bg-gradient-to-r from-neon-cyan via-white to-neon-violet bg-clip-text text-transparent">
              {looksLikeReferralLink ? '👋' : '404'}
            </span>
          </div>

          {/* Message */}
          <h1 className="text-2xl md:text-3xl font-light text-white mb-4">
            {looksLikeReferralLink 
              ? t("notFoundReferralTitle") 
              : t("notFoundTitle")}
          </h1>
          <p className="text-lg text-white/60 font-light mb-4">
            {looksLikeReferralLink 
              ? t("notFoundReferralDesc")
              : t("notFoundDescription")}
          </p>
          {looksLikeReferralLink && (
            <div className="bg-white/[0.05] backdrop-blur-xl border border-neon-cyan/20 rounded-xl p-6 mb-6 text-left max-w-md mx-auto">
              <p className="text-white/80 text-sm font-light mb-3">{t("notFoundReferralHowTo")}</p>
              <ol className="text-white/60 text-sm font-light space-y-2 list-decimal list-inside">
                <li>{t("notFoundReferralStep1")}</li>
                <li>{t("notFoundReferralStep2")}</li>
                <li>{t("notFoundReferralStep3")} <span className="text-neon-cyan font-medium">"{pathSegment}"</span></li>
              </ol>
            </div>
          )}

          {/* Primary CTA */}
          <Link to={localizedPath("/", language)} className="inline-block mb-10">
            <Button 
              size="lg"
              className="gap-2 bg-white/[0.05] backdrop-blur-xl border-2 border-neon-cyan/30 text-white hover:bg-neon-cyan/10 hover:border-neon-cyan/50 font-light rounded-xl transition-all duration-300 hover:scale-105"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("notFoundBackHome")}
            </Button>
          </Link>

          {/* Quick Links */}
          <div className="pt-8 border-t border-white/10">
            <p className="text-sm text-white/40 mb-6">{t("notFoundQuickLinks")}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to={localizedPath("/shop", language)}>
                <Button 
                  variant="ghost" 
                  className="gap-2 text-white/70 hover:text-white hover:bg-white/[0.05]"
                >
                  <ShoppingBag className="w-4 h-4" />
                  {t("shop")}
                </Button>
              </Link>
              <Link to={localizedPath("/help", language)}>
                <Button 
                  variant="ghost" 
                  className="gap-2 text-white/70 hover:text-white hover:bg-white/[0.05]"
                >
                  <HelpCircle className="w-4 h-4" />
                  {t("helpCenterTitle")}
                </Button>
              </Link>
              <Link to={localizedPath("/", language)}>
                <Button 
                  variant="ghost" 
                  className="gap-2 text-white/70 hover:text-white hover:bg-white/[0.05]"
                >
                  <Home className="w-4 h-4" />
                  {t("navHome")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <SiteNavigation />
    </div>
  );
};

export default NotFound;