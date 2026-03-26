import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCartWithTotal } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, ShoppingCart, Trash2, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { useAffiliateTracking } from "@/hooks/useAffiliateTracking";
import { useTranslation } from "@/contexts/TranslationContext";
import { cn } from "@/lib/utils";

const emailSchema = z.string().email("Please enter a valid email address");

export default function Checkout() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, clearCart, total } = useCartWithTotal();
  const { referralCode } = useAffiliateTracking();
  const { t, formatPrice } = useTranslation();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Check authentication status without redirecting
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      // Pre-fill email if user is logged in
      if (user?.email) {
        setEmail(user.email);
      }
    };
    
    checkAuth();
  }, []);

  // Generate or retrieve visitor ID for affiliate tracking
  const getVisitorId = () => {
    let visitorId = localStorage.getItem('visitor_id');
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem('visitor_id', visitorId);
    }
    return visitorId;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is logged in before proceeding with checkout
    if (!user) {
      toast.error("Please log in to complete your purchase");
      navigate('/auth?redirect=/checkout');
      return;
    }
    
    // Validate email
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    // Validate full name
    if (!fullName || fullName.trim().length < 2) {
      toast.error("Please enter your full name");
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get visitor ID for affiliate tracking
      const visitorId = getVisitorId();
      const primaryItem = items[0];

      if (paymentMethod === 'card') {
        // Stripe checkout - opens in new tab
        const { data: stripeData, error: stripeError } = await supabase.functions.invoke(
          'create-stripe-checkout',
          {
            body: {
              email,
              fullName: fullName.trim(),
              productId: primaryItem.product.id,
              quantity: primaryItem.quantity,
              referralCode: referralCode || null,
              visitorId,
            }
          }
        );

        if (stripeError || !stripeData?.url) {
          console.error('Error creating Stripe checkout:', stripeError);
          throw new Error('Failed to create checkout session');
        }

        console.log('Stripe checkout created:', stripeData.url, 'Order ID:', stripeData.orderId);
        setCurrentOrderId(stripeData.orderId);
        
        // Open Stripe checkout in new tab
        window.open(stripeData.url, '_blank');
        toast.info('Complete payment in the new tab');
        setIsSubmitting(false);
        
      } else {
        // Helio crypto checkout - embedded modal
        const { data: paylinkData, error: paylinkError } = await supabase.functions.invoke(
          'create-helio-paylink',
          {
            body: {
              email,
              fullName: fullName.trim(),
              productId: primaryItem.product.id,
              quantity: primaryItem.quantity,
              referralCode: referralCode || null,
              visitorId,
              userId: user?.id || null,
            }
          }
        );

        if (paylinkError || !paylinkData?.paylinkUrl) {
          console.error('Error creating paylink:', paylinkError);
          throw new Error('Failed to create payment link');
        }

        console.log('Paylink created:', paylinkData.paylinkUrl, 'Order ID:', paylinkData.orderId);
        
        // Store order ID for status polling
        setCurrentOrderId(paylinkData.orderId);
        
        // Show embedded payment modal with iframe
        setPaylinkUrl(paylinkData.paylinkUrl);
        setShowPaymentModal(true);
        setIsSubmitting(false);
      }
      
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || "Failed to create payment. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Listen for payment completion from MoonPay/Helio (backup method)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.includes('hel.io') && !event.origin.includes('moonpay.com')) return;
      
      if (event.data?.status === 'success' || event.data?.type === 'payment_success') {
        console.log('Payment successful via postMessage! Clearing cart and redirecting to My eSIMs...');
        setShowPaymentModal(false);
        clearCart();
        toast.success('Payment successful! Your eSIM will arrive shortly.');
        // Redirect to My eSIMs page
        navigate('/orders');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate, clearCart]);

  // Real-time subscription + fallback polling to detect payment completion
  useEffect(() => {
    if (!showPaymentModal || !currentOrderId) return;

    console.log('Setting up realtime subscription for order:', currentOrderId);
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    // Realtime subscription for instant updates
    const channel = supabase
      .channel(`order-${currentOrderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${currentOrderId}`
        },
        (payload) => {
          console.log('Order update received via realtime:', payload);
          const newStatus = payload.new?.status;
          
          if (newStatus === 'completed' || newStatus === 'paid') {
            console.log('Order completed! Clearing cart and redirecting to My eSIMs...');
            setPaymentCompleted(true);
            clearCart();
            toast.success('Payment successful! Your eSIM is ready.');
            // Redirect to My eSIMs page
            navigate('/orders');
          }
        }
      )
      .subscribe();

    // Fallback polling every 5 seconds in case realtime fails
    const checkOrderStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('status')
          .eq('id', currentOrderId)
          .single();

        if (error || !data) return;

        if (data.status === 'completed' || data.status === 'paid') {
          console.log('Order completed (via polling)! Clearing cart and redirecting to My eSIMs...');
          setPaymentCompleted(true);
          clearCart();
          toast.success('Payment successful! Your eSIM is ready.');
          // Redirect to My eSIMs page
          navigate('/orders');
        }
      } catch (err) {
        console.error('Error polling order status:', err);
      }
    };

    pollInterval = setInterval(checkOrderStatus, 5000);

    return () => {
      console.log('Cleaning up realtime subscription and polling');
      supabase.removeChannel(channel);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [showPaymentModal, currentOrderId, navigate, clearCart]);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4">
        {/* Premium Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,hsl(var(--accent)/0.1),transparent_40%)]" />
        
        <Card className="w-full max-w-md text-center bg-card/80 backdrop-blur-xl border-border/50 shadow-2xl relative z-10 animate-scale-in">
          <CardContent className="pt-8 pb-6 px-6 space-y-6">
            <div className="p-6 bg-gradient-to-br from-muted/50 to-transparent rounded-2xl border border-border/50">
              <ShoppingCart className="h-20 w-20 mx-auto text-muted-foreground/60" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {t("checkoutEmptyCart")}
              </h2>
              <p className="text-base text-muted-foreground">
                {t("checkoutEmptyCartDesc")}
              </p>
            </div>
            <Button 
              onClick={() => navigate('/')}
              className="w-full h-auto py-3 px-4 text-sm md:text-base font-light bg-white/[0.05] backdrop-blur-xl border-2 border-neon-cyan/30 text-white hover:bg-neon-cyan/10 hover:border-neon-cyan/50 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-neon-cyan/20"
            >
              <span className="break-words">{t("checkoutBrowsePackages")}</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black/40 via-deep-space/60 to-black/40 relative">
      {/* Premium background decorations */}
      <div className="fixed inset-0 -z-10 overflow-hidden opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-neon-cyan/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-neon-violet/30 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
        <Button
          variant="ghost"
          className="mb-6 text-white/70 hover:text-white hover:bg-white/10"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("checkoutBackToShop")}
        </Button>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="md:col-span-2 space-y-4">
            <h1 className="text-3xl md:text-4xl font-semibold mb-6 text-center md:text-left">
              <span className="text-white">
                {t("checkoutTitle")}
              </span>
            </h1>
            
            {items.map((item) => (
              <Card key={item.product.id} className="bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:border-neon-cyan/30 transition-all duration-300 overflow-hidden">
                {/* Product Hero Image */}
                {item.product.country_image_url && (
                  <div className="relative h-40 w-full overflow-hidden">
                    <img 
                      src={item.product.country_image_url} 
                      alt={item.product.country_name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-6">
                      <h3 className="font-bold text-2xl text-white drop-shadow-lg">
                        {item.product.country_name}
                      </h3>
                      <p className="text-sm text-white/80">
                        {item.product.data_amount} • {item.product.validity_days} days
                      </p>
                    </div>
                  </div>
                )}
                <CardContent className="p-6">
                  {!item.product.country_image_url && (
                    <div className="mb-4">
                      <h3 className="font-semibold text-lg text-white">
                        {item.product.country_name} - {item.product.data_amount} - {item.product.validity_days} days
                      </h3>
                      <p className="text-sm text-white/60">
                        {item.product.country_name} • {item.product.data_amount} • {item.product.validity_days} days
                      </p>
                    </div>
                  )}
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="bg-white/5 border-white/20 hover:bg-white/10 hover:border-neon-cyan/40 text-white h-8 w-8 p-0"
                        >
                          -
                        </Button>
                        <span className="w-8 text-center text-white font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="bg-white/5 border-white/20 hover:bg-white/10 hover:border-neon-cyan/40 text-white h-8 w-8 p-0"
                        >
                          +
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.product.id)}
                        className="text-white/60 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-left md:text-right w-full md:w-auto">
                      <p className="text-xl font-bold text-neon-cyan">
                        {formatPrice(item.product.price_usd * item.quantity)}
                      </p>
                      <p className="text-sm text-white/50">{formatPrice(item.product.price_usd)} {t("checkoutEach")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-4 bg-white/[0.03] backdrop-blur-xl border border-white/10">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="text-white">{t("checkoutOrderSummary")}</CardTitle>
                <CardDescription className="text-white/60">{t("checkoutOrderSummaryDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium text-white/80">{t("checkoutFullNameLabel")}</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder={t("checkoutFullNamePlaceholder")}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="text-base py-6 bg-white/5 border-white/20 focus:border-neon-cyan/50 text-white placeholder:text-white/40"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-white/80">{t("checkoutEmailLabel")} *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t("checkoutEmailPlaceholder")}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="text-base py-6 bg-white/5 border-white/20 focus:border-neon-cyan/50 text-white placeholder:text-white/40"
                    />
                    <div className="bg-neon-cyan/5 border border-neon-cyan/20 rounded-xl p-4 mt-3">
                      {user ? (
                        <>
                          <p className="text-sm font-medium text-white">
                            {t("checkoutEmailInfo")}
                          </p>
                          <p className="text-xs text-white/60 mt-1">
                            {t("checkoutEmailFromAccount")} • {t("checkoutEmailWarning")}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-white">
                            ⚠️ Login Required to Purchase
                          </p>
                          <p className="text-xs text-white/60 mt-1">
                            You must be logged in to complete your purchase. Click checkout to continue.
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Payment Method Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-white/80">Payment Method</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={cn(
                          "p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all",
                          paymentMethod === 'card'
                            ? "border-neon-cyan bg-neon-cyan/10"
                            : "border-white/20 bg-white/5 hover:border-white/40"
                        )}
                      >
                        <CreditCard className={cn(
                          "w-6 h-6",
                          paymentMethod === 'card' ? "text-neon-cyan" : "text-white/60"
                        )} />
                        <span className={cn(
                          "text-sm font-medium",
                          paymentMethod === 'card' ? "text-neon-cyan" : "text-white/60"
                        )}>Card</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('crypto')}
                        className={cn(
                          "p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all",
                          paymentMethod === 'crypto'
                            ? "border-neon-cyan bg-neon-cyan/10"
                            : "border-white/20 bg-white/5 hover:border-white/40"
                        )}
                      >
                        <Wallet className={cn(
                          "w-6 h-6",
                          paymentMethod === 'crypto' ? "text-neon-cyan" : "text-white/60"
                        )} />
                        <span className={cn(
                          "text-sm font-medium",
                          paymentMethod === 'crypto' ? "text-neon-cyan" : "text-white/60"
                        )}>Crypto</span>
                      </button>
                    </div>
                  </div>

                  <Separator className="bg-white/10" />

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-white/70">
                      <span>{t("checkoutSubtotal")} ({items.reduce((sum, item) => sum + item.quantity, 0)} {t("checkoutItems")})</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg pt-2 text-white">
                      <span>{t("checkoutTotal")}</span>
                      <span className="text-neon-cyan">
                        {formatPrice(total)}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full bg-white/[0.08] hover:bg-white/[0.12] backdrop-blur-xl border border-white/20 hover:border-neon-cyan/40 text-white font-medium py-6 rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-neon-cyan/10"
                  >
                    {isSubmitting ? t("checkoutProcessing") : t("checkoutCompleteOrder")}
                  </Button>

                  <p className="text-xs text-center text-white/50">
                    {t("checkoutTerms")}
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showPaymentModal} onOpenChange={(open) => {
        setShowPaymentModal(open);
        if (!open) {
          toast.info('You can check your order status in My eSIMs page');
        }
      }}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] md:h-[85vh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-4 md:p-6 pb-2 md:pb-4 flex-shrink-0 flex flex-row items-center justify-between">
            <DialogTitle>{t("checkoutCompletePayment") || "Complete Your Payment"}</DialogTitle>
          </DialogHeader>
          {paylinkUrl && (
            <iframe
              src={paylinkUrl}
              className="w-full flex-1 min-h-0 border-0"
              style={{ minHeight: '500px' }}
              title="Helio Payment"
              allow="payment"
            />
          )}
          {/* Always visible footer - fixed at bottom */}
          <div className={`px-4 py-3 md:px-6 md:py-5 border-t flex-shrink-0 flex flex-col md:flex-row items-center justify-center md:justify-end gap-2 md:gap-4 ${paymentCompleted ? 'bg-green-500/10' : 'bg-card'}`}>
            {paymentCompleted ? (
              <>
                <p className="text-sm text-green-400 font-medium hidden md:block">
                  ✓ {t("checkoutPaymentSuccess") || "Payment successful! Your eSIM is ready."}
                </p>
                <p className="text-xs text-green-400 font-medium md:hidden text-center">
                  ✓ {t("checkoutPaymentSuccess") || "Payment successful! Your eSIM is ready."}
                </p>
                <Button 
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentCompleted(false);
                    navigate('/orders');
                  }}
                  className="w-full md:w-auto bg-green-600 hover:bg-green-700 px-4 md:px-8 md:py-3 md:text-base"
                >
                  {t("checkoutViewMyEsims") || "View My eSIMs"}
                </Button>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground md:hidden text-center">
                  {t("checkoutMobileWalletHint") || "Paid in Phantom? Tap below to check your eSIM."}
                </p>
                <p className="text-sm text-muted-foreground hidden md:block">
                  {t("checkoutAlreadyPaid") || "Already paid? Go check your eSIMs."}
                </p>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowPaymentModal(false);
                    navigate('/orders');
                  }}
                  className="w-full md:w-auto px-4 md:px-8 md:py-3 md:text-base border-primary/40 hover:bg-primary/10"
                >
                  {t("checkoutGoToMyEsims") || "Go to My eSIMs"}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
