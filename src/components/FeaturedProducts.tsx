import { memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useShopifyProducts } from "@/hooks/useShopifyProducts";
import { ShopifyProduct } from "@/stores/shopifyCartStore";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Loader2, ArrowRight, ChevronRight } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { useTranslation } from "@/contexts/TranslationContext";

function getCountryName(title: string): string {
  return title.replace(/\s*eSIM$/i, "").trim();
}

function getFlag(description: string): string {
  const match = description.match(/[\u{1F1E0}-\u{1F1FF}]{2}/u);
  return match ? match[0] : "🌍";
}

interface CountryPreviewProps {
  product: ShopifyProduct;
  index: number;
  onClick: () => void;
}

const DesktopCountryCard = memo(({ product, index, onClick }: CountryPreviewProps) => {
  const image = product.node.images.edges[0]?.node;
  const startingPrice = parseFloat(product.node.priceRange.minVariantPrice.amount);
  const countryName = getCountryName(product.node.title);
  const flag = getFlag(product.node.description);
  const planCount = product.node.variants.edges.length;

  return (
    <Card
      className="group relative overflow-hidden backdrop-blur-xl bg-card/50 border-border/50 hover:border-neon-cyan/30 transition-all duration-300 hover:shadow-xl hover:shadow-neon-cyan/10 hover:-translate-y-1 animate-fade-in cursor-pointer"
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={onClick}
    >
      {image && (
        <div className="relative h-32 overflow-hidden">
          <img src={image.url} alt={image.altText || countryName} className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-2 left-3 text-2xl">{flag}</div>
        </div>
      )}
      <CardContent className="p-4">
        <h3 className="text-base font-semibold group-hover:text-neon-cyan transition-colors truncate mb-1">
          {countryName}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{planCount} plans</span>
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium bg-gradient-to-r from-white via-neon-cyan to-white bg-clip-text text-transparent">
              from ${startingPrice.toFixed(2)}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-white/30 group-hover:text-neon-cyan transition-colors" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
DesktopCountryCard.displayName = "DesktopCountryCard";

const MobileCountryRow = memo(({ product, index, onClick }: CountryPreviewProps) => {
  const image = product.node.images.edges[0]?.node;
  const startingPrice = parseFloat(product.node.priceRange.minVariantPrice.amount);
  const countryName = getCountryName(product.node.title);
  const flag = getFlag(product.node.description);
  const planCount = product.node.variants.edges.length;

  return (
    <div
      className="group relative overflow-hidden backdrop-blur-xl bg-card/50 border border-border/50 hover:border-neon-cyan/30 rounded-2xl transition-all duration-300 cursor-pointer animate-fade-in p-4"
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        {image ? (
          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
            <img src={image.url} alt={countryName} className="w-full h-full object-cover" loading="lazy" />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 text-xl">
            {flag}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold group-hover:text-neon-cyan transition-colors truncate">
            {flag} {countryName}
          </h3>
          <p className="text-xs text-muted-foreground">{planCount} plans</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-sm font-medium bg-gradient-to-r from-white via-neon-cyan to-white bg-clip-text text-transparent whitespace-nowrap">
            from ${startingPrice.toFixed(2)}
          </span>
          <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-neon-cyan" />
        </div>
      </div>
    </div>
  );
});
MobileCountryRow.displayName = "MobileCountryRow";

export const FeaturedProducts = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useShopifyProducts(12);
  const { t } = useTranslation();

  const handleCountryClick = useCallback(
    (product: ShopifyProduct) => {
      navigate(`/shop?country=${encodeURIComponent(product.node.handle)}`);
    },
    [navigate]
  );

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
            {t("instantGlobalDataAccessDesc") || "Select a destination to see eSIM packages"}
          </p>
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-12">
          {products.map((product, index) => (
            <DesktopCountryCard
              key={product.node.id}
              product={product}
              index={index}
              onClick={() => handleCountryClick(product)}
            />
          ))}
        </div>

        {/* Mobile List */}
        <div className="md:hidden space-y-3 mb-12">
          {products.map((product, index) => (
            <MobileCountryRow
              key={product.node.id}
              product={product}
              index={index}
              onClick={() => handleCountryClick(product)}
            />
          ))}
        </div>

        <div className="text-center animate-fade-in" style={{ animationDelay: "0.6s" }}>
          <Button
            size="lg"
            onClick={() => navigate("/shop")}
            className="h-auto py-3 px-6 md:px-10 md:py-7 text-sm md:text-base lg:text-lg font-light bg-white/[0.05] backdrop-blur-xl border-2 border-white/20 text-white hover:bg-white/10 hover:border-white/40 rounded-xl md:rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-white/20"
          >
            <span>{t("viewAllPlans") || "View All Countries"}</span>
            <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};
