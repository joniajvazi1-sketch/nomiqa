import { useState } from "react";
import { useTranslation } from "@/contexts/TranslationContext";
import { Twitter, Instagram, Video, Youtube, Facebook, ChevronDown } from "lucide-react";
export const Footer = () => {
  const { t } = useTranslation();
  const [openSections, setOpenSections] = useState<string[]>([]);

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };
  
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
            <a href="https://twitter.com/nomiqa" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/[0.02] backdrop-blur-xl border border-white/10 flex items-center justify-center hover:border-neon-cyan/50 hover:bg-neon-cyan/10 hover:scale-110 transition-all duration-300 group" aria-label="X">
              <Twitter className="w-4 h-4 text-white/60 group-hover:text-neon-cyan transition-colors duration-300" />
            </a>
            <a href="https://instagram.com/nomiqa" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/[0.02] backdrop-blur-xl border border-white/10 flex items-center justify-center hover:border-neon-coral/50 hover:bg-neon-coral/10 hover:scale-110 transition-all duration-300 group" aria-label="Instagram">
              <Instagram className="w-4 h-4 text-white/60 group-hover:text-neon-coral transition-colors duration-300" />
            </a>
            <a href="https://youtube.com/@nomiqa" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/[0.02] backdrop-blur-xl border border-white/10 flex items-center justify-center hover:border-neon-orange/50 hover:bg-neon-orange/10 hover:scale-110 transition-all duration-300 group" aria-label="YouTube">
              <Youtube className="w-4 h-4 text-white/60 group-hover:text-neon-orange transition-colors duration-300" />
            </a>
            <a href="https://tiktok.com/@nomiqa" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/[0.02] backdrop-blur-xl border border-white/10 flex items-center justify-center hover:border-neon-violet/50 hover:bg-neon-violet/10 hover:scale-110 transition-all duration-300 group" aria-label="TikTok">
              <Video className="w-4 h-4 text-white/60 group-hover:text-neon-violet transition-colors duration-300" />
            </a>
            <a href="https://facebook.com/nomiqa" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/[0.02] backdrop-blur-xl border border-white/10 flex items-center justify-center hover:border-blue-500/50 hover:bg-blue-500/10 hover:scale-110 transition-all duration-300 group" aria-label="Facebook">
              <Facebook className="w-4 h-4 text-white/60 group-hover:text-blue-500 transition-colors duration-300" />
            </a>
          </div>
          <a href="/terms" className="text-white/60 hover:text-neon-cyan transition-colors duration-300 font-light text-xs md:text-sm inline-block">
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