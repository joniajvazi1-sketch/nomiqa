import { memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useShopifyProducts } from "@/hooks/useShopifyProducts";
import { useShopifyCart, ShopifyProduct } from "@/stores/shopifyCartStore";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Loader2, ArrowRight, ShoppingCart } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { useTranslation } from "@/contexts/TranslationContext";
import { toast } from "sonner";

interface ProductCardProps {
  product: ShopifyProduct;
  index: number;
  onAddToCart: (product: ShopifyProduct) => void;
  onClick: () => void;
  isCartLoading: boolean;
}

const DesktopProductCard = memo(({ product, index, onAddToCart, onClick, isCartLoading }: ProductCardProps) => {
  const image = product.node.images.edges[0]?.node;
  const price = product.node.priceRange.minVariantPrice;
  const variant = product.node.variants.edges[0]?.node;

  return (
    <Card
      className="group relative overflow-hidden backdrop-blur-xl bg-card/50 border-border/50 hover:border-neon-cyan/30 transition-all duration-300 hover:shadow-xl hover:shadow-neon-cyan/10 hover:-translate-y-1 animate-fade-in cursor-pointer"
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={onClick}
    >
      {image && (
        <div className="relative h-36 overflow-hidden">
          <img src={image.url} alt={image.altText || product.node.title} className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}
      <CardContent className="p-5">
        <h3 className="text-lg font-semibold group-hover:text-neon-cyan transition-colors line-clamp-1 mb-1">
          {product.node.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-1 mb-3">{product.node.description}</p>

        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="text-2xl font-semibold bg-gradient-to-r from-white via-neon-cyan to-white bg-clip-text text-transparent">
            {price.currencyCode} {parseFloat(price.amount).toFixed(2)}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-neon-cyan hover:bg-neon-cyan/10 h-8 px-3"
            disabled={isCartLoading || !variant?.availableForSale}
            onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
          >
            <ShoppingCart className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
DesktopProductCard.displayName = 'DesktopProductCard';

const MobileProductRow = memo(({ product, index, onAddToCart, onClick, isCartLoading }: ProductCardProps) => {
  const image = product.node.images.edges[0]?.node;
  const price = product.node.priceRange.minVariantPrice;
  const variant = product.node.variants.edges[0]?.node;

  return (
    <div
      className="group relative overflow-hidden backdrop-blur-xl bg-card/50 border border-border/50 hover:border-neon-cyan/30 rounded-2xl transition-all duration-300 cursor-pointer animate-fade-in p-4"
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        {image && (
          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
            <img src={image.url} alt={image.altText || product.node.title} className="w-full h-full object-cover" loading="lazy" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold group-hover:text-neon-cyan transition-colors truncate">
            {product.node.title}
          </h3>
          <p className="text-xs text-muted-foreground truncate">{product.node.description}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-xl font-semibold bg-gradient-to-r from-white via-neon-cyan to-white bg-clip-text text-transparent whitespace-nowrap">
            {price.currencyCode} {parseFloat(price.amount).toFixed(2)}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-neon-cyan h-8 w-8 p-0"
            disabled={isCartLoading || !variant?.availableForSale}
            onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
          >
            <ShoppingCart className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
});
MobileProductRow.displayName = 'MobileProductRow';

export const FeaturedProducts = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useShopifyProducts(12);
  const { t } = useTranslation();
  const addItem = useShopifyCart(state => state.addItem);
  const isCartLoading = useShopifyCart(state => state.isLoading);

  const handleAddToCart = useCallback(async (product: ShopifyProduct) => {
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
  }, [addItem]);

  const handleProductClick = useCallback((product: ShopifyProduct) => {
    navigate(`/product/${product.node.handle}`);
  }, [navigate]);

  if (isLoading || !data?.products) {
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

  const products = data.products;

  return (
    <section className="py-24 relative overflow-hidden bg-gradient-to-b from-background via-background/50 to-background">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.1),transparent_50%)]" />

      <div className="container px-6 md:px-8 relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-block mb-4">
            <Badge variant="outline" className="border-neon-cyan/20 text-neon-cyan bg-neon-cyan/5 px-4 py-2">
              {t("instantAccess") || "Instant Access"}
            </Badge>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light font-display mb-6">
            <span className="bg-gradient-to-r from-neon-cyan via-white to-neon-violet bg-clip-text text-transparent font-semibold">
              {t("instantGlobalDataAccess") || "Instant Global Data Access"}
            </span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light">
            {t("instantGlobalDataAccessDesc") || "Browse our eSIM plans for worldwide connectivity"}
          </p>
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {products.map((product, index) => (
            <DesktopProductCard
              key={product.node.id}
              product={product}
              index={index}
              onAddToCart={handleAddToCart}
              onClick={() => handleProductClick(product)}
              isCartLoading={isCartLoading}
            />
          ))}
        </div>

        {/* Mobile List */}
        <div className="md:hidden space-y-3 mb-12">
          {products.map((product, index) => (
            <MobileProductRow
              key={product.node.id}
              product={product}
              index={index}
              onAddToCart={handleAddToCart}
              onClick={() => handleProductClick(product)}
              isCartLoading={isCartLoading}
            />
          ))}
        </div>

        <div className="text-center animate-fade-in" style={{ animationDelay: "0.6s" }}>
          <Button
            size="lg"
            onClick={() => navigate('/shop')}
            className="h-auto py-3 px-6 md:px-10 md:py-7 text-sm md:text-base lg:text-lg font-light bg-white/[0.05] backdrop-blur-xl border-2 border-white/20 text-white hover:bg-white/10 hover:border-white/40 rounded-xl md:rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-white/20"
          >
            <span>{t("viewAllPlans") || "View All Plans"}</span>
            <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};
