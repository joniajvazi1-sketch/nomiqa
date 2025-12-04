import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCartWithTotal } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, ShoppingCart, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { useAffiliateTracking } from "@/hooks/useAffiliateTracking";
import { useTranslation } from "@/contexts/TranslationContext";

const emailSchema = z.string().email("Please enter a valid email address");

export default function Checkout() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, clearCart, total } = useCartWithTotal();
  const { referralCode } = useAffiliateTracking();
  const { t, formatPrice } = useTranslation();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paylinkUrl, setPaylinkUrl] = useState<string | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
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

      // Create Helio paylink (server creates order securely)
      const primaryItem = items[0];

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
        console.log('Payment successful via postMessage! Clearing cart and redirecting...');
        setShowPaymentModal(false);
        clearCart();
        toast.success('Payment successful! Your eSIM will arrive shortly.');
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
    let pollInterval: NodeJS.Timeout | null = null;

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
            console.log('Order completed! Clearing cart and showing success UI...');
            setPaymentCompleted(true);
            clearCart();
            toast.success('Payment successful! Your eSIM is ready.');
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
          console.log('Order completed (via polling)! Clearing cart and showing success UI...');
          setPaymentCompleted(true);
          clearCart();
          toast.success('Payment successful! Your eSIM is ready.');
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("checkoutBackToShop")}
        </Button>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="md:col-span-2 space-y-4">
            <h1 className="text-3xl font-bold mb-6 text-center md:text-left">{t("checkoutTitle")}</h1>
            
            {items.map((item) => (
              <Card key={item.product.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">
                        {item.product.country_name} - {item.product.data_amount} - {item.product.validity_days} days
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {item.product.country_name} • {item.product.data_amount} • {item.product.validity_days} days
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-center md:text-right w-full md:w-auto">
                      <p className="text-xl font-bold">{formatPrice(item.product.price_usd * item.quantity)}</p>
                      <p className="text-sm text-muted-foreground">{formatPrice(item.product.price_usd)} {t("checkoutEach")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>{t("checkoutOrderSummary")}</CardTitle>
                <CardDescription>{t("checkoutOrderSummaryDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-base font-semibold">{t("checkoutFullNameLabel")}</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder={t("checkoutFullNamePlaceholder")}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="text-base py-6"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-base font-semibold">{t("checkoutEmailLabel")} *</Label>
                    {user ? (
                      <Input
                        id="email"
                        type="email"
                        placeholder={t("checkoutEmailPlaceholder")}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        readOnly
                        className="text-base py-6 bg-muted/50 cursor-not-allowed"
                      />
                    ) : (
                      <Input
                        id="email"
                        type="email"
                        placeholder={t("checkoutEmailPlaceholder")}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="text-base py-6"
                      />
                    )}
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mt-3">
                      {user ? (
                        <>
                          <p className="text-sm md:text-base font-medium text-foreground">
                            {t("checkoutEmailInfo")}
                          </p>
                          <p className="text-xs md:text-sm text-muted-foreground mt-1">
                            Email from your account • {t("checkoutEmailWarning")}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm md:text-base font-medium text-foreground">
                            ⚠️ Login Required to Purchase
                          </p>
                          <p className="text-xs md:text-sm text-muted-foreground mt-1">
                            You must be logged in to complete your purchase. Click checkout to continue.
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{t("checkoutSubtotal")} ({items.reduce((sum, item) => sum + item.quantity, 0)} {t("checkoutItems")})</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2">
                      <span>{t("checkoutTotal")}</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? t("checkoutProcessing") : t("checkoutCompleteOrder")}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
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
