import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { NetworkBackground } from "@/components/NetworkBackground";
import { Coins, Rocket, Sparkles, TrendingUp, Lock, Zap } from "lucide-react";
import { useEffect, useState, useRef } from "react";

const Token = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: Coins,
      title: "Earn Rewards",
      description: "Get rewarded with $NOMIQA tokens every time you activate or share your eSIM"
    },
    {
      icon: TrendingUp,
      title: "Stake & Grow",
      description: "Stake your tokens to earn passive rewards and unlock exclusive benefits"
    },
    {
      icon: Lock,
      title: "True Ownership",
      description: "Your tokens, your control. Built on Solana for security and speed"
    },
    {
      icon: Zap,
      title: "Instant Utility",
      description: "Redeem tokens for extra data, discounts, and premium features"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-deep-space to-black relative overflow-hidden">
      <NetworkBackground />
      <Navbar />
      
      <main className="relative z-10 pt-32 pb-20 px-4" ref={sectionRef}>
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className={`text-center space-y-8 mb-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300">
              <Coins className="w-6 h-6 text-neon-cyan animate-pulse" />
              <span className="text-lg font-light tracking-wider text-white/90">$NOMIQA Token</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extralight tracking-tight">
              <span className="bg-gradient-to-r from-white via-neon-cyan to-white bg-clip-text text-transparent">
                Coming Soon
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto font-light leading-relaxed">
              The world's first crypto-enabled travel network token.
              <br />
              <span className="text-neon-cyan">Earn. Stake. Travel freely.</span>
            </p>
          </div>

          {/* Visual Element */}
          <div className={`relative py-20 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-96 h-96 bg-neon-cyan/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute w-64 h-64 bg-neon-violet/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
            <div className="relative z-10 flex flex-col items-center gap-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/30 to-neon-violet/30 rounded-full blur-xl animate-pulse" />
                <Rocket className="w-32 h-32 text-neon-cyan relative z-10 animate-bounce" />
              </div>
              <div className="flex items-center gap-2 text-white/60 font-light">
                <Sparkles className="w-5 h-5 text-neon-cyan animate-pulse" />
                <span>Launching on Solana blockchain</span>
                <Sparkles className="w-5 h-5 text-neon-violet animate-pulse" />
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className={`grid md:grid-cols-2 gap-6 mb-16 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group relative bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl p-8 transition-all duration-500 hover:bg-white/[0.04] hover:scale-[1.02]"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-neon-violet/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center mb-6 group-hover:bg-white/[0.08] transition-all duration-300">
                    <feature.icon className="w-7 h-7 text-neon-cyan" />
                  </div>
                  <h3 className="text-xl font-light text-white mb-3 tracking-wide">{feature.title}</h3>
                  <p className="text-white/60 font-light leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className={`text-center space-y-6 max-w-3xl mx-auto mb-12 transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <p className="text-lg md:text-xl text-white/80 font-light leading-relaxed">
              $NOMIQA tokens will power the future of private, borderless connectivity — giving you more control, more rewards, and more freedom.
            </p>
            <p className="text-white/60 font-light">
              Be part of a decentralized network where your privacy is protected, your data is yours, and your participation is rewarded.
            </p>
          </div>

          {/* Coming Soon Badge */}
          <div className={`text-center transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-block relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/20 to-neon-violet/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500" />
              <div className="relative px-8 py-4 rounded-full bg-white/[0.05] backdrop-blur-xl border border-white/20 hover:border-white/30 transition-all duration-300">
                <p className="text-sm md:text-base font-light text-white/90 tracking-wider">
                  Stay tuned for the official launch announcement
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Token;
