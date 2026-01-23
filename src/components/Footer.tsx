import { useTranslation } from "@/contexts/TranslationContext";
import { Link } from "react-router-dom";
import socialFacebook from "@/assets/social-facebook.webp";
import socialInstagram from "@/assets/social-instagram.webp";
import socialPinterest from "@/assets/social-pinterest.webp";
import socialTiktok from "@/assets/social-tiktok.webp";
import socialX from "@/assets/social-x.webp";
import socialYoutube from "@/assets/social-youtube.webp";

export const Footer = () => {
  const { t } = useTranslation();

  const socialLinks = [
    { href: "https://www.facebook.com/share/1ZfyMXTQfP/?mibextid=wwXIfr", icon: socialFacebook, label: "Facebook" },
    { href: "https://www.instagram.com/nomiqaesim?igsh=MWtjMDFkM3BjZ2t2aA%3D%3D&utm_source=qr", icon: socialInstagram, label: "Instagram" },
    { href: "https://pin.it/45dyQhPNk", icon: socialPinterest, label: "Pinterest" },
    { href: "https://www.tiktok.com/@nomiqaesim?_r=1&_t=ZN-91m8zWG0IVC", icon: socialTiktok, label: "TikTok" },
    { href: "https://x.com/nomiqaesim?s=11", icon: socialX, label: "X" },
    { href: "https://youtube.com/@nomiqaesim?si=zCWrU1r-I1sOR4C9", icon: socialYoutube, label: "YouTube" },
  ];

  const quickLinks = [
    { to: "/leaderboard", label: "🔥 " + (t("referralChallenge") || "Referral Challenge") },
    { to: "/getting-started", label: t("footerHowDepinWorks") },
    { to: "/download", label: t("footerDownloadApp") },
    { to: "/shop", label: t("navEsimPlans") },
    { to: "/affiliate", label: t("footerReferEarn") },
    { to: "/rewards", label: t("footerLoyaltyPrograms") },
    { to: "/help", label: t("footerContactUs") },
  ];
  
  return (
    <footer className="relative bg-gradient-to-b from-black/60 via-deep-space/80 to-black/90 text-white overflow-hidden border-t border-white/10">
      {/* Premium decorative glows - reduced opacity for accessibility */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-cyan rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-violet rounded-full blur-3xl"></div>
      </div>
      
      <div className="container px-4 sm:px-6 md:px-8 relative z-10 py-12 md:py-16">
        {/* Logo */}
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-5xl md:text-7xl font-light bg-gradient-to-r from-neon-cyan via-white to-neon-violet bg-clip-text text-transparent">
            nomiqa
          </h2>
        </div>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 max-w-2xl mx-auto mb-10 md:mb-12">
          {quickLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-center py-3 px-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-neon-cyan/30 transition-all duration-300 text-white hover:text-white text-sm font-light"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Follow Us - Centered */}
        <div className="mb-10 md:mb-12 text-center">
          <h3 className="font-normal mb-4 text-white text-lg">{t("footerFollowUs")}</h3>
          <div className="flex flex-wrap gap-3 justify-center mb-6">
            {socialLinks.map((social) => (
              <a 
                key={social.label}
                href={social.href} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-300 overflow-hidden" 
                aria-label={social.label}
              >
                <img 
                  src={social.icon} 
                  alt={social.label} 
                  width="40"
                  height="40"
                  className="w-10 h-10 object-cover"
                />
              </a>
            ))}
          </div>
        </div>

        {/* Legal Links */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-8">
          <Link to="/terms" className="text-white/80 hover:text-neon-cyan transition-colors duration-300 font-light text-xs md:text-sm">
            {t("footerTermsConditions")}
          </Link>
          <Link to="/privacy" className="text-white/80 hover:text-neon-cyan transition-colors duration-300 font-light text-xs md:text-sm">
            {t("footerPrivacySecurity")}
          </Link>
          <Link to="/about" className="text-white/80 hover:text-neon-cyan transition-colors duration-300 font-light text-xs md:text-sm">
            {t("footerAboutNomiqa")}
          </Link>
        </div>
        
        {/* Copyright */}
        <div className="border-t border-white/10 pt-6 text-center">
          <p className="text-white/30 text-xs font-light">
            {t("footerCopyright")}
          </p>
        </div>
      </div>
    </footer>
  );
};
