import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  ShoppingCart, 
  Wifi, 
  Calendar, 
  Globe, 
  ChevronDown, 
  X,
  Check,
  ArrowRight,
  Zap,
  Shield,
  Clock,
  Smartphone,
  Plus,
  Signal,
  Flame,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useProducts, Product } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { useEnhancedHaptics } from '@/hooks/useEnhancedHaptics';
import { useEnhancedSounds } from '@/hooks/useEnhancedSounds';
import { useTranslation } from '@/contexts/TranslationContext';
import { useDeviceCompatibility } from '@/hooks/useDeviceCompatibility';
import { useImagePreload, preloadCountryFlags } from '@/hooks/useImagePreload';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AppSpinner } from '@/components/app/AppSpinner';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/app/PullToRefreshIndicator';
import { AnimatedCard } from '@/components/app/PageTransition';
import { ProductContextMenu } from '@/components/app/ProductContextMenu';
import { SwipeableDismiss } from '@/components/app/SwipeableDismiss';
import { SectionErrorBoundary } from '@/components/app/SectionErrorBoundary';
import { SwipeHint } from '@/components/app/GestureHints';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type CoverageTab = 'local' | 'regional' | 'global';
type DataFilter = 'all' | '1gb' | '3gb' | '5gb' | '10gb' | 'unlimited';

const REGION_IMAGE_MAP: Record<string, string> = {
  'EUROPE': '/regions/europe.png',
  'EU-PLUS-UK': '/regions/europe.png',
  'ASIA': '/regions/asia.png',
  'CARIBBEAN-ISLANDS': '/regions/caribbean.png',
  'LATIN-AMERICA': '/regions/latin-america.png',
  'MIDDLE-EAST-AND-NORTH-AFRICA': '/regions/middle-east-africa.png',
  'AFRICA': '/regions/middle-east-africa.png',
  'NORTH-AMERICA': '/regions/north-america.png',
  'OCEANIA': '/regions/oceania.png',
  'WORLD': '/regions/world.png',
};

/**
 * App Shop - Premium mobile eSIM storefront with segmented tabs & filter chips
 */
