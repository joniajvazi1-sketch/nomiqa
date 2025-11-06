import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Product } from "@/hooks/useProducts";
import { Check, Globe, Zap, Clock } from "lucide-react";

interface ProductDetailModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProductDetailModal = ({
  product,
  open,
  onOpenChange,
}: ProductDetailModalProps) => {
  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{product.country_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Package Info */}
          <div className="bg-muted/50 rounded-lg p-6">
            <div className="flex items-baseline justify-between mb-2">
              <h3 className="text-3xl font-bold">{product.data_amount}</h3>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">
                  ${product.price_usd.toFixed(2)}
                </div>
              </div>
            </div>
            <p className="text-muted-foreground">
              Valid for {product.validity_days}{" "}
              {product.validity_days === 1 ? "day" : "days"}
            </p>
          </div>

          {/* Features */}
          {product.features && Object.keys(product.features).length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Features</h4>
              <div className="space-y-2">
                {product.features.coverage && (
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">Coverage</div>
                      <div className="text-sm text-muted-foreground">
                        {product.features.coverage}
                      </div>
                    </div>
                  </div>
                )}
                {product.features.speed && (
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">Speed</div>
                      <div className="text-sm text-muted-foreground">
                        {product.features.speed}
                      </div>
                    </div>
                  </div>
                )}
                {product.features.activation && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">Activation</div>
                      <div className="text-sm text-muted-foreground">
                        {product.features.activation}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* What's Included */}
          <div>
            <h4 className="font-semibold mb-3">What's Included</h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">{product.data_amount} of data</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">
                  {product.validity_days} day validity period
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">Easy eSIM activation</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">No physical SIM card needed</span>
              </li>
            </ul>
          </div>

          {/* Coverage Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Coverage Area</h4>
            <p className="text-sm text-muted-foreground">
              This eSIM provides coverage in {product.country_name} (
              {product.country_code})
            </p>
          </div>

          {/* Buy Button */}
          <Button variant="hero" size="lg" className="w-full">
            Buy Now - ${product.price_usd.toFixed(2)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
