import { TrendingUp } from "lucide-react";
import solanaLogo from "@/assets/solana-logo.svg";
import phantomLogo from "@/assets/phantom-logo.png";
import meteoraLogo from "@/assets/meteora-logo.jpg";
import moonpayLogo from "@/assets/moonpay-logo.jpg";
import { useSolanaPrice } from "@/hooks/useSolanaPrice";


export const TrustPartners = () => {
  const { price, isLoading } = useSolanaPrice();
  
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
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-5xl mx-auto">
          <div className="group flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl bg-card/30 backdrop-blur-sm border border-neon-cyan/10 hover:border-neon-cyan/30 transition-all">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform">
              <img src={solanaLogo} alt="Solana" className="w-8 h-8 md:w-12 md:h-12" />
            </div>
            <span className="text-foreground/70 font-semibold text-sm md:text-base">Solana</span>
            {!isLoading && price ? (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-foreground/50 text-xs">${price.usd.toFixed(2)}</span>
                <TrendingUp className={`w-3 h-3 ${price.usd_24h_change >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              </div>
            ) : (
              <span className="text-foreground/50 text-xs mt-1">Fast Payments</span>
            )}
          </div>
          
          <div className="group flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl bg-card/30 backdrop-blur-sm border border-neon-violet/10 hover:border-neon-violet/30 transition-all">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform">
              <img src={phantomLogo} alt="Phantom Wallet" className="w-8 h-8 md:w-12 md:h-12 rounded-xl" />
            </div>
            <span className="text-foreground/70 font-semibold text-sm md:text-base">Phantom</span>
            <span className="text-foreground/50 text-xs mt-1">Secure Wallet</span>
          </div>
          
          <div className="group flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl bg-card/30 backdrop-blur-sm border border-neon-pink/10 hover:border-neon-pink/30 transition-all">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform">
              <img src={meteoraLogo} alt="Meteora" className="w-8 h-8 md:w-12 md:h-12 rounded-xl" />
            </div>
            <span className="text-foreground/70 font-semibold text-sm md:text-base">Meteora</span>
            <span className="text-foreground/50 text-xs mt-1">Smart Contracts</span>
          </div>
          
          <div className="group flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl bg-card/30 backdrop-blur-sm border border-neon-cyan/10 hover:border-neon-cyan/30 transition-all">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform">
              <img src={moonpayLogo} alt="MoonPay" className="w-8 h-8 md:w-12 md:h-12 rounded-xl" />
            </div>
            <span className="text-foreground/70 font-semibold text-sm md:text-base">MoonPay</span>
            <span className="text-foreground/50 text-xs mt-1">Crypto Payments</span>
          </div>
        </div>
      </div>
    </section>
  );
};
