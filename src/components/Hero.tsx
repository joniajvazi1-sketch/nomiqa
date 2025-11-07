import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import nomiqaLogo from "@/assets/nomiqa-logo.jpg";
import { useTranslation } from "@/contexts/TranslationContext";

export const Hero = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  return (
    <section className="relative min-h-screen flex items-center bg-gradient-to-br from-background via-midnight-blue/50 to-background overflow-hidden pt-20">
      {/* Animated neon orbs */}
      <div className="absolute top-20 left-10 md:left-20 w-64 md:w-96 h-64 md:h-96 bg-neon-cyan/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 md:right-20 w-80 md:w-[500px] h-80 md:h-[500px] bg-neon-violet/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 md:w-[600px] h-96 md:h-[600px] bg-neon-pink/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a2e_1px,transparent_1px),linear-gradient(to_bottom,#1a1a2e_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-10"></div>
      
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
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-bold mb-3 md:mb-4 font-display">
              <span className="block bg-gradient-neon bg-clip-text text-transparent leading-tight">
                The Signal of the
              </span>
              <span className="block bg-gradient-sunset bg-clip-text text-transparent leading-tight mt-1 md:mt-2">
                Moving Class
              </span>
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-neon-cyan/90 mb-2 max-w-2xl mx-auto px-4">
              The global eSIM for digital nomads, travelers & web3 citizens
            </p>
            <p className="text-sm md:text-base lg:text-lg text-foreground/70 max-w-2xl mx-auto px-4">
              The world's first crypto eSIM for digital freedom
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-10 md:mb-16 justify-center animate-fade-in-up px-4" style={{ animationDelay: "0.2s" }}>
            <Button 
              variant="neon"
              size="lg"
              onClick={() => navigate('/shop')}
              className="w-full sm:w-auto"
            >
              Get Your eSIM Now
            </Button>
            <Button 
              variant="cyber"
              size="lg"
              onClick={() => {
                const coverageSection = document.getElementById('coverage');
                coverageSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto"
            >
              See Global Coverage
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto animate-fade-in-up px-4" style={{ animationDelay: "0.4s" }}>
            <div className="group p-4 md:p-6 rounded-2xl bg-card/30 backdrop-blur-sm border border-neon-cyan/20 hover:border-neon-cyan/50 hover:shadow-glow-cyan transition-all duration-300">
              <div className="text-2xl md:text-3xl mb-1 md:mb-2 bg-gradient-to-br from-neon-cyan to-neon-blue bg-clip-text text-transparent font-display font-bold">
                Freedom
              </div>
              <p className="text-xs md:text-sm text-muted-foreground italic">
                Travel isn't escape. It's expansion.
              </p>
            </div>
            
            <div className="group p-4 md:p-6 rounded-2xl bg-card/30 backdrop-blur-sm border border-neon-violet/20 hover:border-neon-violet/50 hover:shadow-glow-violet transition-all duration-300">
              <div className="text-2xl md:text-3xl mb-1 md:mb-2 bg-gradient-to-br from-neon-violet to-neon-pink bg-clip-text text-transparent font-display font-bold">
                Belonging
              </div>
              <p className="text-xs md:text-sm text-muted-foreground italic">
                Home is everywhere you connect.
              </p>
            </div>
            
            <div className="group p-4 md:p-6 rounded-2xl bg-card/30 backdrop-blur-sm border border-neon-coral/20 hover:border-neon-coral/50 hover:shadow-glow-coral transition-all duration-300">
              <div className="text-2xl md:text-3xl mb-1 md:mb-2 bg-gradient-to-br from-neon-coral to-neon-orange bg-clip-text text-transparent font-display font-bold">
                Sovereignty
              </div>
              <p className="text-xs md:text-sm text-muted-foreground italic">
                Own your connection. Own your identity.
              </p>
            </div>
            
            <div className="group p-4 md:p-6 rounded-2xl bg-card/30 backdrop-blur-sm border border-neon-yellow/20 hover:border-neon-yellow/50 hover:shadow-glow-orange transition-all duration-300">
              <div className="text-2xl md:text-3xl mb-1 md:mb-2 bg-gradient-to-br from-neon-orange to-neon-yellow bg-clip-text text-transparent font-display font-bold">
                Movement
              </div>
              <p className="text-xs md:text-sm text-muted-foreground italic">
                You don't follow trends. You move worlds.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};