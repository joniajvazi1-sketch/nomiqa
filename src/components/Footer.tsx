import { useTranslation } from "@/contexts/TranslationContext";
import { Twitter, Instagram, Send } from "lucide-react";

export const Footer = () => {
  const { t } = useTranslation();
  
  return (
    <footer className="bg-gradient-to-br from-midnight-blue via-deep-space to-midnight-blue text-foreground py-12 border-t border-neon-cyan/20 relative overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-cyan rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-violet rounded-full blur-3xl"></div>
      </div>
      
      <div className="container px-4 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8 text-left">
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-xl font-bold mb-4 bg-gradient-neon bg-clip-text text-transparent">nomiqa</h3>
            <p className="text-foreground/70 text-sm md:text-base mb-4">
              {t("footerTagline")}
            </p>
            <p className="text-xs text-foreground/50">
              Powered by Business Unlimited Worldwide Ltd.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-neon-cyan text-sm md:text-base">{t("products")}</h4>
            <ul className="space-y-2 text-foreground/70 text-sm">
              <li><a href="/shop" className="hover:text-neon-cyan transition-colors">{t("shop")}</a></li>
              <li><a href="#coverage" className="hover:text-neon-cyan transition-colors">Coverage</a></li>
              <li><a href="/stake" className="hover:text-neon-cyan transition-colors">Staking</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-neon-cyan text-sm md:text-base">{t("company")}</h4>
            <ul className="space-y-2 text-foreground/70 text-sm">
              <li><a href="/affiliate" className="hover:text-neon-cyan transition-colors">{t("affiliate")}</a></li>
              <li><a href="#" className="hover:text-neon-cyan transition-colors">NMQ Token</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-neon-cyan text-sm md:text-base">{t("support")}</h4>
            <ul className="space-y-2 text-foreground/70 text-sm">
              <li><a href="/getting-started" className="hover:text-neon-cyan transition-colors">Getting Started</a></li>
              <li><a href="#" className="hover:text-neon-cyan transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-neon-cyan transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-neon-cyan/20 pt-8">
          {/* Social Media Links */}
          <div className="flex justify-center gap-6 mb-6">
            <a 
              href="https://twitter.com/nomiqa" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-card/50 border border-neon-cyan/20 flex items-center justify-center hover:border-neon-cyan/50 hover:shadow-glow-cyan transition-all"
              aria-label="Twitter"
            >
              <Twitter className="w-5 h-5 text-neon-cyan" />
            </a>
            <a 
              href="https://instagram.com/nomiqa" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-card/50 border border-neon-pink/20 flex items-center justify-center hover:border-neon-pink/50 hover:shadow-glow-coral transition-all"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5 text-neon-pink" />
            </a>
            <a 
              href="https://t.me/nomiqa" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-card/50 border border-neon-blue/20 flex items-center justify-center hover:border-neon-blue/50 hover:shadow-glow-cyan transition-all"
              aria-label="Telegram"
            >
              <Send className="w-5 h-5 text-neon-blue" />
            </a>
          </div>
          
          <div className="text-center md:text-left">
            <p className="text-foreground/50 text-xs md:text-sm">
              © 2024 Business Unlimited Worldwide Ltd. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};