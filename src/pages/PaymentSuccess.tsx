import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCartWithTotal } from "@/hooks/useCart";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { localizedPath } from "@/utils/localizedLinks";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCartWithTotal();
  const { language } = useTranslation();
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    // Clear cart immediately
    clearCart();
    
    // Show success message
    toast.success('Payment successful! Your eSIM is being prepared.');
    
    // Redirect to My eSIMs page after a brief delay
    const timer = setTimeout(() => {
      navigate(localizedPath('/orders', language));
    }, 2000);

    return () => clearTimeout(timer);
  }, [clearCart, navigate, language]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-6 animate-fade-in">
        <div className="relative">
          <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl animate-pulse" />
          <CheckCircle className="w-24 h-24 text-green-500 mx-auto relative z-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Payment Successful!</h1>
          <p className="text-muted-foreground">Your eSIM is being prepared...</p>
        </div>
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Redirecting to My eSIMs...</span>
        </div>
      </div>
    </div>
  );
}
