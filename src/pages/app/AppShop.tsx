import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Loader2, 
  ShoppingCart, 
  Wifi, 
  Calendar, 
  Globe, 
  ChevronDown, 
  X,
  Sparkles,
  Check,
  ArrowRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProducts, Product } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { useHaptics } from '@/hooks/useHaptics';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
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
  const { lightTap, success } = useHaptics();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [coverageFilter, setCoverageFilter] = useState<CoverageType>('all');
  const [displayCount, setDisplayCount] = useState(10);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    return products.filter((product: Product) => {
      const matchesSearch = 
        product.country_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (coverageFilter === 'all') return matchesSearch;
      
      const productType = (product as any).package_type || 'local';
      return matchesSearch && productType === coverageFilter;
    });
  }, [products, searchQuery, coverageFilter]);

  const displayedProducts = filteredProducts.slice(0, displayCount);
  const hasMore = filteredProducts.length > displayCount;
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToCart = (product: Product) => {
    lightTap();
    addItem(product);
    success();
    toast.success(`${product.country_name} eSIM added to cart!`, {
      icon: <Check className="w-4 h-4 text-green-400" />
    });
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
    const packageType = (product as any).package_type;
    
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
          <div className="relative">
            <img 
              src={regionImage} 
              alt="" 
              className="w-12 h-12 rounded-xl object-cover border border-white/10 shadow-lg"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <Globe className="w-3 h-3 text-primary-foreground" />
            </div>
          </div>
        );
      }
    }
    
    if (imageUrl) {
      return (
        <img 
          src={imageUrl} 
          alt="" 
          className="w-12 h-12 rounded-xl object-cover border border-white/10 shadow-lg"
        />
      );
    }
    
    return (
      <div className="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center">
        <Globe className="w-6 h-6 text-muted-foreground" />
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
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">eSIM Shop</h1>
            <p className="text-sm text-muted-foreground">190+ countries available</p>
          </div>
          <button 
            onClick={() => navigate('/checkout')}
            className="relative w-12 h-12 rounded-xl bg-white/[0.05] backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-white/[0.08] transition-all active:scale-95"
          >
            <ShoppingCart className="w-5 h-5 text-foreground" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center shadow-lg shadow-primary/40">
                {cartItemCount}
              </span>
            )}
          </button>
        </header>

        {/* Search Bar - Premium Glass */}
        <div className="relative">
          <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-xl rounded-2xl" />
          <div className="relative flex items-center border border-white/[0.08] rounded-2xl overflow-hidden">
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
                className="absolute right-4 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Coverage Filter Pills */}
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All', icon: Sparkles },
            { key: 'local', label: 'Local', icon: MapPin },
            { key: 'regional', label: 'Regional', icon: Globe }
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => { lightTap(); setCoverageFilter(filter.key as CoverageType); }}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95',
                coverageFilter === filter.key 
                  ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30' 
                  : 'bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] text-muted-foreground hover:bg-white/[0.06]'
              )}
            >
              <filter.icon className="w-3.5 h-3.5" />
              {filter.label}
            </button>
          ))}
        </div>

        {/* Products List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Loading eSIM plans...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedProducts.map((product, index) => (
              <div 
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="relative rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-all duration-200"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Glass background */}
                <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-xl" />
                
                {/* Content */}
                <div className="relative p-4 border border-white/[0.08] rounded-2xl">
                  <div className="flex items-center gap-4">
                    {getCountryFlag(product)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground truncate">
                          {product.country_name}
                        </span>
                        {(product as any).package_type === 'regional' && (
                          <Badge className="bg-primary/20 text-primary border-0 text-[10px] px-1.5">
                            Regional
                          </Badge>
                        )}
                      </div>
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
                        <span className="text-lg font-bold text-foreground">
                          ${product.price_usd.toFixed(2)}
                        </span>
                      </div>
                      <Button 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                        className="h-10 px-4 rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/30 hover:opacity-90"
                      >
                        Add
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
                className="w-full p-4 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:bg-white/[0.05] transition-all active:scale-[0.98]"
              >
                <ChevronDown className="w-4 h-4" />
                Load More ({filteredProducts.length - displayCount} remaining)
              </button>
            )}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && displayedProducts.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
              <MapPin className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground mb-4">No plans found for "{searchQuery}"</p>
            <Button 
              variant="outline"
              className="bg-white/[0.03] border-white/10"
              onClick={() => { setSearchQuery(''); setCoverageFilter('all'); }}
            >
              Clear filters
            </Button>
          </div>
        )}

        {/* Product Detail Modal - Premium Design */}
        <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
          <DialogContent className="max-w-sm mx-4 rounded-3xl border-white/10 bg-background/95 backdrop-blur-2xl p-0 overflow-hidden">
            {selectedProduct && (
              <>
                {/* Header with gradient */}
                <div className="relative p-6 pb-4">
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent" />
                  <DialogHeader className="relative">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {getCountryFlag(selectedProduct)}
                      </div>
                      <div>
                        <DialogTitle className="text-xl">{selectedProduct.country_name}</DialogTitle>
                        <p className="text-sm text-muted-foreground">{selectedProduct.name}</p>
                      </div>
                    </div>
                  </DialogHeader>
                </div>
                
                <div className="px-6 pb-6 space-y-4">
                  {/* Data & Validity Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <Wifi className="w-4 h-4" />
                        Data
                      </div>
                      <span className="text-xl font-bold text-foreground">{selectedProduct.data_amount}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <Calendar className="w-4 h-4" />
                        Validity
                      </div>
                      <span className="text-xl font-bold text-foreground">{selectedProduct.validity_days} days</span>
                    </div>
                  </div>
                  
                  {/* Coverage info */}
                  {selectedProduct.features?.coverage && (
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <Globe className="w-4 h-4" />
                        Coverage
                      </div>
                      <p className="text-sm text-foreground">{selectedProduct.features.coverage}</p>
                    </div>
                  )}
                  
                  {/* Price Display */}
                  <div className="text-center py-4">
                    <div className="text-4xl font-bold text-foreground tracking-tight">
                      ${selectedProduct.price_usd.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">One-time payment • Instant activation</p>
                  </div>
                  
                  {/* Add to Cart Button */}
                  <Button 
                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/30 text-base font-semibold group"
                    onClick={() => {
                      handleAddToCart(selectedProduct);
                      setDetailModalOpen(false);
                    }}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Add to Cart
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
