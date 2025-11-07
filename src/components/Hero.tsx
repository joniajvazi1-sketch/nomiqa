import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import nomiqaLogo from "@/assets/nomiqa-logo.jpg";
import { useTranslation } from "@/contexts/TranslationContext";

export const Hero = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  return (
    <section className="relative min-h-screen flex items-center bg-gradient-to-br from-background via-deep-space to-background overflow-hidden pt-20">
      {/* World map data lines - soft glowing effect */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan to-transparent"></div>
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-violet to-transparent"></div>
        <div className="absolute top-3/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-coral to-transparent"></div>
        <div className="absolute left-1/4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-neon-cyan/50 to-transparent"></div>
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-neon-violet/50 to-transparent"></div>
        <div className="absolute left-3/4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-neon-coral/50 to-transparent"></div>
      </div>
      
      {/* Sunrise gradient glow */}
      <div className="absolute top-20 left-10 md:left-20 w-64 md:w-96 h-64 md:h-96 bg-neon-cyan/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 md:right-20 w-80 md:w-[500px] h-80 md:h-[500px] bg-neon-coral/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 md:w-[600px] h-96 md:h-[600px] bg-neon-violet/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
      
      <div className="container relative z-10 px-4 py-16 md:py-32">
        <div className="max-w-5xl mx-auto text-center">
          {/* Logo */}
          <div className="mb-6 md:mb-8 flex justify-center animate-scale-in">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-neon opacity-30 blur-2xl rounded-full"></div>
              <img 
                src={nomiqaLogo} 
                alt="nomiqa - The world's first crypto eSIM"
                className="relative w-32 h-32 md:w-48 md:h-48 lg:w-64 lg:h-64 rounded-3xl shadow-glow-neon neon-glow"
              />
            </div>
          </div>
          
          {/* Main heading */}
          <div className="mb-6 md:mb-8 animate-fade-in-up">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-4 md:mb-6 font-display leading-tight">
              <span className="block bg-gradient-freedom bg-clip-text text-transparent">
                Connect Privately.
              </span>
              <span className="block bg-gradient-sunrise bg-clip-text text-transparent mt-2">
                Travel Freely.
              </span>
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-foreground/90 mb-3 max-w-3xl mx-auto px-4 leading-relaxed">
              Anonymous eSIMs. Crypto payments. Instant access in 190+ countries.
            </p>
            <p className="text-sm md:text-base lg:text-lg text-foreground/60 max-w-2xl mx-auto px-4">
              Freedom that respects privacy
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-10 md:mb-16 justify-center animate-fade-in-up px-4" style={{ animationDelay: "0.2s" }}>
            <Button 
              size="lg"
              onClick={() => navigate('/shop')}
              className="w-full sm:w-auto bg-neon-coral hover:bg-neon-coral/90 text-white font-semibold px-8 py-6 text-lg shadow-lg hover:shadow-neon-coral/50 transition-all"
            >
              Get Your eSIM →
            </Button>
            <Button 
              variant="outline"
              size="lg"
              onClick={() => {
                const coverageSection = document.getElementById('coverage');
                coverageSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10"
            >
              Explore Coverage
            </Button>
          </div>
          
          <div className="text-center mb-8 animate-fade-in-up px-4" style={{ animationDelay: "0.4s" }}>
            <p className="text-base md:text-lg text-warm-sand/80">
              Wherever you go, your signal follows.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};