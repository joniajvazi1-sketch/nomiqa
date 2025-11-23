import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Loader2, ShoppingCart, Wifi, Calendar, MapPin, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import * as CountryFlags from 'country-flag-icons/react/3x2';
import { useTranslation } from "@/contexts/TranslationContext";
import { getTranslatedCountryName } from "@/utils/countryTranslations";

export const FeaturedProducts = () => {
  const navigate = useNavigate();
  const { data: products, isLoading } = useProducts();
  const { addItem } = useCart();
  const { language, t } = useTranslation();
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  // Get featured products (popular ones or first 6)
  const featuredProducts = products
    ?.filter(p => p.is_popular)
    .slice(0, 6) || products?.slice(0, 6) || [];

  const handleAddToCart = async (product: any) => {
    setAddingToCart(product.id);
    try {
      addItem(product);
      toast.success(t("addedToCart"));
    } catch (error) {
      toast.error(t("errorAddingToCart"));
    } finally {
      setAddingToCart(null);
    }
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

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {featuredProducts.map((product, index) => {
            const translatedCountryName = getTranslatedCountryName(product.country_code, language);
            
            return (
              <Card 
                key={product.id} 
                className="group relative overflow-hidden backdrop-blur-xl bg-card/50 border-border/50 hover:border-neon-cyan/30 transition-all duration-300 hover:shadow-xl hover:shadow-neon-cyan/10 hover:-translate-y-1 animate-fade-in cursor-pointer"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => navigate('/shop')}
              >
                {product.is_popular && (
                  <div className="absolute top-4 right-4 z-10">
                    <Badge className="bg-gradient-to-r from-neon-coral to-neon-violet text-white border-0 shadow-lg">
                      {t("popular")}
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="space-y-4">
                  <div className="flex items-center gap-3">
                    {getCountryFlag(product.country_code)}
                    <div className="flex-1">
                      <CardTitle className="text-xl font-semibold group-hover:text-neon-cyan transition-colors">
                        {translatedCountryName}
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground mt-1">
                        {product.name}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Wifi className="w-4 h-4 text-neon-cyan" />
                      <span>{product.data_amount}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4 text-neon-violet" />
                      <span>{product.validity_days} {t("productDetailDays")}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/50">
                    <div className="text-3xl font-bold bg-gradient-to-r from-neon-cyan to-neon-violet bg-clip-text text-transparent">
                      ${product.price_usd}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {t("checkoutEach")}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="gap-2">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(product);
                    }}
                    disabled={addingToCart === product.id}
                    className="flex-1 bg-gradient-to-r from-neon-cyan to-neon-violet hover:opacity-90 text-white border-0 shadow-lg hover:shadow-neon-cyan/30"
                  >
                    {addingToCart === product.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {t("addToCart")}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
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
