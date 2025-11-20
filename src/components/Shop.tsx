import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Loader2, ShoppingCart, Search, Wifi, Calendar, Globe, MapPin, Share2, HandCoins, Info } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { ProductDetailModal } from "./ProductDetailModal";
import * as CountryFlags from 'country-flag-icons/react/3x2';
import { ReferEarnModal } from "./ReferEarnModal";
import { Confetti } from "./Confetti";
import { useTranslation } from "@/contexts/TranslationContext";
import { getTranslatedCountryName, getAllTranslatedNames } from "@/utils/countryTranslations";

type CoverageType = "all" | "local" | "regional";

// Regional package identifiers based on Airalo's naming
const REGIONAL_PACKAGES = {
  africa: ['hello africa', 'hello-africa'],
  asia: ['asialink'],
  oceania: ['oceanlink'],
  europe: ['eurolink'],
  latinAmerica: ['latamlink'],
  mena: ['menalink'],
  northAmerica: ['american mex', 'american-mex']
};

const ALL_REGIONAL_IDENTIFIERS = Object.values(REGIONAL_PACKAGES).flat();

export const Shop = () => {
  const navigate = useNavigate();
  const { data: products, isLoading } = useProducts();
  const { items, addItem } = useCart();
  const { language, t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [coverageFilter, setCoverageFilter] = useState<CoverageType>("all");
  const [referEarnModalOpen, setReferEarnModalOpen] = useState(false);
  const [productDetailModalOpen, setProductDetailModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [displayCount, setDisplayCount] = useState(9);
  const [showConfetti, setShowConfetti] = useState(false);

  // Classify products by coverage type
  const getProductCoverageType = (product: any): CoverageType => {
    const countryCode = product.country_code?.toLowerCase() || "";
    const countryName = product.country_name?.toLowerCase() || "";
    const packageName = product.name?.toLowerCase() || "";
    
    // Check if it's a regional package by name
    const isRegional = ALL_REGIONAL_IDENTIFIERS.some(identifier => 
      countryCode.includes(identifier) || 
      countryName.includes(identifier) ||
      packageName.includes(identifier)
    );
    
    if (isRegional) {
      return "regional";
    }
    
    // Everything else is local (single country)
    return "local";
  };

  const filteredProducts = products?.filter(product => {
    // Get all possible country names for this product (in all languages)
    const allCountryNames = getAllTranslatedNames(product.country_code);
    const searchLower = searchQuery.toLowerCase();
    
    // Check if search matches the product name or any translated country name
    const matchesSearch = product.name.toLowerCase().includes(searchLower) ||
                         product.country_name.toLowerCase().includes(searchLower) ||
                         allCountryNames.some(name => name.toLowerCase().includes(searchLower));
    
    if (coverageFilter === "all") {
      return matchesSearch;
    }
    
    const productType = getProductCoverageType(product);
    return matchesSearch && productType === coverageFilter;
  });

  const displayedProducts = filteredProducts?.slice(0, displayCount);
  const hasMore = filteredProducts && filteredProducts.length > displayCount;

  const handleAddToCart = (product: any) => {
    addItem(product);
    setShowConfetti(true);
    toast.success(`${product.name} added to cart!`);
  };

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setProductDetailModalOpen(true);
  };

  const handleReferEarn = (product: any) => {
    setSelectedProduct(product);
    setReferEarnModalOpen(true);
  };

  const getCountryFlag = (countryCode: string) => {
    const FlagComponent = (CountryFlags as any)[countryCode];
    return FlagComponent ? <FlagComponent className="w-8 h-6 rounded shadow" /> : null;
  };

  return (
    <section id="shop" className="py-12 md:py-20 px-4 bg-gradient-to-br from-deep-space via-midnight-blue to-deep-space">
      <div className="container mx-auto max-w-7xl">
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <div className="w-full">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 bg-gradient-neon bg-clip-text text-transparent">
              {t('esimPlansTitle')}
            </h2>
            <p className="text-foreground/70 text-sm md:text-base">
              {t('esimPlansSubtitle')}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !filteredProducts?.length ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">
              {searchQuery || coverageFilter !== "all" ? "No products match your filters" : "No products available"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedProducts?.map((product) => (
              <Card 
                key={product.id} 
                className="group hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 hover:border-primary/50 bg-gradient-to-br from-card via-card to-card/95"
                onClick={() => handleProductClick(product)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getCountryFlag(product.country_code)}
                      <div>
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">
                          {getTranslatedCountryName(product.country_code, language)}
                        </CardTitle>
                        <CardDescription className="text-sm">{product.name}</CardDescription>
                      </div>
                    </div>
                    {product.is_popular && (
                      <Badge className="bg-gradient-to-r from-primary via-primary to-accent shadow-lg">
                        {t('popular')}
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Wifi className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium">{t('data')}</span>
                      </div>
                      <span className="font-bold text-lg">{product.data_amount}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-accent" />
                        <span className="text-xs font-medium">{t('validity')}</span>
                      </div>
                      <span className="font-bold text-lg">{product.validity_days} {t('days')}</span>
                    </div>
                  </div>

                  {product.features?.coverage && (
                    <div className="flex items-center gap-2 text-sm p-2 rounded bg-muted/50">
                      <Globe className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-muted-foreground truncate">{product.features.coverage}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t">
                    <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      ${product.price_usd.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{t('oneTimePayment')}</p>
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-2 text-sm text-muted-foreground/70 group-hover:text-primary transition-colors">
                    <Info className="h-4 w-4" />
                    <span>{t('clickForMoreInfo')}</span>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col sm:flex-row gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(product);
                    }}
                    className="w-full sm:flex-1 shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {t('addToCart')}
                  </Button>
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReferEarn(product);
                    }}
                    variant="outline"
                    className="w-full sm:w-auto hover:bg-primary/10 hover:border-primary/50 transition-colors"
                  >
                    <HandCoins className="h-4 w-4 mr-2" />
                    {t('referAndEarn')}
                  </Button>
                </CardFooter>
              </Card>
              ))}
            </div>
            
            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button 
                  onClick={() => setDisplayCount(prev => prev + 9)}
                  variant="outline"
                  size="lg"
                >
                  Load More ({filteredProducts.length - displayCount} remaining)
                </Button>
              </div>
            )}
          </>
        )}

        <ProductDetailModal
          open={productDetailModalOpen}
          onOpenChange={setProductDetailModalOpen}
          product={selectedProduct}
          onAddToCart={handleAddToCart}
          onReferEarn={handleReferEarn}
        />
        
        <ReferEarnModal 
          open={referEarnModalOpen}
          onOpenChange={setReferEarnModalOpen}
          product={selectedProduct}
        />
        
        <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
      </div>
    </section>
  );
};