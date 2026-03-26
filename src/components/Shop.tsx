import { useState, useMemo, useCallback } from "react";
import { useShopifyProducts } from "@/hooks/useShopifyProducts";
import { useShopifyCart, ShopifyProduct } from "@/stores/shopifyCartStore";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Loader2, Search, ShoppingCart, ArrowLeft, Globe, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "./ui/card";
import { useTranslation } from "@/contexts/TranslationContext";
import { Badge } from "./ui/badge";
import { countryTranslations } from "@/utils/countryTranslations";

/** Build a lookup: lowercase translated name → english name, for all languages */
const translationIndex: Map<string, Set<string>> = new Map();
Object.values(countryTranslations).forEach((langs) => {
  const englishName = langs.EN.toLowerCase();
  Object.values(langs).forEach((name) => {
    const key = name.toLowerCase();
    if (!translationIndex.has(key)) translationIndex.set(key, new Set());
    translationIndex.get(key)!.add(englishName);
  });
});

/** Check if a product title matches a search term across all languages */
function matchesMultilingualSearch(productTitle: string, searchTerm: string): boolean {
  const term = searchTerm.toLowerCase();
  const title = productTitle.toLowerCase();

  // Direct title match
  if (title.includes(term)) return true;

  // Check if the search term matches any translation
  for (const [translatedName, englishNames] of translationIndex) {
    if (translatedName.includes(term)) {
      for (const en of englishNames) {
        if (title.includes(en)) return true;
      }
    }
  }

  return false;
}

/** Parse variant title like "Andorra 3GB 30Days" into data + validity */
function parseVariant(title: string): { data: string; validity: string } {
  const match = title.match(/(\d+(?:\.\d+)?(?:GB|MB))\s+(\d+Days?)/i);
  if (match) return { data: match[1], validity: match[2] };
  return { data: title, validity: "" };
}

/** Extract country name from product title (remove " eSIM" suffix) */
function getCountryName(title: string): string {
  return title.replace(/\s*eSIM$/i, "").trim();
}

/** Extract flag emoji from description */
function getFlag(description: string): string {
  const match = description.match(/[\u{1F1E0}-\u{1F1FF}]{2}/u);
  return match ? match[0] : "🌍";
}

/** Get starting price for a product */
function getStartingPrice(product: ShopifyProduct): number {
  return parseFloat(product.node.priceRange.minVariantPrice.amount);
}

