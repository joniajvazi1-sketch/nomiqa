import { useTranslation } from "@/contexts/TranslationContext";
import { Twitter, Instagram, Send } from "lucide-react";
export const Footer = () => {
  const {
    t
  } = useTranslation();
  return <footer className="relative bg-gradient-to-b from-black/60 via-deep-space/80 to-black/90 text-white overflow-hidden border-t border-white/10">
      {/* Premium decorative glows */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-cyan rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-violet rounded-full blur-3xl"></div>
      </div>
      
      <div className="container px-4 sm:px-6 md:px-8 relative z-10 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10 mb-10 md:mb-12 text-center md:text-left">
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-xl md:text-2xl font-light mb-4 md:mb-5 bg-gradient-to-r from-white via-white/95 to-white/90 bg-clip-text text-transparent">nomiqa</h3>
            <p className="text-white/60 text-sm md:text-base mb-4 font-light leading-relaxed">
              {t("footerTagline")}
            </p>
            <p className="text-xs text-white/40 font-light">
              Powered by Nomiqa.
            </p>
          </div>
          
          <div>
            <h4 className="font-light mb-4 md:mb-5 text-white text-sm md:text-base">{t("products")}</h4>
            <ul className="space-y-2 md:space-y-3 text-white/60 text-xs md:text-sm">
              <li><a href="/shop" className="hover:text-white transition-colors duration-300 font-light">{t("shop")}</a></li>
              <li><a href="#coverage" className="hover:text-white transition-colors duration-300 font-light">Coverage</a></li>
              <li><a href="/stake" className="hover:text-white transition-colors duration-300 font-light">Staking</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-light mb-4 md:mb-5 text-white text-sm md:text-base">{t("company")}</h4>
            <ul className="space-y-2 md:space-y-3 text-white/60 text-xs md:text-sm">
              <li><a href="/affiliate" className="hover:text-white transition-colors duration-300 font-light">{t("affiliate")}</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-300 font-light">NMQ Token</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-light mb-4 md:mb-5 text-white text-sm md:text-base">{t("support")}</h4>
            <ul className="space-y-2 md:space-y-3 text-white/60 text-xs md:text-sm">
              <li><a href="/getting-started" className="hover:text-white transition-colors duration-300 font-light">Getting Started</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-300 font-light">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-300 font-light">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8 md:pt-10">
          {/* Social Media Links */}
          <div className="flex justify-center gap-4 sm:gap-5 md:gap-6 mb-6 md:mb-8">
            <a href="https://twitter.com/nomiqa" target="_blank" rel="noopener noreferrer" className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-white/[0.02] backdrop-blur-xl border border-white/10 flex items-center justify-center hover:border-neon-cyan/50 hover:bg-white/5 hover:scale-110 transition-all duration-300" aria-label="Twitter">
              <Twitter className="w-4 h-4 sm:w-5 sm:h-5 text-neon-cyan" />
            </a>
            <a href="https://instagram.com/nomiqa" target="_blank" rel="noopener noreferrer" className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-white/[0.02] backdrop-blur-xl border border-white/10 flex items-center justify-center hover:border-neon-coral/50 hover:bg-white/5 hover:scale-110 transition-all duration-300" aria-label="Instagram">
              <Instagram className="w-4 h-4 sm:w-5 sm:h-5 text-neon-coral" />
            </a>
            <a href="https://t.me/nomiqa" target="_blank" rel="noopener noreferrer" className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-white/[0.02] backdrop-blur-xl border border-white/10 flex items-center justify-center hover:border-neon-violet/50 hover:bg-white/5 hover:scale-110 transition-all duration-300" aria-label="Telegram">
              <Send className="w-4 h-4 sm:w-5 sm:h-5 text-neon-violet" />
            </a>
          </div>
          
          <div className="text-center">
            <p className="text-white/80 text-sm sm:text-base md:text-lg mb-2 md:mb-3 font-light">
              Nomiqa — where privacy meets connection.
            </p>
            <p className="text-white/60 text-xs sm:text-sm md:text-base mb-3 md:mb-4 font-light italic">
              Powered by the people. Built for the borderless.
            </p>
            <p className="text-white/40 text-xs sm:text-sm font-light">
              © 2025 Nomiqa. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>;
};