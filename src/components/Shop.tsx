import { useState, useMemo, useCallback } from "react";
import { useShopifyProducts } from "@/hooks/useShopifyProducts";
import { useShopifyCart, ShopifyProduct } from "@/stores/shopifyCartStore";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Loader2, Search, ShoppingCart, ArrowLeft, Globe, ChevronRight, ChevronDown, MapPin, Map } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "./ui/card";
import { useTranslation } from "@/contexts/TranslationContext";
import { countryTranslations } from "@/utils/countryTranslations";
import { useIsMobile } from "@/hooks/use-mobile";

/* ─── Multilingual search index ─── */
const translationIndex: globalThis.Map<string, Set<string>> = new globalThis.Map();
Object.values(countryTranslations).forEach((langs) => {
  const englishName = langs.EN.toLowerCase();
  Object.values(langs).forEach((name) => {
    const key = (name as string).toLowerCase();
    const existing = translationIndex.get(key);
    if (existing) { existing.add(englishName); }
    else { translationIndex.set(key, new Set([englishName])); }
  });
});

function matchesMultilingualSearch(productTitle: string, searchTerm: string): boolean {
  const term = searchTerm.toLowerCase();
  const title = productTitle.toLowerCase();
  if (title.includes(term)) return true;
  for (const [translatedName, englishNames] of translationIndex) {
    if (translatedName.includes(term)) {
      for (const en of englishNames) {
        if (title.includes(en)) return true;
      }
    }
  }
  return false;
}

/* ─── Helpers ─── */
function parseVariant(title: string): { data: string; validity: string } {
  const match = title.match(/(\d+(?:\.\d+)?(?:GB|MB))\s+(\d+Days?)/i);
  if (match) return { data: match[1], validity: match[2].replace("Days", " Days").replace("Day", " Day") };
  return { data: title, validity: "" };
}

function getCountryName(title: string): string {
  return title.replace(/\s*eSIM$/i, "").trim();
}

function getFlag(description: string): string {
  const match = description.match(/[\u{1F1E0}-\u{1F1FF}]{2}/u);
  return match ? match[0] : "🌍";
}

function getCleanDescription(description: string): string {
  const descMatch = description.match(/Description\s+(.*?)(?:\s+Technical Specs|$)/s);
  if (descMatch) return descMatch[1].trim();
  return description;
}

function getFeatures(description: string): { topUp: boolean; hotspot: boolean; fiveG: boolean } {
  return {
    topUp: /Top Up Available:\s*Yes/i.test(description),
    hotspot: /Hotspot:\s*Yes/i.test(description),
    fiveG: /5G/i.test(description),
  };
}

/** Regional keywords in product tags or title */
const REGIONAL_KEYWORDS = ["africa", "asia", "europe", "caribbean", "latin", "north america", "global", "middle east", "oceania", "eu-plus", "european union"];

function isRegionalProduct(product: ShopifyProduct): boolean {
  const tags = product.node.description.toLowerCase() + " " + product.node.title.toLowerCase();
  // Check for "single-country" tag absence or regional keywords
  if (REGIONAL_KEYWORDS.some((kw) => tags.includes(kw))) {
    // But exclude if it's a single country in a region (check variant count and title pattern)
    const name = getCountryName(product.node.title).toLowerCase();
    // If the name itself IS a region name, it's regional
    if (REGIONAL_KEYWORDS.some((kw) => name.includes(kw))) return true;
  }
  return false;
}

type TabType = "local" | "regional";

