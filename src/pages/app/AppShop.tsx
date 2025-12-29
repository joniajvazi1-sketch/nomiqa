import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Loader2, ShoppingCart, Wifi, Calendar, Globe, ChevronDown, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
 * App Shop - Full-featured mobile eSIM store matching web functionality
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

  // Filter products
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
    toast.success(`${product.country_name} eSIM added to cart!`);
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

  // Get country flag
  const getCountryFlag = (product: Product) => {
    const imageUrl = product.country_image_url;
    const packageType = (product as any).package_type;
    
    // Regional packages - use region maps
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
            className="w-10 h-10 rounded-full object-cover border-2 border-border/50 shadow-sm"
          />
        );
      }
    }
    
    if (imageUrl) {
      return (
        <img 
          src={imageUrl} 
          alt="" 
          className="w-10 h-10 rounded-full object-cover border-2 border-border/50 shadow-sm"
        />
      );
    }
    
    return (
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
        <Globe className="w-5 h-5 text-muted-foreground" />
      </div>
    );
  };

  return (
    <div className="px-4 py-6 space-y-5 pb-24">
      {/* Header with Cart */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">eSIM Shop</h1>
          <p className="text-sm text-muted-foreground">190+ countries available</p>
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          className="relative"
          onClick={() => navigate('/checkout')}
        >
          <ShoppingCart className="w-5 h-5" />
          {cartItemCount > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
              {cartItemCount}
            </span>
          )}
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search countries or regions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-muted/50 border-border/50"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Coverage Type Filters */}
      <div className="flex gap-2">
        <Badge
          variant="outline"
          className={cn(
            'cursor-pointer transition-colors px-3 py-1.5',
            coverageFilter === 'all' 
              ? 'bg-primary text-primary-foreground border-primary' 
              : 'hover:bg-muted'
          )}
          onClick={() => { lightTap(); setCoverageFilter('all'); }}
        >
          <Globe className="w-3 h-3 mr-1" />
          All
        </Badge>
        <Badge
          variant="outline"
          className={cn(
            'cursor-pointer transition-colors px-3 py-1.5',
            coverageFilter === 'local' 
              ? 'bg-primary text-primary-foreground border-primary' 
              : 'hover:bg-muted'
          )}
          onClick={() => { lightTap(); setCoverageFilter('local'); }}
        >
          <MapPin className="w-3 h-3 mr-1" />
          Local
        </Badge>
        <Badge
          variant="outline"
          className={cn(
            'cursor-pointer transition-colors px-3 py-1.5',
            coverageFilter === 'regional' 
              ? 'bg-primary text-primary-foreground border-primary' 
              : 'hover:bg-muted'
          )}
          onClick={() => { lightTap(); setCoverageFilter('regional'); }}
        >
          <Globe className="w-3 h-3 mr-1" />
          Regional
        </Badge>
      </div>

      {/* Products List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          {displayedProducts.map((product) => (
            <Card 
              key={product.id} 
              className="bg-card/50 border-border/50 overflow-hidden active:scale-[0.99] transition-transform"
              onClick={() => handleProductClick(product)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {/* Flag */}
                  {getCountryFlag(product)}
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground truncate">
                        {product.country_name}
                      </span>
                      {(product as any).package_type === 'regional' && (
                        <Badge variant="secondary" className="text-xs shrink-0">Regional</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1">
                        <Wifi className="w-3 h-3" />
                        {product.data_amount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {product.validity_days}d
                      </span>
                    </div>
                  </div>
                  
                  {/* Price & Add */}
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">
                      ${product.price_usd.toFixed(2)}
                    </span>
                    <Button 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      className="shrink-0"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Load More */}
          {hasMore && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleLoadMore}
            >
              <ChevronDown className="w-4 h-4 mr-2" />
              Load More ({filteredProducts.length - displayCount} remaining)
            </Button>
          )}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && displayedProducts.length === 0 && (
        <div className="text-center py-20">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No plans found for "{searchQuery}"</p>
          <Button 
            variant="link" 
            onClick={() => { setSearchQuery(''); setCoverageFilter('all'); }}
            className="mt-2"
          >
            Clear filters
          </Button>
        </div>
      )}

      {/* Product Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          {selectedProduct && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  {getCountryFlag(selectedProduct)}
                  <div>
                    <DialogTitle>{selectedProduct.country_name}</DialogTitle>
                    <p className="text-sm text-muted-foreground">{selectedProduct.name}</p>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Data & Validity */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Wifi className="w-3 h-3" />
                      Data
                    </div>
                    <span className="font-semibold text-foreground">{selectedProduct.data_amount}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Calendar className="w-3 h-3" />
                      Validity
                    </div>
                    <span className="font-semibold text-foreground">{selectedProduct.validity_days} days</span>
                  </div>
                </div>
                
                {/* Coverage info */}
                {selectedProduct.features?.coverage && (
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Globe className="w-3 h-3" />
                      Coverage
                    </div>
                    <p className="text-sm text-foreground">{selectedProduct.features.coverage}</p>
                  </div>
                )}
                
                {/* Price */}
                <div className="text-center py-2">
                  <div className="text-3xl font-bold text-foreground">
                    ${selectedProduct.price_usd.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">One-time payment</p>
                </div>
                
                {/* Add to Cart Button */}
                <Button 
                  className="w-full h-12"
                  onClick={() => {
                    handleAddToCart(selectedProduct);
                    setDetailModalOpen(false);
                  }}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
