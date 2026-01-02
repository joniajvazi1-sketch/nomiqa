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
  Sparkles,
  Check,
  ArrowRight,
  Zap,
  Shield,
  Clock,
  Smartphone,
  Plus
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useProducts, Product } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { useHaptics } from '@/hooks/useHaptics';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AppSpinner } from '@/components/app/AppSpinner';
import { CompatibilityChecker } from '@/components/CompatibilityChecker';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type CoverageType = 'all' | 'local' | 'regional';

/**
 * App Shop - Premium mobile eSIM store with sophisticated glass design
 */
export const AppShop: React.FC = () => {
  const navigate = useNavigate();
  const { data: products, isLoading } = useProducts();
  const { items, addItem } = useCart();
  const { lightTap, success, error: hapticError } = useHaptics();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [coverageFilter, setCoverageFilter] = useState<CoverageType>('all');
  const [displayCount, setDisplayCount] = useState(10);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [compatibilityOpen, setCompatibilityOpen] = useState(false);
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const [cartShaking, setCartShaking] = useState(false);
  const cartButtonRef = useRef<HTMLButtonElement>(null);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    return products.filter((product: Product) => {
      const matchesSearch = 
        product.country_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (coverageFilter === 'all') return matchesSearch;
      
      const productType = product.package_type || 'local';
      return matchesSearch && productType === coverageFilter;
    });
  }, [products, searchQuery, coverageFilter]);

  const displayedProducts = filteredProducts.slice(0, displayCount);
  const hasMore = filteredProducts.length > displayCount;
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToCart = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    lightTap();
    setAddingProductId(product.id);
    
    // Animate the add button
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
      // Shake animation for empty cart
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
    setDisplayCount(prev => prev + 10);
  };

  const getCountryFlag = (product: Product) => {
    const imageUrl = product.country_image_url;
    const packageType = product.package_type;
    
    if (packageType === 'regional') {
      const regionImageMap: Record<string, string> = {
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
      const regionImage = regionImageMap[product.country_code];
      if (regionImage) {
        return (
          <img 
            src={regionImage} 
            alt="" 
            className="w-12 h-12 rounded-xl object-cover border border-white/10 shadow-lg transition-transform group-hover:scale-110"
          />
        );
      }
    }
    
    if (imageUrl) {
      return (
        <img 
          src={imageUrl} 
          alt="" 
          className="w-12 h-12 rounded-xl object-cover border border-white/10 shadow-lg transition-transform group-hover:scale-110"
        />
      );
    }
    
    return (
      <div className="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center transition-transform group-hover:scale-110">
        <Globe className="w-6 h-6 text-muted-foreground" />
      </div>
    );
  };

  const getLargeCountryFlag = (product: Product) => {
    const imageUrl = product.country_image_url;
    const packageType = product.package_type;
    
    if (packageType === 'regional') {
      const regionImageMap: Record<string, string> = {
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
      const regionImage = regionImageMap[product.country_code];
      if (regionImage) {
        return (
          <img 
            src={regionImage} 
            alt="" 
            className="w-16 h-12 rounded-xl object-cover shadow-lg animate-scale-in"
          />
        );
      }
    }
    
    if (imageUrl) {
      return (
        <img 
          src={imageUrl} 
          alt="" 
          className="w-16 h-12 rounded-xl object-cover shadow-lg animate-scale-in"
        />
      );
    }
    
    return (
      <div className="w-16 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center animate-scale-in">
        <Globe className="w-8 h-8 text-muted-foreground" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute top-20 left-0 w-[400px] h-[400px] rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, hsl(var(--neon-cyan)) 0%, transparent 70%)',
            filter: 'blur(80px)'
          }}
        />
      </div>

      <div className="relative z-10 px-5 py-6 pb-28 space-y-5">
        {/* Header */}
        <header className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">eSIM Shop</h1>
            <p className="text-sm text-muted-foreground">200+ countries available</p>
          </div>
          <button 
            ref={cartButtonRef}
            onClick={handleCartClick}
            className={cn(
              'relative w-12 h-12 rounded-xl bg-white/[0.05] backdrop-blur-xl border border-white/10 flex items-center justify-center transition-all active:scale-90',
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

        {/* Search Bar - Premium Glass */}
        <div className="relative animate-fade-in" style={{ animationDelay: '50ms' }}>
          <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-xl rounded-2xl" />
          <div className="relative flex items-center border border-white/[0.08] rounded-2xl overflow-hidden focus-within:border-primary/30 transition-colors">
            <Search className="absolute left-4 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search countries or regions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-10 h-14 bg-transparent border-0 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-0"
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

        {/* Coverage Filter Pills */}
        <div className="flex gap-2 animate-fade-in" style={{ animationDelay: '100ms' }}>
          {[
            { key: 'all', label: 'All', icon: Sparkles },
            { key: 'local', label: 'Local', icon: MapPin },
            { key: 'regional', label: 'Regional', icon: Globe }
          ].map((filter, i) => (
            <button
              key={filter.key}
              onClick={() => { lightTap(); setCoverageFilter(filter.key as CoverageType); }}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95',
                coverageFilter === filter.key 
                  ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30' 
                  : 'bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] text-muted-foreground hover:bg-white/[0.06]'
              )}
              style={{ animationDelay: `${i * 50 + 100}ms` }}
            >
              <filter.icon className={cn(
                'w-3.5 h-3.5 transition-transform',
                coverageFilter === filter.key && 'animate-pulse'
              )} />
              {filter.label}
            </button>
          ))}
        </div>

        {/* Products List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AppSpinner size="lg" label="Loading eSIM plans..." />
          </div>
        ) : (
          <div className="space-y-3">
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
                  animation: `stagger-in 0.4s ease-out ${Math.min(index, 8) * 50}ms backwards`
                }}
              >
                {/* Glass background with hover glow */}
                <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-xl transition-colors group-hover:bg-white/[0.06]" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-primary/5 to-transparent" />
                
                {/* Content */}
                <div className="relative p-4 border border-white/[0.08] rounded-2xl group-hover:border-primary/20 transition-colors">
                  <div className="flex items-center gap-4">
                    {getCountryFlag(product)}
                    
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-foreground block truncate group-hover:text-primary transition-colors">
                        {product.country_name}
                      </span>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Wifi className="w-3.5 h-3.5" />
                          {product.data_amount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {product.validity_days}d
                        </span>
                      </div>
                    </div>
                    
                    {/* Price & Add Button */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-lg font-bold text-foreground tabular-nums">
                          ${product.price_usd.toFixed(2)}
                        </span>
                      </div>
                      <Button 
                        size="sm"
                        onClick={(e) => handleAddToCart(product, e)}
                        disabled={addingProductId === product.id}
                        className={cn(
                          'h-10 w-10 p-0 rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/30 hover:opacity-90 transition-all',
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
              </div>
            ))}
            
            {/* Load More Button */}
            {hasMore && (
              <button 
                onClick={handleLoadMore}
                className="w-full p-4 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:bg-white/[0.05] hover:border-primary/20 transition-all active:scale-[0.98] group"
              >
                <ChevronDown className="w-4 h-4 group-hover:animate-bounce" />
                Load More ({filteredProducts.length - displayCount} remaining)
              </button>
            )}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && displayedProducts.length === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center animate-float">
              <MapPin className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground mb-4">No plans found for "{searchQuery}"</p>
            <Button 
              variant="outline"
              className="bg-white/[0.03] border-white/10 hover:bg-white/[0.06]"
              onClick={() => { setSearchQuery(''); setCoverageFilter('all'); }}
            >
              Clear filters
            </Button>
          </div>
        )}

        {/* Enhanced Product Detail Modal with animations */}
        <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
          <DialogContent className="w-[calc(100%-2rem)] max-w-[360px] rounded-2xl border-white/10 bg-background/98 backdrop-blur-2xl p-0 overflow-hidden max-h-[80vh] overflow-y-auto animate-modal-bounce">
            {selectedProduct && (
              <>
                {/* Header with gradient */}
                <div className="relative p-4 pb-3">
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent" />
                  <DialogHeader className="relative">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        {getLargeCountryFlag(selectedProduct)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <DialogTitle className="text-lg leading-tight animate-fade-in">{selectedProduct.country_name}</DialogTitle>
                        <p className="text-xs text-muted-foreground mt-0.5 animate-fade-in" style={{ animationDelay: '50ms' }}>
                          {selectedProduct.data_amount} • {selectedProduct.validity_days} days
                        </p>
                      </div>
                    </div>
                  </DialogHeader>
                </div>
                
                <div className="px-4 pb-4 space-y-3">
                  {/* Price Display */}
                  <div className="text-center py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] animate-scale-in" style={{ animationDelay: '100ms' }}>
                    <div className="text-2xl font-bold text-foreground tracking-tight tabular-nums">
                      ${selectedProduct.price_usd.toFixed(2)}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">One-time payment • Instant activation</p>
                  </div>

                  {/* Data & Validity Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 animate-fade-in" style={{ animationDelay: '150ms' }}>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
                        <Wifi className="w-3 h-3" />
                        Data
                      </div>
                      <span className="text-base font-bold text-foreground">{selectedProduct.data_amount}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] animate-fade-in" style={{ animationDelay: '200ms' }}>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
                        <Calendar className="w-3 h-3" />
                        Validity
                      </div>
                      <span className="text-base font-bold text-foreground">{selectedProduct.validity_days} days</span>
                    </div>
                  </div>

                  {/* Operator / Powered By */}
                  {selectedProduct.operator_image_url && (
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center gap-2 animate-fade-in" style={{ animationDelay: '250ms' }}>
                      <img 
                        src={selectedProduct.operator_image_url} 
                        alt={selectedProduct.operator_name || 'Operator'} 
                        className="h-6 object-contain rounded"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      {selectedProduct.operator_name && (
                        <p className="text-xs text-muted-foreground">Powered by {selectedProduct.operator_name}</p>
                      )}
                    </div>
                  )}

                  {/* Device Compatibility Button */}
                  <Button 
                    onClick={() => setCompatibilityOpen(true)}
                    variant="outline"
                    className="w-full h-10 rounded-xl bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 text-sm animate-fade-in"
                    style={{ animationDelay: '300ms' }}
                  >
                    <Smartphone className="mr-2 h-4 w-4" />
                    Check Compatibility
                  </Button>

                  {/* Plan Details - Compact */}
                  <div className="space-y-1.5 animate-fade-in" style={{ animationDelay: '350ms' }}>
                    <h3 className="text-xs font-medium text-foreground">Plan Details</h3>
                    
                    {selectedProduct.features?.coverage && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.04] transition-colors">
                        <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
                        <p className="text-xs text-muted-foreground truncate">{selectedProduct.features.coverage}</p>
                      </div>
                    )}

                    {selectedProduct.features?.speed && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.04] transition-colors">
                        <Zap className="h-3.5 w-3.5 text-primary shrink-0" />
                        <p className="text-xs text-muted-foreground truncate">{selectedProduct.features.speed}</p>
                      </div>
                    )}

                    {selectedProduct.features?.activation && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.04] transition-colors">
                        <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                        <p className="text-xs text-muted-foreground truncate">{selectedProduct.features.activation}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                      <Shield className="h-3.5 w-3.5 text-green-400 shrink-0" />
                      <p className="text-xs text-green-400">Privacy Protected</p>
                    </div>
                  </div>
                  
                  {/* Add to Cart Button with animation */}
                  <Button 
                    className={cn(
                      'w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/30 text-sm font-semibold group transition-all animate-fade-in',
                      addingProductId === selectedProduct.id && 'animate-bounce'
                    )}
                    style={{ animationDelay: '400ms' }}
                    disabled={addingProductId === selectedProduct.id}
                    onClick={() => {
                      handleAddToCart(selectedProduct);
                      setTimeout(() => setDetailModalOpen(false), 300);
                    }}
                  >
                    {addingProductId === selectedProduct.id ? (
                      <>
                        <Check className="w-4 h-4 mr-2 animate-scale-in" />
                        Added!
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2 group-hover:animate-bounce" />
                        Add to Cart
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
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

      {/* Shake animation keyframes */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};
