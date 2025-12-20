import { Building2, Users, DollarSign, Network, Coins, Heart } from "lucide-react";

export const DePINAdvantage = () => {
  const traditionalTelcos = [
    { icon: DollarSign, text: "Expensive retail pricing" },
    { icon: Building2, text: "Centralized infrastructure" },
    { icon: Users, text: "Profits go to shareholders" },
  ];

  const nomiqaNetwork = [
    { icon: Coins, text: "Wholesale rates for all" },
    { icon: Network, text: "User-owned network" },
    { icon: Heart, text: "Rewards flow back to you" },
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Premium gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/50 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(0,255,200,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(139,92,246,0.08),transparent_50%)]" />
      
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,200,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,200,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      
      <div className="container px-4 relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <span className="inline-block px-5 py-2 rounded-full bg-white/[0.03] backdrop-blur-xl text-neon-cyan text-sm font-medium mb-6 border border-white/10 shadow-lg shadow-neon-cyan/5">
            The DePIN Advantage
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light font-display mb-6">
            <span className="bg-gradient-to-r from-neon-cyan via-white to-neon-violet bg-clip-text text-transparent font-semibold">
              Why Decentralized Wins
            </span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light">
            The old telecom model is broken. We're building something better—together.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Traditional Telcos */}
          <div className="relative group animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-orange-500/5 rounded-3xl blur-2xl opacity-50 group-hover:opacity-70 transition-opacity duration-500" />
            <div className="relative backdrop-blur-xl bg-white/[0.02] border border-white/10 rounded-3xl p-8 h-full shadow-2xl shadow-black/20 hover:border-red-500/20 transition-all duration-500">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-500/5 backdrop-blur-sm flex items-center justify-center border border-red-500/20">
                  <Building2 className="w-7 h-7 text-red-400" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground">Traditional Telcos</h3>
              </div>
              
              <div className="space-y-4">
                {traditionalTelcos.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div 
                      key={index}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] backdrop-blur-sm border border-red-500/10 hover:border-red-500/20 transition-all duration-300"
                    >
                      <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0 border border-red-500/10">
                        <Icon className="w-5 h-5 text-red-400" />
                      </div>
                      <span className="text-muted-foreground font-light">{item.text}</span>
                    </div>
                  );
                })}
              </div>

              {/* Centralized tower visual */}
              <div className="mt-10 flex justify-center">
                <div className="relative">
                  <div className="w-24 h-36 bg-gradient-to-t from-red-500/10 to-transparent rounded-t-2xl flex flex-col items-center justify-end pb-3 backdrop-blur-sm border border-red-500/10 border-b-0">
                    <div className="w-1.5 h-28 bg-gradient-to-t from-red-400/60 to-red-400/20 rounded-full" />
                    <div className="w-10 h-10 bg-red-400/20 rounded-full absolute top-3 animate-pulse border border-red-400/20" />
                    <div className="w-6 h-6 bg-red-400/40 rounded-full absolute top-5 animate-pulse" style={{ animationDelay: '0.5s' }} />
                  </div>
                  <div className="text-xs text-red-400/50 text-center mt-3 font-light tracking-wide">Centralized Tower</div>
                </div>
              </div>
            </div>
          </div>

          {/* Nomiqa Network */}
          <div className="relative group animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/10 to-nomiqa-teal/5 rounded-3xl blur-2xl opacity-50 group-hover:opacity-70 transition-opacity duration-500" />
            <div className="relative backdrop-blur-xl bg-white/[0.02] border border-white/10 rounded-3xl p-8 h-full shadow-2xl shadow-black/20 hover:border-neon-cyan/20 transition-all duration-500">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-neon-cyan/5 backdrop-blur-sm flex items-center justify-center border border-neon-cyan/20">
                  <Network className="w-7 h-7 text-neon-cyan" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground">The Nomiqa Network</h3>
              </div>
              
              <div className="space-y-4">
                {nomiqaNetwork.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div 
                      key={index}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] backdrop-blur-sm border border-neon-cyan/10 hover:border-neon-cyan/20 transition-all duration-300"
                    >
                      <div className="w-11 h-11 rounded-xl bg-neon-cyan/10 flex items-center justify-center flex-shrink-0 border border-neon-cyan/10">
                        <Icon className="w-5 h-5 text-neon-cyan" />
                      </div>
                      <span className="text-foreground font-light">{item.text}</span>
                    </div>
                  );
                })}
              </div>

              {/* Distributed mesh visual */}
              <div className="mt-10 flex justify-center">
                <div className="relative w-36 h-36">
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
                        className={`w-3.5 h-3.5 rounded-full bg-gradient-to-br from-neon-cyan to-nomiqa-teal shadow-lg shadow-neon-cyan/40 ${i === 5 ? 'w-5 h-5' : ''}`}
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
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-neon-cyan/50 whitespace-nowrap font-light tracking-wide">Distributed Mesh</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
