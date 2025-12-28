import { UserPlus, Smartphone, Coins } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";

export const HowYouEarn = () => {
  const { t } = useTranslation();
  
  const steps = [
    {
      icon: UserPlus,
      number: "01",
      titleKey: "howYouEarnStep1Title",
      descriptionKey: "howYouEarnStep1Desc",
    },
    {
      icon: Smartphone,
      number: "02", 
      titleKey: "howYouEarnStep2Title",
      descriptionKey: "howYouEarnStep2Desc",
    },
    {
      icon: Coins,
      number: "03",
      titleKey: "howYouEarnStep3Title",
      descriptionKey: "howYouEarnStep3Desc",
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Premium gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/20 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(0,255,200,0.06),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(139,92,246,0.06),transparent_50%)]" />

      <div className="container px-4 relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <span className="inline-block px-5 py-2 rounded-full bg-white/[0.03] backdrop-blur-xl text-nomiqa-teal text-sm font-medium mb-6 border border-white/10 shadow-lg shadow-nomiqa-teal/5">
            {t("howYouEarnBadge")}
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light font-display mb-6">
            <span className="bg-gradient-to-r from-neon-cyan via-white to-neon-violet bg-clip-text text-transparent font-semibold">
              {t("howYouEarnTitle")}
            </span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light">
            {t("howYouEarnSubtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative group animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                {/* Connection line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 left-full w-full h-px bg-gradient-to-r from-neon-cyan/30 via-neon-cyan/10 to-transparent z-0 -translate-y-1/2" />
                )}
                
                <div className="relative backdrop-blur-xl bg-white/[0.02] border border-white/10 rounded-3xl p-8 h-full shadow-2xl shadow-black/20 transition-all duration-500 hover:border-neon-cyan/20 hover:shadow-neon-cyan/5 group-hover:-translate-y-1">
                  {/* Step number */}
                  <div className="absolute -top-4 -right-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-cyan to-nomiqa-teal flex items-center justify-center text-background font-bold text-lg shadow-xl shadow-neon-cyan/30 border border-white/20">
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-nomiqa-teal/10 backdrop-blur-sm p-0.5 mb-6 border border-neon-cyan/20">
                    <div className="w-full h-full rounded-2xl bg-background/80 flex items-center justify-center">
                      <Icon className="w-8 h-8 text-neon-cyan" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-semibold text-foreground mb-3">{t(step.titleKey)}</h3>
                  <p className="text-muted-foreground leading-relaxed font-light">{t(step.descriptionKey)}</p>

                  {/* Decorative glow */}
                  <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-br from-neon-cyan/5 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom tagline */}
        <div className="text-center mt-14 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="inline-block px-6 py-3 rounded-full bg-white/[0.02] backdrop-blur-xl border border-white/10">
            <p className="text-muted-foreground font-light">
              <span className="text-neon-cyan font-medium">{t("howYouEarnTagline")}</span> — {t("howYouEarnTaglineEnd")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
