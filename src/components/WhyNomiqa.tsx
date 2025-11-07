import { useTranslation } from "@/contexts/TranslationContext";

export const WhyNomiqa = () => {
  const { t } = useTranslation();
  
  return (
    <section className="py-24 bg-gradient-to-b from-background to-midnight-blue relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 right-10 w-80 h-80 bg-gradient-glow blur-3xl opacity-50"></div>
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-gradient-glow blur-3xl opacity-50"></div>
      
      <div className="container px-4 relative z-10">
        <div className="text-center mb-16 max-w-4xl mx-auto animate-fade-in-up">
          <p className="text-neon-cyan uppercase tracking-[0.3em] text-sm font-semibold mb-4">
            The Signal of The Moving Class
          </p>
          <h2 className="text-5xl md:text-6xl font-bold mb-6 font-display">
            <span className="bg-gradient-neon bg-clip-text text-transparent">
              Why Nomiqa?
            </span>
          </h2>
          <p className="text-xl text-muted-foreground italic font-light">
            {t("whyNomiqaSubtitle")}
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          <div className="group relative bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm border border-neon-cyan/20 p-8 rounded-3xl hover:border-neon-cyan/50 hover:shadow-glow-cyan transition-all duration-500 hover:-translate-y-2 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-blue flex items-center justify-center mb-6 shadow-glow-cyan group-hover:scale-110 transition-transform duration-300">
                <div className="w-8 h-8 rounded-full bg-white/90"></div>
              </div>
              <h3 className="text-2xl font-bold mb-3 bg-gradient-to-br from-neon-cyan to-neon-blue bg-clip-text text-transparent font-display uppercase tracking-wide">
                {t("valueFreedom")}
              </h3>
              <p className="text-foreground/80 text-sm leading-relaxed">
                {t("valueFreedomDesc")}
              </p>
            </div>
          </div>
          
          <div className="group relative bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm border border-neon-violet/20 p-8 rounded-3xl hover:border-neon-violet/50 hover:shadow-glow-violet transition-all duration-500 hover:-translate-y-2 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-neon-violet/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-violet to-neon-pink flex items-center justify-center mb-6 shadow-glow-violet group-hover:scale-110 transition-transform duration-300">
                <div className="w-8 h-8 rounded-full bg-white/90"></div>
              </div>
              <h3 className="text-2xl font-bold mb-3 bg-gradient-to-br from-neon-violet to-neon-pink bg-clip-text text-transparent font-display uppercase tracking-wide">
                {t("valueBelonging")}
              </h3>
              <p className="text-foreground/80 text-sm leading-relaxed">
                {t("valueBelongingDesc")}
              </p>
            </div>
          </div>
          
          <div className="group relative bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm border border-neon-coral/20 p-8 rounded-3xl hover:border-neon-coral/50 hover:shadow-glow-coral transition-all duration-500 hover:-translate-y-2 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-neon-coral/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-coral to-neon-orange flex items-center justify-center mb-6 shadow-glow-coral group-hover:scale-110 transition-transform duration-300">
                <div className="w-8 h-8 rounded-full bg-white/90"></div>
              </div>
              <h3 className="text-2xl font-bold mb-3 bg-gradient-to-br from-neon-coral to-neon-orange bg-clip-text text-transparent font-display uppercase tracking-wide">
                {t("valueSovereignty")}
              </h3>
              <p className="text-foreground/80 text-sm leading-relaxed">
                {t("valueSovereigntyDesc")}
              </p>
            </div>
          </div>
          
          <div className="group relative bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm border border-neon-orange/20 p-8 rounded-3xl hover:border-neon-orange/50 hover:shadow-glow-orange transition-all duration-500 hover:-translate-y-2 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-neon-orange/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-orange to-neon-yellow flex items-center justify-center mb-6 shadow-glow-orange group-hover:scale-110 transition-transform duration-300">
                <div className="w-8 h-8 rounded-full bg-white/90"></div>
              </div>
              <h3 className="text-2xl font-bold mb-3 bg-gradient-to-br from-neon-orange to-neon-yellow bg-clip-text text-transparent font-display uppercase tracking-wide">
                {t("valueMovement")}
              </h3>
              <p className="text-foreground/80 text-sm leading-relaxed">
                {t("valueMovementDesc")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};