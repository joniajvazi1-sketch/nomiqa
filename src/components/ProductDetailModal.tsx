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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4 mb-4">
            {getCountryFlag(product.country_code)}
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2">
                {getTranslatedCountryName(product.country_code, language)}
              </DialogTitle>
              <p className="text-muted-foreground">{product.name}</p>
              {product.is_popular && (
                <Badge className="mt-2 bg-gradient-to-r from-primary to-primary/80">
                  {t('popular')}
                </Badge>
              )}
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">
                ${product.price_usd.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">{t('oneTimePayment')}</p>
            </div>
          </div>
        </DialogHeader>

        {/* Main Features Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Wifi className="h-5 w-5 text-primary" />
              <span className="font-semibold">{t('data')}</span>
            </div>
            <p className="text-2xl font-bold">{product.data_amount}</p>
          </div>

          <div className="p-4 rounded-lg bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-accent" />
              <span className="font-semibold">{t('validity')}</span>
            </div>
            <p className="text-2xl font-bold">{product.validity_days} {t('days')}</p>
          </div>
        </div>

        {/* Detailed Features */}
        <div className="space-y-3 mb-6">
          <h3 className="font-semibold text-lg mb-3">{t('planDetails')}</h3>
          
          {product.features?.coverage && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Globe className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">{t('coverage')}</p>
                <p className="text-sm text-muted-foreground">{product.features.coverage}</p>
              </div>
            </div>
          )}

          {product.features?.speed && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Zap className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">{t('networkSpeed')}</p>
                <p className="text-sm text-muted-foreground">{product.features.speed}</p>
              </div>
            </div>
          )}

          {product.features?.activation && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Clock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">{t('activation')}</p>
                <p className="text-sm text-muted-foreground">{product.features.activation}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
            <Shield className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-green-700 dark:text-green-600">{t('privacyProtected')}</p>
              <p className="text-sm text-muted-foreground">{t('privacyProtectedDesc')}</p>
            </div>
          </div>
        </div>

        {/* Check Compatibility Button */}
        <Button 
          onClick={() => setCompatibilityOpen(true)}
          variant="outline"
          size="lg"
          className="w-full mb-6"
        >
          <Smartphone className="mr-2 h-5 w-5" />
          {t('checkDeviceCompatibility')}
        </Button>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={() => {
              onAddToCart(product);
              onOpenChange(false);
            }}
            className="flex-1"
            size="lg"
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            {t('addToCart')}
          </Button>
          <Button 
            onClick={() => {
              onOpenChange(false);
              onReferEarn(product);
            }}
            variant="outline"
            size="lg"
            className="flex-1"
          >
            <HandCoins className="h-5 w-5 mr-2" />
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
