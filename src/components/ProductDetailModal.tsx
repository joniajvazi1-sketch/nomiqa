import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ShoppingCart, HandCoins, Wifi, Calendar, Globe, Zap, Shield, Clock, Smartphone } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { getTranslatedCountryName } from "@/utils/countryTranslations";
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
  const { language, t, formatPrice } = useTranslation();
  const [compatibilityOpen, setCompatibilityOpen] = useState(false);

  if (!product) return null;

  // Regional map images mapping
  const getRegionImage = (countryCode: string): string | null => {
    const regionImageMap: Record<string, string> = {
      'EUROPE': '/regions/europe.png',
      'EU-PLUS-UK': '/regions/europe.png',
      'ASIA': '/regions/asia.png',
      'CARIBBEAN-ISLANDS': '/regions/caribbean.png',
      'LATIN-AMERICA': '/regions/latin-america.png',
      'MIDDLE-EAST-AND-NORTH-AFRICA': '/regions/middle-east-africa.png',
      'AFRICA': '/regions/middle-east-africa.png',
      'NORTH-AMERICA': '/regions/north-america.png',
      'OCEANIA': '/regions/oceania.png',
      'WORLD': '/regions/world.png',
    };
    return regionImageMap[countryCode] || null;
  };

  const getCountryFlag = (countryCode: string, packageType?: string, countryImageUrl?: string | null) => {
    // For regional packages, show region map image
    if (packageType === 'regional') {
      const regionImage = getRegionImage(countryCode);
      if (regionImage) {
        return (
          <img 
            src={regionImage} 
            alt={countryCode} 
            width={64}
            height={44}
            loading="lazy"
            decoding="async"
            className="w-16 h-11 rounded-lg object-cover shadow-lg"
          />
        );
      }
      return (
        <div className="w-16 h-11 flex items-center justify-center text-4xl bg-white/5 rounded-lg">
          🌐
        </div>
      );
    }
    // For local packages, use country flag image from database
    if (countryImageUrl) {
      return (
        <img 
          src={countryImageUrl} 
          alt={`${countryCode} flag`} 
          width={64}
          height={44}
          loading="lazy"
          decoding="async"
          className="w-16 h-11 rounded-lg object-cover shadow-lg"
        />
      );
    }
    // Fallback to globe icon if no image
    return (
      <div className="w-16 h-11 flex items-center justify-center text-4xl bg-white/5 rounded-lg">
        🌐
      </div>
    );
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
          {/* Clean Header Layout */}
          <div className="flex flex-col items-center text-center mb-6">
            {/* Flag */}
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-neon-cyan/20 rounded-xl blur-lg"></div>
              <div className="relative">
                {getCountryFlag(product.country_code, product.package_type, product.country_image_url)}
              </div>
            </div>
            
            {/* Country Name */}
            <DialogTitle className="text-2xl md:text-3xl mb-1 bg-gradient-to-r from-neon-cyan via-white to-neon-violet bg-clip-text text-transparent font-light">
              {getTranslatedCountryName(product.country_code, language)}
            </DialogTitle>
            
            {/* Package Info */}
            <p className="text-white/50 font-light text-sm mb-3">{product.name}</p>
            
            {/* Badges */}
            <div className="flex gap-2 mb-4">
              {product.package_type === 'regional' && (
                <Badge className="bg-gradient-to-r from-neon-violet to-neon-coral text-white border-0 shadow-glow-violet font-light text-xs px-3">
                  Regional
                </Badge>
              )}
              {product.is_popular && (
                <Badge className="bg-gradient-to-r from-neon-coral to-neon-orange text-white border-0 shadow-glow-coral font-light text-xs px-3">
                  {t('popular')}
                </Badge>
              )}
            </div>
            
            {/* Price */}
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl px-8 py-4">
              <div className="text-4xl md:text-5xl font-semibold bg-gradient-to-r from-white via-neon-cyan to-white bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(6,182,212,0.4)]">
                {formatPrice(product.price_usd)}
              </div>
              <p className="text-xs text-white/40 mt-1 font-light">{t('oneTimePayment')}</p>
            </div>
          </div>

          {/* Operator Image */}
          {product.operator_image_url && (
            <div className="mb-6 p-6 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-neon-cyan/10 rounded-lg blur-xl"></div>
                <img 
                  src={product.operator_image_url} 
                  alt={product.operator_name || 'Operator'} 
                  className="relative h-16 md:h-20 object-contain rounded-lg"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              {product.operator_name && (
                <p className="ml-4 text-sm text-white/60 font-light">{t('poweredBy')} {product.operator_name}</p>
              )}
            </div>
          )}

          {/* Device Compatibility - Prominent */}
          <Button 
            onClick={() => setCompatibilityOpen(true)}
            variant="outline"
            size="lg"
            className="w-full mb-6 bg-gradient-to-br from-neon-cyan/10 to-neon-cyan/5 border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/20 hover:border-neon-cyan/60 transition-all duration-200 font-light h-14 rounded-xl shadow-lg shadow-neon-cyan/10"
          >
            <Smartphone className="mr-2 h-5 w-5" />
            {t('checkDeviceCompatibility')}
          </Button>
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
              <div className="flex-1 min-w-0">
                <p className="font-normal text-white break-words">{t('coverage')}</p>
                <p className="text-sm text-white/60 font-light mt-1 break-words">{product.features.coverage}</p>
              </div>
            </div>
          )}

          {product.features?.speed && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-neon-cyan/30 transition-all duration-300">
              <Zap className="h-5 w-5 text-neon-cyan mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-normal text-white break-words">{t('networkSpeed')}</p>
                <p className="text-sm text-white/60 font-light mt-1 break-words">{product.features.speed}</p>
              </div>
            </div>
          )}

          {product.features?.activation && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-neon-cyan/30 transition-all duration-300">
              <Clock className="h-5 w-5 text-neon-cyan mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-normal text-white break-words">{t('activation')}</p>
                <p className="text-sm text-white/60 font-light mt-1 break-words">{product.features.activation}</p>
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

        {/* Removed duplicate Check Compatibility Button - now in header */}

        {/* Action Buttons - Premium & Much Bigger */}
        <div className="flex flex-col gap-4 relative z-10">
          <Button 
            onClick={() => {
              onAddToCart(product);
              onOpenChange(false);
            }}
            className="w-full bg-white/[0.05] backdrop-blur-xl border-2 border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/10 hover:border-neon-cyan/60 font-light h-16 rounded-2xl transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-neon-cyan/20 text-lg px-8"
            size="lg"
          >
            <ShoppingCart className="mr-3 h-6 w-6 shrink-0" />
            <span className="break-words">{t('addToCart')}</span>
          </Button>
          <Button 
            onClick={() => {
              onOpenChange(false);
              onReferEarn(product);
            }}
            className="w-full bg-white/[0.05] backdrop-blur-xl border-2 border-neon-coral/40 text-neon-coral hover:bg-neon-coral/10 hover:border-neon-coral/60 font-light h-16 rounded-2xl transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-neon-coral/20 text-lg px-8"
            size="lg"
          >
            <HandCoins className="mr-3 h-6 w-6 shrink-0" />
            <span className="break-words">{t('referAndEarn')}</span>
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
