import React, { useState, useMemo, useRef } from 'react';
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
  Flame
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useProducts, Product } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { useHaptics } from '@/hooks/useHaptics';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SkeletonProductCard } from '@/components/app/SkeletonProductCard';
import { CompatibilityChecker } from '@/components/CompatibilityChecker';
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
  const { data: products, isLoading } = useProducts();
  const { items, addItem } = useCart();
  const { lightTap, success, error: hapticError } = useHaptics();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<CoverageTab>('local');
  const [dataFilter, setDataFilter] = useState<DataFilter>('all');
  const [displayCount, setDisplayCount] = useState(12);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [compatibilityOpen, setCompatibilityOpen] = useState(false);
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const [cartShaking, setCartShaking] = useState(false);
  const cartButtonRef = useRef<HTMLButtonElement>(null);

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

  const handleAddToCart = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    lightTap();
    setAddingProductId(product.id);
    
    setTimeout(() => {
      addItem(product);
      success();
      setAddingProductId(null);
      
      toast.success(
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
            <Check className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <p className="font-medium">{product.country_name} eSIM</p>
            <p className="text-xs text-muted-foreground">Added to cart</p>
          </div>
        </div>
      );
    }, 150);
  };

  const handleCartClick = () => {
    lightTap();
    if (cartItemCount === 0) {
      hapticError();
      setCartShaking(true);
      setTimeout(() => setCartShaking(false), 500);
      toast.error('Your cart is empty', {
        description: 'Add some eSIM plans first!'
      });
    } else {
      navigate('/checkout');
    }
  };

  const handleProductClick = (product: Product) => {
    lightTap();
    setSelectedProduct(product);
    setDetailModalOpen(true);
  };

  const handleLoadMore = () => {
    lightTap();
    setDisplayCount(prev => prev + 12);
  };

  const handleTabChange = (tab: CoverageTab) => {
    lightTap();
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
          className={cn(sizeClasses, 'object-cover border border-white/10 shadow-lg transition-transform group-hover:scale-105')}
        />
      );
    }
    
    return (
      <div className={cn(sizeClasses, 'bg-white/[0.05] border border-white/10 flex items-center justify-center transition-transform group-hover:scale-105')}>
        <Globe className={size === 'sm' ? 'w-7 h-7' : 'w-10 h-10'} style={{ color: 'hsl(var(--muted-foreground))' }} />
      </div>
    );
  };

  const tabs: { key: CoverageTab; label: string; icon: React.ElementType }[] = [
    { key: 'local', label: 'Local', icon: MapPin },
    { key: 'regional', label: 'Regional', icon: Globe },
    { key: 'global', label: 'Global', icon: Signal },
  ];

  const dataFilters: { key: DataFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: '1gb', label: '1GB' },
    { key: '3gb', label: '3GB' },
    { key: '5gb', label: '5GB' },
    { key: '10gb', label: '10GB+' },
    { key: 'unlimited', label: '∞' },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute top-20 left-0 w-[400px] h-[400px] rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, hsl(var(--neon-cyan)) 0%, transparent 70%)',
            filter: 'blur(80px)'
          }}
        />
        <div 
          className="absolute bottom-40 right-0 w-[300px] h-[300px] rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, hsl(var(--neon-violet)) 0%, transparent 70%)',
            filter: 'blur(80px)'
          }}
        />
      </div>

      <div className="relative z-10 px-5 py-6 pb-28 space-y-4">
        {/* Header */}
        <header className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">eSIM Shop</h1>
            <p className="text-sm text-muted-foreground">200+ destinations</p>
          </div>
          <button 
            ref={cartButtonRef}
            onClick={handleCartClick}
            className={cn(
              'relative w-12 h-12 rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/10 flex items-center justify-center transition-all active:scale-90',
              cartItemCount > 0 ? 'hover:bg-primary/20 hover:border-primary/30' : 'hover:bg-white/[0.08]',
              cartShaking && 'animate-shake'
            )}
          >
            <ShoppingCart className={cn(
              'w-5 h-5 transition-colors',
              cartItemCount > 0 ? 'text-primary' : 'text-foreground'
            )} />
            {cartItemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center shadow-lg shadow-primary/40 animate-bounce-in">
                {cartItemCount}
              </span>
            )}
          </button>
        </header>

        {/* Segmented Tabs */}
        <div className="relative animate-fade-in" style={{ animationDelay: '50ms' }}>
          <div className="flex p-1.5 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08]">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all active:scale-95',
                  activeTab === tab.key 
                    ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.03]'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-xl rounded-2xl" />
          <div className="relative flex items-center border border-white/[0.08] rounded-2xl overflow-hidden focus-within:border-primary/30 transition-colors">
            <Search className="absolute left-4 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder={activeTab === 'local' ? 'Search countries...' : activeTab === 'regional' ? 'Search regions...' : 'Search global plans...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-10 h-12 bg-transparent border-0 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-0"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Data Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide animate-fade-in" style={{ animationDelay: '150ms' }}>
          {dataFilters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => { lightTap(); setDataFilter(filter.key); }}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95',
                dataFilter === filter.key 
                  ? 'bg-primary/20 border border-primary/40 text-primary' 
                  : 'bg-white/[0.03] border border-white/[0.08] text-muted-foreground hover:bg-white/[0.06]'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between text-sm animate-fade-in" style={{ animationDelay: '200ms' }}>
          <span className="text-muted-foreground">
            {filteredProducts.length} {activeTab === 'local' ? 'countries' : activeTab === 'regional' ? 'regions' : 'plans'}
          </span>
          {dataFilter !== 'all' && (
            <button 
              onClick={() => setDataFilter('all')}
              className="text-primary text-xs flex items-center gap-1 hover:underline"
            >
              Clear filter
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            <SkeletonProductCard count={8} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {displayedProducts.map((product, index) => (
              <div 
                key={product.id}
                onClick={() => handleProductClick(product)}
                className={cn(
                  'group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300',
                  'hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/10',
                  'active:scale-[0.97]'
                )}
                style={{ 
                  animation: `stagger-in 0.4s ease-out ${Math.min(index, 10) * 40}ms backwards`
                }}
              >
                {/* Glass background */}
                <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-xl transition-colors group-hover:bg-white/[0.06]" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-primary/10 to-transparent" />
                
                {/* Content */}
                <div className="relative p-3 border border-white/[0.08] rounded-2xl group-hover:border-primary/20 transition-colors">
                  {/* Popular badge */}
                  {product.is_popular && (
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-orange-500/20 border border-orange-500/30 flex items-center gap-0.5">
                      <Flame className="w-2.5 h-2.5 text-orange-400" />
                      <span className="text-[9px] font-medium text-orange-400">HOT</span>
                    </div>
                  )}
                  
                  {/* Flag */}
                  <div className="flex justify-center mb-3">
                    {getCountryFlag(product)}
                  </div>
                  
                  {/* Country/Region name */}
                  <h3 className="font-semibold text-foreground text-center truncate mb-1 group-hover:text-primary transition-colors">
                    {product.country_name}
                  </h3>
                  
                  {/* Data & Validity */}
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-0.5">
                      <Wifi className="w-3 h-3" />
                      {product.data_amount}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                    <span>{product.validity_days}d</span>
                  </div>
                  
                  {/* Price & Add Button */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-lg font-bold text-foreground tabular-nums">
                      ${product.price_usd.toFixed(2)}
                    </span>
                    <Button 
                      size="sm"
                      onClick={(e) => handleAddToCart(product, e)}
                      disabled={addingProductId === product.id}
                      className={cn(
                        'h-9 w-9 p-0 rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/30 hover:opacity-90 transition-all',
                        addingProductId === product.id && 'animate-bounce scale-110'
                      )}
                    >
                      {addingProductId === product.id ? (
                        <Check className="w-4 h-4 animate-scale-in" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && !isLoading && (
          <button 
            onClick={handleLoadMore}
            className="w-full p-4 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:bg-white/[0.05] hover:border-primary/20 transition-all active:scale-[0.98] group"
          >
            <ChevronDown className="w-4 h-4 group-hover:animate-bounce" />
            Load More ({filteredProducts.length - displayCount} remaining)
          </button>
        )}

        {/* Empty State */}
        {!isLoading && displayedProducts.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center animate-float">
              <MapPin className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground mb-2">
              {searchQuery ? `No plans found for "${searchQuery}"` : 'No plans available'}
            </p>
            <p className="text-xs text-muted-foreground/60 mb-4">
              Try adjusting your filters
            </p>
            <Button 
              variant="outline"
              size="sm"
              className="bg-white/[0.03] border-white/10 hover:bg-white/[0.06]"
              onClick={() => { setSearchQuery(''); setDataFilter('all'); }}
            >
              Clear all filters
            </Button>
          </div>
        )}

        {/* Enhanced Plan Selection Modal */}
        <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
          <DialogContent className="w-[calc(100%-2rem)] max-w-[380px] rounded-3xl border-white/10 bg-background/98 backdrop-blur-2xl p-0 overflow-hidden max-h-[85vh] overflow-y-auto animate-modal-bounce">
            {selectedProduct && (
              <>
                {/* Header with large flag */}
                <div className="relative p-5 pb-4">
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/15 via-primary/5 to-transparent" />
                  <DialogHeader className="relative">
                    <div className="flex items-start gap-4">
                      <div className="relative shrink-0 animate-scale-in">
                        {getCountryFlag(selectedProduct, 'lg')}
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <DialogTitle className="text-xl font-bold leading-tight animate-fade-in">
                          {selectedProduct.country_name}
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground mt-1 animate-fade-in" style={{ animationDelay: '50ms' }}>
                          {selectedProduct.package_type === 'regional' ? 'Regional Coverage' : 
                           selectedProduct.country_code === 'WORLD' ? 'Worldwide Coverage' : 'Local Coverage'}
                        </p>
                      </div>
                    </div>
                  </DialogHeader>
                </div>
                
                <div className="px-5 pb-5 space-y-4">
                  {/* Price Hero */}
                  <div className="text-center py-4 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 animate-scale-in" style={{ animationDelay: '100ms' }}>
                    <div className="text-3xl font-bold text-foreground tracking-tight tabular-nums">
                      ${selectedProduct.price_usd.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">One-time payment • Instant delivery</p>
                  </div>

                  {/* Data & Validity Cards */}
                  <div className="grid grid-cols-2 gap-3 animate-fade-in" style={{ animationDelay: '150ms' }}>
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <Wifi className="w-4 h-4 text-primary" />
                        Data
                      </div>
                      <span className="text-xl font-bold text-foreground">{selectedProduct.data_amount}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        Validity
                      </div>
                      <span className="text-xl font-bold text-foreground">{selectedProduct.validity_days} days</span>
                    </div>
                  </div>

                  {/* Operator */}
                  {selectedProduct.operator_image_url && (
                    <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center gap-3 animate-fade-in" style={{ animationDelay: '200ms' }}>
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

                  {/* Device Compatibility */}
                  <Button 
                    onClick={() => setCompatibilityOpen(true)}
                    variant="outline"
                    className="w-full h-12 rounded-2xl bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 text-sm font-medium animate-fade-in"
                    style={{ animationDelay: '250ms' }}
                  >
                    <Smartphone className="mr-2 h-5 w-5" />
                    Check Device Compatibility
                  </Button>

                  {/* Plan Features */}
                  <div className="space-y-2 animate-fade-in" style={{ animationDelay: '300ms' }}>
                    <h3 className="text-sm font-medium text-foreground mb-3">Plan Features</h3>
                    
                    {selectedProduct.features?.coverage && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                        <Globe className="h-4 w-4 text-primary shrink-0" />
                        <p className="text-sm text-muted-foreground">{selectedProduct.features.coverage}</p>
                      </div>
                    )}

                    {selectedProduct.features?.speed && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                        <Zap className="h-4 w-4 text-primary shrink-0" />
                        <p className="text-sm text-muted-foreground">{selectedProduct.features.speed}</p>
                      </div>
                    )}

                    {selectedProduct.features?.activation && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                        <Clock className="h-4 w-4 text-primary shrink-0" />
                        <p className="text-sm text-muted-foreground">{selectedProduct.features.activation}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                      <Shield className="h-4 w-4 text-green-400 shrink-0" />
                      <p className="text-sm text-green-400">Privacy Protected • No KYC Required</p>
                    </div>
                  </div>
                  
                  {/* Add to Cart Button */}
                  <Button 
                    className={cn(
                      'w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/30 text-base font-semibold group transition-all animate-fade-in',
                      addingProductId === selectedProduct.id && 'animate-bounce'
                    )}
                    style={{ animationDelay: '350ms' }}
                    disabled={addingProductId === selectedProduct.id}
                    onClick={() => {
                      handleAddToCart(selectedProduct);
                      setTimeout(() => setDetailModalOpen(false), 300);
                    }}
                  >
                    {addingProductId === selectedProduct.id ? (
                      <>
                        <Check className="w-5 h-5 mr-2 animate-scale-in" />
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
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Compatibility Checker */}
        <CompatibilityChecker 
          open={compatibilityOpen} 
          onOpenChange={setCompatibilityOpen} 
        />
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
