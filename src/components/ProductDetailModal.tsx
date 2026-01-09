import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ShoppingCart, HandCoins, Wifi, Calendar, Globe, Zap, Shield, Clock, Smartphone, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { getTranslatedCountryName } from "@/utils/countryTranslations";
import { useDeviceCompatibility } from "@/hooks/useDeviceCompatibility";

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
  const { isCompatible, platform, isLoading } = useDeviceCompatibility();

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

  const renderCompatibilityStatus = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
          <div className="w-5 h-5 border-2 border-white/30 border-t-neon-cyan rounded-full animate-spin" />
          <span className="text-sm text-white/60">Checking device...</span>
        </div>
      );
    }

    if (isCompatible === true) {
      return (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-green-500/5 border border-green-500/30">
          <div className="p-2 rounded-lg bg-green-500/20">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-green-400">Device Compatible</p>
            <p className="text-xs text-white/50">{platform} • Ready for eSIM</p>
          </div>
        </div>
      );
    }

    if (isCompatible === false) {
      return (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-red-500/5 border border-red-500/30">
          <div className="p-2 rounded-lg bg-red-500/20">
            <XCircle className="w-5 h-5 text-red-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-red-400">May Not Be Compatible</p>
            <p className="text-xs text-white/50">{platform} • Update your device or use QR code</p>
          </div>
        </div>
      );
    }

    // Unknown (desktop or undetectable)
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-neon-cyan/10 to-neon-cyan/5 border border-neon-cyan/30">
        <div className="p-2 rounded-lg bg-neon-cyan/20">
          <AlertCircle className="w-5 h-5 text-neon-cyan" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-neon-cyan">Check on Your Phone</p>
          <p className="text-xs text-white/50">Install via QR code on supported device</p>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        variant="popup"
        className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-gradient-to-br from-deep-space/98 via-black/95 to-deep-space/98 backdrop-blur-2xl border border-white/[0.08] rounded-3xl"
      >
        {/* Premium background decorations */}
        <div className="absolute inset-0 opacity-10 pointer-events-none rounded-3xl overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-neon-cyan/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-neon-violet/30 rounded-full blur-3xl"></div>
        </div>

        <DialogHeader className="relative z-10">
          {/* Clean Header Layout */}
          <div className="flex flex-col items-center text-center mb-4">
            {/* Flag */}
            <div className="relative mb-3">
              <div className="absolute inset-0 bg-neon-cyan/20 rounded-xl blur-lg"></div>
              <div className="relative">
                {getCountryFlag(product.country_code, product.package_type, product.country_image_url)}
              </div>
            </div>
            
            {/* Country Name */}
            <DialogTitle className="text-xl md:text-2xl mb-1 bg-gradient-to-r from-neon-cyan via-white to-neon-violet bg-clip-text text-transparent font-light">
              {getTranslatedCountryName(product.country_code, language)}
            </DialogTitle>
            
            {/* Package Info */}
            <p className="text-white/50 font-light text-xs mb-2">{product.name}</p>
            
            {/* Badges */}
            <div className="flex gap-2 mb-3">
              {product.package_type === 'regional' && (
                <Badge className="bg-gradient-to-r from-neon-violet to-neon-coral text-white border-0 shadow-glow-violet font-light text-xs px-2.5 py-0.5">
                  Regional
                </Badge>
              )}
              {product.is_popular && (
                <Badge className="bg-gradient-to-r from-neon-coral to-neon-orange text-white border-0 shadow-glow-coral font-light text-xs px-2.5 py-0.5">
                  {t('popular')}
                </Badge>
              )}
            </div>
            
            {/* Price */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl px-6 py-3">
              <div className="text-3xl font-semibold bg-gradient-to-r from-white via-neon-cyan to-white bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(6,182,212,0.4)]">
                {formatPrice(product.price_usd)}
              </div>
              <p className="text-xs text-white/40 mt-0.5 font-light">{t('oneTimePayment')}</p>
            </div>
          </div>
        </DialogHeader>

        {/* Device Compatibility - Auto-detected */}
        <div className="relative z-10 mb-4">
          {renderCompatibilityStatus()}
        </div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
          <div className="p-4 rounded-xl bg-gradient-to-br from-neon-cyan/10 to-neon-cyan/5 border border-white/[0.08]">
            <div className="flex items-center gap-2 mb-2">
              <Wifi className="h-4 w-4 text-neon-cyan" />
              <span className="font-light text-white/70 text-xs">{t('data')}</span>
            </div>
            <p className="text-xl font-light text-white">{product.data_amount}</p>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-neon-violet/10 to-neon-violet/5 border border-white/[0.08]">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-neon-violet" />
              <span className="font-light text-white/70 text-xs">{t('validity')}</span>
            </div>
            <p className="text-xl font-light text-white">{product.validity_days} {t('days')}</p>
          </div>
        </div>

        {/* Compact Features */}
        <div className="space-y-2 mb-4 relative z-10">
          {product.features?.coverage && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <Globe className="h-4 w-4 text-neon-cyan shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/50 font-light truncate">{product.features.coverage}</p>
              </div>
            </div>
          )}

          {product.features?.speed && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <Zap className="h-4 w-4 text-neon-cyan shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/50 font-light truncate">{product.features.speed}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-green-500/5 to-green-500/[0.02] border border-green-500/20">
            <Shield className="h-4 w-4 text-green-400 shrink-0" />
            <p className="text-xs text-green-400/80 font-light">{t('privacyProtected')}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 relative z-10">
          <Button 
            onClick={() => {
              onAddToCart(product);
              onOpenChange(false);
            }}
            className="w-full bg-white/[0.05] backdrop-blur-xl border border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/10 hover:border-neon-cyan/60 font-light h-14 rounded-2xl transition-all duration-300 active:scale-[0.98] shadow-lg text-base"
            size="lg"
          >
            <ShoppingCart className="mr-2 h-5 w-5 shrink-0" />
            <span>{t('addToCart')}</span>
          </Button>
          <Button 
            onClick={() => {
              onOpenChange(false);
              onReferEarn(product);
            }}
            className="w-full bg-white/[0.03] backdrop-blur-xl border border-white/[0.1] text-white/70 hover:bg-white/[0.05] hover:text-white font-light h-12 rounded-xl transition-all duration-300 active:scale-[0.98] text-sm"
            size="lg"
          >
            <HandCoins className="mr-2 h-4 w-4 shrink-0" />
            <span>{t('referAndEarn')}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
