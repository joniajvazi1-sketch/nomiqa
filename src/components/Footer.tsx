import { useState } from "react";
import { useTranslation } from "@/contexts/TranslationContext";
import { localizedPath } from "@/utils/localizedLinks";
import socialFacebook from "@/assets/social-facebook.png";
import socialInstagram from "@/assets/social-instagram.png";
import socialPinterest from "@/assets/social-pinterest.png";
import socialTiktok from "@/assets/social-tiktok.png";
import socialX from "@/assets/social-x.png";
import socialYoutube from "@/assets/social-youtube.png";

export const Footer = () => {
  const { t, language } = useTranslation();
  const [openSections, setOpenSections] = useState<string[]>([]);

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const socialLinks = [
    { href: "https://www.facebook.com/share/1ZfyMXTQfP/?mibextid=wwXIfr", icon: socialFacebook, label: "Facebook" },
    { href: "https://www.instagram.com/nomiqaesim?igsh=MWtjMDFkM3BjZ2t2aA%3D%3D&utm_source=qr", icon: socialInstagram, label: "Instagram" },
    { href: "https://pin.it/45dyQhPNk", icon: socialPinterest, label: "Pinterest" },
    { href: "https://www.tiktok.com/@nomiqaesim?_r=1&_t=ZN-91m8zWG0IVC", icon: socialTiktok, label: "TikTok" },
    { href: "https://x.com/nomiqaesim?s=11", icon: socialX, label: "X" },
    { href: "https://youtube.com/@nomiqaesim?si=zCWrU1r-I1sOR4C9", icon: socialYoutube, label: "YouTube" },
  ];
  
  return <footer className="relative bg-gradient-to-b from-black/60 via-deep-space/80 to-black/90 text-white overflow-hidden border-t border-white/10">
      {/* Premium decorative glows */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-cyan rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-violet rounded-full blur-3xl"></div>
      </div>
      
      <div className="container px-4 sm:px-6 md:px-8 relative z-10 py-12 md:py-16">
        {/* Logo */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-6xl md:text-8xl font-light bg-gradient-to-r from-neon-cyan via-white to-neon-violet bg-clip-text text-transparent">
            nomiqa
          </h2>
        </div>

        {/* Follow Us - Centered */}
        <div className="mb-12 md:mb-16 text-center">
          <h4 className="font-normal mb-4 text-white text-xl md:text-2xl">{t("footerFollowUs")}</h4>
          <div className="flex flex-wrap gap-3 justify-center mb-4">
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
                  className="w-10 h-10 object-cover"
                />
              </a>
            ))}
          </div>
          <a href={localizedPath("/terms", language)} className="text-white/60 hover:text-neon-cyan transition-colors duration-300 font-light text-xs md:text-sm inline-block">
            {t("footerTermsConditions")}
          </a>
        </div>
        
        {/* Copyright */}
        <div className="border-t border-white/10 pt-8 text-center">
          <p className="text-white/40 text-xs sm:text-sm font-light">
            {t("footerCopyright")}
          </p>
        </div>
      </div>
    </footer>;
};
