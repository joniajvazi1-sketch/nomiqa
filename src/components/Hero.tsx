import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import heroSunsetBg from "@/assets/hero-sunset-background.png";
import { useTranslation } from "@/contexts/TranslationContext";
export const Hero = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  return <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img 
          src={heroSunsetBg} 
          alt="Sunset cityscape" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/60 via-deep-space/70 to-background/60"></div>
      </div>
      
      <div className="container relative z-10 px-4 py-16 md:py-32">
        <div className="max-w-5xl text-left md:text-left">
          {/* Main heading */}
          <div className="mb-8 md:mb-10 animate-fade-in-up">
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold font-display leading-tight">
              <span className="text-neon-cyan">Private.</span>{" "}
              <span className="text-neon-blue">Borderless.</span>{" "}
              <span className="bg-gradient-to-r from-neon-pink via-neon-coral to-warm-sand bg-clip-text text-transparent">Human.</span>
            </h1>
          </div>
          
          {/* Description text */}
          <div className="mb-8 md:mb-10 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <p className="text-xl md:text-2xl lg:text-3xl text-white/95 mb-2 leading-relaxed">
              Anonymous eSIMs that work in 190+ countries.
            </p>
            <p className="text-lg md:text-xl lg:text-2xl text-white/90 leading-relaxed">
              No ID, no tracking, no limits.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <Button 
              size="lg" 
              onClick={() => navigate('/shop')} 
              className="bg-neon-coral hover:bg-neon-coral/90 text-white font-semibold px-10 py-7 text-lg rounded-xl shadow-xl hover:shadow-neon-coral/50 transition-all"
            >
              Buy Now
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => navigate('/getting-started')} 
              className="border-2 border-neon-cyan/70 text-neon-cyan hover:bg-neon-cyan/10 px-8 py-7 text-lg rounded-xl backdrop-blur-sm"
            >
              Watch How It Works
            </Button>
          </div>
        </div>
      </div>
    </section>;
};