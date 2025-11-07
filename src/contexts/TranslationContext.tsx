import { createContext, useContext, useState, ReactNode } from "react";

type Language = "EN" | "ES" | "FR" | "DE" | "RU" | "ZH" | "JA" | "PT" | "AR" | "HI";

interface Translations {
  [key: string]: {
    [lang in Language]: string;
  };
}

const translations: Translations = {
  // Hero
  heroTitle: {
    EN: "Freedom has a new signal.",
    ES: "La libertad tiene una nueva señal.",
    FR: "La liberté a un nouveau signal.",
    DE: "Freiheit hat ein neues Signal.",
    RU: "У свободы новый сигнал.",
    ZH: "自由有了新信号。",
    JA: "自由に新しい信号が。",
    PT: "A liberdade tem um novo sinal.",
    AR: "الحرية لديها إشارة جديدة.",
    HI: "स्वतंत्रता का एक नया संकेत है।"
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
    EN: "Browse eSIMs",
    ES: "Ver eSIMs",
    FR: "Parcourir les eSIM",
    DE: "eSIMs durchsuchen",
    RU: "Просмотреть eSIM",
    ZH: "浏览 eSIM",
    JA: "eSIMを閲覧",
    PT: "Navegar eSIMs",
    AR: "تصفح eSIMs",
    HI: "eSIM ब्राउज़ करें"
  },
  getStarted: {
    EN: "Get Started",
    ES: "Comenzar",
    FR: "Commencer",
    DE: "Loslegen",
    RU: "Начать",
    ZH: "开始使用",
    JA: "始める",
    PT: "Começar",
    AR: "البدء",
    HI: "शुरू करें"
  },
  countries: {
    EN: "200+ Countries",
    ES: "Más de 200 países",
    FR: "Plus de 200 pays",
    DE: "200+ Länder",
    RU: "200+ стран",
    ZH: "200多个国家",
    JA: "200以上の国",
    PT: "Mais de 200 países",
    AR: "أكثر من 200 دولة",
    HI: "200+ देश"
  },
  noKyc: {
    EN: "No KYC Required",
    ES: "Sin KYC requerido",
    FR: "Aucun KYC requis",
    DE: "Kein KYC erforderlich",
    RU: "KYC не требуется",
    ZH: "无需KYC",
    JA: "KYC不要",
    PT: "Sem KYC necessário",
    AR: "لا يتطلب KYC",
    HI: "KYC की आवश्यकता नहीं"
  },
  cryptoPayments: {
    EN: "Crypto Payments",
    ES: "Pagos en criptomonedas",
    FR: "Paiements crypto",
    DE: "Krypto-Zahlungen",
    RU: "Криптовалютные платежи",
    ZH: "加密支付",
    JA: "暗号通貨決済",
    PT: "Pagamentos em cripto",
    AR: "المدفوعات المشفرة",
    HI: "क्रिप्टो भुगतान"
  },
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
