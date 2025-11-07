import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Heart, Shield, Users } from "lucide-react";

export const EasyCheckout = () => {
  const navigate = useNavigate();
  
  return (
    <section className="py-24 bg-gradient-to-b from-midnight-blue to-background relative overflow-hidden">
      {/* Neon decorative elements */}
      <div className="absolute top-10 left-10 w-80 h-80 bg-neon-violet/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-neon-cyan/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      
      <div className="container px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 animate-fade-in-up">
            <p className="text-neon-violet uppercase tracking-[0.3em] text-sm font-semibold mb-4">
              Our Story
            </p>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 font-display">
              <span className="bg-gradient-cyber bg-clip-text text-transparent">
                About Us and Our Motivation
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              We believe freedom is connection without borders. Built for the borderless generation who refuse to choose between connectivity and privacy.
            </p>
          </div>

          {/* Motivation Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 rounded-2xl bg-card/40 backdrop-blur-sm border border-neon-cyan/30 hover:border-neon-cyan/50 transition-all animate-fade-in-up">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-violet p-0.5 mb-4 mx-auto">
                <div className="w-full h-full bg-card rounded-xl flex items-center justify-center">
                  <Heart className="w-7 h-7 text-neon-cyan" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3 text-center text-neon-cyan">Privacy First</h3>
              <p className="text-sm text-foreground/70 text-center">
                Your data belongs to you. No KYC, no tracking, no surveillance. Just pure connection.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card/40 backdrop-blur-sm border border-neon-violet/30 hover:border-neon-violet/50 transition-all animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-neon-violet to-neon-coral p-0.5 mb-4 mx-auto">
                <div className="w-full h-full bg-card rounded-xl flex items-center justify-center">
                  <Shield className="w-7 h-7 text-neon-violet" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3 text-center text-neon-violet">Crypto Native</h3>
              <p className="text-sm text-foreground/70 text-center">
                Built on Web3 principles. Pay with crypto, own your identity, control your journey.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-card/40 backdrop-blur-sm border border-neon-coral/30 hover:border-neon-coral/50 transition-all animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-neon-coral to-warm-sand p-0.5 mb-4 mx-auto">
                <div className="w-full h-full bg-card rounded-xl flex items-center justify-center">
                  <Users className="w-7 h-7 text-neon-coral" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3 text-center text-neon-coral">Community Owned</h3>
              <p className="text-sm text-foreground/70 text-center">
                Powered by the people who use it. Earn rewards, share benefits, build together.
              </p>
            </div>
          </div>
          
          <div className="flex justify-center animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <Button 
              variant="neon"
              size="xl"
              onClick={() => navigate('/about')}
              className="font-display uppercase tracking-wide"
            >
              Learn More About Us
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};