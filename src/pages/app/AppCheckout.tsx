import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCartWithTotal } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, ShoppingCart, Trash2, Minus, Plus, Check, CreditCard, Shield, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { useAffiliateTracking } from "@/hooks/useAffiliateTracking";
import { useTranslation } from "@/contexts/TranslationContext";
import { useEnhancedHaptics } from "@/hooks/useEnhancedHaptics";
import { useEnhancedSounds } from "@/hooks/useEnhancedSounds";
import { cn } from "@/lib/utils";
import { FirstPurchaseCelebration, useFirstPurchaseCelebration } from "@/components/app/FirstPurchaseCelebration";

const emailSchema = z.string().email("Please enter a valid email address");

export const AppCheckout = () => {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, clearCart, total } = useCartWithTotal();
  const { referralCode } = useAffiliateTracking();
  const { t, formatPrice } = useTranslation();
  const { buttonTap, successPattern, errorPattern, navigationTap, selectionTap } = useEnhancedHaptics();
  const { playSuccess, playError, playPop, playSwoosh } = useEnhancedSounds();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paylinkUrl, setPaylinkUrl] = useState<string | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1);
  
  // First purchase celebration hook
  const { 
    isOpen: showCelebration, 
    productName: celebrationProductName, 
    checkAndTrigger: triggerFirstPurchase, 
    close: closeCelebration 
  } = useFirstPurchaseCelebration();

  // Check authentication status without redirecting
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user?.email) {
        setEmail(user.email);
      }
    };
    checkAuth();
  }, []);

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
    buttonTap();
    
    if (!user) {
      errorPattern();
      playError();
      toast.error("Please log in to complete your purchase");
      navigate('/auth?redirect=/checkout');
      return;
    }
    
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      errorPattern();
      playError();
      toast.error(result.error.errors[0].message);
      return;
    }

    if (!fullName || fullName.trim().length < 2) {
      errorPattern();
      playError();
      toast.error("Please enter your full name");
      return;
    }

    if (items.length === 0) {
      errorPattern();
      playError();
      toast.error("Your cart is empty");
      return;
    }

    setIsSubmitting(true);
    setCheckoutStep(1);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const visitorId = getVisitorId();
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
        throw new Error('Failed to create payment link');
      }

      setCurrentOrderId(paylinkData.orderId);
      setPaylinkUrl(paylinkData.paylinkUrl);
      setShowPaymentModal(true);
      setCheckoutStep(2);
      successPattern();
      playSuccess();
      setIsSubmitting(false);
      
    } catch (error: any) {
      errorPattern();
      playError();
      toast.error(error.message || "Failed to create payment. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Listen for payment completion from MoonPay/Helio
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.includes('hel.io') && !event.origin.includes('moonpay.com')) return;
      
      if (event.data?.status === 'success' || event.data?.type === 'payment_success') {
        setCheckoutStep(3);
        setPaymentCompleted(true);
        triggerFirstPurchase(items[0]?.product?.country_name);
        clearCart();
        toast.success('Payment successful! Your eSIM will arrive shortly.');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate, clearCart]);

  // Real-time subscription + fallback polling
  useEffect(() => {
    if (!showPaymentModal || !currentOrderId) return;

    let pollInterval: NodeJS.Timeout | null = null;

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
          const newStatus = payload.new?.status;
          if (newStatus === 'completed' || newStatus === 'paid') {
            setCheckoutStep(3);
            setPaymentCompleted(true);
            triggerFirstPurchase(items[0]?.product?.country_name);
            clearCart();
            toast.success('Payment successful! Your eSIM is ready.');
          }
        }
      )
      .subscribe();

    const checkOrderStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('status')
          .eq('id', currentOrderId)
          .single();

        if (error || !data) return;

        if (data.status === 'completed' || data.status === 'paid') {
          setCheckoutStep(3);
          setPaymentCompleted(true);
          triggerFirstPurchase(items[0]?.product?.country_name);
          clearCart();
          toast.success('Payment successful! Your eSIM is ready.');
        }
      } catch (err) {
        console.error('Error polling order status:', err);
      }
    };

    pollInterval = setInterval(checkOrderStatus, 5000);

    return () => {
      supabase.removeChannel(channel);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [showPaymentModal, currentOrderId, navigate, clearCart]);

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-5">
        <div className="fixed inset-0 pointer-events-none">
          <div 
            className="absolute top-20 left-0 w-[300px] h-[300px] rounded-full opacity-10"
            style={{
              background: 'radial-gradient(circle, hsl(var(--neon-cyan)) 0%, transparent 70%)',
              filter: 'blur(80px)'
            }}
          />
        </div>
        
        <div className="relative z-10 text-center w-full max-w-sm">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
            <ShoppingCart className="w-10 h-10 text-muted-foreground/50" />
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
    <div className="min-h-screen bg-background relative overflow-hidden pb-8 app-container momentum-scroll">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute top-20 left-0 w-[300px] h-[300px] rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, hsl(var(--neon-cyan)) 0%, transparent 70%)',
            filter: 'blur(80px)'
          }}
        />
        <div 
          className="absolute bottom-40 right-0 w-[250px] h-[250px] rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, hsl(var(--neon-violet)) 0%, transparent 70%)',
            filter: 'blur(80px)'
          }}
        />
      </div>

      <div className="relative z-10 px-5 py-6 space-y-5">
        {/* Header */}
        <header className="flex items-center gap-4">
          <button 
            onClick={() => { navigationTap(); navigate(-1); }}
            className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center active:scale-90 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Checkout</h1>
            <p className="text-sm text-muted-foreground">{items.length} item{items.length > 1 ? 's' : ''}</p>
          </div>
        </header>

        {/* Cart Items */}
        <div className="space-y-3">
          {items.map((item) => (
            <div 
              key={item.product.id} 
              className="p-4 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08]"
            >
              <div className="flex items-start gap-4">
                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {item.product.country_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {item.product.data_amount} • {item.product.validity_days} days
                  </p>
                </div>
                
                {/* Price */}
                <div className="text-right shrink-0">
                  <p className="font-bold text-primary tabular-nums">
                    ${(item.product.price_usd * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
              
              {/* Quantity Controls */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.05]">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { selectionTap(); playPop(); updateQuantity(item.product.id, item.quantity - 1); }}
                    className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.1] flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <Minus className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <span className="w-8 text-center font-medium text-foreground tabular-nums">{item.quantity}</span>
                  <button
                    onClick={() => { selectionTap(); playPop(); updateQuantity(item.product.id, item.quantity + 1); }}
                    className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.1] flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <button
                  onClick={() => { buttonTap(); removeItem(item.product.id); }}
                  className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 active:scale-90 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] space-y-4">
            <h3 className="font-semibold text-foreground">Your Information</h3>
            
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Full Name</label>
              <Input
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-12 rounded-xl bg-white/[0.03] border-white/[0.1] text-foreground placeholder:text-muted-foreground/50 focus:border-primary/40"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Email</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl bg-white/[0.03] border-white/[0.1] text-foreground placeholder:text-muted-foreground/50 focus:border-primary/40"
              />
            </div>

            {!user && (
              <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <p className="text-sm text-orange-400">Login required to checkout</p>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="p-4 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] space-y-3">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="h-px bg-white/[0.05]" />
            <div className="flex justify-between font-semibold text-lg">
              <span className="text-foreground">Total</span>
              <span className="text-primary">${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>Secure payment via Helio</span>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/30 text-base font-semibold active:scale-[0.98] transition-all",
              isSubmitting && "opacity-70"
            )}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </div>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Pay ${total.toFixed(2)}
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={(open) => {
        setShowPaymentModal(open);
        if (!open) {
          toast.info('Check your order in My eSIMs');
        }
      }}>
        <DialogContent className="w-[calc(100%-1rem)] max-w-full h-[90vh] p-0 overflow-hidden flex flex-col rounded-t-3xl border-white/[0.08] bg-background/98 backdrop-blur-2xl">
          <DialogHeader className="p-4 pb-2 flex-shrink-0 border-b border-white/[0.05]">
            <DialogTitle className="text-lg font-semibold">Complete Payment</DialogTitle>
            {/* Checkout Progress Indicator */}
            <div className="flex items-center justify-center gap-3 mt-2">
              {[
                { step: 1, label: 'Processing' },
                { step: 2, label: 'Payment' },
                { step: 3, label: 'Confirmed' }
              ].map(({ step, label }) => (
                <div key={step} className="flex items-center gap-1.5">
                  <div className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all',
                    checkoutStep > step 
                      ? 'bg-green-500 text-white' 
                      : checkoutStep === step 
                        ? 'bg-primary text-primary-foreground animate-pulse' 
                        : 'bg-white/10 text-muted-foreground'
                  )}>
                    {checkoutStep > step ? <Check className="w-3 h-3" /> : step}
                  </div>
                  <span className={cn(
                    'text-xs transition-colors',
                    checkoutStep >= step ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {label}
                  </span>
                  {step < 3 && (
                    <div className={cn(
                      'w-4 h-0.5 rounded-full transition-colors',
                      checkoutStep > step ? 'bg-green-500' : 'bg-white/10'
                    )} />
                  )}
                </div>
              ))}
            </div>
          </DialogHeader>
          {paylinkUrl && (
            <iframe
              src={paylinkUrl}
              className="w-full flex-1 min-h-0 border-0"
              title="Payment"
              allow="payment"
            />
          )}
          <div className={cn(
            "px-4 py-4 border-t border-white/[0.05] flex-shrink-0",
            paymentCompleted ? 'bg-green-500/10' : ''
          )}>
            {paymentCompleted ? (
              <Button 
                onClick={() => {
                  successPattern();
                  playSuccess();
                  setShowPaymentModal(false);
                  navigate('/orders');
                }}
                className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700"
              >
                <Check className="w-5 h-5 mr-2" />
                View My eSIMs
              </Button>
            ) : (
              <Button 
                variant="outline"
                onClick={() => {
                  buttonTap();
                  setShowPaymentModal(false);
                  navigate('/orders');
                }}
                className="w-full h-12 rounded-xl bg-white/[0.03] border-white/[0.1]"
              >
                Already Paid? Check eSIMs
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* First Purchase Celebration Modal */}
      <FirstPurchaseCelebration
        isOpen={showCelebration}
        onClose={() => {
          closeCelebration();
          navigate('/orders');
        }}
        productName={celebrationProductName}
      />
    </div>
  );
};
