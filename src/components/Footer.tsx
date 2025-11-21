import { useTranslation } from "@/contexts/TranslationContext";
import { Twitter, Instagram, Send, Youtube } from "lucide-react";
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
        {/* Logo and Tagline */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-light mb-4 bg-gradient-to-r from-neon-cyan via-white to-neon-violet bg-clip-text text-transparent">
            nomiqa
          </h2>
          <p className="text-white/80 text-base md:text-lg mb-2 font-light">
            Nomiqa — where privacy meets connection.
          </p>
          <p className="text-white/60 text-sm md:text-base font-light">
            Powered by Nomiqa.
          </p>
        </div>

        {/* Footer Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-6 mb-12 md:mb-16">
          {/* Our eSIMs */}
          <div>
            <h4 className="font-normal mb-4 text-white text-sm md:text-base">Our eSIMs</h4>
            <ul className="space-y-2.5 text-white/60 text-xs md:text-sm">
              <li><a href="/shop" className="hover:text-neon-cyan transition-colors duration-300 font-light">Store</a></li>
              <li><a href="/shop" className="hover:text-neon-cyan transition-colors duration-300 font-light">Unlimited Data</a></li>
              <li><a href="/affiliate" className="hover:text-neon-cyan transition-colors duration-300 font-light">Refer and Earn</a></li>
              <li><a href="/account" className="hover:text-neon-cyan transition-colors duration-300 font-light">Loyalty Programs</a></li>
            </ul>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-normal mb-4 text-white text-sm md:text-base">Explore</h4>
            <ul className="space-y-2.5 text-white/60 text-xs md:text-sm">
              <li><a href="/shop" className="hover:text-neon-cyan transition-colors duration-300 font-light">eSIMs</a></li>
              <li><a href="/getting-started" className="hover:text-neon-cyan transition-colors duration-300 font-light">Device Compatibility</a></li>
            </ul>
          </div>

          {/* Get Help */}
          <div>
            <h4 className="font-normal mb-4 text-white text-sm md:text-base">Get Help</h4>
            <ul className="space-y-2.5 text-white/60 text-xs md:text-sm">
              <li><a href="/help" className="hover:text-neon-cyan transition-colors duration-300 font-light">Contact Us</a></li>
              <li><a href="/help" className="hover:text-neon-cyan transition-colors duration-300 font-light">Help</a></li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="font-normal mb-4 text-white text-sm md:text-base">About</h4>
            <ul className="space-y-2.5 text-white/60 text-xs md:text-sm">
              <li><a href="/about" className="hover:text-neon-cyan transition-colors duration-300 font-light">About Nomiqa</a></li>
            </ul>
          </div>

          {/* Follow Us */}
          <div>
            <h4 className="font-normal mb-4 text-white text-sm md:text-base">Follow Us</h4>
            <div className="flex flex-wrap gap-3">
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
          </div>
        </div>
        
        {/* Copyright */}
        <div className="border-t border-white/10 pt-8 text-center">
          <p className="text-white/40 text-xs sm:text-sm font-light">
            © 2025 Nomiqa. All rights reserved.
          </p>
        </div>
      </div>
    </footer>;
};