import { Button } from "@/components/ui/button";
import { ShoppingCart, Globe, Shield } from "lucide-react";
import heroImage from "@/assets/hero-bg.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-hero">
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white">
            Freedom has a new signal.
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-2xl mx-auto">
            The first crypto-native eSIM with anonymous activation, wallet payments, and token rewards.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button variant="hero" size="xl">
              <ShoppingCart className="mr-2" />
              Browse Plans
            </Button>
            <Button variant="outline" size="xl" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              <Shield className="mr-2" />
              How It Works
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-8 justify-center items-center text-white/80">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-accent" />
              <span>200+ Countries</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent" />
              <span>No KYC Required</span>
            </div>
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-accent" />
              <span>Crypto Payments</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};