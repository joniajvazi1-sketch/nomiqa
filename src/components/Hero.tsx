import { ShoppingCart, Globe, Shield } from "lucide-react";
import heroImage from "@/assets/hero-happy.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-background">
      <div 
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/90" />
      
      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-foreground drop-shadow-sm animate-scale-in">
            Freedom has a new signal.
          </h1>
          
          <p className="text-xl md:text-2xl mb-12 text-foreground/80 max-w-2xl mx-auto">
            The first crypto-native eSIM with anonymous activation, wallet payments, and token rewards.
          </p>
          
          <div className="flex flex-wrap gap-8 justify-center items-center text-foreground/70 mb-12 text-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              <span>200+ Countries</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span>No KYC Required</span>
            </div>
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              <span>Crypto Payments</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};