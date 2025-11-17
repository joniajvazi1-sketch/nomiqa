import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

export type Language = "EN" | "ES" | "FR" | "DE" | "RU" | "ZH" | "JA" | "PT" | "AR" | "HI";

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

// Minimal base translations. Any missing key will fall back to EN or the key itself.
const translations: Record<string, Partial<Record<Language, string>>> = {
  // Navigation
  shop: { EN: "Shop", ES: "Tienda", FR: "Boutique", DE: "Shop", RU: "Магазин", ZH: "商店", JA: "ショップ", PT: "Loja", AR: "المتجر", HI: "दुकान" },
  gettingStarted: { EN: "Getting Started", ES: "Cómo empezar", FR: "Commencer", DE: "Erste Schritte", RU: "Начало работы", ZH: "入门指南", JA: "はじめに", PT: "Primeiros passos", AR: "البدء", HI: "शुरू करें" },
  howToBuy: { EN: "How to Buy (SOL & $NOMIQA token)", ES: "Cómo comprar (SOL y token $NOMIQA)", FR: "Comment acheter (SOL et jeton $NOMIQA)", DE: "So kaufst du (SOL & $NOMIQA-Token)", RU: "Как купить (SOL и токен $NOMIQA)", ZH: "如何购买（SOL 和 $NOMIQA 代币）", JA: "購入方法（SOL と $NOMIQA トークン）", PT: "Como comprar (SOL e token $NOMIQA)", AR: "طريقة الشراء (SOL و رمز $NOMIQA)", HI: "कैसे खरीदें (SOL और $NOMIQA टोकन)" },
  stake: { EN: "Stake", ES: "Staking", FR: "Staking", DE: "Staking", RU: "Стейкинг", ZH: "质押", JA: "ステーキング", PT: "Staking", AR: "الستيكينغ", HI: "स्टेकिंग" },
  roadmap: { EN: "Roadmap", ES: "Hoja de ruta", FR: "Feuille de route", DE: "Roadmap", RU: "Дорожная карта", ZH: "路线图", JA: "ロードマップ", PT: "Roteiro", AR: "خارطة الطريق", HI: "रोडमैप" },
  affiliate: { EN: "Affiliate", ES: "Afiliados", FR: "Affiliation", DE: "Partnerprogramm", RU: "Партнёрка", ZH: "联盟计划", JA: "アフィリエイト", PT: "Afiliados", AR: "برنامج الإحالة", HI: "सहयोगी" },
  aboutUs: { EN: "About Us", ES: "Sobre nosotros", FR: "À propos", DE: "Über uns", RU: "О нас", ZH: "关于我们", JA: "私たちについて", PT: "Sobre nós", AR: "من نحن", HI: "हमारे बारे में" },
  howWeProtect: { EN: "How We Protect You", ES: "Cómo te protegemos", FR: "Comment nous vous protégeons", DE: "So schützen wir dich", RU: "Как мы защищаем вас", ZH: "我们如何保护你", JA: "私たちの保護方法", PT: "Como protegemos você", AR: "كيف نحميك", HI: "हम आपकी सुरक्षा कैसे करते हैं" },
  myEsims: { EN: "My eSIMs", ES: "Mis eSIM", FR: "Mes eSIM", DE: "Meine eSIMs", RU: "Мои eSIM", ZH: "我的 eSIM", JA: "マイ eSIM", PT: "Minhas eSIMs", AR: "شرائح eSIM الخاصة بي", HI: "मेरी eSIMs" },
  myOrders: { EN: "My Orders", ES: "Mis pedidos", FR: "Mes commandes", DE: "Meine Bestellungen", RU: "Мои заказы", ZH: "我的订单", JA: "注文履歴", PT: "Meus pedidos", AR: "طلباتي", HI: "मेरे ऑर्डर" },
  signIn: { EN: "Sign In", ES: "Iniciar sesión", FR: "Se connecter", DE: "Anmelden", RU: "Войти", ZH: "登录", JA: "ログイン", PT: "Entrar", AR: "تسجيل الدخول", HI: "साइन इन" },
  signOut: { EN: "Sign Out", ES: "Cerrar sesión", FR: "Se déconnecter", DE: "Abmelden", RU: "Выйти", ZH: "退出登录", JA: "ログアウト", PT: "Sair", AR: "تسجيل الخروج", HI: "साइन आउट" },
  signUp: { EN: "Sign Up", ES: "Crear cuenta", FR: "Créer un compte", DE: "Konto erstellen", RU: "Создать аккаунт", ZH: "创建账号", JA: "アカウント作成", PT: "Criar conta", AR: "إنشاء حساب", HI: "खाता बनाएं" },
  menu: { EN: "Menu", ES: "Menú", FR: "Menu", DE: "Menü", RU: "Меню", ZH: "菜单", JA: "メニュー", PT: "Menu", AR: "القائمة", HI: "मेनू" },

  // Hero
  heroPrivate: { EN: "Private.", ES: "Privado.", FR: "Privé.", DE: "Privat.", RU: "Приватно.", ZH: "私密。", JA: "プライベート。", PT: "Privado.", AR: "خاص.", HI: "निजी।" },
  heroBorderless: { EN: "Borderless.", ES: "Sin fronteras.", FR: "Sans frontières.", DE: "Grenzenlos.", RU: "Без границ.", ZH: "无边界。", JA: "ボーダーレス。", PT: "Sem fronteiras.", AR: "بلا حدود.", HI: "बॉर्डरलेस।" },
  heroHuman: { EN: "Human.", ES: "Humano.", FR: "Humain.", DE: "Menschlich.", RU: "Человечно.", ZH: "人性。", JA: "ヒューマン。", PT: "Humano.", AR: "إنساني.", HI: "ह्यूमन।" },
  heroDescription1: { EN: "Connect anywhere in 60 seconds — no ID, no tracking, no limits.", ES: "Conéctate en cualquier lugar en 60 segundos — sin ID, sin rastreo, sin límites.", FR: "Connectez-vous partout en 60 secondes — sans ID, sans suivi, sans limites.", DE: "Verbinde dich überall in 60 Sekunden – keine ID, kein Tracking, keine Grenzen.", RU: "Подключайтесь где угодно за 60 секунд — без ID, без слежки, без ограничений.", ZH: "60 秒内随时随地连接——无需身份证、无跟踪、无限制。", JA: "どこでも60秒で接続 — ID不要、追跡なし、制限なし。", PT: "Conecte-se em qualquer lugar em 60 segundos — sem ID, sem rastreamento, sem limites.", AR: "اتصل من أي مكان خلال 60 ثانية — بدون هوية، بدون تتبع، بدون حدود.", HI: "60 सेकंड में कहीं भी कनेक्ट करें — बिना ID, बिना ट्रैकिंग, बिना सीमाओं के." },
  heroDescription2: { EN: "Join the world's first crypto-powered eSIM for freedom on your terms.", ES: "Únete a la primera eSIM impulsada por cripto para una libertad a tu manera.", FR: "Rejoignez la première eSIM alimentée par la crypto pour une liberté à votre façon.", DE: "Schließe dich der ersten krypto-basierten eSIM der Welt an – Freiheit zu deinen Bedingungen.", RU: "Присоединяйтесь к первой в мире eSIM на крипто — свобода на ваших условиях.", ZH: "加入全球首个加密驱动的 eSIM，以你的方式获得自由。", JA: "世界初の暗号通貨駆動のeSIMに参加し、あなたの条件で自由に。", PT: "Junte-se à primeira eSIM movida a cripto do mundo para liberdade nos seus termos.", AR: "انضم إلى أول eSIM مدعومة بالعملة المشفرة في العالم — حرية بشروطك.", HI: "दुनिया की पहली क्रिप्टो-पावर्ड eSIM से जुड़ें — स्वतंत्रता आपके तरीके से." },
  heroBuyNow: { EN: "Buy Now", ES: "Comprar ahora", FR: "Acheter", DE: "Jetzt kaufen", RU: "Купить", ZH: "立即购买", JA: "今すぐ購入", PT: "Comprar agora", AR: "اشتري الآن", HI: "अभी खरीदें" },
  heroWatchHow: { EN: "Watch How It Works", ES: "Cómo funciona", FR: "Voir comment ça marche", DE: "So funktioniert's", RU: "Как это работает", ZH: "观看操作", JA: "使い方を見る", PT: "Veja como funciona", AR: "شاهد كيف تعمل", HI: "कैसे काम करता है देखें" },

  // FAQ headings (content handled in FAQ component keys)
  faqTitle: { EN: "Questions? We've got you.", ES: "¿Preguntas? Te ayudamos.", FR: "Des questions ? On est là.", DE: "Fragen? Wir sind da.", RU: "Вопросы? Мы поможем.", ZH: "有问题？我们来帮你。", JA: "質問はありますか？お任せください。", PT: "Dúvidas? Estamos com você.", AR: "أسئلة؟ نحن هنا لأجلك.", HI: "सवाल? हम आपके साथ हैं।" },
  faqSubtitle: { EN: "eSIM setup, troubleshooting, and payments.", ES: "Configuración de eSIM, solución de problemas y pagos.", FR: "Configuration eSIM, dépannage et paiements.", DE: "eSIM-Einrichtung, Fehlerbehebung und Zahlungen.", RU: "Настройка eSIM, устранение неполадок и платежи.", ZH: "eSIM 设置、故障排除和支付。", JA: "eSIM の設定、トラブルシューティング、支払い。", PT: "Configuração de eSIM, solução de problemas e pagamentos.", AR: "إعداد eSIM، استكشاف الأخطاء وإصلاحها، والمدفوعات.", HI: "eSIM सेटअप, ट्रबलशूटिंग और पेमेंट।" },

  // FAQ Q&A keys (placeholders to ensure stable rendering)
  faq1Q: { EN: "How do I install my eSIM?" },
  faq1A: { EN: "After purchase, you'll receive a QR code and instructions. Scan it in your phone's eSIM settings and follow the prompts." },
  faq2Q: { EN: "Does eSIM work on my phone?" },
  faq2A: { EN: "Most recent iPhone and Android models support eSIM. Check your device settings: Mobile/Cellular > Add eSIM." },
  faq3Q: { EN: "How fast is activation?" },
  faq3A: { EN: "Usually under 60 seconds after scanning the QR code and enabling data for the new eSIM profile." },
  faq4Q: { EN: "What if data isn't working?" },
  faq4A: { EN: "Toggle Airplane Mode, ensure the eSIM is set as the active data line, and enable Data Roaming for that profile." },
  faq5Q: { EN: "Can I keep my physical SIM for calls?" },
  faq5A: { EN: "Yes. Keep your primary SIM for calls/SMS and set the eSIM for data only. You can switch anytime in settings." },
  faq6Q: { EN: "How do I top up or buy again?" },
  faq6A: { EN: "Return to the shop, pick a plan, and you'll get a fresh QR if needed. Some eSIMs support direct top-ups." },
  faq7Q: { EN: "Which crypto can I pay with?" },
  faq7A: { EN: "Pay with SOL or USDC on Solana. $NOMIQA support is coming soon." },
  faq8Q: { EN: "Do you require ID or KYC?" },
  faq8A: { EN: "No. We don't require ID or KYC. Your privacy matters." },
  faq9Q: { EN: "Can I use it in 190+ countries?" },
  faq9A: { EN: "Yes. We support 190+ countries. Coverage varies by plan." },
  faq10Q: { EN: "Where can I see my orders?" },
  faq10A: { EN: "Go to My Orders from the menu after signing in. You'll see QR codes, activation info, and status." },
};

