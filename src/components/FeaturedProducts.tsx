import { useNavigate } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Loader2, ArrowRight, Wifi, Calendar } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import * as CountryFlags from 'country-flag-icons/react/3x2';
import { useTranslation } from "@/contexts/TranslationContext";
import { getTranslatedCountryName } from "@/utils/countryTranslations";

// Featured country codes - showing cheapest packages
const FEATURED_COUNTRIES = [
  'TR', // Turkey
  'CN', // China
  'TH', // Thailand
  'US', // USA
  'ID', // Indonesia
  'SG', // Singapore
  'SA', // Saudi Arabia
  'JP', // Japan
  'BR', // Brazil
  'IE', // Ireland
  'AE', // UAE
  'MX'  // Mexico
];

export const FeaturedProducts = () => {
  const navigate = useNavigate();
  const { data: products, isLoading } = useProducts();
  const { language, t } = useTranslation();

  // Get cheapest package for each featured country
  const featuredProducts = FEATURED_COUNTRIES.map(countryCode => {
    const countryProducts = products?.filter(p => p.country_code === countryCode) || [];
    // Find the cheapest product for this country
    return countryProducts.reduce((cheapest, current) => 
      !cheapest || current.price_usd < cheapest.price_usd ? current : cheapest
    , null as any);
  }).filter(Boolean);

  const handleProductClick = (product: any) => {
    const translatedCountryName = getTranslatedCountryName(product.country_code, language);
    navigate(`/shop?search=${encodeURIComponent(translatedCountryName)}`);
  };

  const getCountryFlag = (countryCode: string) => {
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
            const translatedCountryName = getTranslatedCountryName(product.country_code, language);
            
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
                      {getCountryFlag(product.country_code)}
                      <div>
                        <h3 className="text-lg font-semibold group-hover:text-neon-cyan transition-colors">
                          {translatedCountryName}
                        </h3>
                        <p className="text-xs text-muted-foreground">{product.data_amount}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div className="text-2xl font-bold bg-gradient-to-r from-neon-cyan to-neon-violet bg-clip-text text-transparent">
                      ${product.price_usd}
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
            const translatedCountryName = getTranslatedCountryName(product.country_code, language);
            
            return (
              <div
                key={product.id}
                className="group relative overflow-hidden backdrop-blur-xl bg-card/50 border border-border/50 hover:border-neon-cyan/30 rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-neon-cyan/10 cursor-pointer animate-fade-in p-4"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => handleProductClick(product)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getCountryFlag(product.country_code)}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold group-hover:text-neon-cyan transition-colors truncate">
                        {translatedCountryName}
                      </h3>
                      <p className="text-xs text-muted-foreground">{product.data_amount}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-xl font-bold bg-gradient-to-r from-neon-cyan to-neon-violet bg-clip-text text-transparent whitespace-nowrap">
                      ${product.price_usd}
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
            className="group bg-white hover:bg-white/95 text-deep-space font-semibold px-10 py-7 text-base md:text-lg rounded-2xl shadow-2xl hover:shadow-white/20 transition-all duration-300 hover:scale-105 border border-white/20"
          >
            {t("viewAllPlans")}
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};
