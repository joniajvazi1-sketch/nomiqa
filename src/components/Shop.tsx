import { useEffect, useState } from "react";
import { useProducts, useSyncProducts } from "@/hooks/useProducts";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Shop = () => {
  const { data: products, isLoading, refetch } = useProducts();
  const syncProducts = useSyncProducts();
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoSynced, setAutoSynced] = useState(false);

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

  // Group products by validity_days
  const groupedProducts = products?.reduce((acc, product) => {
    const days = product.validity_days;
    if (!acc[days]) {
      acc[days] = [];
    }
    acc[days].push(product);
    return acc;
  }, {} as Record<number, typeof products>);

  // Sort duration groups
  const sortedDurations = Object.keys(groupedProducts || {})
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <section id="shop" className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Shop eSIMs</h2>
          <p className="text-muted-foreground">
            Choose the perfect data package for your travel needs
          </p>
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
                        <button
                          key={product.id}
                          className="w-full flex items-center justify-between p-4 rounded-lg border bg-background hover:border-primary transition-all group"
                        >
                          <span className="text-base font-medium">
                            {product.data_amount}
                          </span>
                          <span className="text-base font-semibold">
                            ${product.price_usd.toFixed(2)}
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};