/* ─── Country Card ─── */
const CountryCard = ({ product, onClick }: { product: ShopifyProduct; onClick: () => void }) => {
  const image = product.node.images.edges[0]?.node;
  const flag = getFlag(product.node.description);
  const countryName = getCountryName(product.node.title);
  const startingPrice = getStartingPrice(product);
  const variantCount = product.node.variants.edges.length;

  return (
    <Card
      className="group relative overflow-hidden bg-white/[0.03] border border-white/10 hover:border-neon-cyan/40 transition-all duration-200 rounded-2xl cursor-pointer hover:shadow-lg hover:shadow-neon-cyan/5 hover:-translate-y-0.5"
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-neon-violet/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

      {image && (
        <div className="relative h-32 overflow-hidden">
          <img
            src={image.url}
            alt={image.altText || countryName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-2 left-3 text-2xl">{flag}</div>
        </div>
      )}

      <CardContent className="relative z-10 p-4">
        <h3 className="text-base font-medium text-white group-hover:text-neon-cyan transition-colors truncate mb-1">
          {countryName}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/50">
            {variantCount} plan{variantCount !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-1">
            <span className="text-sm text-neon-cyan font-medium">
              from ${startingPrice.toFixed(2)}
            </span>
            <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-neon-cyan transition-colors" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/* ─── Package Detail View ─── */
const PackageView = ({
  product,
  onBack,
  onAddToCart,
  isCartLoading,
}: {
  product: ShopifyProduct;
  onBack: () => void;
  onAddToCart: (product: ShopifyProduct, variantId: string) => void;
  isCartLoading: boolean;
}) => {
  const image = product.node.images.edges[0]?.node;
  const flag = getFlag(product.node.description);
  const countryName = getCountryName(product.node.title);
  const variants = product.node.variants.edges;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-white/60 hover:text-neon-cyan transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-light">Back to countries</span>
      </button>

      <div className="flex items-center gap-4 mb-8">
        {image && (
          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
            <img src={image.url} alt={countryName} className="w-full h-full object-cover" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{flag}</span>
            <h2 className="text-2xl md:text-3xl font-semibold text-white">{countryName}</h2>
          </div>
          <p className="text-white/50 text-sm font-light mt-1">
            {variants.length} package{variants.length !== 1 ? "s" : ""} available
          </p>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {variants.map((variant) => {
          const { data, validity } = parseVariant(variant.node.title);
          const price = parseFloat(variant.node.price.amount);

          return (
            <Card
              key={variant.node.id}
              className="group relative overflow-hidden bg-white/[0.03] border border-white/10 hover:border-neon-cyan/30 rounded-xl transition-all duration-200"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-xl font-semibold text-white">{data}</div>
                    {validity && (
                      <div className="text-sm text-white/50 font-light">{validity.replace("Days", " Days")}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold bg-gradient-to-r from-neon-cyan to-white bg-clip-text text-transparent">
                      ${price.toFixed(2)}
                    </div>
                    <div className="text-xs text-white/40">USD</div>
                  </div>
                </div>

                <Button
                  onClick={() => onAddToCart(product, variant.node.id)}
                  disabled={isCartLoading || !variant.node.availableForSale}
                  className="w-full bg-white/[0.05] border border-neon-cyan/30 text-white hover:bg-neon-cyan/10 hover:border-neon-cyan/50 font-light h-10 rounded-lg transition-colors duration-200"
                  size="sm"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {variant.node.availableForSale ? "Add to Cart" : "Sold Out"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Main Shop Component ─── */
export const Shop = () => {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ShopifyProduct | null>(null);
  const addItem = useShopifyCart((state) => state.addItem);
  const isCartLoading = useShopifyCart((state) => state.isLoading);

  const { data, isLoading, isError, refetch } = useShopifyProducts(250, activeSearch || undefined);
  const products = data?.products || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchInput.trim());
    setSelectedProduct(null);
  };

  const handleAddToCart = useCallback(
    async (product: ShopifyProduct, variantId: string) => {
      const variant = product.node.variants.edges.find((v) => v.node.id === variantId)?.node;
      if (!variant) return;
      await addItem({
        product,
        variantId: variant.id,
        variantTitle: variant.title,
        price: variant.price,
        quantity: 1,
        selectedOptions: variant.selectedOptions || [],
      });
      toast.success(`${variant.title} added to cart!`);
    },
    [addItem]
  );

  return (
    <section id="shop" className="py-16 md:py-24 px-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-neon-cyan/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-neon-violet/5 rounded-full blur-2xl pointer-events-none" />

      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-block mb-3 md:mb-4">
            <span className="text-neon-cyan text-xs md:text-sm font-light tracking-[0.25em] uppercase">
              ⚡ {t("esimPlansTitle") || "eSIM Plans"}
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light mb-4 md:mb-5">
            <span className="block bg-gradient-to-r from-neon-cyan via-white to-neon-violet bg-clip-text text-transparent">
              {selectedProduct ? getCountryName(selectedProduct.node.title) : t("esimPlansTitle") || "Browse Plans"}
            </span>
          </h2>
          <p className="text-white/70 text-base md:text-lg lg:text-xl font-light max-w-2xl mx-auto">
            {selectedProduct
              ? "Choose a data package for your trip"
              : t("esimPlansSubtitle") || "Select a destination to see available eSIM packages"}
          </p>
        </div>

        {/* Search — only show on country grid */}
        {!selectedProduct && (
          <div className="mb-10 md:mb-12 max-w-3xl mx-auto">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neon-cyan z-10 pointer-events-none" />
              <Input
                placeholder={t("searchPlaceholder") || "Search countries..."}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-11 h-12 md:h-14 bg-white/[0.03] border-white/10 hover:border-neon-cyan/30 focus:border-neon-cyan/50 text-white placeholder:text-white/40 rounded-xl transition-colors duration-200"
              />
            </form>
          </div>
        )}

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
        ) : selectedProduct ? (
          <PackageView
            product={selectedProduct}
            onBack={() => setSelectedProduct(null)}
            onAddToCart={handleAddToCart}
            isCartLoading={isCartLoading}
          />
        ) : !products.length ? (
          <div className="text-center py-20">
            <Globe className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">
              {activeSearch ? "No countries match your search" : "No products found"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
            {products.map((product) => (
              <CountryCard
                key={product.node.id}
                product={product}
                onClick={() => setSelectedProduct(product)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
