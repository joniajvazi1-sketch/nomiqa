import { useState, useEffect } from "react";
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

  // Check for URL search parameter on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    if (searchParam) {
      setSearchQuery(decodeURIComponent(searchParam));
    }
  }, []);

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
    <section id="shop" className="py-16 md:py-24 px-4 relative overflow-hidden bg-gradient-to-br from-black/40 via-deep-space/60 to-black/40">
      {/* Premium background decorations */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-neon-cyan/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-neon-violet/5 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-coral/3 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Hero Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-block mb-3 md:mb-4">
            <span className="text-neon-cyan text-xs md:text-sm font-light tracking-[0.25em] uppercase">
              ⚡ Global Connectivity
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light mb-4 md:mb-5">
            <span className="block bg-gradient-to-r from-neon-cyan via-white to-neon-violet bg-clip-text text-transparent">
              {t('esimPlansTitle')}
            </span>
          </h2>
          <p className="text-white/70 text-base md:text-lg lg:text-xl font-light max-w-2xl mx-auto">
            {t('esimPlansSubtitle')}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-10 md:mb-12 max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neon-cyan z-10 pointer-events-none" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 md:h-14 bg-white/[0.02] backdrop-blur-xl border-white/10 hover:border-neon-cyan/30 focus:border-neon-cyan/50 text-white placeholder:text-white/40 rounded-xl transition-all duration-300 text-left relative z-0"
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {displayedProducts?.map((product) => (
              <Card 
                key={product.id} 
                className="group relative overflow-hidden bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-neon-cyan/40 transition-all duration-500 hover:-translate-y-2 cursor-pointer hover-lift rounded-2xl"
                onClick={() => handleProductClick(product)}
              >
                {/* Hover glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-neon-violet/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                
                <CardHeader className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="absolute inset-0 bg-neon-cyan/20 rounded blur-sm group-hover:bg-neon-cyan/30 transition-all duration-500"></div>
                        {getCountryFlag(product.country_code)}
                      </div>
                      <div>
                        <CardTitle className="text-lg md:text-xl text-white group-hover:text-neon-cyan transition-colors duration-300 font-light">
                          {getTranslatedCountryName(product.country_code, language)}
                        </CardTitle>
                        <CardDescription className="text-sm text-white/60 font-light">{product.name}</CardDescription>
                      </div>
                    </div>
                    {product.is_popular && (
                      <Badge className="bg-gradient-to-r from-neon-coral to-neon-orange text-white border-0 shadow-glow-coral font-light">
                        {t('popular')}
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 relative z-10">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-neon-cyan/10 to-neon-cyan/5 border border-neon-cyan/20 hover:border-neon-cyan/40 transition-all duration-300">
                      <div className="flex items-center gap-2 mb-2">
                        <Wifi className="h-4 w-4 text-neon-cyan" />
                        <span className="text-xs font-light text-white/70">{t('data')}</span>
                      </div>
                      <span className="font-normal text-lg text-white">{product.data_amount}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-neon-violet/10 to-neon-violet/5 border border-neon-violet/20 hover:border-neon-violet/40 transition-all duration-300">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-neon-violet" />
                        <span className="text-xs font-light text-white/70">{t('validity')}</span>
                      </div>
                      <span className="font-normal text-lg text-white">{product.validity_days} {t('days')}</span>
                    </div>
                  </div>

                  {product.features?.coverage && (
                    <div className="flex items-center gap-2 text-sm p-3 rounded-lg bg-white/[0.02] border border-white/5">
                      <Globe className="h-4 w-4 text-neon-cyan shrink-0" />
                      <span className="text-white/60 truncate font-light">{product.features.coverage}</span>
                    </div>
                  )}

                  <div className="pt-4 border-t border-white/10">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/20 to-neon-violet/20 rounded-xl blur-lg"></div>
                      <div className="relative px-5 py-3 bg-white/[0.05] backdrop-blur-xl border border-white/20 rounded-xl">
                        <span className="text-3xl md:text-4xl font-semibold bg-gradient-to-r from-white via-neon-cyan to-white bg-clip-text text-transparent">
                          ${product.price_usd.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-white/50 mt-3 font-light">{t('oneTimePayment')}</p>
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-2 text-sm text-white/50 group-hover:text-neon-cyan transition-colors duration-300">
                    <Info className="h-4 w-4" />
                    <span className="font-light">{t('clickForMoreInfo')}</span>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col sm:flex-row gap-3 relative z-10" onClick={(e) => e.stopPropagation()}>
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(product);
                    }}
                    className="w-full sm:flex-1 bg-gradient-to-r from-neon-cyan to-neon-violet hover:from-neon-cyan/90 hover:to-neon-violet/90 text-white border-0 shadow-glow-cyan font-light h-11 rounded-xl transition-all duration-300"
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
                    className="w-full sm:w-auto bg-white/[0.02] border-neon-coral/30 text-neon-coral hover:bg-neon-coral/10 hover:border-neon-coral/50 transition-all duration-300 font-light h-11 rounded-xl"
                  >
                    <HandCoins className="h-4 w-4 mr-2" />
                    {t('referAndEarn')}
                  </Button>
                </CardFooter>
              </Card>
              ))}
            </div>
            
            {hasMore && (
              <div className="flex justify-center mt-12">
                <Button 
                  onClick={() => setDisplayCount(prev => prev + 9)}
                  variant="outline"
                  size="lg"
                  className="bg-white/[0.02] border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10 hover:border-neon-cyan/50 px-8 py-6 rounded-xl font-light transition-all duration-300 shadow-glow-cyan"
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