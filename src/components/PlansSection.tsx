import { PlanCard } from "./PlanCard";
import { useProducts, useSyncProducts } from "@/hooks/useProducts";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export const PlansSection = () => {
  const { data: products, isLoading, refetch } = useProducts();
  const syncProducts = useSyncProducts();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      await syncProducts();
      await refetch();
      toast({
        title: "Products synced",
        description: "eSIM products updated from Airlo",
      });
    } catch (error) {
      toast({
        title: "Sync failed",
        description: "Could not sync products from Airlo",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <section id="plans" className="py-20 bg-background">
      <div className="container px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Choose Your Plan</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Flexible data plans for every type of traveler. No contracts, no hassle.
          </p>
          <Button 
            onClick={handleSync} 
            disabled={isSyncing}
            variant="outline"
            className="mt-4"
          >
            {isSyncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sync Products from Airlo
          </Button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {products.map((product) => (
              <PlanCard 
                key={product.id}
                name={product.name}
                data={product.data_amount}
                validity={`${product.validity_days} Days`}
                price={`$${product.price_usd.toFixed(2)}`}
                features={[
                  `Coverage in ${product.country_name}`,
                  product.features.speed || '4G/5G speeds',
                  product.features.activation || 'Instant activation',
                  'Keep your WhatsApp number'
                ]}
                popular={product.is_popular}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">No products available yet.</p>
            <Button onClick={handleSync} disabled={isSyncing}>
              {isSyncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Load Products from Airlo
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};