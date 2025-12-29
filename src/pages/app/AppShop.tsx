import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProducts, Product } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { useHaptics } from '@/hooks/useHaptics';
import { cn } from '@/lib/utils';

/**
 * App Shop - Mobile-optimized eSIM store with country flags
 */
export const AppShop: React.FC = () => {
  const navigate = useNavigate();
  const { data: products, isLoading } = useProducts();
  const { addItem } = useCart();
  const { lightTap, success } = useHaptics();
  
  const [searchQuery, setSearchQuery] = useState('');

  // Group products by country
  const groupedProducts = useMemo(() => {
    if (!products) return {} as Record<string, Product[]>;
    
    const filtered = products.filter((p: Product) =>
      p.country_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filtered.reduce((acc: Record<string, Product[]>, product: Product) => {
      const country = product.country_name;
      if (!acc[country]) acc[country] = [];
      acc[country].push(product);
      return acc;
    }, {} as Record<string, Product[]>);
  }, [products, searchQuery]);

  const handleAddToCart = (product: any) => {
    lightTap();
    addItem(product);
    success();
  };

  const popularCountries = ['United States', 'United Kingdom', 'Japan', 'Thailand', 'France', 'Germany'];

  // Get first product's flag for each country group
  const getCountryFlag = (countryProducts: Product[]) => {
    const imageUrl = countryProducts[0]?.country_image_url;
    if (imageUrl) {
      return (
        <img 
          src={imageUrl} 
          alt="" 
          className="w-8 h-8 rounded-full object-cover border-2 border-border/50 shadow-sm"
        />
      );
    }
    // Fallback emoji mapping for common countries
    const emojiMap: Record<string, string> = {
      'United States': '🇺🇸',
      'United Kingdom': '🇬🇧',
      'Japan': '🇯🇵',
      'Thailand': '🇹🇭',
      'France': '🇫🇷',
      'Germany': '🇩🇪',
      'China': '🇨🇳',
      'Singapore': '🇸🇬',
      'Australia': '🇦🇺',
      'Canada': '🇨🇦',
      'South Korea': '🇰🇷',
      'Italy': '🇮🇹',
      'Spain': '🇪🇸',
      'Brazil': '🇧🇷',
      'Mexico': '🇲🇽',
      'India': '🇮🇳',
      'Indonesia': '🇮🇩',
      'Turkey': '🇹🇷',
      'UAE': '🇦🇪',
      'Saudi Arabia': '🇸🇦',
    };
    const countryName = countryProducts[0]?.country_name;
    const emoji = emojiMap[countryName] || '🌍';
    return <span className="text-2xl">{emoji}</span>;
  };

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">eSIM Shop</h1>
        <p className="text-sm text-muted-foreground">Travel data plans for 190+ countries</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search countries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-muted/50 border-border/50"
        />
      </div>

      {/* Quick filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {popularCountries.map((country) => (
          <Badge
            key={country}
            variant="outline"
            className={cn(
              'whitespace-nowrap cursor-pointer transition-colors',
              searchQuery === country 
                ? 'bg-primary text-primary-foreground border-primary' 
                : 'hover:bg-muted'
            )}
            onClick={() => {
              lightTap();
              setSearchQuery(searchQuery === country ? '' : country);
            }}
          >
            {country}
          </Badge>
        ))}
      </div>

      {/* Products */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedProducts).slice(0, 10).map(([country, countryProducts]) => (
            <div key={country}>
              {/* Country header with flag */}
              <div className="flex items-center gap-3 mb-3">
                {getCountryFlag(countryProducts as Product[])}
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-foreground">{country}</h2>
                  <Badge variant="secondary" className="text-xs">
                    {countryProducts.length} plans
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                {countryProducts.slice(0, 3).map((product) => (
                  <Card 
                    key={product.id} 
                    className="bg-card/50 border-border/50 overflow-hidden"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground truncate">
                              {product.data_amount}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              • {product.validity_days} days
                            </span>
                          </div>
                          {product.is_popular && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              Popular
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-bold text-foreground">
                              ${product.price_usd.toFixed(2)}
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => handleAddToCart(product)}
                            className="shrink-0"
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && Object.keys(groupedProducts).length === 0 && (
        <div className="text-center py-20">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No plans found for "{searchQuery}"</p>
          <Button 
            variant="link" 
            onClick={() => setSearchQuery('')}
            className="mt-2"
          >
            Clear search
          </Button>
        </div>
      )}
    </div>
  );
};
