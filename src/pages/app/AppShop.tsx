import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import {
  Search, ShoppingCart, Globe, ChevronDown, X, ChevronRight, ArrowLeft,
  MapPin, Map, Wifi, Calendar, Zap, Shield, AlertCircle, CheckCircle2, XCircle,
  Plus, Check, ArrowRight,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useShopifyProducts } from '@/hooks/useShopifyProducts';
import { useShopifyCart, ShopifyProduct } from '@/stores/shopifyCartStore';
import { useEnhancedHaptics } from '@/hooks/useEnhancedHaptics';
import { useEnhancedSounds } from '@/hooks/useEnhancedSounds';
import { useTranslation } from '@/contexts/TranslationContext';
import { useDeviceCompatibility } from '@/hooks/useDeviceCompatibility';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AppSpinner } from '@/components/app/AppSpinner';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/app/PullToRefreshIndicator';
import { AppSEO } from '@/components/app/AppSEO';
import { countryTranslations } from '@/utils/countryTranslations';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { SwipeableDismiss } from '@/components/app/SwipeableDismiss';

/* ─── Multilingual search ─── */
const translationIndex: globalThis.Map<string, Set<string>> = new globalThis.Map();
Object.values(countryTranslations).forEach((langs) => {
  const englishName = langs.EN.toLowerCase();
  Object.values(langs).forEach((name) => {
    const key = (name as string).toLowerCase();
    const existing = translationIndex.get(key);
    if (existing) existing.add(englishName);
    else translationIndex.set(key, new Set([englishName]));
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
  if (match) return { data: match[1], validity: match[2].replace('Days', ' Days').replace('Day', ' Day') };
  return { data: title, validity: '' };
}

function getCountryName(title: string): string {
  return title.replace(/\s*eSIM$/i, '').trim();
}

function getFlag(description: string): string {
  const match = description.match(/[\u{1F1E0}-\u{1F1FF}]{2}/u);
  return match ? match[0] : '🌍';
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

const REGIONAL_KEYWORDS = ['africa', 'asia', 'europe', 'caribbean', 'latin', 'north america', 'global', 'middle east', 'oceania', 'eu-plus', 'european union'];

function isRegionalProduct(product: ShopifyProduct): boolean {
  const tags = product.node.description.toLowerCase() + ' ' + product.node.title.toLowerCase();
  if (REGIONAL_KEYWORDS.some((kw) => tags.includes(kw))) {
    const name = getCountryName(product.node.title).toLowerCase();
    if (REGIONAL_KEYWORDS.some((kw) => name.includes(kw))) return true;
  }
  return false;
}

type TabType = 'local' | 'regional';

export const AppShop: React.FC = () => {
  const navigate = useNavigate();
  const isAndroid = Capacitor.getPlatform() === 'android';
  const { data, isLoading, isError, refetch } = useShopifyProducts(250);
  const addItem = useShopifyCart((s) => s.addItem);
  const cartItems = useShopifyCart((s) => s.items);
  const isCartLoading = useShopifyCart((s) => s.isLoading);
  const getCheckoutUrl = useShopifyCart((s) => s.getCheckoutUrl);
  const { buttonTap, errorPattern, navigationTap, selectionTap } = useEnhancedHaptics();
  const { playPop, playError, playSwoosh } = useEnhancedSounds();
  const { isCompatible, platform, isLoading: compatLoading } = useDeviceCompatibility();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('local');
  const [displayCount, setDisplayCount] = useState(5);
  const [selectedProduct, setSelectedProduct] = useState<ShopifyProduct | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [cartShaking, setCartShaking] = useState(false);

  const allProducts = data?.products || [];
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Pull-to-refresh
  const handleRefresh = useCallback(async () => { await refetch(); }, [refetch]);
  const { isRefreshing, pullDistance, pullProgress, containerRef } = usePullToRefresh({ onRefresh: handleRefresh });

  const { localProducts, regionalProducts } = useMemo(() => {
    const local: ShopifyProduct[] = [];
    const regional: ShopifyProduct[] = [];
    allProducts.forEach((p) => {
      if (isRegionalProduct(p)) regional.push(p);
      else local.push(p);
    });
    return { localProducts: local, regionalProducts: regional };
  }, [allProducts]);

  const activeProducts = activeTab === 'local' ? localProducts : regionalProducts;

  const filteredProducts = useMemo(() => {
    const term = searchQuery.trim();
    if (!term) return activeProducts;
    return activeProducts.filter((p) => matchesMultilingualSearch(p.node.title, term));
  }, [activeProducts, searchQuery]);

  const isSearching = searchQuery.trim().length > 0;
  const limit = isSearching ? filteredProducts.length : displayCount;
  const visibleProducts = filteredProducts.slice(0, limit);
  const hasMore = !isSearching && filteredProducts.length > limit;
  const remainingCount = filteredProducts.length - limit;

  const handleAddToCart = useCallback(async (product: ShopifyProduct, variantId: string) => {
    const variant = product.node.variants.edges.find((v) => v.node.id === variantId)?.node;
    if (!variant) return;
    buttonTap();
    await addItem({
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions || [],
    });
    playPop();
    toast.success(`${getCountryName(product.node.title)} eSIM added to cart!`);
  }, [addItem, buttonTap, playPop]);

  const handleCartClick = () => {
    buttonTap();
    if (cartItemCount === 0) {
      errorPattern();
      playError();
      setCartShaking(true);
      setTimeout(() => setCartShaking(false), 500);
      toast.error('Cart is empty', { description: 'Add a plan first' });
    } else {
      playSwoosh();
      const checkoutUrl = getCheckoutUrl();
      if (checkoutUrl) {
        window.open(checkoutUrl, '_blank');
      } else {
        navigate('/checkout');
      }
    }
  };

  const handleProductClick = (product: ShopifyProduct) => {
    buttonTap();
    setSelectedProduct(product);
    setDetailModalOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTabChange = (tab: TabType) => {
    selectionTap();
    setActiveTab(tab);
    setDisplayCount(5);
  };

  return (
    <>
      <AppSEO />
      <div ref={containerRef} className="relative">
        <PullToRefreshIndicator pullDistance={pullDistance} pullProgress={pullProgress} isRefreshing={isRefreshing} />

        <div
          className="relative z-10 px-5 py-6 space-y-4"
          style={{ paddingBottom: isAndroid ? '140px' : '112px' }}
        >
          {/* Header */}
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">eSIM Shop</h1>
              <p className="text-base font-semibold text-muted-foreground">
                {allProducts.length} destinations
              </p>
            </div>
            <button
              onClick={handleCartClick}
              className={cn(
                'relative w-12 h-12 rounded-xl bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center transition-colors active:scale-90',
                cartItemCount > 0 ? 'hover:bg-card hover:border-primary/30' : 'hover:bg-card/90',
                cartShaking && 'animate-shake'
              )}
            >
              <ShoppingCart className={cn('w-5 h-5 transition-colors', cartItemCount > 0 ? 'text-primary' : 'text-foreground')} />
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>
          </header>

          {/* Tabs */}
          <div className="flex p-1 rounded-xl bg-card/60 backdrop-blur-sm border border-border">
            <button
              onClick={() => handleTabChange('local')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors active:scale-95',
                activeTab === 'local' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <MapPin className="w-4 h-4" />
              Local
              <span className="text-[10px] opacity-60">({localProducts.length})</span>
            </button>
            <button
              onClick={() => handleTabChange('regional')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors active:scale-95',
                activeTab === 'regional' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Globe className="w-4 h-4" />
              Regional
              <span className="text-[10px] opacity-60">({regionalProducts.length})</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative flex items-center border border-border rounded-xl overflow-hidden bg-card/60 backdrop-blur-sm focus-within:border-primary/50 transition-colors">
            <Search className="absolute left-4 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder={activeTab === 'local' ? 'Search countries...' : 'Search regions...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-10 h-12 bg-transparent border-0 text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 w-6 h-6 rounded-full bg-muted flex items-center justify-center"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Products List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-14">
              <AppSpinner size="lg" label="Loading plans..." />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-14 gap-4">
              <AlertCircle className="w-12 h-12 text-destructive" />
              <div className="text-center">
                <h3 className="font-semibold text-foreground mb-1">Failed to load plans</h3>
                <p className="text-sm text-muted-foreground mb-4">Please check your connection and try again</p>
                <Button onClick={() => refetch()} variant="outline" className="border-primary text-primary">Try Again</Button>
              </div>
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="text-center py-16">
              <Globe className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">
                {searchQuery ? `No plans found for "${searchQuery}"` : 'No plans available'}
              </p>
              {searchQuery && (
                <Button variant="outline" size="sm" onClick={() => setSearchQuery('')} className="mt-2">
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {visibleProducts.map((product) => {
                const image = product.node.images.edges[0]?.node;
                const flag = getFlag(product.node.description);
                const countryName = getCountryName(product.node.title);
                const startingPrice = parseFloat(product.node.priceRange.minVariantPrice.amount);
                const variantCount = product.node.variants.edges.length;
                const features = getFeatures(product.node.description);
                const isRegional = isRegionalProduct(product);

                return (
                  <div
                    key={product.node.id}
                    onClick={() => handleProductClick(product)}
                    className="group flex items-center gap-3 p-3.5 rounded-2xl bg-card/60 backdrop-blur-sm border border-border hover:border-primary/30 transition-all cursor-pointer active:scale-[0.98]"
                  >
                    {image ? (
                      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-border">
                        <img src={image.url} alt={countryName} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 text-2xl border border-border">
                        {flag}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{flag}</span>
                        <h3 className="text-sm font-semibold text-foreground truncate">{countryName}</h3>
                        {isRegional && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium flex-shrink-0">Region</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground">
                        <span>{variantCount} plans</span>
                        {features.fiveG && <span className="text-primary">• 5G</span>}
                        {features.hotspot && <span>• Hotspot</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-semibold text-primary">${startingPrice.toFixed(2)}</div>
                        <div className="text-[9px] text-muted-foreground uppercase">from</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More */}
          {hasMore && !isLoading && (
            <button
              onClick={() => { buttonTap(); setDisplayCount((p) => p + 10); }}
              className="w-full p-4 rounded-xl bg-card/60 backdrop-blur-sm border border-border flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:bg-card/80 transition-colors active:scale-[0.98]"
            >
              <ChevronDown className="w-4 h-4" />
              Show More ({remainingCount} remaining)
            </button>
          )}
        </div>

        {/* Product Detail Modal */}
        <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
          <DialogContent
            variant="popup"
            className="w-[calc(100%-2rem)] max-w-[380px] rounded-3xl border border-border bg-background/98 backdrop-blur-2xl p-0 overflow-hidden max-h-[85vh] overflow-y-auto"
          >
            {selectedProduct && (
              <SwipeableDismiss onDismiss={() => setDetailModalOpen(false)}>
                {/* Header */}
                <div className="relative p-5 pb-4">
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/15 via-primary/5 to-transparent" />
                  <DialogHeader className="relative">
                    <div className="flex items-start gap-4">
                      {(() => {
                        const img = selectedProduct.node.images.edges[0]?.node;
                        const flag = getFlag(selectedProduct.node.description);
                        return img ? (
                          <div className="w-20 h-16 rounded-2xl overflow-hidden border border-border flex-shrink-0">
                            <img src={img.url} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-20 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center text-3xl flex-shrink-0">{flag}</div>
                        );
                      })()}
                      <div className="flex-1 min-w-0 pt-1">
                        <DialogTitle className="text-xl font-bold leading-tight">
                          {getCountryName(selectedProduct.node.title)}
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {isRegionalProduct(selectedProduct) ? 'Regional Coverage' : 'Local Coverage'}
                        </p>
                      </div>
                    </div>
                  </DialogHeader>
                </div>

                <div className="px-5 pb-5 space-y-4">
                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {getCleanDescription(selectedProduct.node.description)}
                  </p>

                  {/* Features */}
                  {(() => {
                    const features = getFeatures(selectedProduct.node.description);
                    return (
                      <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                        {features.fiveG && (
                          <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-primary" />5G supported</span>
                        )}
                        {features.hotspot && (
                          <span>• Hotspot</span>
                        )}
                        {features.topUp && (
                          <span>• Top-up available</span>
                        )}
                        <span>• Data only</span>
                      </div>
                    );
                  })()}

                  {/* Device Compatibility */}
                  <div className="rounded-2xl overflow-hidden">
                    {compatLoading ? (
                      <div className="flex items-center gap-3 p-4 bg-muted/50 border border-border">
                        <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
                        <span className="text-sm text-muted-foreground">Checking device...</span>
                      </div>
                    ) : isCompatible === true ? (
                      <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="text-sm font-medium text-green-400">Device Compatible</p>
                          <p className="text-xs text-muted-foreground">{platform} • Ready for eSIM</p>
                        </div>
                      </div>
                    ) : isCompatible === false ? (
                      <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20">
                        <XCircle className="w-5 h-5 text-red-400" />
                        <div>
                          <p className="text-sm font-medium text-red-400">May Not Be Compatible</p>
                          <p className="text-xs text-muted-foreground">{platform} • Update device or use QR</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/20">
                        <AlertCircle className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium text-primary">Check on Your Phone</p>
                          <p className="text-xs text-muted-foreground">Install via QR on supported device</p>
                        </div>
                      </div>
                    )}
                  </div>


                  {/* Packages */}
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Choose a Package</h3>
                  <div className="space-y-2.5">
                    {selectedProduct.node.variants.edges.map((variant) => {
                      const { data, validity } = parseVariant(variant.node.title);
                      const price = parseFloat(variant.node.price.amount);

                      return (
                        <div
                          key={variant.node.id}
                          className="group flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border hover:border-primary/30 transition-all"
                        >
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 flex flex-col items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-primary leading-none">{data}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground">{data}</div>
                            {validity && <div className="text-xs text-muted-foreground mt-0.5">{validity}</div>}
                          </div>
                          <div className="flex items-center gap-2.5 flex-shrink-0">
                            <span className="text-base font-bold text-foreground">${price.toFixed(2)}</span>
                            <Button
                              onClick={(e) => { e.stopPropagation(); handleAddToCart(selectedProduct, variant.node.id); }}
                              disabled={isCartLoading || !variant.node.availableForSale}
                              size="sm"
                              className="h-9 px-3 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20"
                            >
                              <ShoppingCart className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </SwipeableDismiss>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </>
  );
};
