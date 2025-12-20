import { UserPlus, Smartphone, Coins } from "lucide-react";

export const HowYouEarn = () => {
  const steps = [
    {
      icon: UserPlus,
      number: "01",
      title: "Join",
      description: "Create a free account in seconds. No ID or KYC required—just your email.",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Smartphone,
      number: "02", 
      title: "Verify",
      description: "Your phone automatically validates network quality and coverage in your area.",
      color: "from-neon-cyan to-nomiqa-teal",
    },
    {
      icon: Coins,
      number: "03",
      title: "Earn",
      description: "Get rewarded in tokens and credits for helping the network grow stronger.",
      color: "from-nomiqa-teal to-emerald-500",
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-background to-card/30 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-nomiqa-teal/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container px-4 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-nomiqa-teal/10 text-nomiqa-teal text-sm font-medium mb-4 border border-nomiqa-teal/20">
            How You Earn
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Turn Your Phone Into a Node
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Become part of the world's first user-owned connectivity network. It's simple, free, and rewarding.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative group">
                {/* Connection line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 left-full w-full h-0.5 bg-gradient-to-r from-neon-cyan/30 to-transparent z-0 -translate-y-1/2" />
                )}
                
                <div className="relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 h-full transition-all duration-500 hover:border-neon-cyan/30 hover:shadow-lg hover:shadow-neon-cyan/5 group-hover:-translate-y-1">
                  {/* Step number */}
                  <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-gradient-to-br from-neon-cyan to-nomiqa-teal flex items-center justify-center text-background font-bold text-lg shadow-lg shadow-neon-cyan/20">
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} p-0.5 mb-6`}>
                    <div className="w-full h-full rounded-2xl bg-background flex items-center justify-center">
                      <Icon className="w-8 h-8 text-neon-cyan" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-foreground mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>

                  {/* Decorative element */}
                  <div className="absolute bottom-4 right-4 w-20 h-20 bg-gradient-to-br from-neon-cyan/5 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom tagline */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            <span className="text-neon-cyan font-semibold">No crypto knowledge needed</span> — we handle the tech, you reap the rewards.
          </p>
        </div>
      </div>
    </section>
  );
};
