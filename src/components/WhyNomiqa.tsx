import { Shield, Zap, Globe } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";

export const WhyNomiqa = () => {
  const { t } = useTranslation();
  
  const values = [
    {
      icon: Shield,
      title: "Anonymous eSIMs",
      description: "No KYC, no tracking",
      gradient: "from-neon-cyan to-neon-violet",
    },
    {
      icon: Zap,
      title: "Crypto checkout in seconds",
      description: "Pay with crypto, activate instantly",
      gradient: "from-neon-violet to-neon-coral",
    },
    {
      icon: Globe,
      title: "Instant activation in 190+ countries",
      description: "Global coverage, local freedom",
      gradient: "from-neon-coral to-warm-sand",
    },
  ];

  return (
    <section className="relative py-24 md:py-32 bg-gradient-to-b from-background via-deep-space to-background overflow-hidden">
      {/* Decorative glows */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-neon-cyan/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-neon-coral/10 rounded-full blur-3xl"></div>
      
      <div className="container relative z-10 px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 font-display">
            <span className="bg-gradient-freedom bg-clip-text text-transparent">
              Why Nomiqa
            </span>
          </h2>
          <p className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto">
            Connection without compromise
          </p>
        </div>

        {/* Value cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {values.map((value, index) => (
            <div
              key={index}
              className="group relative p-8 rounded-3xl bg-card/40 backdrop-blur-sm border border-border/50 hover:border-neon-cyan/50 transition-all duration-500 hover:shadow-lg hover:shadow-neon-cyan/20"
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${value.gradient} p-0.5 mb-6`}>
                <div className="w-full h-full bg-card rounded-2xl flex items-center justify-center">
                  <value.icon className="w-8 h-8 text-neon-cyan" />
                </div>
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 text-foreground">
                {value.title}
              </h3>
              <p className="text-foreground/60">
                {value.description}
              </p>
            </div>
          ))}
        </div>

        {/* How it works - 3 steps */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold mb-4 font-display bg-gradient-digital bg-clip-text text-transparent">
              Get connected in minutes
            </h3>
            <p className="text-foreground/60 font-quote italic">
              No passport check. No SIM swap.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="relative text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-neon-cyan to-neon-violet flex items-center justify-center text-2xl font-bold text-white">
                1
              </div>
              <h4 className="text-lg font-semibold mb-2 text-neon-cyan">Choose Plan</h4>
              <p className="text-sm text-foreground/60">Select your destination and data amount</p>
            </div>

            <div className="relative text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-neon-violet to-neon-coral flex items-center justify-center text-2xl font-bold text-white">
                2
              </div>
              <h4 className="text-lg font-semibold mb-2 text-neon-violet">Scan QR</h4>
              <p className="text-sm text-foreground/60">Activate your eSIM with one scan</p>
            </div>

            <div className="relative text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-neon-coral to-warm-sand flex items-center justify-center text-2xl font-bold text-white">
                3
              </div>
              <h4 className="text-lg font-semibold mb-2 text-neon-coral">Connect Instantly 🌐</h4>
              <p className="text-sm text-foreground/60">You're online, anywhere in the world</p>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-lg font-quote italic text-warm-sand/80">
              Freedom that respects your privacy
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
