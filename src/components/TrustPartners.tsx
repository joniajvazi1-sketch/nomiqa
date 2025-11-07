import { Wallet, Coins, Shield, Zap } from "lucide-react";

export const TrustPartners = () => {
  return (
    <section className="py-12 md:py-16 bg-gradient-to-br from-midnight-blue via-deep-space to-midnight-blue border-y border-neon-cyan/10">
      <div className="container px-4">
        <div className="text-center mb-8 md:mb-12">
          <p className="text-neon-cyan/70 text-xs md:text-sm uppercase tracking-wider mb-2">
            Trusted By The Web3 Community
          </p>
          <h3 className="text-xl md:text-2xl font-bold bg-gradient-neon bg-clip-text text-transparent">
            Powered By Leading Web3 Infrastructure
          </h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-4xl mx-auto">
          <div className="group flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl bg-card/30 backdrop-blur-sm border border-neon-cyan/10 hover:border-neon-cyan/30 transition-all">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-neon-violet/20 to-neon-violet/5 flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform">
              <Coins className="w-6 h-6 md:w-8 md:h-8 text-neon-violet" />
            </div>
            <span className="text-foreground/70 font-semibold text-sm md:text-base">Solana</span>
            <span className="text-foreground/50 text-xs mt-1">Fast Payments</span>
          </div>
          
          <div className="group flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl bg-card/30 backdrop-blur-sm border border-neon-yellow/10 hover:border-neon-yellow/30 transition-all">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-neon-yellow/20 to-neon-yellow/5 flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform">
              <Wallet className="w-6 h-6 md:w-8 md:h-8 text-neon-yellow" />
            </div>
            <span className="text-foreground/70 font-semibold text-sm md:text-base">Binance Pay</span>
            <span className="text-foreground/50 text-xs mt-1">Secure Checkout</span>
          </div>
          
          <div className="group flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl bg-card/30 backdrop-blur-sm border border-neon-cyan/10 hover:border-neon-cyan/30 transition-all">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-cyan/5 flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6 md:w-8 md:h-8 text-neon-cyan" />
            </div>
            <span className="text-foreground/70 font-semibold text-sm md:text-base">Trust Wallet</span>
            <span className="text-foreground/50 text-xs mt-1">Safe Storage</span>
          </div>
          
          <div className="group flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl bg-card/30 backdrop-blur-sm border border-neon-pink/10 hover:border-neon-pink/30 transition-all">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-neon-pink/20 to-neon-pink/5 flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 md:w-8 md:h-8 text-neon-pink" />
            </div>
            <span className="text-foreground/70 font-semibold text-sm md:text-base">NowPayments</span>
            <span className="text-foreground/50 text-xs mt-1">Crypto Gateway</span>
          </div>
        </div>
      </div>
    </section>
  );
};
