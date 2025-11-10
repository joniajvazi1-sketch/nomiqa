import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import worldTravelers from "@/assets/world-travelers.jpg";
import { useTranslation } from "@/contexts/TranslationContext";
export const EarnSection = () => {
  const navigate = useNavigate();
  const {
    t
  } = useTranslation();
  return <section className="py-12 md:py-20 bg-gradient-to-br from-deep-space via-midnight-blue to-deep-space relative overflow-hidden">
      {/* Animated background shapes */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-64 md:w-72 h-64 md:h-72 bg-neon-coral rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-80 md:w-96 h-80 md:h-96 bg-neon-violet rounded-full blur-3xl animate-pulse" style={{
        animationDelay: '1s'
      }}></div>
      </div>
      
      {/* Happy illustration */}
      <div className="absolute right-10 top-1/2 -translate-y-1/2 hidden xl:block opacity-30">
        <img src={worldTravelers} alt="People around the world" className="w-64 h-64 object-contain rounded-2xl" />
      </div>
      
      <div className="container px-4 relative z-10">
        <div className="text-center max-w-4xl mx-auto animate-fade-in-up">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 bg-gradient-sunset bg-clip-text text-transparent">
            {t("earnTitle")}
          </h2>
          
          <p className="text-base md:text-lg lg:text-xl mb-6 md:mb-8 text-foreground/80 px-4">
            {t("earnDesc")}
          </p>
          
          <p className="text-sm md:text-base lg:text-lg mb-8 md:mb-12 text-neon-cyan/90 font-medium px-4">Lock $NOMIQA tokens to earn rewards. Your travel, powered by Web3.</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-bounce-in px-4" style={{
          animationDelay: "0.3s"
        }}>
            <Button variant="neon" size="lg" className="w-full sm:w-auto hover:scale-105 transition-transform duration-300" onClick={() => navigate('/stake')}>
              Start Staking
            </Button>
            <Button variant="cyber" size="lg" className="w-full sm:w-auto hover:scale-105 transition-transform duration-300" onClick={() => navigate('/affiliate')}>
              Join as Affiliate
            </Button>
          </div>
        </div>
      </div>
    </section>;
};