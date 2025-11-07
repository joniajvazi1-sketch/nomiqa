import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, TrendingUp, Shield, Zap, Users, Network } from "lucide-react";

export default function Stake() {
  const benefits = [
    {
      icon: TrendingUp,
      title: "High APY Returns",
      description: "Earn competitive rewards on your staked $NMQ tokens",
      gradient: "from-neon-cyan to-neon-violet",
    },
    {
      icon: Shield,
      title: "Secure Staking",
      description: "Non-custodial staking directly from your Phantom wallet",
      gradient: "from-neon-violet to-neon-coral",
    },
    {
      icon: Zap,
      title: "Instant Rewards",
      description: "Earn free data credits automatically as you stake",
      gradient: "from-neon-coral to-neon-orange",
    },
    {
      icon: Users,
      title: "Affiliate Boost",
      description: "Stakers get higher commission rates on referrals",
      gradient: "from-neon-orange to-warm-sand",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-deep-space to-background">
      <Navbar />
      
      {/* Hero Section - Coming Soon */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden min-h-[80vh] flex items-center">
        {/* Animated gradient orbs */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-neon-violet/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-neon-coral/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-cyan/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
        
        <div className="container max-w-6xl mx-auto relative z-10">
          <div className="text-center animate-fade-in-up">
            <div className="inline-block mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-sunset opacity-30 blur-xl rounded-full"></div>
                <div className="relative bg-card/40 backdrop-blur-sm border border-neon-violet/30 px-8 py-4 rounded-full">
                  <span className="text-lg font-semibold bg-gradient-sunset bg-clip-text text-transparent">
                    🚀 Coming Soon
                  </span>
                </div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 font-display">
              <span className="block bg-gradient-sunset bg-clip-text text-transparent">
                Stake $NOMIQA
              </span>
              <span className="block bg-gradient-digital bg-clip-text text-transparent mt-2">
                Earn Rewards
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-foreground/80 max-w-3xl mx-auto mb-8">
              Our staking platform is currently under development. 
              Lock tokens to earn rewards and exclusive benefits.
            </p>

            {/* Features Preview */}
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-16 mb-12">
              <div className="p-6 rounded-2xl bg-card/40 backdrop-blur-sm border border-neon-cyan/30">
                <TrendingUp className="w-12 h-12 text-neon-cyan mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2 text-neon-cyan">High APY</h3>
                <p className="text-sm text-foreground/70">Competitive staking rewards</p>
              </div>
              
              <div className="p-6 rounded-2xl bg-card/40 backdrop-blur-sm border border-neon-violet/30">
                <Zap className="w-12 h-12 text-neon-violet mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2 text-neon-violet">Free Data Credits</h3>
                <p className="text-sm text-foreground/70">Earn eSIM data as you stake</p>
              </div>
              
              <div className="p-6 rounded-2xl bg-card/40 backdrop-blur-sm border border-neon-coral/30">
                <Users className="w-12 h-12 text-neon-coral mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2 text-neon-coral">Affiliate Boost</h3>
                <p className="text-sm text-foreground/70">Higher referral commissions</p>
              </div>
            </div>

            {/* CTA */}
            <Card className="bg-gradient-to-br from-neon-violet/10 via-neon-coral/10 to-neon-cyan/10 border-neon-violet/30 backdrop-blur-sm max-w-2xl mx-auto">
              <CardContent className="pt-8 pb-8 text-center">
                <Coins className="w-16 h-16 text-neon-coral mx-auto mb-6 animate-float" />
                <h3 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-sunset bg-clip-text text-transparent">
                  Be the First to Know
                </h3>
                <p className="text-foreground/70 mb-6">
                  Sign up to be notified when staking goes live. Early stakers get bonus rewards.
                </p>
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-neon-coral to-neon-violet hover:opacity-90 text-white shadow-glow-coral"
                >
                  Notify Me at Launch
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}