function isRTL(lang: Language) {
  return lang === "AR"; // Arabic
}

function detectBrowserLanguage(): Language {
  if (typeof navigator === 'undefined') return "EN";
  
  const browserLang = navigator.language || (navigator as any).userLanguage;
  const langCode = browserLang.split('-')[0].toUpperCase();
  
  const langMap: Record<string, Language> = {
    'EN': 'EN', 'ES': 'ES', 'FR': 'FR', 'DE': 'DE', 
    'RU': 'RU', 'ZH': 'ZH', 'JA': 'JA', 'PT': 'PT', 
    'AR': 'AR', 'HI': 'HI'
  };
  
  return langMap[langCode] || "EN";
}

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return "EN";
  
  // 1. Check URL query param
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('lang')?.toUpperCase() as Language | null;
  if (urlLang && ['EN', 'ES', 'FR', 'DE', 'RU', 'ZH', 'JA', 'PT', 'AR', 'HI'].includes(urlLang)) {
    return urlLang;
  }
  
  // 2. Check localStorage
  const savedLang = localStorage.getItem("lang") as Language | null;
  if (savedLang && ['EN', 'ES', 'FR', 'DE', 'RU', 'ZH', 'JA', 'PT', 'AR', 'HI'].includes(savedLang)) {
    return savedLang;
  }
  
  // 3. Detect from browser
  return detectBrowserLanguage();
}

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [language, setLang] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    // Update localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem("lang", language);
      
      // Update URL query param
      const url = new URL(window.location.href);
      url.searchParams.set('lang', language.toLowerCase());
      window.history.replaceState({}, '', url.toString());
    }
    
    // Update document attributes
    const dir = isRTL(language) ? "rtl" : "ltr";
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.setAttribute("dir", dir);
      document.documentElement.setAttribute("lang", language.toLowerCase());
    }
  }, [language]);

  const t = useMemo(() => {
    return (key: string) => {
      const entry = translations[key];
      if (!entry) return key;
      return entry[language] ?? entry["EN"] ?? key;
    };
  }, [language]);

  const value = useMemo<TranslationContextType>(() => ({
    language,
    setLanguage: (l: Language) => setLang(l),
    t,
  }), [language, t]);

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(TranslationContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within TranslationProvider");
  }
  return ctx;
}
