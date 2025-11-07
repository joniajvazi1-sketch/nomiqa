import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const EarnSection = () => {
  const navigate = useNavigate();
  
  return (
    <section className="py-20 bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20">
      <div className="container px-4">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Earn with Staking & Affiliates
          </h2>
          
          <p className="text-lg md:text-xl mb-12 text-white/90">
            Unlock rewards by staking your Nomiqa tokens or sharing our platform through our
            affiliate program. Start earning today with secure, fast crypto transactions.
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center">
            <Button 
              variant="hero" 
              size="xl"
              onClick={() => navigate('/stake')}
            >
              Start Staking
            </Button>
            <Button 
              variant="outline" 
              size="xl"
              className="bg-white hover:bg-white/90 text-primary border-white"
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
