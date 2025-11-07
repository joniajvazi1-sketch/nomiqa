import celebratingPerson from "@/assets/celebrating-person.jpg";
import { useTranslation } from "@/contexts/TranslationContext";

export const WhyNomiqa = () => {
  const { t } = useTranslation();
  
  return (
    <section className="py-20 bg-gradient-to-br from-nomiqa-peach/20 via-background to-nomiqa-cream relative overflow-hidden">
      {/* Decorative shapes */}
      <div className="absolute top-20 right-10 w-32 h-32 bg-nomiqa-peach/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-10 w-40 h-40 bg-nomiqa-teal/20 rounded-full blur-3xl"></div>
      <div className="container px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          <div className="text-center lg:text-left animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
              Why Nomiqa: {t("whyNomiqaTitle")}
            </h2>
            
            <div className="flex justify-center lg:justify-start mt-8">
              <img 
                src={celebratingPerson} 
                alt="Happy person celebrating"
                className="w-48 h-48 object-contain rounded-2xl"
              />
            </div>
          </div>
          
          <div className="space-y-6 text-center lg:text-left animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <p className="text-lg">
              {t("whyNomiqaDesc1")}
            </p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto mt-16 text-center">
          <div className="border border-border bg-gradient-card p-8 rounded-2xl hover:shadow-shadow-warm transition-all duration-300 hover:scale-105 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <h3 className="text-2xl font-bold mb-4 text-primary">Unwavering Privacy</h3>
            <p className="text-muted-foreground">
              Nomiqa protects your data with advanced encryption and decentralized
              technologies. Enjoy eSIM activation and secure browsing, ensuring your personal
              information remains private and safe.
            </p>
          </div>
          
          <div className="border border-border bg-gradient-card p-8 rounded-2xl hover:shadow-shadow-warm transition-all duration-300 hover:scale-105 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <h3 className="text-2xl font-bold mb-4 text-primary">Effortless Simplicity</h3>
            <p className="text-muted-foreground">
              Our platform offers a user-friendly interface for purchasing and managing eSIMs
              with crypto. Buy Solana, use Solana Wallet, and purchase Nomiqa Tokens with ease,
              making Web3 accessible to everyone.
            </p>
          </div>
          
          <div className="border border-border bg-gradient-card p-8 rounded-2xl hover:shadow-shadow-warm transition-all duration-300 hover:scale-105 animate-fade-in" style={{ animationDelay: "0.5s" }}>
            <h3 className="text-2xl font-bold mb-4 text-primary">Earn with Nomiqa</h3>
            <p className="text-muted-foreground">
              Nomiqa empowers global Web3 travelers with seamless crypto checkout and staking
              rewards. Earn by locking tokens and enjoy a 3-level affiliate system, making your
              journey both rewarding and free.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
