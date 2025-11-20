import { TrendingUp } from "lucide-react";
import solanaLogo from "@/assets/solana-logo.svg";
import phantomLogo from "@/assets/phantom-logo.png";
import meteoraLogo from "@/assets/meteora-logo.jpg";
import moonpayLogo from "@/assets/moonpay-logo.jpg";
import { useSolanaPrice } from "@/hooks/useSolanaPrice";
import { useTranslation } from "@/contexts/TranslationContext";

export const TrustPartners = () => {
  const { price, isLoading } = useSolanaPrice();
  const { t } = useTranslation();
  
  return (
    <section className="py-24 md:py-32 bg-gradient-to-br from-black/40 via-deep-space/60 to-black/40 border-y border-white/5 relative overflow-hidden">
      {/* Subtle premium decorations */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-cyan/3 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-violet/3 rounded-full blur-3xl"></div>
      
      <div className="container px-6 md:px-8 relative z-10">
        <div className="text-center mb-16 md:mb-20">
          <p className="text-white/50 uppercase tracking-[0.25em] text-xs md:text-sm font-light mb-4">
            {t("trustInfrastructureTag")}
          </p>
          <h3 className="text-3xl md:text-4xl lg:text-5xl font-light mb-5">
            <span className="bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent">
              {t("trustMainTitle")}
            </span>
          </h3>
          <p className="text-white/60 text-base md:text-lg font-light max-w-2xl mx-auto leading-relaxed">
            {t("trustSubtitle")}
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-6xl mx-auto">
          {/* Solana */}
          <div className="group flex flex-col items-center justify-center p-8 md:p-10 rounded-3xl bg-white/[0.02] backdrop-blur-xl border border-white/5 hover:border-white/10 transition-all duration-500 hover:bg-white/[0.04] hover-lift">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500">
              <img src={solanaLogo} alt="Solana" className="w-11 h-11 md:w-14 md:h-14" loading="lazy" />
            </div>
            <span className="text-white font-light text-lg md:text-xl mb-1">Solana</span>
            {!isLoading && price ? (
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-neon-cyan font-light text-sm md:text-base">${price.usd.toFixed(2)}</span>
                <TrendingUp className={`w-3.5 h-3.5 ${price.usd_24h_change >= 0 ? 'text-green-400' : 'text-red-400'}`} />
              </div>
            ) : (
              <span className="text-white/40 text-xs md:text-sm mt-2 font-light">{t("trustLightningFast")}</span>
            )}
          </div>
          
          {/* Phantom */}
          <div className="group flex flex-col items-center justify-center p-8 md:p-10 rounded-3xl bg-white/[0.02] backdrop-blur-xl border border-white/5 hover:border-white/10 transition-all duration-500 hover:bg-white/[0.04] hover-lift">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500">
              <img src={phantomLogo} alt="Phantom Wallet" className="w-11 h-11 md:w-14 md:h-14 rounded-xl" loading="lazy" />
            </div>
            <span className="text-white font-light text-lg md:text-xl mb-1">Phantom</span>
            <span className="text-white/40 text-xs md:text-sm mt-2 font-light">{t("trustTrustedWallet")}</span>
          </div>
          
          {/* Meteora */}
          <div className="group flex flex-col items-center justify-center p-8 md:p-10 rounded-3xl bg-white/[0.02] backdrop-blur-xl border border-white/5 hover:border-white/10 transition-all duration-500 hover:bg-white/[0.04] hover-lift">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500">
              <img src={meteoraLogo} alt="Meteora" className="w-11 h-11 md:w-14 md:h-14 rounded-xl" loading="lazy" />
            </div>
            <span className="text-white font-light text-lg md:text-xl mb-1">Meteora</span>
            <span className="text-white/40 text-xs md:text-sm mt-2 font-light">{t("trustDefiProtocol")}</span>
          </div>
          
          {/* MoonPay */}
          <div className="group flex flex-col items-center justify-center p-8 md:p-10 rounded-3xl bg-white/[0.02] backdrop-blur-xl border border-white/5 hover:border-white/10 transition-all duration-500 hover:bg-white/[0.04] hover-lift">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500">
              <img src={moonpayLogo} alt="MoonPay" className="w-11 h-11 md:w-14 md:h-14 rounded-xl" loading="lazy" />
            </div>
            <span className="text-white font-light text-lg md:text-xl mb-1">MoonPay</span>
            <span className="text-white/40 text-xs md:text-sm mt-2 font-light">{t("trustCryptoGateway")}</span>
          </div>
        </div>
      </div>
    </section>
  );
};