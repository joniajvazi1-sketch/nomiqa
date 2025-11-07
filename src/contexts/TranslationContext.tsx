import { createContext, useContext, useState, ReactNode } from "react";

type Language = "EN" | "ES" | "FR" | "DE" | "RU" | "ZH" | "JA" | "PT" | "AR" | "HI";

interface Translations {
  [key: string]: {
    [lang in Language]: string;
  };
}

const translations: Translations = {
  // Navigation
  shop: {
    EN: "Shop", ES: "Tienda", FR: "Boutique", DE: "Shop", RU: "Магазин", 
    ZH: "商店", JA: "ショップ", PT: "Loja", AR: "متجر", HI: "दुकान"
  },
  gettingStarted: {
    EN: "Getting Started", ES: "Comenzar", FR: "Commencer", DE: "Erste Schritte", RU: "Начало работы",
    ZH: "开始使用", JA: "はじめに", PT: "Começar", AR: "البدء", HI: "शुरू करना"
  },
  stake: {
    EN: "Stake", ES: "Staking", FR: "Staking", DE: "Staking", RU: "Стейкинг",
    ZH: "质押", JA: "ステーキング", PT: "Staking", AR: "التوقيع", HI: "स्टेकिंग"
  },
  roadmap: {
    EN: "Roadmap", ES: "Hoja de ruta", FR: "Feuille de route", DE: "Roadmap", RU: "Дорожная карта",
    ZH: "路线图", JA: "ロードマップ", PT: "Roteiro", AR: "خارطة الطريق", HI: "रोडमैप"
  },
  affiliate: {
    EN: "Affiliate", ES: "Afiliados", FR: "Affilié", DE: "Partner", RU: "Партнерская программа",
    ZH: "联盟", JA: "アフィリエイト", PT: "Afiliado", AR: "الشركاء", HI: "संबद्ध"
  },
  myOrders: {
    EN: "My Orders", ES: "Mis pedidos", FR: "Mes commandes", DE: "Meine Bestellungen", RU: "Мои заказы",
    ZH: "我的订单", JA: "注文履歴", PT: "Meus pedidos", AR: "طلباتي", HI: "मेरे ऑर्डर"
  },
  signIn: {
    EN: "Sign In", ES: "Iniciar sesión", FR: "Se connecter", DE: "Anmelden", RU: "Войти",
    ZH: "登录", JA: "サインイン", PT: "Entrar", AR: "تسجيل الدخول", HI: "साइन इन करें"
  },
  signOut: {
    EN: "Sign Out", ES: "Cerrar sesión", FR: "Se déconnecter", DE: "Abmelden", RU: "Выйти",
    ZH: "登出", JA: "サインアウト", PT: "Sair", AR: "تسجيل الخروج", HI: "साइन आउट करें"
  },
  signUp: {
    EN: "Sign Up", ES: "Registrarse", FR: "S'inscrire", DE: "Registrieren", RU: "Регистрация",
    ZH: "注册", JA: "登録", PT: "Registrar", AR: "التسجيل", HI: "साइन अप करें"
  },
  
  // Hero Section
  heroTitle: {
    EN: "Freedom has a new signal.", ES: "La libertad tiene una nueva señal.", FR: "La liberté a un nouveau signal.",
    DE: "Freiheit hat ein neues Signal.", RU: "У свободы новый сигнал.", ZH: "自由有了新信号。",
    JA: "自由に新しい信号が。", PT: "A liberdade tem um novo sinal.", AR: "الحرية لديها إشارة جديدة.", HI: "स्वतंत्रता का एक नया संकेत है।"
  },
  heroSubtitle: {
    EN: "The first crypto-native eSIM with anonymous activation, wallet payments, and token rewards.",
    ES: "La primera eSIM nativa de criptomonedas con activación anónima, pagos con billetera y recompensas de tokens.",
    FR: "La première eSIM crypto native avec activation anonyme, paiements par portefeuille et récompenses en tokens.",
    DE: "Die erste Krypto-native eSIM mit anonymer Aktivierung, Wallet-Zahlungen und Token-Belohnungen.",
    RU: "Первая криптовалютная eSIM с анонимной активацией, платежами через кошелек и наградами в токенах.",
    ZH: "首个加密原生 eSIM，支持匿名激活、钱包支付和代币奖励。",
    JA: "匿名アクティベーション、ウォレット決済、トークン報酬を備えた初の暗号ネイティブeSIM。",
    PT: "O primeiro eSIM nativo de criptomoedas com ativação anônima, pagamentos por carteira e recompensas em tokens.",
    AR: "أول eSIM أصلي للعملات المشفرة مع التفعيل المجهول والدفع بالمحفظة ومكافآت الرموز.",
    HI: "गुमनाम सक्रियण, वॉलेट भुगतान और टोकन पुरस्कारों के साथ पहला क्रिप्टो-नेटिव eSIM।"
  },
  browseEsims: {
    EN: "Browse eSIMs", ES: "Ver eSIMs", FR: "Parcourir les eSIM", DE: "eSIMs durchsuchen", RU: "Просмотреть eSIM",
    ZH: "浏览 eSIM", JA: "eSIMを閲覧", PT: "Navegar eSIMs", AR: "تصفح eSIMs", HI: "eSIM ब्राउज़ करें"
  },
  getStarted: {
    EN: "Get Started", ES: "Comenzar", FR: "Commencer", DE: "Loslegen", RU: "Начать",
    ZH: "开始使用", JA: "始める", PT: "Começar", AR: "البدء", HI: "शुरू करें"
  },
  countries: {
    EN: "200+ Countries", ES: "Más de 200 países", FR: "Plus de 200 pays", DE: "200+ Länder", RU: "200+ стран",
    ZH: "200多个国家", JA: "200以上の国", PT: "Mais de 200 países", AR: "أكثر من 200 دولة", HI: "200+ देश"
  },
  noKyc: {
    EN: "No KYC Required", ES: "Sin KYC requerido", FR: "Aucun KYC requis", DE: "Kein KYC erforderlich", RU: "KYC не требуется",
    ZH: "无需KYC", JA: "KYC不要", PT: "Sem KYC necessário", AR: "لا يتطلب KYC", HI: "KYC की आवश्यकता नहीं"
  },
  cryptoPayments: {
    EN: "Crypto Payments", ES: "Pagos en criptomonedas", FR: "Paiements crypto", DE: "Krypto-Zahlungen", RU: "Криптовалютные платежи",
    ZH: "加密支付", JA: "暗号通貨決済", PT: "Pagamentos em cripto", AR: "المدفوعات المشفرة", HI: "क्रिप्टो भुगतान"
  },

  // WhyNomiqa Section
  whyNomiqaTitle: {
    EN: "Privacy, Simplicity, and Crypto Freedom for Web3 Travelers",
    ES: "Privacidad, simplicidad y libertad cripto para viajeros Web3",
    FR: "Confidentialité, simplicité et liberté crypto pour les voyageurs Web3",
    DE: "Datenschutz, Einfachheit und Krypto-Freiheit für Web3-Reisende",
    RU: "Конфиденциальность, простота и криптосвобода для Web3-путешественников",
    ZH: "为Web3旅行者提供隐私、简单和加密自由",
    JA: "Web3トラベラーのためのプライバシー、シンプルさ、暗号の自由",
    PT: "Privacidade, simplicidade e liberdade cripto para viajantes Web3",
    AR: "الخصوصية والبساطة وحرية التشفير لمسافري الويب3",
    HI: "Web3 यात्रियों के लिए गोपनीयता, सरलता और क्रिप्टो स्वतंत्रता"
  },
  whyNomiqaDesc1: {
    EN: "At Nomiqa, we're redefining connectivity for the new era of Web3 travelers. Guided by our three core pillars Privacy, Simplicity, and Crypto Freedom we ensure that every connection you make is secure, effortless, and truly yours.",
    ES: "En Nomiqa, redefinimos la conectividad para la nueva era de viajeros Web3. Guiados por nuestros tres pilares fundamentales: privacidad, simplicidad y libertad cripto, aseguramos que cada conexión sea segura, sin esfuerzo y verdaderamente tuya.",
    FR: "Chez Nomiqa, nous redéfinissons la connectivité pour la nouvelle ère des voyageurs Web3. Guidés par nos trois piliers fondamentaux : confidentialité, simplicité et liberté crypto, nous veillons à ce que chaque connexion soit sécurisée, sans effort et vraiment vôtre.",
    DE: "Bei Nomiqa definieren wir Konnektivität für die neue Ära der Web3-Reisenden neu. Geleitet von unseren drei Kernpfeilern - Datenschutz, Einfachheit und Krypto-Freiheit - stellen wir sicher, dass jede Verbindung sicher, mühelos und wirklich Ihre ist.",
    RU: "В Nomiqa мы переосмысливаем связь для новой эры путешественников Web3. Руководствуясь тремя основными принципами - конфиденциальность, простота и криптосвобода - мы гарантируем, что каждое подключение будет безопасным, легким и по-настоящему вашим.",
    ZH: "在Nomiqa，我们正在为Web3旅行者的新时代重新定义连接。在隐私、简单和加密自由三大核心支柱的指导下，我们确保您建立的每个连接都是安全、轻松且真正属于您的。",
    JA: "Nomiqaでは、Web3トラベラーの新時代のための接続性を再定義しています。プライバシー、シンプルさ、暗号の自由という3つの中核的な柱に導かれ、すべての接続が安全で、簡単で、真にあなたのものであることを保証します。",
    PT: "Na Nomiqa, estamos redefinindo a conectividade para a nova era dos viajantes Web3. Guiados por nossos três pilares fundamentais - privacidade, simplicidade e liberdade cripto - garantimos que cada conexão seja segura, sem esforço e verdadeiramente sua.",
    AR: "في Nomiqa، نعيد تعريف الاتصال لعصر جديد من مسافري الويب3. بتوجيه من أعمدتنا الثلاثة الأساسية - الخصوصية والبساطة وحرية التشفير - نضمن أن كل اتصال تقوم به آمن وسهل وخاص بك حقًا.",
    HI: "Nomiqa में, हम Web3 यात्रियों के नए युग के लिए कनेक्टिविटी को फिर से परिभाषित कर रहे हैं। हमारे तीन मुख्य स्तंभों - गोपनीयता, सरलता और क्रिप्टो स्वतंत्रता द्वारा निर्देशित, हम सुनिश्चित करते हैं कि आपका प्रत्येक कनेक्शन सुरक्षित, आसान और वास्तव में आपका है।"
  },

  // Easy Checkout Section  
  easyCheckoutTitle: {
    EN: "Pay with Solana & Nomiqa token",
    ES: "Paga con Solana y token Nomiqa",
    FR: "Payez avec Solana et le token Nomiqa",
    DE: "Bezahlen Sie mit Solana & Nomiqa Token",
    RU: "Оплата Solana и токеном Nomiqa",
    ZH: "使用Solana和Nomiqa代币支付",
    JA: "SolanaとNomiqaトークンで支払う",
    PT: "Pague com Solana e token Nomiqa",
    AR: "الدفع بواسطة Solana ورمز Nomiqa",
    HI: "Solana और Nomiqa टोकन से भुगतान करें"
  },
  easyCheckoutDesc: {
    EN: "Buy eSIMs with Solana in 3 simple steps: 1. Copy the provided Solana address. 2. Pay securely with your Phantom Wallet. 3. Receive your eSIM instantly after confirmation.",
    ES: "Compra eSIMs con Solana en 3 simples pasos: 1. Copia la dirección Solana proporcionada. 2. Paga de forma segura con tu Phantom Wallet. 3. Recibe tu eSIM instantáneamente después de la confirmación.",
    FR: "Achetez des eSIM avec Solana en 3 étapes simples : 1. Copiez l'adresse Solana fournie. 2. Payez en toute sécurité avec votre Phantom Wallet. 3. Recevez votre eSIM instantanément après confirmation.",
    DE: "Kaufen Sie eSIMs mit Solana in 3 einfachen Schritten: 1. Kopieren Sie die bereitgestellte Solana-Adresse. 2. Zahlen Sie sicher mit Ihrer Phantom Wallet. 3. Erhalten Sie Ihre eSIM sofort nach Bestätigung.",
    RU: "Покупайте eSIM за Solana в 3 простых шага: 1. Скопируйте предоставленный адрес Solana. 2. Оплатите безопасно через Phantom Wallet. 3. Получите свою eSIM мгновенно после подтверждения.",
    ZH: "通过Solana购买eSIM，只需3个简单步骤：1. 复制提供的Solana地址。2. 使用Phantom钱包安全支付。3. 确认后立即收到您的eSIM。",
    JA: "Solanaで3つの簡単なステップでeSIMを購入：1. 提供されたSolanaアドレスをコピー。2. Phantom Walletで安全に支払い。3. 確認後すぐにeSIMを受け取る。",
    PT: "Compre eSIMs com Solana em 3 passos simples: 1. Copie o endereço Solana fornecido. 2. Pague com segurança com sua Phantom Wallet. 3. Receba seu eSIM instantaneamente após confirmação.",
    AR: "اشترِ eSIMs باستخدام Solana في 3 خطوات بسيطة: 1. انسخ عنوان Solana المقدم. 2. ادفع بأمان باستخدام محفظة Phantom الخاصة بك. 3. استلم eSIM الخاص بك على الفور بعد التأكيد.",
    HI: "3 सरल चरणों में Solana से eSIM खरीदें: 1. प्रदान किए गए Solana पते की प्रतिलिपि बनाएं। 2. अपने Phantom Wallet से सुरक्षित रूप से भुगतान करें। 3. पुष्टि के बाद तुरंत अपना eSIM प्राप्त करें।"
  },

  // Earn Section
  earnTitle: {
    EN: "Earn with Staking & Affiliates",
    ES: "Gana con Staking y Afiliados",
    FR: "Gagnez avec le staking et les affiliés",
    DE: "Verdienen Sie mit Staking & Affiliates",
    RU: "Зарабатывайте со стейкингом и партнерством",
    ZH: "通过质押和推荐赚取",
    JA: "ステーキングとアフィリエイトで稼ぐ",
    PT: "Ganhe com Staking e Afiliados",
    AR: "اكسب مع التوقيع والشركاء",
    HI: "स्टेकिंग और संबद्धों के साथ कमाएं"
  },
  earnDesc: {
    EN: "Unlock rewards by staking your Nomiqa tokens or sharing our platform through our affiliate program. Start earning today with secure, fast crypto transactions.",
    ES: "Desbloquea recompensas haciendo staking de tus tokens Nomiqa o compartiendo nuestra plataforma a través de nuestro programa de afiliados. Comienza a ganar hoy con transacciones cripto seguras y rápidas.",
    FR: "Débloquez des récompenses en stakant vos tokens Nomiqa ou en partageant notre plateforme via notre programme d'affiliation. Commencez à gagner dès aujourd'hui avec des transactions crypto sécurisées et rapides.",
    DE: "Schalten Sie Belohnungen frei, indem Sie Ihre Nomiqa-Token staken oder unsere Plattform über unser Partnerprogramm teilen. Beginnen Sie noch heute mit sicheren, schnellen Krypto-Transaktionen zu verdienen.",
    RU: "Получайте вознаграждения, делая стейкинг токенов Nomiqa или делясь нашей платформой через партнерскую программу. Начните зарабатывать сегодня с безопасными и быстрыми криптотранзакциями.",
    ZH: "通过质押您的Nomiqa代币或通过我们的联盟计划分享我们的平台来解锁奖励。今天就开始通过安全、快速的加密交易赚钱。",
    JA: "Nomiqaトークンをステーキングするか、アフィリエイトプログラムを通じてプラットフォームを共有することで報酬を獲得できます。安全で高速な暗号取引で今日から稼ぎ始めましょう。",
    PT: "Desbloqueie recompensas fazendo staking de seus tokens Nomiqa ou compartilhando nossa plataforma através do nosso programa de afiliados. Comece a ganhar hoje com transações cripto seguras e rápidas.",
    AR: "افتح المكافآت من خلال توقيع رموز Nomiqa الخاصة بك أو مشاركة منصتنا من خلال برنامج الشركاء الخاص بنا. ابدأ في الكسب اليوم مع معاملات التشفير الآمنة والسريعة.",
    HI: "अपने Nomiqa टोकन को स्टेक करके या हमारे सहबद्ध कार्यक्रम के माध्यम से हमारे प्लेटफॉर्म को साझा करके पुरस्कार अनलॉक करें। सुरक्षित, तेज़ क्रिप्टो लेनदेन के साथ आज ही कमाई शुरू करें।"
  },

  // FAQ Section
  faqTitle: {
    EN: "Frequently Asked Questions",
    ES: "Preguntas frecuentes",
    FR: "Questions fréquemment posées",
    DE: "Häufig gestellte Fragen",
    RU: "Часто задаваемые вопросы",
    ZH: "常见问题",
    JA: "よくある質問",
    PT: "Perguntas frequentes",
    AR: "الأسئلة الشائعة",
    HI: "अक्सर पूछे जाने वाले प्रश्न"
  },
  faqSubtitle: {
    EN: "Everything you need to know about Nomiqa eSIMs",
    ES: "Todo lo que necesitas saber sobre eSIMs de Nomiqa",
    FR: "Tout ce que vous devez savoir sur les eSIM Nomiqa",
    DE: "Alles, was Sie über Nomiqa eSIMs wissen müssen",
    RU: "Все, что вам нужно знать о eSIM Nomiqa",
    ZH: "关于Nomiqa eSIM您需要了解的一切",
    JA: "Nomiqa eSIMについて知っておくべきすべて",
    PT: "Tudo o que você precisa saber sobre eSIMs Nomiqa",
    AR: "كل ما تحتاج لمعرفته حول eSIMs Nomiqa",
    HI: "Nomiqa eSIMs के बारे में आपको जो कुछ जानने की आवश्यकता है"
  },

  // Footer
  footerTagline: {
    EN: "Freedom has a new signal. Privacy-first eSIMs on blockchain.",
    ES: "La libertad tiene una nueva señal. eSIMs con privacidad primero en blockchain.",
    FR: "La liberté a un nouveau signal. eSIMs axées sur la confidentialité sur la blockchain.",
    DE: "Freiheit hat ein neues Signal. Datenschutzorientierte eSIMs auf Blockchain.",
    RU: "У свободы новый сигнал. eSIM с приоритетом конфиденциальности на блокчейне.",
    ZH: "自由有了新信号。基于区块链的隐私优先eSIM。",
    JA: "自由に新しい信号が。ブロックチェーン上のプライバシー優先eSIM。",
    PT: "A liberdade tem um novo sinal. eSIMs com prioridade de privacidade em blockchain.",
    AR: "الحرية لديها إشارة جديدة. eSIMs تعتمد على الخصوصية أولاً على البلوكشين.",
    HI: "स्वतंत्रता का एक नया संकेत है। ब्लॉकचेन पर गोपनीयता-प्रथम eSIM।"
  },
  products: {
    EN: "Products", ES: "Productos", FR: "Produits", DE: "Produkte", RU: "Продукты",
    ZH: "产品", JA: "製品", PT: "Produtos", AR: "المنتجات", HI: "उत्पाद"
  },
  company: {
    EN: "Company", ES: "Empresa", FR: "Entreprise", DE: "Unternehmen", RU: "Компания",
    ZH: "公司", JA: "会社", PT: "Empresa", AR: "الشركة", HI: "कंपनी"
  },
  support: {
    EN: "Support", ES: "Soporte", FR: "Support", DE: "Support", RU: "Поддержка",
    ZH: "支持", JA: "サポート", PT: "Suporte", AR: "الدعم", HI: "समर्थन"
  }
};

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>("EN");

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within TranslationProvider");
  }
  return context;
};
