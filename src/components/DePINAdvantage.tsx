import { Building2, Users, DollarSign, Network, Coins, Heart } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";

export const DePINAdvantage = () => {
  const { t } = useTranslation();

  const traditionalTelcos = [
    { icon: DollarSign, textKey: "depinTraditional1" },
    { icon: Building2, textKey: "depinTraditional2" },
    { icon: Users, textKey: "depinTraditional3" },
  ];

  const nomiqaNetwork = [
    { icon: Coins, textKey: "depinNomiqa1" },
    { icon: Network, textKey: "depinNomiqa2" },
    { icon: Heart, textKey: "depinNomiqa3" },
  ];

  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Cleaner gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(var(--neon-cyan)/0.06),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--neon-violet)/0.06),transparent_50%)]" />
      
      <div className="container px-4 sm:px-6 relative z-10">
        <div className="text-center mb-10 md:mb-14 animate-fade-in">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-sm font-medium mb-5">
            {t("depinBadge")}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
            <span className="text-foreground">{t("depinHeadline")}</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("depinSubheadline")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-8 max-w-5xl mx-auto">
          {/* Traditional Telcos */}
          <div className="relative group animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-orange-500/5 rounded-2xl sm:rounded-3xl blur-2xl opacity-50 group-hover:opacity-70 transition-opacity duration-500" />
            <div className="relative backdrop-blur-xl bg-white/[0.02] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 h-full shadow-2xl shadow-black/20 hover:border-red-500/20 transition-all duration-500">
              <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-8">
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-red-500/20 to-red-500/5 backdrop-blur-sm flex items-center justify-center border border-red-500/20 flex-shrink-0">
                  <Building2 className="w-5 h-5 sm:w-7 sm:h-7 text-red-400" />
                </div>
                <h3 className="text-base sm:text-xl md:text-2xl font-semibold text-foreground leading-tight">{t("depinTraditionalTitle")}</h3>
              </div>
              
              <div className="space-y-2 sm:space-y-4">
                {traditionalTelcos.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div 
                      key={index}
                      className="flex items-center gap-2 sm:gap-4 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.02] backdrop-blur-sm border border-red-500/10 hover:border-red-500/20 transition-all duration-300"
                    >
                      <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0 border border-red-500/10">
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                      </div>
                      <span className="text-xs sm:text-sm md:text-base text-muted-foreground font-light leading-snug">{t(item.textKey)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Centralized tower visual */}
              <div className="mt-6 sm:mt-10 flex justify-center">
                <div className="relative">
                  <div className="w-16 h-24 sm:w-24 sm:h-36 bg-gradient-to-t from-red-500/10 to-transparent rounded-t-xl sm:rounded-t-2xl flex flex-col items-center justify-end pb-2 sm:pb-3 backdrop-blur-sm border border-red-500/10 border-b-0">
                    <div className="w-1 h-18 sm:w-1.5 sm:h-28 bg-gradient-to-t from-red-400/60 to-red-400/20 rounded-full" />
                    <div className="w-7 h-7 sm:w-10 sm:h-10 bg-red-400/20 rounded-full absolute top-2 sm:top-3 animate-pulse border border-red-400/20" />
                    <div className="w-4 h-4 sm:w-6 sm:h-6 bg-red-400/40 rounded-full absolute top-3 sm:top-5 animate-pulse" style={{ animationDelay: '0.5s' }} />
                  </div>
                  <div className="text-[10px] sm:text-xs text-red-400/50 text-center mt-2 sm:mt-3 font-light tracking-wide">{t("depinCentralizedTower")}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Nomiqa Network */}
          <div className="relative group animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/10 to-nomiqa-teal/5 rounded-2xl sm:rounded-3xl blur-2xl opacity-50 group-hover:opacity-70 transition-opacity duration-500" />
            <div className="relative backdrop-blur-xl bg-white/[0.02] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 h-full shadow-2xl shadow-black/20 hover:border-neon-cyan/20 transition-all duration-500">
              <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-8">
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-neon-cyan/5 backdrop-blur-sm flex items-center justify-center border border-neon-cyan/20 flex-shrink-0">
                  <Network className="w-5 h-5 sm:w-7 sm:h-7 text-neon-cyan" />
                </div>
                <h3 className="text-base sm:text-xl md:text-2xl font-semibold text-foreground leading-tight">{t("depinNomiqaTitle")}</h3>
              </div>
              
              <div className="space-y-2 sm:space-y-4">
                {nomiqaNetwork.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div 
                      key={index}
                      className="flex items-center gap-2 sm:gap-4 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.02] backdrop-blur-sm border border-neon-cyan/10 hover:border-neon-cyan/20 transition-all duration-300"
                    >
                      <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-neon-cyan/10 flex items-center justify-center flex-shrink-0 border border-neon-cyan/10">
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-neon-cyan" />
                      </div>
                      <span className="text-xs sm:text-sm md:text-base text-foreground font-light leading-snug">{t(item.textKey)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Distributed mesh visual */}
              <div className="mt-6 sm:mt-10 flex justify-center">
                <div className="relative w-24 h-24 sm:w-36 sm:h-36">
                  {/* Mesh nodes */}
                  {[
                    { x: '50%', y: '8%' },
                    { x: '88%', y: '35%' },
                    { x: '75%', y: '78%' },
                    { x: '25%', y: '78%' },
                    { x: '12%', y: '35%' },
                    { x: '50%', y: '50%' },
                  ].map((pos, i) => (
                    <div
                      key={i}
                      className="absolute"
                      style={{ 
                        left: pos.x, 
                        top: pos.y,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <div 
                        className={`w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full bg-gradient-to-br from-neon-cyan to-nomiqa-teal shadow-lg shadow-neon-cyan/40 ${i === 5 ? 'w-3.5 h-3.5 sm:w-5 sm:h-5' : ''}`}
                        style={{ animationDelay: `${i * 0.15}s` }}
                      >
                        <div className="absolute inset-0 rounded-full bg-neon-cyan animate-ping opacity-30" />
                      </div>
                    </div>
                  ))}
                  {/* Connection lines */}
                  <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
                    <defs>
                      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgba(0,255,200,0.3)" />
                        <stop offset="100%" stopColor="rgba(0,255,200,0.1)" />
                      </linearGradient>
                    </defs>
                    <line x1="50%" y1="8%" x2="88%" y2="35%" stroke="url(#lineGradient)" strokeWidth="1" />
                    <line x1="88%" y1="35%" x2="75%" y2="78%" stroke="url(#lineGradient)" strokeWidth="1" />
                    <line x1="75%" y1="78%" x2="25%" y2="78%" stroke="url(#lineGradient)" strokeWidth="1" />
                    <line x1="25%" y1="78%" x2="12%" y2="35%" stroke="url(#lineGradient)" strokeWidth="1" />
                    <line x1="12%" y1="35%" x2="50%" y2="8%" stroke="url(#lineGradient)" strokeWidth="1" />
                    <line x1="50%" y1="50%" x2="50%" y2="8%" stroke="rgba(0,255,200,0.2)" strokeWidth="1" />
                    <line x1="50%" y1="50%" x2="88%" y2="35%" stroke="rgba(0,255,200,0.2)" strokeWidth="1" />
                    <line x1="50%" y1="50%" x2="75%" y2="78%" stroke="rgba(0,255,200,0.2)" strokeWidth="1" />
                    <line x1="50%" y1="50%" x2="25%" y2="78%" stroke="rgba(0,255,200,0.2)" strokeWidth="1" />
                    <line x1="50%" y1="50%" x2="12%" y2="35%" stroke="rgba(0,255,200,0.2)" strokeWidth="1" />
                  </svg>
                  <div className="absolute -bottom-5 sm:-bottom-6 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs text-neon-cyan/50 whitespace-nowrap font-light tracking-wide">{t("depinDistributedMesh")}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};