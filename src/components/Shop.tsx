import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Loader2, ShoppingCart, Search, Wifi, Calendar, Globe, MapPin, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import * as CountryFlags from 'country-flag-icons/react/3x2';
import { ShareModal } from "./ShareModal";

type CoverageType = "all" | "local" | "regional";

// Regional package identifiers based on Airalo's naming
const REGIONAL_PACKAGES = {
  africa: ['hello africa', 'hello-africa'],
  asia: ['asialink'],
  oceania: ['oceanlink'],
  europe: ['eurolink'],
  latinAmerica: ['latamlink'],
  mena: ['menalink'],
  northAmerica: ['american mex', 'american-mex']
};

const ALL_REGIONAL_IDENTIFIERS = Object.values(REGIONAL_PACKAGES).flat();

export const Shop = () => {
  const navigate = useNavigate();
  const { data: products, isLoading } = useProducts();
  const { items, addItem } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [coverageFilter, setCoverageFilter] = useState<CoverageType>("all");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // Classify products by coverage type
  const getProductCoverageType = (product: any): CoverageType => {
    const countryCode = product.country_code?.toLowerCase() || "";
    const countryName = product.country_name?.toLowerCase() || "";
    const packageName = product.name?.toLowerCase() || "";
    
    // Check if it's a regional package by name
    const isRegional = ALL_REGIONAL_IDENTIFIERS.some(identifier => 
      countryCode.includes(identifier) || 
      countryName.includes(identifier) ||
      packageName.includes(identifier)
    );
    
    if (isRegional) {
      return "regional";
    }
    
    // Everything else is local (single country)
    return "local";
  };

  const filteredProducts = products?.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.country_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (coverageFilter === "all") {
      return matchesSearch;
    }
    
    const productType = getProductCoverageType(product);
    return matchesSearch && productType === coverageFilter;
  });

  const handleAddToCart = (product: any) => {
    addItem(product);
    toast.success(`${product.name} added to cart!`);
  };

  const handleShare = (product: any) => {
    setSelectedProduct(product);
    setShareModalOpen(true);
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
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !filteredProducts?.length ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">
              {searchQuery || coverageFilter !== "all" ? "No products match your filters" : "No products available"}
            </p>
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

                <CardFooter className="flex gap-2">
                  <Button 
                    onClick={() => handleAddToCart(product)}
                    className="flex-1"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                  </Button>
                  <Button 
                    onClick={() => handleShare(product)}
                    variant="outline"
                    size="icon"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        <ShareModal 
          open={shareModalOpen}
          onOpenChange={setShareModalOpen}
          product={selectedProduct}
        />
      </div>
    </section>
  );
};