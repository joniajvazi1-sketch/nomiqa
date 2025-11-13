import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Coins, Rocket } from "lucide-react";

const Token = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Hero Section */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Coins className="w-6 h-6 text-primary animate-pulse" />
              <span className="text-lg font-semibold text-primary">$NOMIQA Token</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Coming Soon
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              The world's first crypto-enabled travel network is launching soon.
            </p>
          </div>

          {/* Visual Element */}
          <div className="relative py-16">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
            </div>
            <div className="relative z-10">
              <Rocket className="w-32 h-32 mx-auto text-primary animate-bounce" />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-4 max-w-2xl mx-auto">
            <p className="text-lg text-foreground">
              Get ready to earn rewards every time you activate or share your eSIM.
            </p>
            <p className="text-muted-foreground">
              $NOMIQA tokens will power the future of private, borderless connectivity — giving you more control, more rewards, and more freedom.
            </p>
          </div>

          {/* Coming Soon Badge */}
          <div className="pt-8">
            <div className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30">
              <p className="text-sm font-medium text-foreground">
                Stay tuned for the official launch announcement
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Token;
