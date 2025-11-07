import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import worldTravelers from "@/assets/world-travelers.jpg";
import { AnimatedHeroImage } from "./AnimatedHeroImage";

export const EarnSection = () => {
  const navigate = useNavigate();
  
  return (
    <section className="py-20 bg-nomiqa-green relative overflow-hidden">
      {/* Animated background shapes */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-nomiqa-orange rounded-full blur-3xl"></div>
      </div>
      
      {/* Happy illustration */}
      <div className="absolute right-10 top-1/2 -translate-y-1/2 hidden xl:block">
        <AnimatedHeroImage 
          src={worldTravelers} 
          alt="People around the world" 
          className="w-64 h-64 opacity-80"
        />
      </div>
      
      <div className="container px-4 relative z-10">
        <div className="text-center max-w-4xl mx-auto animate-fade-in-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white drop-shadow-lg">
            Earn with Staking & Affiliates
          </h2>
          
          <p className="text-lg md:text-xl mb-12 text-white/90">
            Unlock rewards by staking your Nomiqa tokens or sharing our platform through our
            affiliate program. Start earning today with secure, fast crypto transactions.
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center animate-bounce-in" style={{ animationDelay: "0.3s" }}>
            <Button 
              variant="hero" 
              size="xl"
              className="hover:scale-110 transition-transform duration-300 shadow-lg hover:shadow-glow-pink"
              onClick={() => navigate('/stake')}
            >
              Start Staking
            </Button>
            <Button 
              variant="outline" 
              size="xl"
              className="bg-white hover:bg-white/90 text-primary border-white hover:scale-110 transition-transform duration-300 shadow-lg"
              onClick={() => navigate('/affiliate')}
            >
              Join Affiliate Program
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
