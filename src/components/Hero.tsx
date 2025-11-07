import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import nomiqaLogo from "@/assets/nomiqa-logo.jpg";
import { useTranslation } from "@/contexts/TranslationContext";

export const Hero = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  return (
    <section className="relative min-h-screen flex items-center bg-gradient-to-br from-background via-midnight-blue/50 to-background overflow-hidden">
      {/* Animated neon orbs */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-neon-cyan/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-[500px] h-[500px] bg-neon-violet/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-pink/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a2e_1px,transparent_1px),linear-gradient(to_bottom,#1a1a2e_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-10"></div>
      
      <div className="container relative z-10 px-4 py-32">
        <div className="max-w-5xl mx-auto text-center">
          {/* Logo */}
          <div className="mb-8 flex justify-center animate-scale-in">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-neon opacity-30 blur-2xl rounded-full"></div>
              <img 
                src={nomiqaLogo} 
                alt="nomiqa - The world's first crypto eSIM"
                className="relative w-48 h-48 md:w-64 md:h-64 rounded-3xl shadow-glow-neon neon-glow"
              />
            </div>
          </div>
          
          {/* Main heading */}
          <div className="mb-6 animate-fade-in-up">
            <h1 className="text-6xl md:text-8xl font-bold mb-4 font-display">
              <span className="block bg-gradient-neon bg-clip-text text-transparent leading-tight">
                nomiqa
              </span>
            </h1>
            <p className="text-2xl md:text-4xl font-light text-soft-cream mb-2">
              The world's first crypto eSIM for digital freedom.
            </p>
            <p className="text-lg md:text-xl text-muted-foreground italic">
              The global eSIM for digital nomads, travelers & web3 citizens.
            </p>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-16 justify-center animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <Button 
              variant="neon"
              size="xl"
              onClick={() => navigate('/shop')}
            >
              Get Your eSIM Now
            </Button>
            <Button 
              variant="outline"
              size="xl"
              onClick={() => navigate('/getting-started')}
            >
              See Global Coverage
            </Button>
          </div>
          
          {/* Core values with color gradient */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <div className="group p-6 rounded-2xl bg-card/30 backdrop-blur-sm border border-neon-cyan/20 hover:border-neon-cyan/50 hover:shadow-glow-cyan transition-all duration-300">
              <div className="text-3xl mb-2 bg-gradient-to-br from-neon-cyan to-neon-blue bg-clip-text text-transparent font-display font-bold">
                Freedom
              </div>
              <p className="text-sm text-muted-foreground italic">
                Travel isn't escape. It's expansion.
              </p>
            </div>
            
            <div className="group p-6 rounded-2xl bg-card/30 backdrop-blur-sm border border-neon-violet/20 hover:border-neon-violet/50 hover:shadow-glow-violet transition-all duration-300">
              <div className="text-3xl mb-2 bg-gradient-to-br from-neon-violet to-neon-pink bg-clip-text text-transparent font-display font-bold">
                Belonging
              </div>
              <p className="text-sm text-muted-foreground italic">
                Home is everywhere you connect.
              </p>
            </div>
            
            <div className="group p-6 rounded-2xl bg-card/30 backdrop-blur-sm border border-neon-coral/20 hover:border-neon-coral/50 hover:shadow-glow-coral transition-all duration-300">
              <div className="text-3xl mb-2 bg-gradient-to-br from-neon-coral to-neon-orange bg-clip-text text-transparent font-display font-bold">
                Sovereignty
              </div>
              <p className="text-sm text-muted-foreground italic">
                Own your connection. Own your identity.
              </p>
            </div>
            
            <div className="group p-6 rounded-2xl bg-card/30 backdrop-blur-sm border border-neon-yellow/20 hover:border-neon-yellow/50 hover:shadow-glow-orange transition-all duration-300">
              <div className="text-3xl mb-2 bg-gradient-to-br from-neon-orange to-neon-yellow bg-clip-text text-transparent font-display font-bold">
                Movement
              </div>
              <p className="text-sm text-muted-foreground italic">
                You don't follow trends. You move worlds.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};