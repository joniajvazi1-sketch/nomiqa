import { useTranslation } from "@/contexts/TranslationContext";
import { Twitter, Instagram, Send, Youtube, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
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
        {/* Logo and Tagline */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-light mb-4 bg-gradient-to-r from-neon-cyan via-white to-neon-violet bg-clip-text text-transparent">
            nomiqa
          </h2>
          <p className="text-white/80 text-base md:text-lg mb-2 font-light">
            {t("footerTagline1")}
          </p>
          <p className="text-white/60 text-sm md:text-base font-light">
            {t("footerTagline2")}
          </p>
        </div>

        {/* Footer Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6 mb-12 md:mb-16 text-center md:text-left">
          {/* Our eSIMs */}
          <Collapsible open={openSections.includes('esims')} onOpenChange={() => toggleSection('esims')}>
            <CollapsibleTrigger className="w-full flex items-center justify-between font-normal py-3 text-white text-sm md:text-base hover:text-neon-cyan transition-colors">
              {t("footerOurEsims")}
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openSections.includes('esims') ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pb-4">
              <ul className="space-y-2.5 text-white/60 text-xs md:text-sm">
                <li><a href="/shop" className="hover:text-neon-cyan transition-colors duration-300 font-light">{t("footerStore")}</a></li>
                <li><a href="/shop" className="hover:text-neon-cyan transition-colors duration-300 font-light">{t("footerUnlimitedData")}</a></li>
                <li><a href="/affiliate" className="hover:text-neon-cyan transition-colors duration-300 font-light">{t("footerReferEarn")}</a></li>
                <li><a href="/rewards" className="hover:text-neon-cyan transition-colors duration-300 font-light">{t("footerLoyaltyPrograms")}</a></li>
              </ul>
            </CollapsibleContent>
          </Collapsible>

          {/* Explore */}
          <Collapsible open={openSections.includes('explore')} onOpenChange={() => toggleSection('explore')}>
            <CollapsibleTrigger className="w-full flex items-center justify-between font-normal py-3 text-white text-sm md:text-base hover:text-neon-cyan transition-colors">
              {t("footerExplore")}
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openSections.includes('explore') ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pb-4">
              <ul className="space-y-2.5 text-white/60 text-xs md:text-sm">
                <li><a href="/shop" className="hover:text-neon-cyan transition-colors duration-300 font-light">{t("footerEsims")}</a></li>
                <li><a href="/getting-started" className="hover:text-neon-cyan transition-colors duration-300 font-light">{t("footerDeviceCompatibility")}</a></li>
              </ul>
            </CollapsibleContent>
          </Collapsible>

          {/* Get Help */}
          <Collapsible open={openSections.includes('help')} onOpenChange={() => toggleSection('help')}>
            <CollapsibleTrigger className="w-full flex items-center justify-between font-normal py-3 text-white text-sm md:text-base hover:text-neon-cyan transition-colors">
              {t("footerGetHelp")}
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openSections.includes('help') ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pb-4">
              <ul className="space-y-2.5 text-white/60 text-xs md:text-sm">
                <li><a href="/help" className="hover:text-neon-cyan transition-colors duration-300 font-light">{t("footerContactUs")}</a></li>
                <li><a href="/help" className="hover:text-neon-cyan transition-colors duration-300 font-light">{t("footerHelp")}</a></li>
              </ul>
            </CollapsibleContent>
          </Collapsible>

          {/* About */}
          <Collapsible open={openSections.includes('about')} onOpenChange={() => toggleSection('about')}>
            <CollapsibleTrigger className="w-full flex items-center justify-between font-normal py-3 text-white text-sm md:text-base hover:text-neon-cyan transition-colors">
              {t("footerAbout")}
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openSections.includes('about') ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pb-4">
              <ul className="space-y-2.5 text-white/60 text-xs md:text-sm">
                <li><a href="/about" className="hover:text-neon-cyan transition-colors duration-300 font-light">{t("footerAboutNomiqa")}</a></li>
              </ul>
            </CollapsibleContent>
          </Collapsible>

          {/* Follow Us */}
          <Collapsible open={openSections.includes('follow')} onOpenChange={() => toggleSection('follow')}>
            <CollapsibleTrigger className="w-full flex items-center justify-between font-normal py-3 text-white text-sm md:text-base hover:text-neon-cyan transition-colors">
              {t("footerFollowUs")}
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openSections.includes('follow') ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pb-4">
              <div className="flex flex-wrap gap-3 justify-center md:justify-start mb-4">
                <a href="https://twitter.com/nomiqa" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/[0.02] backdrop-blur-xl border border-white/10 flex items-center justify-center hover:border-neon-cyan/50 hover:bg-neon-cyan/10 hover:scale-110 transition-all duration-300 group" aria-label="Twitter">
                  <Twitter className="w-4 h-4 text-white/60 group-hover:text-neon-cyan transition-colors duration-300" />
                </a>
                <a href="https://instagram.com/nomiqa" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/[0.02] backdrop-blur-xl border border-white/10 flex items-center justify-center hover:border-neon-coral/50 hover:bg-neon-coral/10 hover:scale-110 transition-all duration-300 group" aria-label="Instagram">
                  <Instagram className="w-4 h-4 text-white/60 group-hover:text-neon-coral transition-colors duration-300" />
                </a>
                <a href="https://youtube.com/@nomiqa" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/[0.02] backdrop-blur-xl border border-white/10 flex items-center justify-center hover:border-neon-orange/50 hover:bg-neon-orange/10 hover:scale-110 transition-all duration-300 group" aria-label="YouTube">
                  <Youtube className="w-4 h-4 text-white/60 group-hover:text-neon-orange transition-colors duration-300" />
                </a>
                <a href="https://tiktok.com/@nomiqa" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/[0.02] backdrop-blur-xl border border-white/10 flex items-center justify-center hover:border-neon-violet/50 hover:bg-neon-violet/10 hover:scale-110 transition-all duration-300 group" aria-label="TikTok">
                  <Send className="w-4 h-4 text-white/60 group-hover:text-neon-violet transition-colors duration-300" />
                </a>
              </div>
              <a href="/terms" className="text-white/60 hover:text-neon-cyan transition-colors duration-300 font-light text-xs md:text-sm inline-block">
                {t("footerTermsConditions")}
              </a>
            </CollapsibleContent>
          </Collapsible>
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