/* ─── Country Card ─── */
const CountryCard = ({ product, onClick }: { product: ShopifyProduct; onClick: () => void }) => {
  const image = product.node.images.edges[0]?.node;
  const flag = getFlag(product.node.description);
  const countryName = getCountryName(product.node.title);
  const startingPrice = parseFloat(product.node.priceRange.minVariantPrice.amount);
  const variantCount = product.node.variants.edges.length;
  const features = getFeatures(product.node.description);
  const isRegional = isRegionalProduct(product);

  return (
    <Card
      className="group relative overflow-hidden bg-white/[0.02] border border-white/[0.08] hover:border-neon-cyan/40 transition-all duration-300 rounded-2xl cursor-pointer hover:shadow-xl hover:shadow-neon-cyan/[0.08]"
      onClick={onClick}
    >
      {/* Desktop: vertical card */}
      <div className="hidden sm:block">
        {image && (
          <div className="relative h-36 overflow-hidden">
            <img src={image.url} alt={image.altText || countryName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <span className="text-2xl drop-shadow-lg">{flag}</span>
              <h3 className="text-base font-semibold text-white drop-shadow-lg">{countryName}</h3>
            </div>
            {isRegional && (
              <div className="absolute top-2.5 right-2.5">
                <span className="text-[10px] px-2 py-1 rounded-full bg-neon-violet/80 text-white font-medium backdrop-blur-sm">Regional</span>
              </div>
            )}
          </div>
        )}
        <CardContent className="relative z-10 p-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-white/40">{variantCount} plans</span>
              {features.fiveG && <span className="text-[10px] text-neon-cyan/80 font-medium">5G</span>}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-neon-cyan">from ${startingPrice.toFixed(2)}</span>
              <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-neon-cyan group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
        </CardContent>
      </div>

      {/* Mobile: horizontal row */}
      <div className="sm:hidden">
        <CardContent className="relative z-10 p-3.5">
          <div className="flex items-center gap-3">
            {image ? (
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-white/[0.08]">
                <img src={image.url} alt={countryName} className="w-full h-full object-cover" loading="lazy" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 text-xl border border-white/[0.08]">{flag}</div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-base">{flag}</span>
                <h3 className="text-sm font-semibold text-white group-hover:text-neon-cyan transition-colors truncate">{countryName}</h3>
                {isRegional && <span className="text-[9px] px-1.5 py-0.5 rounded bg-neon-violet/60 text-white/90 font-medium flex-shrink-0">Region</span>}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-white/35">
                <span>{variantCount} plans</span>
                {features.fiveG && <span className="text-neon-cyan/60">• 5G</span>}
                {features.hotspot && <span>• Hotspot</span>}
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="text-right">
                <div className="text-sm font-semibold text-neon-cyan">${startingPrice.toFixed(2)}</div>
                <div className="text-[9px] text-white/25 uppercase">from</div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/15 group-hover:text-neon-cyan" />
            </div>
          </div>
        </CardContent>
      </div>
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
  const cleanDesc = getCleanDescription(product.node.description);
  const features = getFeatures(product.node.description);

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-2 text-white/50 hover:text-neon-cyan transition-colors mb-6 group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-light">All destinations</span>
      </button>

      {/* Hero header */}
      <div className="relative rounded-2xl overflow-hidden mb-6">
        {image && (
          <div className="relative h-40 md:h-52">
            <img src={image.url} alt={countryName} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
            <div className="absolute bottom-4 left-5 md:bottom-6 md:left-8">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl md:text-4xl drop-shadow-lg">{flag}</span>
                <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">{countryName}</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/60">{variants.length} packages</span>
                <span className="text-white/20">•</span>
                <span className="text-xs text-neon-cyan font-medium">
                  from ${parseFloat(product.node.priceRange.minVariantPrice.amount).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info card */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4 md:p-6 mb-6">
        <p className="text-white/60 text-sm leading-relaxed mb-4">{cleanDesc}</p>
        <div className="flex flex-wrap gap-2">
          {features.fiveG && (
            <span className="text-xs px-3 py-1.5 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan font-medium">5G</span>
          )}
          {features.hotspot && (
            <span className="text-xs px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/50">Hotspot</span>
          )}
          {features.topUp && (
            <span className="text-xs px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/50">Top Up</span>
          )}
          <span className="text-xs px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/50">Data Only</span>
        </div>
      </div>

      {/* Packages */}
      <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-4">Choose a Package</h3>

      <div className="space-y-3">
        {variants.map((variant) => {
          const { data, validity } = parseVariant(variant.node.title);
          const price = parseFloat(variant.node.price.amount);

          return (
            <div
              key={variant.node.id}
              className="group flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:border-neon-cyan/30 transition-all duration-200"
            >
              {/* Data badge */}
              <div className="w-16 h-16 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-neon-cyan/15 to-neon-violet/10 border border-neon-cyan/20 flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-neon-cyan leading-none">{data}</span>
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">{data}</div>
                {validity && <div className="text-xs text-white/40 mt-0.5">{validity}</div>}
              </div>

              {/* Price + button */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <div className="text-lg md:text-xl font-bold text-white">${price.toFixed(2)}</div>
                </div>
                <Button
                  onClick={(e) => { e.stopPropagation(); onAddToCart(product, variant.node.id); }}
                  disabled={isCartLoading || !variant.node.availableForSale}
                  size="sm"
                  className="bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/20 hover:border-neon-cyan/50 h-9 px-3 rounded-lg transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Main Shop Component ─── */
export const Shop = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<TabType>("local");
  const [searchInput, setSearchInput] = useState("");
  const [displayCount, setDisplayCount] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<ShopifyProduct | null>(null);
  const addItem = useShopifyCart((state) => state.addItem);
  const isCartLoading = useShopifyCart((state) => state.isLoading);

  const { data, isLoading, isError, refetch } = useShopifyProducts(250);
  const allProducts = data?.products || [];

  const { localProducts, regionalProducts } = useMemo(() => {
    const local: ShopifyProduct[] = [];
    const regional: ShopifyProduct[] = [];
    allProducts.forEach((p) => {
      if (isRegionalProduct(p)) regional.push(p);
      else local.push(p);
    });
    return { localProducts: local, regionalProducts: regional };
  }, [allProducts]);

  const activeProducts = activeTab === "local" ? localProducts : regionalProducts;

  const filteredProducts = useMemo(() => {
    const term = searchInput.trim();
    if (!term) return activeProducts;
    return activeProducts.filter((p) => matchesMultilingualSearch(p.node.title, term));
  }, [activeProducts, searchInput]);

  const defaultLimit = isMobile ? 5 : 10;
  const isSearching = searchInput.trim().length > 0;
  const limit = isSearching ? filteredProducts.length : (displayCount || defaultLimit);
  const visibleProducts = filteredProducts.slice(0, limit);
  const hasMore = !isSearching && filteredProducts.length > limit;
  const remainingCount = filteredProducts.length - limit;

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

  const loadMore = () => {
    setDisplayCount((prev) => (prev || defaultLimit) + (isMobile ? 10 : 20));
  };

  const switchTab = (tab: TabType) => {
    setActiveTab(tab);
    setDisplayCount(0);
    setSearchInput("");
  };

  return (
    <section id="shop" className="py-16 md:py-24 px-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-neon-cyan/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-neon-violet/5 rounded-full blur-2xl pointer-events-none" />

      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-block mb-3">
            <span className="text-neon-cyan text-xs md:text-sm font-light tracking-[0.25em] uppercase">
              ⚡ {t("esimPlansTitle") || "eSIM Plans"}
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-light mb-3 md:mb-5">
            <span className="block bg-gradient-to-r from-neon-cyan via-white to-neon-violet bg-clip-text text-transparent">
              {selectedProduct ? getCountryName(selectedProduct.node.title) : t("esimPlansTitle") || "Browse Plans"}
            </span>
          </h2>
          {!selectedProduct && (
            <p className="text-white/50 text-sm md:text-lg font-light max-w-2xl mx-auto">
              {t("esimPlansSubtitle") || "Select a destination to see available eSIM packages"}
            </p>
          )}
        </div>

        {/* Tabs + Search — only on grid view */}
        {!selectedProduct && (
          <>
            {/* Local / Regional toggle */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex bg-white/[0.03] border border-white/[0.08] rounded-xl p-1">
                <button
                  onClick={() => switchTab("local")}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === "local"
                      ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/25 shadow-sm shadow-neon-cyan/10"
                      : "text-white/40 hover:text-white/60"
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  Local
                  <span className="text-[10px] opacity-60 ml-0.5">({localProducts.length})</span>
                </button>
                <button
                  onClick={() => switchTab("regional")}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === "regional"
                      ? "bg-neon-violet/15 text-neon-violet border border-neon-violet/25 shadow-sm shadow-neon-violet/10"
                      : "text-white/40 hover:text-white/60"
                  }`}
                >
                  <Map className="w-4 h-4" />
                  Regional
                  <span className="text-[10px] opacity-60 ml-0.5">({regionalProducts.length})</span>
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="mb-8 md:mb-10 max-w-2xl mx-auto">
              <form onSubmit={(e) => e.preventDefault()} className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neon-cyan/60 z-10 pointer-events-none" />
                <Input
                  placeholder={t("searchPlaceholder") || "Search in any language..."}
                  value={searchInput}
                  onChange={(e) => { setSearchInput(e.target.value); setDisplayCount(0); }}
                  className="pl-10 h-11 md:h-12 bg-white/[0.02] border-white/[0.08] hover:border-white/15 focus:border-neon-cyan/40 text-white placeholder:text-white/25 rounded-xl text-sm transition-colors duration-200"
                />
              </form>
            </div>
          </>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-neon-cyan" />
          </div>
        ) : isError ? (
          <div className="text-center py-20 space-y-4">
            <p className="text-white/60">Failed to load products.</p>
            <Button onClick={() => refetch()} variant="outline" className="border-neon-cyan text-neon-cyan">Retry</Button>
          </div>
        ) : selectedProduct ? (
          <PackageView
            product={selectedProduct}
            onBack={() => setSelectedProduct(null)}
            onAddToCart={handleAddToCart}
            isCartLoading={isCartLoading}
          />
        ) : !filteredProducts.length ? (
          <div className="text-center py-20">
            <Globe className="w-10 h-10 text-white/15 mx-auto mb-3" />
            <p className="text-white/40 text-sm">
              {searchInput.trim() ? "No destinations match your search" : "No products found"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {visibleProducts.map((product) => (
                <CountryCard
                  key={product.node.id}
                  product={product}
                  onClick={() => { setSelectedProduct(product); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button
                  onClick={loadMore}
                  variant="outline"
                  className="bg-white/[0.02] border-white/[0.08] text-white/50 hover:bg-white/[0.05] hover:border-neon-cyan/20 hover:text-neon-cyan rounded-xl px-6 py-4 text-sm font-light"
                >
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Show More ({remainingCount})
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};
