import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProducts, useSyncProducts, Product } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Loader2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { ProductDetailModal } from "./ProductDetailModal";

export const Shop = () => {
  const navigate = useNavigate();
  const { data: products, isLoading, refetch } = useProducts();
  const { items, addItem } = useCart();
  const syncProducts = useSyncProducts();
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoSynced, setAutoSynced] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const groupedProducts = products?.reduce((acc, product) => {
    const days = product.validity_days;
    if (!acc[days]) {
      acc[days] = [];
    }
    acc[days].push(product);
    return acc;
  }, {} as Record<number, typeof products>);

  const sortedDurations = Object.keys(groupedProducts || {})
    .map(Number)
    .sort((a, b) => a - b);

  const handleAddToCart = (product: Product) => {
    addItem(product);
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <section id="shop" className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-4xl font-bold mb-2">Shop eSIMs</h2>
            <p className="text-muted-foreground">
              Choose the perfect data package for your travel needs
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

        <div className="flex justify-center mb-8">
          <Button
            onClick={handleSync}
            disabled={isSyncing}
            variant="outline"
            size="sm"
          >
            {isSyncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sync Products
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !products?.length ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No products available</p>
            <Button onClick={handleSync} disabled={isSyncing}>
              {isSyncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Load Products
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-xl font-semibold mb-6">Choose your package</h3>
              
              {sortedDurations.map((days) => (
                <div key={days} className="mb-8 last:mb-0">
                  <h4 className="text-base font-semibold mb-4">
                    {days} {days === 1 ? 'day' : 'days'}
                  </h4>
                  
                  <div className="space-y-3">
                    {groupedProducts[days]
                      ?.sort((a, b) => a.price_usd - b.price_usd)
                      .map((product) => (
                        <div
                          key={product.id}
                          className="w-full flex items-center justify-between p-4 rounded-lg border bg-background hover:border-primary transition-all group"
                        >
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setIsModalOpen(true);
                            }}
                            className="flex-1 text-left"
                          >
                            <span className="text-base font-medium">
                              {product.data_amount}
                            </span>
                          </button>
                          
                          <div className="flex items-center gap-4">
                            <span className="text-base font-semibold">
                              ${product.price_usd.toFixed(2)}
                            </span>
                            <Button
                              size="sm"
                              onClick={() => handleAddToCart(product)}
                            >
                              <ShoppingCart className="mr-2 h-4 w-4" />
                              Add
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <ProductDetailModal
          product={selectedProduct}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
        />
      </div>
    </section>
  );
};