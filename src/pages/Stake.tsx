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
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-neon-violet/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-neon-coral/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        
        <div className="container max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-block mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-sunset opacity-30 blur-xl rounded-full"></div>
                <div className="relative bg-card/40 backdrop-blur-sm border border-neon-violet/30 px-6 py-3 rounded-full">
                  <span className="text-sm font-semibold bg-gradient-sunset bg-clip-text text-transparent">
                    Staking Platform Coming Soon
                  </span>
                </div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 font-display">
              <span className="block bg-gradient-sunset bg-clip-text text-transparent">
                Stake NMQ.
              </span>
              <span className="block bg-gradient-digital bg-clip-text text-transparent mt-2">
                Earn Data. Own Your Connection.
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-foreground/80 max-w-3xl mx-auto mb-4">
              Lock tokens to earn free data credits and affiliate rewards.
            </p>
            <p className="text-lg text-warm-sand/90 font-quote italic">
              Your travel, powered by Web3.
            </p>
          </div>

          {/* Staking Diagram */}
          <div className="mb-16 animate-scale-in">
            <Card className="bg-card/40 backdrop-blur-sm border-neon-violet/30">
              <CardHeader>
                <CardTitle className="text-2xl text-center bg-gradient-sunset bg-clip-text text-transparent">
                  3-Level Affiliate System
                </CardTitle>
                <CardDescription className="text-center">
                  Earn commissions on multiple levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-8">
                  {/* Level 1 */}
                  <div className="text-center relative">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-neon-cyan to-neon-violet flex items-center justify-center shadow-glow-cyan">
                      <Network className="w-12 h-12 text-white" />
                    </div>
                    <div className="text-3xl font-bold bg-gradient-digital bg-clip-text text-transparent mb-2">9%</div>
                    <p className="text-sm text-foreground/70">Level 1 Direct</p>
                  </div>
                  
                  {/* Arrow */}
                  <div className="hidden md:block text-neon-cyan/50 text-4xl">→</div>
                  
                  {/* Level 2 */}
                  <div className="text-center relative">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-neon-violet to-neon-coral flex items-center justify-center shadow-glow-violet">
                      <Network className="w-12 h-12 text-white" />
                    </div>
                    <div className="text-3xl font-bold bg-gradient-freedom bg-clip-text text-transparent mb-2">6%</div>
                    <p className="text-sm text-foreground/70">Level 2 Indirect</p>
                  </div>
                  
                  {/* Arrow */}
                  <div className="hidden md:block text-neon-coral/50 text-4xl">→</div>
                  
                  {/* Level 3 */}
                  <div className="text-center relative">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-neon-coral to-warm-sand flex items-center justify-center shadow-glow-coral">
                      <Network className="w-12 h-12 text-white" />
                    </div>
                    <div className="text-3xl font-bold bg-gradient-warmth bg-clip-text text-transparent mb-2">3%</div>
                    <p className="text-sm text-foreground/70">Level 3 Extended</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="group p-6 rounded-2xl bg-card/40 backdrop-blur-sm border border-border/50 hover:border-neon-cyan/50 transition-all duration-500 hover:shadow-lg hover:shadow-neon-cyan/20 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${benefit.gradient} p-0.5 mb-4`}>
                  <div className="w-full h-full bg-card rounded-xl flex items-center justify-center">
                    <benefit.icon className="w-7 h-7 text-neon-cyan" />
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2 text-foreground">
                  {benefit.title}
                </h3>
                <p className="text-sm text-foreground/60">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>

          {/* CTA Card */}
          <Card className="bg-gradient-to-br from-neon-violet/10 via-neon-coral/10 to-neon-cyan/10 border-neon-violet/30 backdrop-blur-sm">
            <CardContent className="pt-8 pb-8 text-center">
              <Coins className="w-16 h-16 text-neon-coral mx-auto mb-6 animate-float" />
              <h3 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-sunset bg-clip-text text-transparent">
                Be the First to Stake
              </h3>
              <p className="text-foreground/70 mb-6 max-w-2xl mx-auto">
                Sign up to be notified when our staking platform launches. Early stakers get bonus rewards.
              </p>
              <Button 
                size="lg"
                className="bg-neon-coral hover:bg-neon-coral/90 text-white shadow-glow-coral"
              >
                Notify Me at Launch
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}