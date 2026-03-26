import { useNavigate } from "react-router-dom";
import { useShopifyCart } from "@/stores/shopifyCartStore";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingCart, Trash2, Minus, Plus, ExternalLink, Loader2 } from "lucide-react";
import { useEnhancedHaptics } from "@/hooks/useEnhancedHaptics";
import { useEnhancedSounds } from "@/hooks/useEnhancedSounds";
import { cn } from "@/lib/utils";

export const AppCheckout = () => {
  const navigate = useNavigate();
  const { items, isLoading, isSyncing, updateQuantity, removeItem, getCheckoutUrl, syncCart } = useShopifyCart();
  const { buttonTap, navigationTap, selectionTap } = useEnhancedHaptics();
  const { playPop, playSwoosh } = useEnhancedSounds();

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (parseFloat(item.price.amount) * item.quantity), 0);
  const currencyCode = items[0]?.price.currencyCode || 'USD';

  const handleCheckout = () => {
    buttonTap();
    playSwoosh();
    const checkoutUrl = getCheckoutUrl();
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank');
    }
  };

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-5">
        <div className="relative z-10 text-center w-full max-w-sm">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-muted border border-border flex items-center justify-center">
            <ShoppingCart className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-foreground">Cart is Empty</h2>
          <p className="text-muted-foreground mb-6">Add some eSIM plans to get started</p>
          <Button
            onClick={() => { navigationTap(); playSwoosh(); navigate('/app/shop'); }}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/30 active:scale-[0.98]"
          >
            Browse Plans
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pb-40 app-container momentum-scroll">
      <div className="relative z-10 px-5 py-6 space-y-5">
        {/* Header */}
        <header className="flex items-center gap-4">
          <button
            onClick={() => { navigationTap(); navigate(-1); }}
            className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center active:scale-90 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Checkout</h1>
            <p className="text-sm text-muted-foreground">{totalItems} item{totalItems > 1 ? 's' : ''}</p>
          </div>
        </header>

        {/* Cart Items */}
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.variantId}
              className="p-4 rounded-2xl bg-card/60 backdrop-blur-xl border border-border"
            >
              <div className="flex items-start gap-4">
                {/* Image */}
                {item.product.node.images?.edges?.[0]?.node && (
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-border">
                    <img
                      src={item.product.node.images.edges[0].node.url}
                      alt={item.product.node.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {item.product.node.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {item.variantTitle}
                  </p>
                </div>
                {/* Price */}
                <div className="text-right shrink-0">
                  <p className="font-bold text-primary tabular-nums">
                    ${(parseFloat(item.price.amount) * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { selectionTap(); playPop(); updateQuantity(item.variantId, item.quantity - 1); }}
                    className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <Minus className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <span className="w-8 text-center font-medium text-foreground tabular-nums">{item.quantity}</span>
                  <button
                    onClick={() => { selectionTap(); playPop(); updateQuantity(item.variantId, item.quantity + 1); }}
                    className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <button
                  onClick={() => { buttonTap(); removeItem(item.variantId); }}
                  className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 active:scale-90 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="p-4 rounded-2xl bg-card/60 backdrop-blur-xl border border-border space-y-3">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
          <div className="h-px bg-border/30" />
          <div className="flex justify-between font-semibold text-lg">
            <span className="text-foreground">Total</span>
            <span className="text-primary">{currencyCode} ${totalPrice.toFixed(2)}</span>
          </div>
        </div>

        {/* Checkout Button */}
        <Button
          onClick={handleCheckout}
          disabled={isLoading || isSyncing || items.length === 0}
          className={cn(
            "w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/30 text-base font-semibold active:scale-[0.98] transition-all",
            (isLoading || isSyncing) && "opacity-70"
          )}
        >
          {isLoading || isSyncing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <ExternalLink className="w-5 h-5 mr-2" />
              Checkout with Shopify
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
