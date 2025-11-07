import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const EasyCheckout = () => {
  const navigate = useNavigate();
  
  return (
    <section className="py-20 bg-background">
      <div className="container px-4">
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
