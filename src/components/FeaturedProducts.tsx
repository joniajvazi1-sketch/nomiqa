import { useNavigate } from "react-router-dom";
import { useFeaturedProducts } from "@/hooks/useProducts";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Loader2, ArrowRight, Wifi, Calendar } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import * as CountryFlags from 'country-flag-icons/react/3x2';
import { useTranslation } from "@/contexts/TranslationContext";
import { getTranslatedCountryName } from "@/utils/countryTranslations";

// Featured country codes - showing cheapest packages (mix of local and regional)
const FEATURED_LOCAL_COUNTRIES = [
  'TR', // Turkey
  'CN', // China
  'TH', // Thailand
  'ID', // Indonesia
  'SG', // Singapore
  'JP', // Japan
  'AE', // UAE
  'MX'  // Mexico
];

// Regional package codes for cheaper multi-country options
const FEATURED_REGIONAL_CODES = [
  'ASIA',    // Asia - $1.50
  'WORLD',   // Global - $2.50
  'EUROPE',  // Europe - $3.00
  'NORTH-AMERICA', // North America - $6.50
];

export const FeaturedProducts = () => {
  const navigate = useNavigate();
  const { data: featuredProducts, isLoading } = useFeaturedProducts(FEATURED_LOCAL_COUNTRIES, FEATURED_REGIONAL_CODES);
  const { language, t, formatPrice } = useTranslation();

  const handleProductClick = (product: any) => {
    const isRegional = product.package_type === 'regional';
    if (isRegional) {
      // For regional products, go to shop with regional filter
      navigate(`/shop?type=regional`);
    } else {
      // For local products, search by country name
      const translatedCountryName = getTranslatedCountryName(product.country_code, language);
      navigate(`/shop?search=${encodeURIComponent(translatedCountryName)}`);
    }
  };

  const getCountryFlag = (countryCode: string, isRegional: boolean) => {
    if (isRegional) {
      // Show globe icon for regional packages
      return (
        <div className="w-8 h-6 rounded shadow-sm bg-gradient-to-br from-neon-cyan/30 to-neon-violet/30 flex items-center justify-center">
          <Wifi className="w-4 h-4 text-neon-cyan" />
        </div>
      );
    }
    const code = countryCode?.toUpperCase();
    const FlagComponent = (CountryFlags as any)[code];
    return FlagComponent ? <FlagComponent className="w-8 h-6 rounded shadow-sm" /> : null;
  };

  if (isLoading) {
    return (
      <section className="py-24 relative overflow-hidden bg-gradient-to-b from-background via-background/50 to-background">
        <div className="container px-6 md:px-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-neon-cyan" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 relative overflow-hidden bg-gradient-to-b from-background via-background/50 to-background">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.1),transparent_50%)]"></div>

      <div className="container px-6 md:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-block mb-4">
            <Badge variant="outline" className="border-neon-cyan/20 text-neon-cyan bg-neon-cyan/5 px-4 py-2">
              {t("shop")}
            </Badge>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light font-display mb-6">
            <span className="bg-gradient-to-r from-neon-cyan via-white to-neon-violet bg-clip-text text-transparent font-semibold">
              {t("featuredPlans")}
            </span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light">
            {t("featuredPlansDesc")}
          </p>
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {featuredProducts.map((product, index) => {
            const isRegional = product.package_type === 'regional';
            const displayName = isRegional ? product.country_name : getTranslatedCountryName(product.country_code, language);
            
            return (
              <Card 
                key={product.id} 
                className="group relative overflow-hidden backdrop-blur-xl bg-card/50 border-border/50 hover:border-neon-cyan/30 transition-all duration-300 hover:shadow-xl hover:shadow-neon-cyan/10 hover:-translate-y-1 animate-fade-in cursor-pointer"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => handleProductClick(product)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getCountryFlag(product.country_code, isRegional)}
                      <div>
                        <h3 className="text-lg font-semibold group-hover:text-neon-cyan transition-colors">
                          {displayName}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {product.package_type === 'regional' ? t("regionalData") : product.data_amount}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div className="text-3xl font-semibold bg-gradient-to-r from-white via-neon-cyan to-white bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                      {formatPrice(product.price_usd)}
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-neon-cyan group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Mobile Compact List */}
        <div className="md:hidden space-y-3 mb-12">
          {featuredProducts.map((product, index) => {
            const isRegional = product.package_type === 'regional';
            const displayName = isRegional ? product.country_name : getTranslatedCountryName(product.country_code, language);
            
            return (
              <div
                key={product.id}
                className="group relative overflow-hidden backdrop-blur-xl bg-card/50 border border-border/50 hover:border-neon-cyan/30 rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-neon-cyan/10 cursor-pointer animate-fade-in p-4"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => handleProductClick(product)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getCountryFlag(product.country_code, isRegional)}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold group-hover:text-neon-cyan transition-colors truncate">
                        {displayName}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {product.package_type === 'regional' ? t("regionalData") : product.data_amount}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-semibold bg-gradient-to-r from-white via-neon-cyan to-white bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(6,182,212,0.3)] whitespace-nowrap">
                      {formatPrice(product.price_usd)}
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-neon-cyan group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All CTA */}
        <div className="text-center animate-fade-in" style={{ animationDelay: "0.6s" }}>
          <Button 
            size="lg"
            onClick={() => navigate('/shop')}
            className="h-auto py-3 px-6 md:px-10 md:py-7 text-sm md:text-base lg:text-lg font-light bg-white/[0.05] backdrop-blur-xl border-2 border-white/20 text-white hover:bg-white/10 hover:border-white/40 rounded-xl md:rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-white/20"
          >
            <span className="break-words">{t("viewAllPlans")}</span>
            <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </Button>
        </div>
      </div>
    </section>
  );
};
