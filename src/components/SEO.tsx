import { Helmet } from "react-helmet-async";
import { useTranslation, Language } from "@/contexts/TranslationContext";

interface SEOProps {
  page?: "home" | "shop" | "about" | "privacy" | "affiliate" | "gettingStarted" | "terms";
}

const seoData: Record<string, Record<Language, { title: string; description: string }>> = {
  home: {
    EN: {
      title: "Nomiqa - Private eSIM with Crypto Payments | 200+ Countries",
      description: "Connect privately anywhere with Nomiqa eSIM. Pay with SOL, USDC, or $NOMIQA token. No ID, no tracking, no limits. Instant activation in 200+ countries."
    },
    DE: {
      title: "Nomiqa - Private eSIM mit Krypto-Zahlungen | 200+ Länder",
      description: "Verbinde dich privat überall mit Nomiqa eSIM. Bezahle mit SOL, USDC oder $NOMIQA Token. Keine ID, kein Tracking, keine Limits. Sofortige Aktivierung in über 200 Ländern."
    },
    FR: {
      title: "Nomiqa - eSIM Privée avec Paiements Crypto | 200+ Pays",
      description: "Connectez-vous en privé partout avec Nomiqa eSIM. Payez avec SOL, USDC ou jeton $NOMIQA. Pas d'ID, pas de suivi, pas de limites. Activation instantanée dans plus de 200 pays."
    },
    ES: {
      title: "Nomiqa - eSIM Privado con Pagos Crypto | 200+ Países",
      description: "Conéctate de forma privada en cualquier lugar con Nomiqa eSIM. Paga con SOL, USDC o token $NOMIQA. Sin ID, sin seguimiento, sin límites. Activación instantánea en más de 200 países."
    },
    IT: {
      title: "Nomiqa - eSIM Privata con Pagamenti Crypto | 200+ Paesi",
      description: "Connettiti privatamente ovunque con Nomiqa eSIM. Paga con SOL, USDC o token $NOMIQA. Nessun ID, nessun tracciamento, nessun limite. Attivazione istantanea in oltre 200 paesi."
    },
    PT: {
      title: "Nomiqa - eSIM Privado com Pagamentos Crypto | 200+ Países",
      description: "Conecte-se privativamente em qualquer lugar com Nomiqa eSIM. Pague com SOL, USDC ou token $NOMIQA. Sem ID, sem rastreamento, sem limites. Ativação instantânea em mais de 200 países."
    },
    JA: {
      title: "Nomiqa - 暗号通貨決済対応プライベートeSIM | 200か国以上",
      description: "Nomiqa eSIMでどこでもプライベートに接続。SOL、USDC、または$NOMIQAトークンで支払い。ID不要、追跡なし、制限なし。200か国以上で即座に有効化。"
    },
    ZH: {
      title: "Nomiqa - 支持加密货币支付的私密eSIM | 200多个国家",
      description: "使用Nomiqa eSIM在任何地方私密连接。使用SOL、USDC或$NOMIQA代币支付。无需身份证明，无追踪，无限制。在200多个国家即时激活。"
    },
    RU: {
      title: "Nomiqa - Приватная eSIM с Крипто-Платежами | 200+ Стран",
      description: "Подключайтесь конфиденциально где угодно с Nomiqa eSIM. Платите SOL, USDC или токеном $NOMIQA. Без ID, без отслеживания, без ограничений. Мгновенная активация в более чем 200 странах."
    },
    AR: {
      title: "Nomiqa - eSIM خاص بمدفوعات العملات المشفرة | 200+ دولة",
      description: "اتصل بشكل خاص في أي مكان مع Nomiqa eSIM. ادفع باستخدام SOL أو USDC أو رمز $NOMIQA. بدون هوية، بدون تتبع، بدون حدود. تفعيل فوري في أكثر من 200 دولة."
    }
  },
  shop: {
    EN: {
      title: "Shop eSIM Plans - Crypto Payments | Nomiqa",
      description: "Browse 200+ country eSIM plans. Pay with SOL, USDC or $NOMIQA token. Instant delivery, no KYC required. Private global connectivity starts here."
    },
    DE: {
      title: "eSIM-Tarife kaufen - Krypto-Zahlungen | Nomiqa",
      description: "Durchsuche über 200 Länder-eSIM-Tarife. Bezahle mit SOL, USDC oder $NOMIQA Token. Sofortige Lieferung, keine KYC erforderlich. Private globale Konnektivität beginnt hier."
    },
    FR: {
      title: "Boutique Forfaits eSIM - Paiements Crypto | Nomiqa",
      description: "Parcourez plus de 200 forfaits eSIM par pays. Payez avec SOL, USDC ou jeton $NOMIQA. Livraison instantanée, aucun KYC requis. La connectivité mondiale privée commence ici."
    },
    ES: {
      title: "Comprar Planes eSIM - Pagos Crypto | Nomiqa",
      description: "Explora planes eSIM para más de 200 países. Paga con SOL, USDC o token $NOMIQA. Entrega instantánea, sin KYC requerido. La conectividad global privada comienza aquí."
    },
    IT: {
      title: "Acquista Piani eSIM - Pagamenti Crypto | Nomiqa",
      description: "Sfoglia piani eSIM per oltre 200 paesi. Paga con SOL, USDC o token $NOMIQA. Consegna istantanea, nessun KYC richiesto. La connettività globale privata inizia qui."
    },
    PT: {
      title: "Comprar Planos eSIM - Pagamentos Crypto | Nomiqa",
      description: "Navegue por planos eSIM de mais de 200 países. Pague com SOL, USDC ou token $NOMIQA. Entrega instantânea, sem KYC necessário. A conectividade global privada começa aqui."
    },
    JA: {
      title: "eSIMプランを購入 - 暗号通貨決済 | Nomiqa",
      description: "200か国以上のeSIMプランを閲覧。SOL、USDC、または$NOMIQAトークンで支払い。即時配信、KYC不要。プライベートなグローバル接続はここから始まります。"
    },
    ZH: {
      title: "购买eSIM套餐 - 加密货币支付 | Nomiqa",
      description: "浏览200多个国家的eSIM套餐。使用SOL、USDC或$NOMIQA代币支付。即时交付，无需KYC。私密的全球连接从这里开始。"
    },
    RU: {
      title: "Магазин Тарифов eSIM - Крипто-Платежи | Nomiqa",
      description: "Просматривайте тарифы eSIM для более чем 200 стран. Платите SOL, USDC или токеном $NOMIQA. Мгновенная доставка, KYC не требуется. Приватная глобальная связь начинается здесь."
    },
    AR: {
      title: "تسوق خطط eSIM - مدفوعات العملات المشفرة | Nomiqa",
      description: "تصفح خطط eSIM لأكثر من 200 دولة. ادفع باستخدام SOL أو USDC أو رمز $NOMIQA. تسليم فوري، لا يلزم KYC. الاتصال العالمي الخاص يبدأ من هنا."
    }
  },
  about: {
    EN: {
      title: "About Nomiqa - Privacy-First eSIM Platform",
      description: "Learn how Nomiqa became the world's first privacy-first eSIM platform. Built for digital nomads, crypto natives, and privacy advocates."
    },
    DE: {
      title: "Über Nomiqa - Datenschutz-First eSIM-Plattform",
      description: "Erfahre, wie Nomiqa zur weltweit ersten datenschutzorientierten eSIM-Plattform wurde. Gebaut für digitale Nomaden, Krypto-Natives und Datenschutz-Befürworter."
    },
    FR: {
      title: "À propos de Nomiqa - Plateforme eSIM axée sur la confidentialité",
      description: "Découvrez comment Nomiqa est devenue la première plateforme eSIM axée sur la confidentialité au monde. Conçue pour les nomades numériques, les natifs de la crypto et les défenseurs de la vie privée."
    },
    ES: {
      title: "Acerca de Nomiqa - Plataforma eSIM centrada en la privacidad",
      description: "Descubre cómo Nomiqa se convirtió en la primera plataforma eSIM centrada en la privacidad del mundo. Construida para nómadas digitales, nativos de cripto y defensores de la privacidad."
    },
    IT: {
      title: "Chi siamo - Piattaforma eSIM incentrata sulla privacy",
      description: "Scopri come Nomiqa è diventata la prima piattaforma eSIM incentrata sulla privacy al mondo. Costruita per nomadi digitali, nativi crypto e sostenitori della privacy."
    },
    PT: {
      title: "Sobre a Nomiqa - Plataforma eSIM focada em privacidade",
      description: "Saiba como a Nomiqa se tornou a primeira plataforma eSIM focada em privacidade do mundo. Construída para nômades digitais, nativos de cripto e defensores da privacidade."
    },
    JA: {
      title: "Nomiqaについて - プライバシー重視のeSIMプラットフォーム",
      description: "Nomiqaが世界初のプライバシー重視のeSIMプラットフォームになった経緯を学びます。デジタルノマド、暗号通貨ネイティブ、プライバシー擁護者のために構築されました。"
    },
    ZH: {
      title: "关于Nomiqa - 以隐私为先的eSIM平台",
      description: "了解Nomiqa如何成为世界上第一个以隐私为先的eSIM平台。为数字游牧民、加密货币原生用户和隐私倡导者而建。"
    },
    RU: {
      title: "О Nomiqa - Платформа eSIM, ориентированная на конфиденциальность",
      description: "Узнайте, как Nomiqa стала первой в мире платформой eSIM, ориентированной на конфиденциальность. Создана для цифровых кочевников, крипто-нативов и защитников конфиденциальности."
    },
    AR: {
      title: "حول Nomiqa - منصة eSIM تركز على الخصوصية",
      description: "تعرف على كيف أصبحت Nomiqa أول منصة eSIM تركز على الخصوصية في العالم. مصممة للرحالة الرقميين ومستخدمي العملات المشفرة ودعاة الخصوصية."
    }
  },
  privacy: {
    EN: {
      title: "Privacy Protection - How Nomiqa Keeps You Safe",
      description: "Learn how Nomiqa protects your privacy with zero-knowledge architecture, crypto-only payments, and no usage tracking. Your data is yours."
    },
    DE: {
      title: "Datenschutz - Wie Nomiqa dich schützt",
      description: "Erfahre, wie Nomiqa deine Privatsphäre mit Zero-Knowledge-Architektur, reinen Krypto-Zahlungen und ohne Nutzungsverfolgung schützt. Deine Daten gehören dir."
    },
    FR: {
      title: "Protection de la vie privée - Comment Nomiqa vous protège",
      description: "Découvrez comment Nomiqa protège votre vie privée avec une architecture à connaissance nulle, des paiements crypto uniquement et aucun suivi d'utilisation. Vos données vous appartiennent."
    },
    ES: {
      title: "Protección de privacidad - Cómo Nomiqa te mantiene seguro",
      description: "Descubre cómo Nomiqa protege tu privacidad con arquitectura de conocimiento cero, pagos solo en cripto y sin seguimiento de uso. Tus datos son tuyos."
    },
    IT: {
      title: "Protezione della privacy - Come Nomiqa ti protegge",
      description: "Scopri come Nomiqa protegge la tua privacy con architettura a conoscenza zero, pagamenti solo crypto e nessun tracciamento dell'utilizzo. I tuoi dati sono tuoi."
    },
    PT: {
      title: "Proteção de privacidade - Como a Nomiqa mantém você seguro",
      description: "Saiba como a Nomiqa protege sua privacidade com arquitetura de conhecimento zero, pagamentos apenas em cripto e sem rastreamento de uso. Seus dados são seus."
    },
    JA: {
      title: "プライバシー保護 - Nomiqaがあなたを守る方法",
      description: "ゼロ知識アーキテクチャ、暗号通貨のみの支払い、使用状況の追跡なしで、Nomiqaがあなたのプライバシーをどのように保護するかを学びます。あなたのデータはあなたのものです。"
    },
    ZH: {
      title: "隐私保护 - Nomiqa如何保护您的安全",
      description: "了解Nomiqa如何通过零知识架构、仅加密货币支付和无使用跟踪来保护您的隐私。您的数据属于您。"
    },
    RU: {
      title: "Защита конфиденциальности - Как Nomiqa защищает вас",
      description: "Узнайте, как Nomiqa защищает вашу конфиденциальность с помощью архитектуры с нулевым разглашением, платежей только в криптовалюте и отсутствия отслеживания использования. Ваши данные принадлежат вам."
    },
    AR: {
      title: "حماية الخصوصية - كيف تحافظ Nomiqa على سلامتك",
      description: "تعرف على كيفية حماية Nomiqa لخصوصيتك من خلال بنية المعرفة الصفرية والمدفوعات بالعملات المشفرة فقط وعدم تتبع الاستخدام. بياناتك ملكك."
    }
  },
  affiliate: {
    EN: {
      title: "Affiliate Program - Earn with Nomiqa Referrals",
      description: "Join Nomiqa's affiliate program. Earn 9% commission on direct referrals, 6% on level 2, and 3% on level 3. Multi-level rewards with no limits."
    },
    DE: {
      title: "Partnerprogramm - Verdiene mit Nomiqa-Empfehlungen",
      description: "Tritt dem Nomiqa-Partnerprogramm bei. Verdiene 9% Provision auf direkte Empfehlungen, 6% auf Level 2 und 3% auf Level 3. Multi-Level-Belohnungen ohne Grenzen."
    },
    FR: {
      title: "Programme d'affiliation - Gagnez avec les parrainages Nomiqa",
      description: "Rejoignez le programme d'affiliation Nomiqa. Gagnez 9% de commission sur les parrainages directs, 6% au niveau 2 et 3% au niveau 3. Récompenses multi-niveaux sans limites."
    },
    ES: {
      title: "Programa de afiliados - Gana con referencias de Nomiqa",
      description: "Únete al programa de afiliados de Nomiqa. Gana 9% de comisión en referencias directas, 6% en nivel 2 y 3% en nivel 3. Recompensas multinivel sin límites."
    },
    IT: {
      title: "Programma di affiliazione - Guadagna con le segnalazioni Nomiqa",
      description: "Unisciti al programma di affiliazione Nomiqa. Guadagna il 9% di commissione sulle segnalazioni dirette, il 6% al livello 2 e il 3% al livello 3. Premi multilivello senza limiti."
    },
    PT: {
      title: "Programa de afiliados - Ganhe com indicações Nomiqa",
      description: "Junte-se ao programa de afiliados da Nomiqa. Ganhe 9% de comissão em indicações diretas, 6% no nível 2 e 3% no nível 3. Recompensas multinível sem limites."
    },
    JA: {
      title: "アフィリエイトプログラム - Nomiqa紹介で稼ぐ",
      description: "Nomiqaのアフィリエイトプログラムに参加。直接紹介で9%、レベル2で6%、レベル3で3%のコミッションを獲得。制限なしのマルチレベル報酬。"
    },
    ZH: {
      title: "联盟计划 - 通过Nomiqa推荐赚钱",
      description: "加入Nomiqa的联盟计划。直接推荐赚取9%佣金，第2级6%，第3级3%。无限制的多级奖励。"
    },
    RU: {
      title: "Партнёрская программа - Зарабатывайте с рефералами Nomiqa",
      description: "Присоединяйтесь к партнёрской программе Nomiqa. Зарабатывайте 9% комиссии с прямых рефералов, 6% на уровне 2 и 3% на уровне 3. Многоуровневые вознаграждения без ограничений."
    },
    AR: {
      title: "برنامج الإحالة - اربح مع إحالات Nomiqa",
      description: "انضم إلى برنامج الإحالة الخاص بـ Nomiqa. اربح عمولة 9% على الإحالات المباشرة، و6% على المستوى 2، و3% على المستوى 3. مكافآت متعددة المستويات بدون حدود."
    }
  },
  gettingStarted: {
    EN: {
      title: "Getting Started with $NOMIQA Token - Setup Guide",
      description: "Step-by-step guide to buying $NOMIQA token and using it for eSIM purchases. Learn about Phantom wallet, Solana, and crypto payments."
    },
    DE: {
      title: "Erste Schritte mit $NOMIQA Token - Setup-Anleitung",
      description: "Schritt-für-Schritt-Anleitung zum Kauf von $NOMIQA Token und dessen Verwendung für eSIM-Käufe. Erfahre mehr über Phantom Wallet, Solana und Krypto-Zahlungen."
    },
    FR: {
      title: "Commencer avec le jeton $NOMIQA - Guide de configuration",
      description: "Guide étape par étape pour acheter le jeton $NOMIQA et l'utiliser pour les achats eSIM. Découvrez Phantom wallet, Solana et les paiements crypto."
    },
    ES: {
      title: "Comenzar con el token $NOMIQA - Guía de configuración",
      description: "Guía paso a paso para comprar el token $NOMIQA y usarlo para compras de eSIM. Aprende sobre Phantom wallet, Solana y pagos cripto."
    },
    IT: {
      title: "Iniziare con il token $NOMIQA - Guida alla configurazione",
      description: "Guida passo passo per acquistare il token $NOMIQA e utilizzarlo per gli acquisti eSIM. Scopri Phantom wallet, Solana e i pagamenti crypto."
    },
    PT: {
      title: "Começando com o token $NOMIQA - Guia de configuração",
      description: "Guia passo a passo para comprar o token $NOMIQA e usá-lo para compras de eSIM. Aprenda sobre Phantom wallet, Solana e pagamentos cripto."
    },
    JA: {
      title: "$NOMIQAトークンの始め方 - セットアップガイド",
      description: "$NOMIQAトークンの購入とeSIM購入への使用に関するステップバイステップガイド。Phantomウォレット、Solana、暗号通貨決済について学びます。"
    },
    ZH: {
      title: "$NOMIQA代币入门 - 设置指南",
      description: "购买$NOMIQA代币并将其用于eSIM购买的分步指南。了解Phantom钱包、Solana和加密货币支付。"
    },
    RU: {
      title: "Начало работы с токеном $NOMIQA - Руководство по настройке",
      description: "Пошаговое руководство по покупке токена $NOMIQA и его использованию для покупок eSIM. Узнайте о кошельке Phantom, Solana и крипто-платежах."
    },
    AR: {
      title: "البدء مع رمز $NOMIQA - دليل الإعداد",
      description: "دليل خطوة بخطوة لشراء رمز $NOMIQA واستخدامه لشراء eSIM. تعرف على محفظة Phantom وSolana ومدفوعات العملات المشفرة."
    }
  },
  terms: {
    EN: {
      title: "Terms & Conditions - Legal Information | Nomiqa",
      description: "Read Nomiqa's Terms & Conditions, Privacy Policy, and legal information. Understand our eSIM service policies, data protection, and user agreements."
    },
    DE: {
      title: "Allgemeine Geschäftsbedingungen - Rechtsinformationen | Nomiqa",
      description: "Lesen Sie Nomiqas AGB, Datenschutzrichtlinie und rechtliche Informationen. Verstehen Sie unsere eSIM-Servicerichtlinien, Datenschutz und Nutzervereinbarungen."
    },
    FR: {
      title: "Termes et Conditions - Informations Légales | Nomiqa",
      description: "Lisez les Termes et Conditions, la Politique de Confidentialité et les informations légales de Nomiqa. Comprenez nos politiques de service eSIM, protection des données et accords d'utilisateur."
    },
    ES: {
      title: "Términos y Condiciones - Información Legal | Nomiqa",
      description: "Lea los Términos y Condiciones, Política de Privacidad e información legal de Nomiqa. Comprenda nuestras políticas de servicio eSIM, protección de datos y acuerdos de usuario."
    },
    IT: {
      title: "Termini e Condizioni - Informazioni Legali | Nomiqa",
      description: "Leggi Termini e Condizioni, Informativa sulla Privacy e informazioni legali di Nomiqa. Comprendi le nostre politiche del servizio eSIM, protezione dei dati e accordi utente."
    },
    PT: {
      title: "Termos e Condições - Informações Legais | Nomiqa",
      description: "Leia os Termos e Condições, Política de Privacidade e informações legais da Nomiqa. Entenda nossas políticas de serviço eSIM, proteção de dados e acordos de usuário."
    },
    JA: {
      title: "利用規約 - 法的情報 | Nomiqa",
      description: "Nomiqaの利用規約、プライバシーポリシー、法的情報をお読みください。eSIMサービスポリシー、データ保護、ユーザー契約を理解してください。"
    },
    ZH: {
      title: "条款与条件 - 法律信息 | Nomiqa",
      description: "阅读Nomiqa的条款与条件、隐私政策和法律信息。了解我们的eSIM服务政策、数据保护和用户协议。"
    },
    RU: {
      title: "Условия использования - Юридическая информация | Nomiqa",
      description: "Прочитайте Условия использования, Политику конфиденциальности и юридическую информацию Nomiqa. Поймите наши политики обслуживания eSIM, защиты данных и пользовательских соглашений."
    },
    AR: {
      title: "الشروط والأحكام - المعلومات القانونية | Nomiqa",
      description: "اقرأ الشروط والأحكام وسياسة الخصوصية والمعلومات القانونية لـ Nomiqa. فهم سياسات خدمة eSIM وحماية البيانات واتفاقيات المستخدم."
    }
  }
};

export const SEO = ({ page = "home" }: SEOProps) => {
  const { language } = useTranslation();
  const data = seoData[page]?.[language] || seoData[page].EN;
  
  // Site URL and logo for social sharing
  const siteUrl = "https://nomiqa-esim.com";
  const logoUrl = `${siteUrl}/nomiqa-logo.jpg`;
  const currentUrl = `${siteUrl}${window.location.pathname}`;

  // Structured data for organization
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Nomiqa",
    "url": siteUrl,
    "logo": logoUrl,
    "description": "Privacy-first eSIM platform accepting cryptocurrency payments. Connect privately anywhere in 200+ countries.",
    "sameAs": [
      "https://twitter.com/nomiqa_esim"
    ]
  };

  return (
    <Helmet>
      <html lang={language.toLowerCase()} />
      <title>{data.title}</title>
      <meta name="description" content={data.description} />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={data.title} />
      <meta property="og:description" content={data.description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:image" content={logoUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Nomiqa" />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={data.title} />
      <meta name="twitter:description" content={data.description} />
      <meta name="twitter:image" content={logoUrl} />
      <meta name="twitter:site" content="@nomiqa_esim" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
    </Helmet>
  );
};
