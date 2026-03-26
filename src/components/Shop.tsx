import { useState } from "react";
import { useShopifyProducts } from "@/hooks/useShopifyProducts";
import { useShopifyCart, ShopifyProduct } from "@/stores/shopifyCartStore";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Loader2, Search, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardFooter } from "./ui/card";
import { useTranslation } from "@/contexts/TranslationContext";

export const Shop = () => {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [displayCount, setDisplayCount] = useState(12);
  const addItem = useShopifyCart(state => state.addItem);
  const isCartLoading = useShopifyCart(state => state.isLoading);

  const { data, isLoading, isError, refetch } = useShopifyProducts(250, activeSearch || undefined);

  const products = data?.products || [];
  const displayedProducts = products.slice(0, displayCount);
  const hasMore = products.length > displayCount;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchInput.trim());
    setDisplayCount(12);
  };

  const handleAddToCart = async (product: ShopifyProduct) => {
    const variant = product.node.variants.edges[0]?.node;
    if (!variant) return;

    await addItem({
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions || [],
    });
    toast.success(`${product.node.title} added to cart!`);
  };

  return (
    <section id="shop" className="py-16 md:py-24 px-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-neon-cyan/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-neon-violet/5 rounded-full blur-2xl pointer-events-none" />

      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-block mb-3 md:mb-4">
            <span className="text-neon-cyan text-xs md:text-sm font-light tracking-[0.25em] uppercase">
              ⚡ {t('esimPlansTitle') || 'eSIM Plans'}
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light mb-4 md:mb-5">
            <span className="block bg-gradient-to-r from-neon-cyan via-white to-neon-violet bg-clip-text text-transparent">
              {t('esimPlansTitle') || 'Browse Plans'}
            </span>
          </h2>
          <p className="text-white/70 text-base md:text-lg lg:text-xl font-light max-w-2xl mx-auto">
            {t('esimPlansSubtitle') || 'Find the perfect eSIM plan for your destination'}
          </p>
        </div>

        {/* Search */}
        <div className="mb-10 md:mb-12 max-w-3xl mx-auto">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neon-cyan z-10 pointer-events-none" />
            <Input
              placeholder={t('searchPlaceholder') || 'Search eSIM plans...'}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-11 h-12 md:h-14 bg-white/[0.03] border-white/10 hover:border-neon-cyan/30 focus:border-neon-cyan/50 text-white placeholder:text-white/40 rounded-xl transition-colors duration-200"
            />
          </form>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-neon-cyan" />
          </div>
        ) : isError ? (
          <div className="text-center py-20 space-y-4">
            <p className="text-white/60">Failed to load products. Please try again.</p>
            <Button onClick={() => refetch()} variant="outline" className="border-neon-cyan text-neon-cyan">
              Retry
            </Button>
          </div>
        ) : !displayedProducts.length ? (
          <div className="text-center py-20">
            <p className="text-white/60">
              {activeSearch ? "No products match your search" : "No products found"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {displayedProducts.map((product) => {
                const image = product.node.images.edges[0]?.node;
                const price = product.node.priceRange.minVariantPrice;
                const variant = product.node.variants.edges[0]?.node;

                return (
                  <Card
                    key={product.node.id}
                    className="group relative overflow-hidden bg-white/[0.03] border border-white/10 hover:border-neon-cyan/40 transition-colors duration-200 rounded-2xl"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-neon-violet/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

                    {/* Product Image */}
                    {image && (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={image.url}
                          alt={image.altText || product.node.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      </div>
                    )}

                    <CardContent className="relative z-10 p-5">
                      <h3 className="text-lg font-medium text-white group-hover:text-neon-cyan transition-colors mb-1 line-clamp-2">
                        {product.node.title}
                      </h3>
                      {product.node.description && (
                        <p className="text-sm text-white/50 font-light line-clamp-2 mb-4">
                          {product.node.description}
                        </p>
                      )}

                      {/* Variant options */}
                      {product.node.options.length > 0 && product.node.options[0].name !== 'Title' && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {product.node.options[0].values.slice(0, 4).map((val) => (
                            <span key={val} className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60">
                              {val}
                            </span>
                          ))}
                          {product.node.options[0].values.length > 4 && (
                            <span className="text-xs px-2 py-0.5 text-white/40">+{product.node.options[0].values.length - 4}</span>
                          )}
                        </div>
                      )}

                      <div className="pt-3 border-t border-white/10">
                        <div className="text-2xl md:text-3xl font-semibold bg-gradient-to-r from-white via-neon-cyan to-white bg-clip-text text-transparent">
                          {price.currencyCode} {parseFloat(price.amount).toFixed(2)}
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="relative z-10 px-5 pb-5 pt-0">
                      <Button
                        onClick={() => handleAddToCart(product)}
                        disabled={isCartLoading || !variant?.availableForSale}
                        className="w-full bg-white/[0.05] border-2 border-neon-cyan/40 text-white hover:bg-neon-cyan/10 hover:border-neon-cyan/60 font-light h-12 rounded-xl transition-colors duration-200"
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        {variant?.availableForSale ? (t('addToCart') || 'Add to Cart') : 'Sold Out'}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-12">
                <Button
                  onClick={() => setDisplayCount(prev => prev + 12)}
                  variant="outline"
                  size="lg"
                  className="bg-white/[0.02] border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10 hover:border-neon-cyan/50 px-8 py-6 rounded-xl font-light"
                >
                  Load More ({products.length - displayCount} remaining)
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};
