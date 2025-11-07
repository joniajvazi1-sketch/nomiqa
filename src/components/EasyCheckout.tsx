import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import happyTravelers from "@/assets/happy-travelers.jpg";

export const EasyCheckout = () => {
  const navigate = useNavigate();
  
  return (
    <section className="py-20 bg-gradient-to-br from-background via-nomiqa-cream/30 to-background relative overflow-hidden">
      {/* Happy decorative elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-nomiqa-green/20 rounded-full blur-2xl animate-float"></div>
      <div className="absolute bottom-10 right-10 w-24 h-24 bg-nomiqa-orange/20 rounded-full blur-2xl animate-float" style={{ animationDelay: "0.5s" }}></div>
      <div className="container px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          <div className="text-center lg:text-left">
            <p className="text-sm font-semibold mb-4 text-accent uppercase tracking-wide">
              EASY CHECKOUT
            </p>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Pay with Solana & Nomiqa token
            </h2>
          </div>
          
          <div className="text-center lg:text-left">
            <p className="text-lg mb-8">
              Buy eSIMs with Solana in 3 simple steps: 1. Copy the provided Solana address. 2.
              Pay securely with your Phantom Wallet. 3. Receive your eSIM instantly after
              confirmation.
            </p>
            
            <img 
              src={happyTravelers} 
              alt="Happy travelers celebrating"
              className="w-full max-w-2xl mx-auto lg:mx-0 mb-8 rounded-3xl shadow-shadow-warm animate-fade-in"
              style={{ animationDelay: "0.4s" }}
            />
            
            <div className="flex justify-center lg:justify-start">
              <Button 
                variant="hero" 
                size="lg"
                onClick={() => navigate('/shop')}
              >
                Shop
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
