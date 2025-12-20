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
    <section className="py-20 bg-background relative overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,200,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,200,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      
      <div className="container px-4 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-neon-cyan/10 text-neon-cyan text-sm font-medium mb-4 border border-neon-cyan/20">
            The DePIN Advantage
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Why Decentralized Wins
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            The old telecom model is broken. We're building something better—together.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Traditional Telcos */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-orange-500/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
            <div className="relative bg-card/50 backdrop-blur-sm border border-red-500/20 rounded-2xl p-8 h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Traditional Telcos</h3>
              </div>
              
              <div className="space-y-4">
                {traditionalTelcos.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div 
                      key={index}
                      className="flex items-center gap-4 p-4 rounded-xl bg-red-500/5 border border-red-500/10"
                    >
                      <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-red-400" />
                      </div>
                      <span className="text-muted-foreground">{item.text}</span>
                    </div>
                  );
                })}
              </div>

              {/* Centralized tower visual */}
              <div className="mt-8 flex justify-center">
                <div className="relative">
                  <div className="w-20 h-32 bg-gradient-to-t from-red-500/20 to-transparent rounded-t-lg flex flex-col items-center justify-end pb-2">
                    <div className="w-2 h-24 bg-red-400/40 rounded-full" />
                    <div className="w-8 h-8 bg-red-400/30 rounded-full absolute top-2 animate-pulse" />
                  </div>
                  <div className="text-xs text-red-400/60 text-center mt-2">Centralized Tower</div>
                </div>
              </div>
            </div>
          </div>

          {/* Nomiqa Network */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/10 to-nomiqa-teal/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
            <div className="relative bg-card/50 backdrop-blur-sm border border-neon-cyan/20 rounded-2xl p-8 h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-neon-cyan/10 flex items-center justify-center">
                  <Network className="w-6 h-6 text-neon-cyan" />
                </div>
                <h3 className="text-xl font-bold text-foreground">The Nomiqa Network</h3>
              </div>
              
              <div className="space-y-4">
                {nomiqaNetwork.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div 
                      key={index}
                      className="flex items-center gap-4 p-4 rounded-xl bg-neon-cyan/5 border border-neon-cyan/10"
                    >
                      <div className="w-10 h-10 rounded-lg bg-neon-cyan/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-neon-cyan" />
                      </div>
                      <span className="text-foreground">{item.text}</span>
                    </div>
                  );
                })}
              </div>

              {/* Distributed mesh visual */}
              <div className="mt-8 flex justify-center">
                <div className="relative w-32 h-32">
                  {/* Mesh nodes */}
                  {[
                    { x: '50%', y: '10%' },
                    { x: '85%', y: '35%' },
                    { x: '75%', y: '75%' },
                    { x: '25%', y: '75%' },
                    { x: '15%', y: '35%' },
                    { x: '50%', y: '50%' },
                  ].map((pos, i) => (
                    <div
                      key={i}
                      className="absolute w-3 h-3 bg-neon-cyan rounded-full animate-pulse"
                      style={{ 
                        left: pos.x, 
                        top: pos.y,
                        transform: 'translate(-50%, -50%)',
                        animationDelay: `${i * 0.2}s`
                      }}
                    >
                      <div className="absolute inset-0 bg-neon-cyan rounded-full animate-ping opacity-30" />
                    </div>
                  ))}
                  {/* Connection lines */}
                  <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
                    <line x1="50%" y1="10%" x2="85%" y2="35%" stroke="rgba(0,255,200,0.2)" strokeWidth="1" />
                    <line x1="85%" y1="35%" x2="75%" y2="75%" stroke="rgba(0,255,200,0.2)" strokeWidth="1" />
                    <line x1="75%" y1="75%" x2="25%" y2="75%" stroke="rgba(0,255,200,0.2)" strokeWidth="1" />
                    <line x1="25%" y1="75%" x2="15%" y2="35%" stroke="rgba(0,255,200,0.2)" strokeWidth="1" />
                    <line x1="15%" y1="35%" x2="50%" y2="10%" stroke="rgba(0,255,200,0.2)" strokeWidth="1" />
                    <line x1="50%" y1="50%" x2="50%" y2="10%" stroke="rgba(0,255,200,0.2)" strokeWidth="1" />
                    <line x1="50%" y1="50%" x2="85%" y2="35%" stroke="rgba(0,255,200,0.2)" strokeWidth="1" />
                    <line x1="50%" y1="50%" x2="75%" y2="75%" stroke="rgba(0,255,200,0.2)" strokeWidth="1" />
                    <line x1="50%" y1="50%" x2="25%" y2="75%" stroke="rgba(0,255,200,0.2)" strokeWidth="1" />
                    <line x1="50%" y1="50%" x2="15%" y2="35%" stroke="rgba(0,255,200,0.2)" strokeWidth="1" />
                  </svg>
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-neon-cyan/60 whitespace-nowrap">Distributed Mesh</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
