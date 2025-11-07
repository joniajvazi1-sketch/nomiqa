import explorerCelebration from "@/assets/explorer-celebration.jpg";
import { useTranslation } from "@/contexts/TranslationContext";

export const WhyNomiqa = () => {
  const { t } = useTranslation();
  
  return (
    <section className="py-20 bg-gradient-to-br from-midnight/5 via-background to-sand/20 relative overflow-hidden">
      {/* Signal orbit decorations */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-gradient-signal blur-3xl"></div>
      <div className="absolute bottom-20 left-10 w-80 h-80 bg-gradient-signal blur-3xl"></div>
      <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-cyan rounded-full animate-pulse"></div>
      <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-cyan rounded-full animate-pulse" style={{ animationDelay: "0.5s" }}></div>
      <div className="container px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto mb-20">
          <div className="text-center lg:text-left animate-fade-in-up">
            <p className="text-sm uppercase tracking-[0.3em] mb-4 text-cyan font-semibold">
              {t("archetypeLabel")}
            </p>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 uppercase tracking-tight leading-tight">
              <span className="bg-gradient-explorer bg-clip-text text-transparent">{t("whyNomiqaTitle")}</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-6 italic font-light">
              {t("whyNomiqaSubtitle")}
            </p>
            
            <div className="flex justify-center lg:justify-start mt-8">
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-signal blur-xl rounded-2xl"></div>
                <img 
                  src={explorerCelebration} 
                  alt="Explorer celebrating freedom and movement"
                  className="relative w-48 h-48 object-cover rounded-2xl shadow-shadow-signal border border-cyan/30"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-6 text-center lg:text-left animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto text-center md:text-left">
          <div className="group border border-border/50 bg-card/50 backdrop-blur-sm p-8 rounded-2xl hover:shadow-shadow-signal hover:border-cyan/50 transition-all duration-500 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="w-12 h-12 rounded-full bg-cyan/10 flex items-center justify-center mb-4 group-hover:bg-cyan/20 transition-colors mx-auto md:mx-0">
              <div className="w-6 h-6 rounded-full bg-cyan/50 group-hover:bg-cyan transition-colors"></div>
            </div>
            <h3 className="text-xl font-bold mb-3 text-foreground uppercase tracking-wide">{t("valueFreedom")}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("valueFreedomDesc")}
            </p>
          </div>
          
          <div className="group border border-border/50 bg-card/50 backdrop-blur-sm p-8 rounded-2xl hover:shadow-shadow-signal hover:border-cyan/50 transition-all duration-500 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <div className="w-12 h-12 rounded-full bg-cyan/10 flex items-center justify-center mb-4 group-hover:bg-cyan/20 transition-colors mx-auto md:mx-0">
              <div className="w-6 h-6 rounded-full bg-cyan/50 group-hover:bg-cyan transition-colors"></div>
            </div>
            <h3 className="text-xl font-bold mb-3 text-foreground uppercase tracking-wide">{t("valueBelonging")}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("valueBelongingDesc")}
            </p>
          </div>
          
          <div className="group border border-border/50 bg-card/50 backdrop-blur-sm p-8 rounded-2xl hover:shadow-shadow-signal hover:border-cyan/50 transition-all duration-500 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: "0.5s" }}>
            <div className="w-12 h-12 rounded-full bg-cyan/10 flex items-center justify-center mb-4 group-hover:bg-cyan/20 transition-colors mx-auto md:mx-0">
              <div className="w-6 h-6 rounded-full bg-cyan/50 group-hover:bg-cyan transition-colors"></div>
            </div>
            <h3 className="text-xl font-bold mb-3 text-foreground uppercase tracking-wide">{t("valueSovereignty")}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("valueSovereigntyDesc")}
            </p>
          </div>
          
          <div className="group border border-border/50 bg-card/50 backdrop-blur-sm p-8 rounded-2xl hover:shadow-shadow-signal hover:border-cyan/50 transition-all duration-500 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: "0.6s" }}>
            <div className="w-12 h-12 rounded-full bg-cyan/10 flex items-center justify-center mb-4 group-hover:bg-cyan/20 transition-colors mx-auto md:mx-0">
              <div className="w-6 h-6 rounded-full bg-cyan/50 group-hover:bg-cyan transition-colors"></div>
            </div>
            <h3 className="text-xl font-bold mb-3 text-foreground uppercase tracking-wide">{t("valueMovement")}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("valueMovementDesc")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};