export const AppShop: React.FC = () => {
  const navigate = useNavigate();
  const { data: products, isLoading, isError, refetch } = useProducts();
  const { items, addItem } = useCart();
  const { buttonTap, addToCartPattern, errorPattern, navigationTap, selectionTap } = useEnhancedHaptics();
  const { playPop, playError, playSwoosh } = useEnhancedSounds();
  const { isCompatible, platform, isLoading: compatLoading } = useDeviceCompatibility();
  const { t } = useTranslation();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<CoverageTab>('local');
  const [dataFilter, setDataFilter] = useState<DataFilter>('all');
  const [displayCount, setDisplayCount] = useState(12);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const [cartShaking, setCartShaking] = useState(false);
  const cartButtonRef = useRef<HTMLButtonElement>(null);

  // Pull-to-refresh
  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const { isRefreshing, pullDistance, pullProgress, handlers } = usePullToRefresh({
    onRefresh: handleRefresh
  });

  // Parse data amount to number for filtering
  const parseDataAmount = (dataStr: string): number => {
    const lower = dataStr.toLowerCase();
    if (lower.includes('unlimited')) return 999;
    const match = lower.match(/(\d+(?:\.\d+)?)\s*(gb|mb)/i);
    if (match) {
      const value = parseFloat(match[1]);
      return match[2].toLowerCase() === 'mb' ? value / 1024 : value;
    }
    return 0;
  };

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    return products.filter((product: Product) => {
      // Search filter
      const matchesSearch = 
        product.country_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      // Tab filter
      const productType = product.package_type || 'local';
      if (activeTab === 'local' && productType !== 'local') return false;
      if (activeTab === 'regional' && productType !== 'regional') return false;
      if (activeTab === 'global' && product.country_code !== 'WORLD') return false;
      
      // Data filter
      if (dataFilter !== 'all') {
        const dataAmount = parseDataAmount(product.data_amount);
        switch (dataFilter) {
          case '1gb': return dataAmount >= 1 && dataAmount < 3;
          case '3gb': return dataAmount >= 3 && dataAmount < 5;
          case '5gb': return dataAmount >= 5 && dataAmount < 10;
          case '10gb': return dataAmount >= 10 && dataAmount < 50;
          case 'unlimited': return dataAmount >= 50 || product.data_amount.toLowerCase().includes('unlimited');
        }
      }
      
      return true;
    });
  }, [products, searchQuery, activeTab, dataFilter]);

  const displayedProducts = filteredProducts.slice(0, displayCount);
  const hasMore = filteredProducts.length > displayCount;
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Preload country flag images for displayed products
  useEffect(() => {
    if (displayedProducts.length > 0) {
      const countryCodes = displayedProducts
        .map(p => p.country_code)
        .filter(code => code && code.length === 2);
      preloadCountryFlags(countryCodes);
    }
  }, [displayedProducts]);

  const handleAddToCart = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    buttonTap();
    setAddingProductId(product.id);
    
    setTimeout(() => {
      addItem(product);
      addToCartPattern();
      playPop();
      setAddingProductId(null);
      
      toast.success(`${product.country_name} eSIM`, {
        description: t('app.shop.addedToCart')
      });
    }, 150);
  };

  const handleCartClick = () => {
    buttonTap();
    if (cartItemCount === 0) {
      errorPattern();
      playError();
      setCartShaking(true);
      setTimeout(() => setCartShaking(false), 500);
      toast.error(t('app.shop.cartEmpty'), {
        description: t('app.shop.addPlansFirst')
      });
    } else {
      playSwoosh();
      navigate('/checkout');
    }
  };

  const handleProductClick = (product: Product) => {
    buttonTap();
    setSelectedProduct(product);
    setDetailModalOpen(true);
  };

  const handleLoadMore = () => {
    buttonTap();
    setDisplayCount(prev => prev + 12);
  };

  const handleTabChange = (tab: CoverageTab) => {
    selectionTap();
    setActiveTab(tab);
    setDisplayCount(12);
    setDataFilter('all');
  };

  const getCountryFlag = (product: Product, size: 'sm' | 'lg' = 'sm') => {
    const imageUrl = product.country_image_url;
    const packageType = product.package_type;
    const sizeClasses = size === 'sm' 
      ? 'w-14 h-14 rounded-2xl' 
      : 'w-20 h-16 rounded-2xl';
    
    if (packageType === 'regional' || product.country_code === 'WORLD') {
      const regionImage = REGION_IMAGE_MAP[product.country_code];
      if (regionImage) {
        return (
          <img 
            src={regionImage} 
            alt="" 
            width={size === 'sm' ? 56 : 80}
            height={size === 'sm' ? 56 : 64}
            loading="lazy"
            decoding="async"
            className={cn(sizeClasses, 'object-cover border border-white/10 shadow-lg transition-transform group-hover:scale-105')}
          />
        );
      }
    }
    
    if (imageUrl) {
      return (
        <img 
          src={imageUrl} 
          alt="" 
          width={size === 'sm' ? 56 : 80}
          height={size === 'sm' ? 56 : 64}
          loading="lazy"
          decoding="async"
          className={cn(sizeClasses, 'object-cover border border-border shadow-lg transition-transform group-hover:scale-105')}
        />
      );
    }
    
    return (
      <div className={cn(sizeClasses, 'bg-muted border border-border flex items-center justify-center transition-transform group-hover:scale-105')}>
        <Globe className={size === 'sm' ? 'w-7 h-7' : 'w-10 h-10'} style={{ color: 'hsl(var(--muted-foreground))' }} />
      </div>
    );
  };

  const tabs: { key: CoverageTab; label: string; icon: React.ElementType }[] = [
    { key: 'local', label: t('app.shop.local'), icon: MapPin },
    { key: 'regional', label: t('app.shop.regional'), icon: Globe },
    { key: 'global', label: t('app.shop.global'), icon: Signal },
  ];

  const dataFilters: { key: DataFilter; label: string }[] = [
    { key: 'all', label: t('app.shop.all') },
    { key: '1gb', label: '1GB' },
    { key: '3gb', label: '3GB' },
    { key: '5gb', label: '5GB' },
    { key: '10gb', label: '10GB+' },
    { key: 'unlimited', label: '∞' },
  ];

  return (
    <div 
      className="min-h-screen relative overflow-hidden overflow-y-auto app-container momentum-scroll"
      {...handlers}
    >
      {/* Pull to refresh indicator */}
      <PullToRefreshIndicator 
        pullDistance={pullDistance}
        pullProgress={pullProgress}
        isRefreshing={isRefreshing}
      />

      <div className="relative z-10 px-5 py-6 pb-28 space-y-4">
        {/* Header - Glassmorphism */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">{t('app.shop.title')}</h1>
            <p className="text-base font-semibold text-muted-foreground">
              1800+ {t('app.shop.packages')}
            </p>
          </div>
          <button 
            ref={cartButtonRef}
            onClick={handleCartClick}
            className={cn(
              'relative w-12 h-12 rounded-xl bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center transition-colors active:scale-90',
              cartItemCount > 0 ? 'hover:bg-card hover:border-primary/30' : 'hover:bg-card/90',
              cartShaking && 'animate-shake'
            )}
          >
            <ShoppingCart className={cn(
              'w-5 h-5 transition-colors',
              cartItemCount > 0 ? 'text-primary' : 'text-foreground'
            )} />
            {cartItemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>
        </header>

        {/* Segmented Tabs - Glassmorphism */}
        <div className="flex p-1 rounded-xl bg-card/60 backdrop-blur-sm border border-border">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors active:scale-95',
                activeTab === tab.key 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/80'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar - Glassmorphism */}
        <div className="relative flex items-center border border-border rounded-xl overflow-hidden bg-card/60 backdrop-blur-sm focus-within:border-primary/50 transition-colors">
          <Search className="absolute left-4 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder={activeTab === 'local' ? t('app.shop.searchCountries') : activeTab === 'regional' ? t('app.shop.searchRegions') : t('app.shop.searchGlobal')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-10 h-12 bg-transparent border-0 text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Data Filter Chips - Glassmorphism */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {dataFilters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => { selectionTap(); setDataFilter(filter.key); }}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors active:scale-95',
                dataFilter === filter.key 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-card/60 border border-border text-muted-foreground hover:bg-card/80'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Clear Filter Button - only show when filter is active */}
        {dataFilter !== 'all' && (
          <div className="flex items-center justify-end text-sm">
            <button 
              onClick={() => setDataFilter('all')}
              className="text-primary text-xs flex items-center gap-1 hover:underline"
            >
              {t('app.shop.clearFilter')}
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Products Grid */}
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
              <Button 
                onClick={() => refetch()} 
                variant="outline" 
                className="border-primary text-primary hover:bg-primary/10"
              >
                Try Again
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {displayedProducts.map((product, index) => (
              <ProductContextMenu
                key={product.id}
                product={product}
                onQuickAdd={() => handleAddToCart(product)}
                onViewDetails={() => handleProductClick(product)}
              >
                <div 
                  onClick={() => handleProductClick(product)}
                  className={cn(
                    'group relative rounded-xl overflow-hidden cursor-pointer transition-colors',
                    'hover:bg-card',
                    'active:scale-[0.98]'
                  )}
                >
                  {/* Card background - Glassmorphism */}
                  <div className="absolute inset-0 bg-card/60 backdrop-blur-sm" />
                  
                  {/* Content */}
                  <div className="relative p-3 border border-border rounded-xl">
                    {/* Popular badge */}
                    {product.is_popular && (
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-primary/20 border border-primary/30">
                        <span className="text-[9px] font-medium text-primary">Popular</span>
                      </div>
                    )}
                    
                    {/* Flag */}
                    <div className="flex justify-center mb-3">
                      {getCountryFlag(product)}
                    </div>
                    
                    {/* Country/Region name */}
                    <h3 className="font-semibold text-foreground text-center truncate mb-1">
                      {product.country_name}
                    </h3>
                    
                    {/* Data & Validity */}
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-1">
                      <span className="flex items-center gap-0.5">
                        <Wifi className="w-3 h-3" />
                        {product.data_amount}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                      <span>{product.validity_days}d</span>
                    </div>

                    {/* Trust text */}
                    <p className="text-[9px] text-muted-foreground/70 text-center mb-2">
                      {t('app.shop.worksOnNetworks')}
                    </p>
                    
                    {/* Price & Add Button */}
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="text-lg font-bold text-foreground tabular-nums block">
                          ${product.price_usd.toFixed(2)}
                        </span>
                        <span className="text-[8px] text-primary/70">Pay with points (soon)</span>
                      </div>
                      <Button 
                        size="sm"
                        onClick={(e) => handleAddToCart(product, e)}
                        disabled={addingProductId === product.id}
                        className={cn(
                          'h-9 w-9 p-0 rounded-lg bg-primary hover:bg-primary/90 transition-colors',
                          addingProductId === product.id && 'scale-110'
                        )}
                      >
                        {addingProductId === product.id ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </ProductContextMenu>
            ))}
          </div>
        )}

        {/* Load More Button - Glassmorphism */}
        {hasMore && !isLoading && (
          <button 
            onClick={handleLoadMore}
            className="w-full p-4 rounded-xl bg-card/60 backdrop-blur-sm border border-border flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:bg-card/80 transition-colors active:scale-[0.98]"
          >
            <ChevronDown className="w-4 h-4" />
            Load More ({filteredProducts.length - displayCount} remaining)
          </button>
        )}

        {/* Empty State - Glassmorphism */}
        {!isLoading && displayedProducts.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-muted flex items-center justify-center">
              <MapPin className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-2">
              {searchQuery ? `No plans found for "${searchQuery}"` : 'No plans available'}
            </p>
            <p className="text-xs text-muted-foreground/70 mb-4">
              Try adjusting your filters
            </p>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => { setSearchQuery(''); setDataFilter('all'); }}
              className="border-border text-foreground hover:bg-muted"
            >
              Clear all filters
            </Button>
          </div>
        )}

        {/* Enhanced Plan Selection Modal - Popup Animation with Swipe-to-Dismiss */}
        <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
          <DialogContent 
            variant="popup"
            className="w-[calc(100%-2rem)] max-w-[380px] rounded-3xl border border-white/[0.08] bg-background/98 backdrop-blur-2xl p-0 overflow-hidden max-h-[85vh] overflow-y-auto"
          >
            {selectedProduct && (
              <SwipeableDismiss onDismiss={() => setDetailModalOpen(false)}>
                {/* Header with large flag */}
                <div className="relative p-5 pb-4">
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/15 via-primary/5 to-transparent" />
                  <DialogHeader className="relative">
                    <div className="flex items-start gap-4">
                      <div className="relative shrink-0">
                        {getCountryFlag(selectedProduct, 'lg')}
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <DialogTitle className="text-xl font-bold leading-tight">
                          {selectedProduct.country_name}
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedProduct.package_type === 'regional' ? 'Regional Coverage' : 
                           selectedProduct.country_code === 'WORLD' ? 'Worldwide Coverage' : 'Local Coverage'}
                        </p>
                      </div>
                    </div>
                  </DialogHeader>
                </div>
                
                <div className="px-5 pb-5 space-y-4">
                  {/* Price Hero */}
                  <div className="text-center py-4 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20">
                    <div className="text-3xl font-bold text-foreground tracking-tight tabular-nums">
                      ${selectedProduct.price_usd.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">One-time payment • Instant delivery</p>
                  </div>

                  {/* Device Compatibility - Auto-detected */}
                  <div className="rounded-2xl overflow-hidden">
                    {compatLoading ? (
                      <div className="flex items-center gap-3 p-4 bg-muted/50 border border-border">
                        <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
                        <span className="text-sm text-muted-foreground">Checking device...</span>
                      </div>
                    ) : isCompatible === true ? (
                      <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20">
                        <div className="p-2 rounded-lg bg-green-500/20">
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-400">Device Compatible</p>
                          <p className="text-xs text-muted-foreground">{platform} • Ready for eSIM</p>
                        </div>
                      </div>
                    ) : isCompatible === false ? (
                      <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20">
                        <div className="p-2 rounded-lg bg-red-500/20">
                          <XCircle className="w-5 h-5 text-red-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-400">May Not Be Compatible</p>
                          <p className="text-xs text-muted-foreground">{platform} • Update device or use QR</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/20">
                        <div className="p-2 rounded-lg bg-primary/20">
                          <AlertCircle className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-primary">Check on Your Phone</p>
                          <p className="text-xs text-muted-foreground">Install via QR on supported device</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Data & Validity Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-card border border-border">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <Wifi className="w-4 h-4 text-primary" />
                        Data
                      </div>
                      <span className="text-xl font-bold text-foreground">{selectedProduct.data_amount}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-card border border-border">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        Validity
                      </div>
                      <span className="text-xl font-bold text-foreground">{selectedProduct.validity_days} days</span>
                    </div>
                  </div>

                  {/* Operator */}
                  {selectedProduct.operator_image_url && (
                    <div className="p-3 rounded-2xl bg-card border border-border flex items-center gap-3">
                      <img 
                        src={selectedProduct.operator_image_url} 
                        alt={selectedProduct.operator_name || 'Operator'} 
                        className="h-8 object-contain rounded"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      {selectedProduct.operator_name && (
                        <div>
                          <p className="text-xs text-muted-foreground">Powered by</p>
                          <p className="text-sm font-medium text-foreground">{selectedProduct.operator_name}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Plan Features */}
                  <div className="space-y-2">
                    {selectedProduct.features?.coverage && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                        <Globe className="h-4 w-4 text-primary shrink-0" />
                        <p className="text-xs text-muted-foreground truncate">{selectedProduct.features.coverage}</p>
                      </div>
                    )}

                    {selectedProduct.features?.speed && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                        <Zap className="h-4 w-4 text-primary shrink-0" />
                        <p className="text-xs text-muted-foreground truncate">{selectedProduct.features.speed}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/5 border border-green-500/15">
                      <Shield className="h-4 w-4 text-green-400 shrink-0" />
                      <p className="text-xs text-green-400/80">Privacy Protected • No KYC</p>
                    </div>
                  </div>
                  
                  {/* Add to Cart Button */}
                  <Button 
                    className={cn(
                      'w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/30 text-base font-semibold group transition-all active:scale-[0.98]',
                      addingProductId === selectedProduct.id && 'animate-bounce'
                    )}
                    disabled={addingProductId === selectedProduct.id}
                    onClick={() => {
                      handleAddToCart(selectedProduct);
                      setTimeout(() => setDetailModalOpen(false), 300);
                    }}
                  >
                    {addingProductId === selectedProduct.id ? (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Added to Cart!
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                        Add to Cart
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </div>
              </SwipeableDismiss>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        @keyframes stagger-in {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes modal-bounce {
          0% { transform: scale(0.9) translateY(10px); opacity: 0; }
          50% { transform: scale(1.02); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        .animate-modal-bounce {
          animation: modal-bounce 0.35s ease-out;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
