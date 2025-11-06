import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProducts, useSyncProducts } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Loader2, ShoppingCart, Search, Wifi, Calendar, Globe } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import * as CountryFlags from 'country-flag-icons/react/3x2';

export const Shop = () => {
  const navigate = useNavigate();
  const { data: products, isLoading, refetch } = useProducts();
  const { items, addItem } = useCart();
  const syncProducts = useSyncProducts();
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoSynced, setAutoSynced] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncProducts();
      await refetch();
      toast.success("Products synced successfully");
    } catch (error) {
      toast.error("Failed to sync products");
      console.error(error);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (!products?.length && !isLoading && !autoSynced && !isSyncing) {
      setAutoSynced(true);
      handleSync();
    }
  }, [products, isLoading, autoSynced, isSyncing]);

  const filteredProducts = products?.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.country_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCountry = selectedCountry === "all" || product.country_code === selectedCountry;
    return matchesSearch && matchesCountry;
  });

  const countries = Array.from(new Set(products?.map(p => p.country_code) || []));

  const handleAddToCart = (product: any) => {
    addItem(product);
    toast.success(`${product.name} added to cart!`);
  };

  const getCountryFlag = (countryCode: string) => {
    const FlagComponent = (CountryFlags as any)[countryCode];
    return FlagComponent ? <FlagComponent className="w-8 h-6 rounded shadow" /> : null;
  };

  return (
    <section id="shop" className="py-20 px-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-4xl font-bold mb-2">eSIM Plans</h2>
            <p className="text-muted-foreground">
              Global connectivity at your fingertips
            </p>
          </div>
          
          {items.length > 0 && (
            <Button
              onClick={() => navigate('/checkout')}
              size="lg"
              className="relative"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Cart
              <Badge className="ml-2 bg-white text-primary hover:bg-white">
                {items.reduce((sum, item) => sum + item.quantity, 0)}
              </Badge>
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by country or plan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedCountry === "all" ? "default" : "outline"}
              onClick={() => setSelectedCountry("all")}
              size="sm"
            >
              All Countries
            </Button>
            {countries.slice(0, 5).map(code => (
              <Button
                key={code}
                variant={selectedCountry === code ? "default" : "outline"}
                onClick={() => setSelectedCountry(code)}
                size="sm"
                className="flex items-center gap-2"
              >
                {getCountryFlag(code)}
                {code}
              </Button>
            ))}
            <Button
              onClick={handleSync}
              disabled={isSyncing}
              variant="outline"
              size="sm"
            >
              {isSyncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sync
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !filteredProducts?.length ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedCountry !== "all" ? "No products match your filters" : "No products available"}
            </p>
            {!products?.length && (
              <Button onClick={handleSync} disabled={isSyncing}>
                {isSyncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Load Products
              </Button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getCountryFlag(product.country_code)}
                      <div>
                        <CardTitle className="text-xl">{product.country_name}</CardTitle>
                        <CardDescription>{product.name}</CardDescription>
                      </div>
                    </div>
                    {product.is_popular && (
                      <Badge className="bg-gradient-to-r from-primary to-primary/80">
                        Popular
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Wifi className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{product.data_amount}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>{product.validity_days} days validity</span>
                    </div>
                    {product.features?.coverage && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4 text-primary" />
                        <span>{product.features.coverage}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t">
                    <div className="text-3xl font-bold text-primary">
                      ${product.price_usd.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">One-time payment</p>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => handleAddToCart(product)}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};