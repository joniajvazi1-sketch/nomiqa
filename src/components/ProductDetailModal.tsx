import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ShoppingCart, HandCoins, Wifi, Calendar, Globe, Zap, Shield, Clock, Smartphone } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { getTranslatedCountryName } from "@/utils/countryTranslations";
import * as CountryFlags from 'country-flag-icons/react/3x2';
import { CompatibilityChecker } from "./CompatibilityChecker";
import { useState } from "react";

interface ProductDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
  onAddToCart: (product: any) => void;
  onReferEarn: (product: any) => void;
}

export const ProductDetailModal = ({ 
  open, 
  onOpenChange, 
  product,
  onAddToCart,
  onReferEarn 
}: ProductDetailModalProps) => {
  const { language, t } = useTranslation();
  const [compatibilityOpen, setCompatibilityOpen] = useState(false);

  if (!product) return null;

  const getCountryFlag = (countryCode: string) => {
    const FlagComponent = (CountryFlags as any)[countryCode];
    return FlagComponent ? <FlagComponent className="w-16 h-12 rounded shadow-lg" /> : null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-deep-space/98 via-black/95 to-deep-space/98 backdrop-blur-2xl border-neon-cyan/20">
        {/* Premium background decorations */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-neon-cyan/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-neon-violet/30 rounded-full blur-3xl"></div>
        </div>

        <DialogHeader className="relative z-10">
          <div className="flex items-start gap-4 mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-neon-cyan/20 rounded blur-md"></div>
              {getCountryFlag(product.country_code)}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl md:text-3xl mb-2 bg-gradient-to-r from-neon-cyan via-white to-neon-violet bg-clip-text text-transparent font-light">
                {getTranslatedCountryName(product.country_code, language)}
              </DialogTitle>
              <p className="text-white/60 font-light">{product.name}</p>
              {product.is_popular && (
                <Badge className="mt-3 bg-gradient-to-r from-neon-coral to-neon-orange text-white border-0 shadow-glow-coral font-light">
                  {t('popular')}
                </Badge>
              )}
            </div>
            <div className="text-right">
              <div className="text-3xl md:text-4xl font-semibold bg-gradient-to-r from-white via-neon-cyan to-white bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(6,182,212,0.4)]">
                ${product.price_usd.toFixed(2)}
              </div>
              <p className="text-xs text-white/50 mt-2 font-light">{t('oneTimePayment')}</p>
            </div>
          </div>
        </DialogHeader>

        {/* Main Features Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
          <div className="p-5 rounded-xl bg-gradient-to-br from-neon-cyan/10 to-neon-cyan/5 border border-neon-cyan/20 hover:border-neon-cyan/40 transition-all duration-300">
            <div className="flex items-center gap-2 mb-3">
              <Wifi className="h-5 w-5 text-neon-cyan" />
              <span className="font-light text-white/80">{t('data')}</span>
            </div>
            <p className="text-2xl md:text-3xl font-extralight text-white">{product.data_amount}</p>
          </div>

          <div className="p-5 rounded-xl bg-gradient-to-br from-neon-violet/10 to-neon-violet/5 border border-neon-violet/20 hover:border-neon-violet/40 transition-all duration-300">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-5 w-5 text-neon-violet" />
              <span className="font-light text-white/80">{t('validity')}</span>
            </div>
            <p className="text-2xl md:text-3xl font-extralight text-white">{product.validity_days} {t('days')}</p>
          </div>
        </div>

        {/* Detailed Features */}
        <div className="space-y-3 mb-8 relative z-10">
          <h3 className="font-light text-lg mb-4 text-white">{t('planDetails')}</h3>
          
          {product.features?.coverage && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-neon-cyan/30 transition-all duration-300">
              <Globe className="h-5 w-5 text-neon-cyan mt-0.5 shrink-0" />
              <div>
                <p className="font-normal text-white">{t('coverage')}</p>
                <p className="text-sm text-white/60 font-light mt-1">{product.features.coverage}</p>
              </div>
            </div>
          )}

          {product.features?.speed && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-neon-cyan/30 transition-all duration-300">
              <Zap className="h-5 w-5 text-neon-cyan mt-0.5 shrink-0" />
              <div>
                <p className="font-normal text-white">{t('networkSpeed')}</p>
                <p className="text-sm text-white/60 font-light mt-1">{product.features.speed}</p>
              </div>
            </div>
          )}

          {product.features?.activation && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-neon-cyan/30 transition-all duration-300">
              <Clock className="h-5 w-5 text-neon-cyan mt-0.5 shrink-0" />
              <div>
                <p className="font-normal text-white">{t('activation')}</p>
                <p className="text-sm text-white/60 font-light mt-1">{product.features.activation}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/30 hover:border-green-500/50 transition-all duration-300">
            <Shield className="h-5 w-5 text-green-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-normal text-green-400">{t('privacyProtected')}</p>
              <p className="text-sm text-white/60 font-light mt-1">{t('privacyProtectedDesc')}</p>
            </div>
          </div>
        </div>

        {/* Check Compatibility Button */}
        <Button 
          onClick={() => setCompatibilityOpen(true)}
          variant="outline"
          size="lg"
          className="w-full mb-6 bg-white/[0.02] border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10 hover:border-neon-cyan/50 transition-all duration-300 font-light h-12 rounded-xl relative z-10"
        >
          <Smartphone className="mr-2 h-5 w-5" />
          {t('checkDeviceCompatibility')}
        </Button>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 relative z-10">
          <Button 
            onClick={() => {
              onAddToCart(product);
              onOpenChange(false);
            }}
            className="flex-1 bg-gradient-to-r from-neon-cyan to-neon-violet hover:from-neon-cyan/90 hover:to-neon-violet/90 text-white border-0 shadow-glow-cyan font-light h-16 sm:h-12 rounded-xl transition-all duration-300 text-lg sm:text-sm px-6"
            size="lg"
          >
            <ShoppingCart className="mr-2 h-6 w-6 sm:h-4 sm:w-4" />
            {t('addToCart')}
          </Button>
          <Button 
            onClick={() => {
              onOpenChange(false);
              onReferEarn(product);
            }}
            variant="outline"
            size="lg"
            className="flex-1 bg-white/[0.02] border-neon-coral/30 text-neon-coral hover:bg-neon-coral/10 hover:border-neon-coral/50 transition-all duration-300 font-light h-16 sm:h-12 rounded-xl text-lg sm:text-sm px-6"
          >
            <HandCoins className="h-6 w-6 mr-2 sm:h-4 sm:w-4" />
            {t('referAndEarn')}
          </Button>
        </div>
        
        <CompatibilityChecker 
          open={compatibilityOpen} 
          onOpenChange={setCompatibilityOpen} 
        />
      </DialogContent>
    </Dialog>
  );
};
