import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/contexts/TranslationContext";

export const EasyCheckout = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  return (
    <section className="py-24 bg-gradient-to-b from-midnight-blue to-background relative overflow-hidden">
      {/* Neon decorative elements */}
      <div className="absolute top-10 left-10 w-80 h-80 bg-neon-violet/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-neon-cyan/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      
      <div className="container px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-12 animate-fade-in-up">
            <p className="text-neon-violet uppercase tracking-[0.3em] text-sm font-semibold mb-4">
              Ready to Connect
            </p>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 font-display">
              <span className="bg-gradient-cyber bg-clip-text text-transparent">
                Choose Your Plan
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("checkoutSubtitle")}
            </p>
          </div>
          
          <div className="flex justify-center animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <Button 
              variant="neon"
              size="xl"
              onClick={() => navigate('/shop')}
              className="font-display uppercase tracking-wide"
            >
              {t("shop")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};