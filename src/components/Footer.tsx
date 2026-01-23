import { useTranslation } from "@/contexts/TranslationContext";
import { Link } from "react-router-dom";
import socialFacebook from "@/assets/social-facebook.webp";
import socialInstagram from "@/assets/social-instagram.webp";
import socialYoutube from "@/assets/social-youtube.webp";

// Custom X (Twitter) logo component - SVG for crisp rendering
const XLogo = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// Custom TikTok logo component - SVG for crisp rendering
const TikTokLogo = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

export const Footer = () => {
  const { t } = useTranslation();

  const socialLinks = [
    { href: "https://www.facebook.com/share/1ZfyMXTQfP/?mibextid=wwXIfr", icon: socialFacebook, label: "Facebook" },
    { href: "https://www.instagram.com/nomiqaesim?igsh=MWtjMDFkM3BjZ2t2aA%3D%3D&utm_source=qr", icon: socialInstagram, label: "Instagram" },
    { href: "https://www.tiktok.com/@nomiqaesim?_r=1&_t=ZN-91m8zWG0IVC", icon: null, label: "TikTok", isTikTok: true },
    { href: "https://x.com/nomiqaesim?s=11", icon: null, label: "X", isX: true },
    { href: "https://youtube.com/@nomiqaesim?si=zCWrU1r-I1sOR4C9", icon: socialYoutube, label: "YouTube" },
  ];

  const quickLinks = [
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
                className="w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-300 overflow-hidden bg-white/10 hover:bg-white/20" 
                aria-label={social.label}
              >
                {'isX' in social && social.isX ? (
                  <XLogo />
                ) : 'isTikTok' in social && social.isTikTok ? (
                  <TikTokLogo />
                ) : (
                  <img 
                    src={social.icon as string} 
                    alt={social.label} 
                    width="40"
                    height="40"
                    className="w-10 h-10 object-cover"
                  />
                )}
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
