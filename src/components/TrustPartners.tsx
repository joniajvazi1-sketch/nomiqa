import { TrendingUp } from "lucide-react";
import solanaLogo from "@/assets/solana-logo.svg";
import phantomLogo from "@/assets/phantom-logo.png";
import meteoraLogo from "@/assets/meteora-logo.jpg";
import moonpayLogo from "@/assets/moonpay-logo.jpg";
import { useSolanaPrice } from "@/hooks/useSolanaPrice";
import { useTranslation } from "@/contexts/TranslationContext";

export const TrustPartners = () => {
  const {
    price,
    isLoading
  } = useSolanaPrice();
  const { t } = useTranslation();
  return <section className="py-16 md:py-20 bg-gradient-to-br from-midnight-blue via-deep-space to-midnight-blue border-y border-neon-cyan/10 relative overflow-hidden">
      {/* Decorative glows for richness */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-neon-cyan/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-neon-violet/5 rounded-full blur-3xl"></div>
      
      <div className="container px-4 relative z-10">
        <div className="text-center mb-10 md:mb-12">
          <p className="text-neon-cyan uppercase tracking-[0.3em] text-xs md:text-sm font-semibold mb-3">
            {t("trustInfrastructureTag")}
        </p>
          <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold font-display mb-3">
            <span className="bg-gradient-neon bg-clip-text text-transparent">
              {t("trustMainTitle")}
            </span>
          </h3>
          <p className="text-foreground/70 text-sm md:text-base max-w-2xl mx-auto">
            {t("trustSubtitle")}
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-6xl mx-auto">
          <div className="group flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl bg-card/40 backdrop-blur-sm border border-neon-cyan/20 hover:border-neon-cyan/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.2)]">
            <div className="w-14 h-14 md:w-20 md:h-20 rounded-xl bg-neon-cyan/5 flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300">
              <img src={solanaLogo} alt="Solana" className="w-10 h-10 md:w-14 md:h-14" loading="lazy" />
            </div>
            <span className="text-white font-bold text-base md:text-lg">Solana</span>
            {!isLoading && price ? <div className="flex items-center gap-1 mt-2">
                <span className="text-neon-cyan font-semibold text-sm md:text-base">${price.usd.toFixed(2)}</span>
                <TrendingUp className={`w-4 h-4 ${price.usd_24h_change >= 0 ? 'text-green-400' : 'text-red-400'}`} />
              </div> : <span className="text-foreground/60 text-xs md:text-sm mt-2">{t("trustLightningFast")}</span>}
          </div>
          
          <div className="group flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl bg-card/40 backdrop-blur-sm border border-neon-violet/20 hover:border-neon-violet/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]">
            <div className="w-14 h-14 md:w-20 md:h-20 rounded-xl bg-neon-violet/5 flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300">
              <img src={phantomLogo} alt="Phantom Wallet" className="w-10 h-10 md:w-14 md:h-14 rounded-xl" loading="lazy" />
            </div>
            <span className="text-white font-bold text-base md:text-lg">Phantom</span>
            <span className="text-foreground/60 text-xs md:text-sm mt-2">{t("trustTrustedWallet")}</span>
          </div>
          
          <div className="group flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl bg-card/40 backdrop-blur-sm border border-neon-pink/20 hover:border-neon-pink/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(236,72,153,0.2)]">
            <div className="w-14 h-14 md:w-20 md:h-20 rounded-xl bg-neon-pink/5 flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300">
              <img src={meteoraLogo} alt="Meteora" className="w-10 h-10 md:w-14 md:h-14 rounded-xl" loading="lazy" />
            </div>
            <span className="text-white font-bold text-base md:text-lg">Meteora</span>
            <span className="text-foreground/60 text-xs md:text-sm mt-2">{t("trustDefiProtocol")}</span>
          </div>
          
          <div className="group flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl bg-card/40 backdrop-blur-sm border border-neon-cyan/20 hover:border-neon-cyan/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.2)]">
            <div className="w-14 h-14 md:w-20 md:h-20 rounded-xl bg-neon-cyan/5 flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300">
              <img src={moonpayLogo} alt="MoonPay" className="w-10 h-10 md:w-14 md:h-14 rounded-xl" loading="lazy" />
            </div>
            <span className="text-white font-bold text-base md:text-lg">MoonPay</span>
            <span className="text-foreground/60 text-xs md:text-sm mt-2">{t("trustCryptoGateway")}</span>
          </div>
        </div>
      </div>
    </section>;
};