import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { localizedPath } from "@/utils/localizedLinks";

const translations = {
  en: { success: "Payment successful! Your eSIM is being prepared.", title: "Payment Successful!", preparing: "Your eSIM is being prepared...", redirecting: "Redirecting to My eSIMs..." },
  de: { success: "Zahlung erfolgreich! Ihre eSIM wird vorbereitet.", title: "Zahlung Erfolgreich!", preparing: "Ihre eSIM wird vorbereitet...", redirecting: "Weiterleitung zu Meine eSIMs..." },
  fr: { success: "Paiement réussi ! Votre eSIM est en préparation.", title: "Paiement Réussi !", preparing: "Votre eSIM est en préparation...", redirecting: "Redirection vers Mes eSIMs..." },
  es: { success: "¡Pago exitoso! Tu eSIM se está preparando.", title: "¡Pago Exitoso!", preparing: "Tu eSIM se está preparando...", redirecting: "Redirigiendo a Mis eSIMs..." },
  it: { success: "Pagamento riuscito! La tua eSIM è in preparazione.", title: "Pagamento Riuscito!", preparing: "La tua eSIM è in preparazione...", redirecting: "Reindirizzamento a Le Mie eSIM..." },
  pt: { success: "Pagamento bem-sucedido! Seu eSIM está sendo preparado.", title: "Pagamento Bem-sucedido!", preparing: "Seu eSIM está sendo preparado...", redirecting: "Redirecionando para Meus eSIMs..." },
  ja: { success: "支払いが完了しました！eSIMを準備中です。", title: "支払い完了！", preparing: "eSIMを準備中...", redirecting: "マイeSIMにリダイレクト中..." },
  zh: { success: "支付成功！您的eSIM正在准备中。", title: "支付成功！", preparing: "您的eSIM正在准备中...", redirecting: "正在跳转到我的eSIM..." },
  ko: { success: "결제 성공! eSIM을 준비 중입니다.", title: "결제 성공!", preparing: "eSIM을 준비 중입니다...", redirecting: "내 eSIM으로 이동 중..." },
  ar: { success: "تم الدفع بنجاح! جارٍ تجهيز بطاقة eSIM الخاصة بك.", title: "تم الدفع بنجاح!", preparing: "جارٍ تجهيز بطاقة eSIM الخاصة بك...", redirecting: "جارٍ إعادة التوجيه إلى بطاقات eSIM الخاصة بي..." },
};

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clearCart = useCart(state => state.clearCart);
  const { language } = useTranslation();
  const hasRun = useRef(false);
  const t = translations[language as keyof typeof translations] || translations.en;

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    
    // Clear cart immediately
    clearCart();
    
    // Show success message
    toast.success(t.success);
    
    // Redirect to My eSIMs page after a brief delay
    const timer = setTimeout(() => {
      navigate(localizedPath('/orders', language), { replace: true });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-6 animate-fade-in">
        <div className="relative">
          <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl animate-pulse" />
          <CheckCircle className="w-24 h-24 text-green-500 mx-auto relative z-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">{t.title}</h1>
          <p className="text-muted-foreground">{t.preparing}</p>
        </div>
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{t.redirecting}</span>
        </div>
      </div>
    </div>
  );
}
