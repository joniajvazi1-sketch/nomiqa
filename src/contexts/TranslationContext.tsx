import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type Language = "EN" | "ES" | "FR" | "DE" | "RU" | "ZH" | "JA" | "PT" | "AR" | "HI";

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

const translations: Record<string, Record<Language, string>> = {
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

  // Hero (placeholders for now)
  heroPrivate: { EN: "Private.", ES: "Privado.", FR: "Privé.", DE: "Privat.", RU: "Приватно.", ZH: "私密。", JA: "プライベート。", PT: "Privado.", AR: "خاص.", HI: "निजी।" },
  heroBorderless: { EN: "Borderless.", ES: "Sin fronteras.", FR: "Sans frontières.", DE: "Grenzenlos.", RU: "Без границ.", ZH: "无边界。", JA: "ボーダーレス。", PT: "Sem fronteiras.", AR: "بلا حدود.", HI: "बॉर्डरलेस।" },
  heroHuman: { EN: "Human.", ES: "Humano.", FR: "Humain.", DE: "Menschlich.", RU: "Человечно.", ZH: "人性化。", JA: "ヒューマン。", PT: "Humano.", AR: "إنساني.", HI: "मानवीय।" },
  heroDescription1: { EN: "Connect anywhere in 60 seconds — no ID, no tracking, no limits", ES: "Conéctate en 60 segundos — sin ID, sin rastreo, sin límites", FR: "Connectez‑vous en 60 s — sans ID, sans suivi, sans limites", DE: "In 60 Sekunden verbunden — keine ID, kein Tracking, keine Limits", RU: "Подключение за 60 секунд — без ID, без слежки, без ограничений", ZH: "60 秒内随时连接 — 无需身份证、无跟踪、无限制", JA: "60秒でどこでも接続 — 身分証不要・追跡なし・制限なし", PT: "Conecte-se em 60s — sem ID, sem rastreamento, sem limites", AR: "اتصل خلال 60 ثانية — بلا هوية، بلا تتبع، بلا حدود", HI: "कहीं भी 60 सेकंड में कनेक्ट — बिना आईडी, बिना ट्रैकिंग, बिना लिमिट" },

  // FAQ
  faqTitle: { EN: "Frequently Asked Questions", ES: "Preguntas frecuentes", FR: "Foire aux questions", DE: "Häufig gestellte Fragen", RU: "Часто задаваемые вопросы", ZH: "常见问题", JA: "よくある質問", PT: "Perguntas frequentes", AR: "الأسئلة الشائعة", HI: "अक्सर पूछे जाने वाले प्रश्न" },
  faqSubtitle: { EN: "Everything about eSIM setup, troubleshooting, and payments.", ES: "Todo sobre la eSIM: instalación, ayuda y pagos.", FR: "Tout sur l’eSIM : installation, aide et paiements.", DE: "Alles über eSIM: Einrichtung, Hilfe und Zahlungen.", RU: "Все об eSIM: настройка, помощь и платежи.", ZH: "关于 eSIM 的安装、支持与支付。", JA: "eSIM の設定・トラブル対応・支払いについて。", PT: "Tudo sobre eSIM: instalação, suporte e pagamentos.", AR: "كل ما يتعلق بـ eSIM: الإعداد، الحلول والدفع.", HI: "eSIM सेटअप, समस्या निवारण और भुगतान से जुड़ी सारी जानकारी." },

  faq1Q: { EN: "What is an eSIM and how does it work?", ES: "¿Qué es una eSIM y cómo funciona?", FR: "Qu’est‑ce qu’une eSIM et comment ça marche ?", DE: "Was ist eine eSIM und wie funktioniert sie?", RU: "Что такое eSIM и как она работает?", ZH: "什么是 eSIM，它如何工作？", JA: "eSIM とは？ 仕組みは？", PT: "O que é uma eSIM e como funciona?", AR: "ما هي eSIM وكيف تعمل؟", HI: "eSIM क्या है और यह कैसे काम करती है?" },
  faq1A: { EN: "An eSIM is a digital SIM built into your device. You activate it by scanning a QR code or entering a code—no physical card needed.", ES: "La eSIM es una SIM digital integrada en tu dispositivo. La activas escaneando un código QR o introduciendo un código—sin tarjeta física.", FR: "Une eSIM est une SIM numérique intégrée à votre appareil. Activez‑la via QR code ou code d’activation—sans carte physique.", DE: "Eine eSIM ist eine digitale SIM im Gerät. Aktiviere sie per QR‑Code oder Eingabecode—ganz ohne Karte.", RU: "eSIM — это цифровая SIM в вашем устройстве. Активируется QR‑кодом или кодом активации—без физической карты.", ZH: "eSIM 是内置于设备的数字 SIM。通过扫描二维码或输入激活码即可，无需实体卡。", JA: "eSIM は端末に内蔵されたデジタル SIM。QR を読み取るかコード入力で有効化します。", PT: "eSIM é um SIM digital embutido no aparelho. Ative por QR code ou código—sem chip físico.", AR: "eSIM هي شريحة رقمية مدمجة بجهازك. تُفعل عبر مسح QR أو إدخال رمز—بدون شريحة فعلية.", HI: "eSIM डिवाइस में मौजूद डिजिटल SIM है। QR स्कैन या कोड डालकर एक्टिवेट करें—फ़िजिकल सिम की जरूरत नहीं।" },

  faq2Q: { EN: "Is my phone compatible with eSIM?", ES: "¿Mi teléfono es compatible con eSIM?", FR: "Mon téléphone est‑il compatible eSIM ?", DE: "Ist mein Handy eSIM‑fähig?", RU: "Совместим ли мой телефон с eSIM?", ZH: "我的手机支持 eSIM 吗？", JA: "自分のスマホは eSIM 対応？", PT: "Meu celular é compatível com eSIM?", AR: "هل هاتفي يدعم eSIM؟", HI: "क्या मेरा फोन eSIM सपोर्ट करता है?" },
  faq2A: { EN: "Most modern iPhone, Samsung, Google, and other flagship devices support eSIM. Check your device settings for ‘Add eSIM’ to confirm.", ES: "La mayoría de iPhone, Samsung, Google y otros gama alta la soportan. Revisa en ajustes ‘Agregar eSIM’.", FR: "La plupart des iPhone, Samsung, Google et modèles phares la supportent. Vérifiez dans Réglages ‘Ajouter une eSIM’.", DE: "Die meisten aktuellen iPhones, Samsung, Google & Flaggschiffe unterstützen eSIM. Prüfe in den Einstellungen ‘eSIM hinzufügen’.", RU: "Большинство современных iPhone, Samsung, Google и флагманов поддерживают eSIM. Проверьте в настройках пункт ‘Добавить eSIM’.", ZH: "多数新款 iPhone/Samsung/Google 等机型支持。设置中查找“添加 eSIM”。", JA: "多くの最新 iPhone/Samsung/Google などが対応。設定の『eSIM を追加』で確認。", PT: "A maioria dos iPhones, Samsung, Google e flagships suportam eSIM. Veja ‘Adicionar eSIM’ nas configurações.", AR: "معظم أجهزة iPhone وSamsung وGoogle الحديثة تدعمها. تحقق من خيار ‘إضافة eSIM’ بالإعدادات.", HI: "अधिकांश iPhone, Samsung, Google और फ़्लैगशिप में सपोर्ट है। सेटिंग्स में ‘Add eSIM’ देखें." },

  faq3Q: { EN: "How do I install my eSIM?", ES: "¿Cómo instalo mi eSIM?", FR: "Comment installer mon eSIM ?", DE: "Wie installiere ich meine eSIM?", RU: "Как установить eSIM?", ZH: "如何安装 eSIM？", JA: "eSIM のインストール方法は？", PT: "Como instalar minha eSIM?", AR: "كيف أقوم بتثبيت eSIM؟", HI: "eSIM इंस्टॉल कैसे करूं?" },
  faq3A: { EN: "After purchase, you’ll receive a QR code and manual code. Scan it in Settings → Mobile/Cellular → Add eSIM, then follow the prompts.", ES: "Tras la compra recibirás un QR y un código. Escanéalo en Ajustes → Datos móviles → Agregar eSIM y sigue los pasos.", FR: "Après l’achat, vous recevez un QR et un code. Scannez‑le dans Réglages → Données cellulaires → Ajouter eSIM, puis suivez les étapes.", DE: "Nach dem Kauf erhältst du einen QR und Code. Scanne ihn unter Einstellungen → Mobilfunk → eSIM hinzufügen und folge den Anweisungen.", RU: "После покупки вы получите QR и код. Отсканируйте его: Настройки → Сотовая связь → Добавить eSIM, затем следуйте шагам.", ZH: "购买后会收到二维码和手动代码。设置 → 蜂窝网络 → 添加 eSIM 扫码并按提示完成。", JA: "購入後に QR とコードが届きます。設定 → モバイル通信 → eSIM を追加 で読み取り、案内に従ってください。", PT: "Após a compra, você recebe um QR e um código. Escaneie em Ajustes → Celular → Adicionar eSIM e siga as etapas.", AR: "بعد الشراء ستصلك QR ورمز يدوي. امسحه في الإعدادات → الخلوي → إضافة eSIM ثم اتبع الإرشادات.", HI: "खरीद के बाद QR और कोड मिलेंगे। सेटिंग्स → मोबाइल/सेल्युलर → eSIM जोड़ें में स्कैन करें और निर्देशों का पालन करें." },

  faq4Q: { EN: "When should I activate my eSIM?", ES: "¿Cuándo debo activar mi eSIM?", FR: "Quand activer mon eSIM ?", DE: "Wann sollte ich meine eSIM aktivieren?", RU: "Когда активировать eSIM?", ZH: "我应何时激活 eSIM？", JA: "いつ有効化すればいい？", PT: "Quando devo ativar minha eSIM?", AR: "متى ينبغي تفعيل eSIM؟", HI: "eSIM कब सक्रिय करनी चाहिए?" },
  faq4A: { EN: "Activate on or just before arrival in your destination country for the best validity period. Don’t delete it after use in case you need to top up.", ES: "Actívala al llegar o justo antes de llegar al país destino para maximizar la vigencia. No la borres por si necesitas recargar.", FR: "Activez‑la à l’arrivée (ou juste avant) dans le pays de destination pour optimiser la validité. Ne la supprimez pas en cas de recharge ultérieure.", DE: "Am besten bei oder kurz vor Ankunft im Zielland aktivieren. Nicht löschen, falls du später aufladen willst.", RU: "Активируйте по прибытии (или незадолго до) в стране назначения. Не удаляйте её — возможно, пополните позже.", ZH: "到达目的地当日或前一刻激活更合适。用完不要删除，以便后续续费。", JA: "渡航先に到着した時、または直前に有効化すると有効期間を最大化できます。後でチャージする可能性があるので削除しないでください。", PT: "Ative ao chegar (ou pouco antes) no destino para melhor validade. Não apague caso precise recarregar.", AR: "فعّلها عند الوصول أو قبل ذلك بقليل لتحصل على أفضل مدة صلاحية. لا تحذفها فقد تحتاج لإعادة الشحن.", HI: "गंतव्य पर पहुँचते ही या ठीक पहले सक्रिय करें ताकि वैधता अधिक मिले। रिचार्ज की जरूरत पड़े तो eSIM न हटाएँ." },

  faq5Q: { EN: "My data isn’t working—what should I check?", ES: "No tengo datos, ¿qué reviso?", FR: "La data ne marche pas—que vérifier ?", DE: "Daten funktionieren nicht—was prüfen?", RU: "Интернет не работает—что проверить?", ZH: "没有流量怎么办？", JA: "データ通信が使えない—何を確認？", PT: "Sem dados—o que verificar?", AR: "البيانات لا تعمل—ما الذي أفحصه؟", HI: "डेटा काम नहीं कर रहा—क्या जाँचूँ?" },
  faq5A: { EN: "Enable data roaming, select the eSIM for mobile data, and restart your phone. If needed, enter APN from your eSIM details.", ES: "Activa itinerancia de datos, elige la eSIM como datos móviles y reinicia. Si hace falta, introduce el APN de tu eSIM.", FR: "Activez l’itinérance, choisissez l’eSIM pour les données et redémarrez. Si besoin, saisissez l’APN fourni.", DE: "Datenroaming aktivieren, eSIM für mobile Daten wählen und neu starten. Falls nötig, APN aus den eSIM‑Details eintragen.", RU: "Включите роуминг данных, выберите eSIM для интернета и перезагрузите телефон. При необходимости укажите APN из письма.", ZH: "开启数据漫游，设为该 eSIM 为移动数据卡，并重启手机。如需，请填写 APN。", JA: "データローミングをONにし、モバイルデータに eSIM を選び、端末を再起動。必要なら APN を入力。", PT: "Ative roaming, selecione a eSIM para dados e reinicie. Se preciso, insira o APN informado.", AR: "فعّل تجوال البيانات، واختر eSIM للبيانات، ثم أعد تشغيل الهاتف. إن لزم أدخل إعدادات APN.", HI: "डेटा रोमिंग चालू करें, मोबाइल डेटा के लिए eSIM चुनें और फोन रिस्टार्ट करें। जरूरत हो तो APN सेट करें." },

  faq6Q: { EN: "Can I keep my physical SIM active for calls?", ES: "¿Puedo mantener mi SIM física para llamadas?", FR: "Puis‑je garder ma SIM physique pour les appels ?", DE: "Kann ich meine physische SIM für Anrufe behalten?", RU: "Могу ли я оставить физическую SIM для звонков?", ZH: "可以保留实体卡用于通话吗？", JA: "通話用に物理 SIM を残せる？", PT: "Posso manter meu SIM físico para chamadas?", AR: "هل يمكنني الإبقاء على الشريحة الفعلية للمكالمات؟", HI: "क्या कॉल के लिए फिजिकल SIM चालू रख सकता/सकती हूँ?" },
  faq6A: { EN: "Yes. You can use eSIM for data and keep your physical SIM for calls/SMS if your device supports dual SIM.", ES: "Sí. Usa la eSIM para datos y mantén tu SIM física para llamadas/SMS si tu móvil admite doble SIM.", FR: "Oui. Utilisez l’eSIM pour les données et gardez la SIM physique pour appels/SMS si le double SIM est pris en charge.", DE: "Ja. Nutze eSIM für Daten und behalte die physische SIM für Anrufe/SMS bei Dual‑SIM‑Support.", RU: "Да. Используйте eSIM для интернета, а физическую SIM—для звонков/SMS, если устройство поддерживает Dual SIM.", ZH: "可以。如果设备支持双卡，可用 eSIM 上网、实体卡通话短信。", JA: "はい。データは eSIM、通話/SMS は物理 SIM を併用可能（デュアル SIM 対応端末）。", PT: "Sim. Use eSIM para dados e mantenha o SIM físico para chamadas/SMS se o aparelho for dual‑SIM.", AR: "نعم. استخدم eSIM للبيانات واحتفظ بالشريحة الفعلية للمكالمات/SMS إذا كان جهازك يدعم شريحتين.", HI: "हाँ, डिवाइस डुअल SIM सपोर्ट करता हो तो डेटा eSIM पर और कॉल/SMS फिजिकल SIM पर रख सकते हैं." },

  faq7Q: { EN: "How long does my plan last?", ES: "¿Cuánto dura mi plan?", FR: "Quelle est la durée de mon forfait ?", DE: "Wie lange gilt mein Tarif?", RU: "На сколько хватает моего плана?", ZH: "套餐有效期多久？", JA: "プランの有効期間は？", PT: "Quanto tempo dura meu plano?", AR: "ما مدة صلاحيّة الخطة؟", HI: "मेरी योजना कितने समय तक चलेगी?" },
  faq7A: { EN: "Your plan includes a data amount and validity days. Remaining data and expiry are shown in your order details.", ES: "Tu plan incluye datos y días de validez. El saldo y el vencimiento aparecen en tus pedidos.", FR: "Votre forfait comprend un volume de données et une durée. Restant et expiration figurent dans vos commandes.", DE: "Dein Tarif hat Datenvolumen und Gültigkeitstage. Rest & Ablauf siehst du in deinen Bestelldetails.", RU: "План включает объём данных и срок действия. Остаток и дату окончания см. в деталях заказа.", ZH: "套餐含流量与有效天数。剩余与到期在订单详情可见。", JA: "データ量と有効日数が含まれます。残量と期限は注文詳細で確認できます。", PT: "Seu plano inclui dados e dias de validade. Saldo e expiração ficam nos detalhes do pedido.", AR: "خُطتك تتضمن حجم بيانات وأيام صلاحية. الرصيد والانتهاء يظهران في تفاصيل طلبك.", HI: "योजना में डेटा और वैधता दिन शामिल हैं। शेष डेटा और एक्सपायरी ऑर्डर विवरण में दिखती है." },

  faq8Q: { EN: "Can I top up or extend my plan?", ES: "¿Puedo recargar o ampliar mi plan?", FR: "Puis‑je recharger ou prolonger mon forfait ?", DE: "Kann ich meinen Tarif aufladen oder verlängern?", RU: "Могу ли я пополнить или продлить план?", ZH: "可以充值或延长吗？", JA: "チャージや延長はできますか？", PT: "Posso recarregar ou estender o plano?", AR: "هل يمكنني الشحن أو تمديد الخطة؟", HI: "क्या मैं टॉप‑अप/एक्सटेंड कर सकता/सकती हूँ?" },
  faq8A: { EN: "Yes—keep the eSIM installed. When top‑ups are available for your package, you’ll see options in your account or receive instructions via email.", ES: "Sí—mantén la eSIM instalada. Cuando haya recargas disponibles, verás opciones en tu cuenta o recibirás instrucciones por correo.", FR: "Oui—gardez l’eSIM installée. Si des recharges sont proposées, elles apparaîtront dans votre compte ou par e‑mail.", DE: "Ja—lasse die eSIM installiert. Wenn Aufladungen verfügbar sind, siehst du Optionen im Konto oder per E‑Mail.", RU: "Да—не удаляйте eSIM. При доступных пополнениях получите инструкции по почте или в аккаунте.", ZH: "可以—请不要删除 eSIM。当有充值时，会在账户中显示或邮件说明。", JA: "可能です—eSIM は削除せず保持してください。チャージ可能な場合はアカウントやメールで案内します。", PT: "Sim—mantenha a eSIM instalada. Havendo recarga, você verá opções na conta ou receberá instruções por e‑mail.", AR: "نعم—أبقِ eSIM مثبتة. عند توفر الشحن ستظهر الخيارات في حسابك أو تصلك التعليمات عبر البريد.", HI: "हाँ—eSIM को इंस्टॉल रहने दें। टॉप‑अप उपलब्ध होने पर खाते में विकल्प दिखेंगे या ईमेल से निर्देश मिलेंगे." },

  faq9Q: { EN: "What payment methods are supported?", ES: "¿Qué métodos de pago aceptan?", FR: "Quels moyens de paiement acceptez‑vous ?", DE: "Welche Zahlungsmethoden gibt es?", RU: "Какие способы оплаты поддерживаются?", ZH: "支持哪些支付方式？", JA: "支払い方法は？", PT: "Quais formas de pagamento são aceitas?", AR: "ما طرق الدفع المتاحة؟", HI: "कौन‑कौन से भुगतान तरीके उपलब्ध हैं?" },
  faq9A: { EN: "We accept crypto only—SOL, USDC, and the $NOMIQA token for discounts. No credit cards or bank trails.", ES: "Aceptamos solo cripto—SOL, USDC y el token $NOMIQA con descuento. Sin tarjetas ni bancos.", FR: "Nous acceptons uniquement la crypto—SOL, USDC et le jeton $NOMIQA avec remise. Pas de cartes ni de banques.", DE: "Nur Krypto—SOL, USDC und der $NOMIQA‑Token mit Rabatt. Keine Karten, keine Banken.", RU: "Только крипта—SOL, USDC и токен $NOMIQA со скидкой. Без карт и банков.", ZH: "仅支持加密货币—SOL、USDC 及 $NOMIQA（可享折扣）。不支持银行卡/银行。", JA: "暗号資産のみ—SOL、USDC、$NOMIQA（割引あり）。カードや銀行は不要。", PT: "Apenas cripto—SOL, USDC e token $NOMIQA com desconto. Sem cartões ou bancos.", AR: "ندعم العملات المشفرة فقط—SOL وUSDC ورمز $NOMIQA مع خصم. لا بطاقات ولا بنوك.", HI: "हम केवल क्रिप्टो स्वीकार करते हैं—SOL, USDC और $NOMIQA (छूट सहित)। कार्ड/बैंक नहीं." },

  faq10Q: { EN: "Is my privacy protected when using Nomiqa?", ES: "¿Mi privacidad está protegida con Nomiqa?", FR: "Ma vie privée est‑elle protégée avec Nomiqa ?", DE: "Ist meine Privatsphäre bei Nomiqa geschützt?", RU: "Защищается ли моя приватность с Nomiqa?", ZH: "使用 Nomiqa 能保护隐私吗？", JA: "Nomiqa 利用時にプライバシーは守られますか？", PT: "Minha privacidade é protegida ao usar a Nomiqa?", AR: "هل تُحمى خصوصيتي مع Nomiqa؟", HI: "क्या Nomiqa के साथ मेरी गोपनीयता सुरक्षित है?" },
  faq10A: { EN: "Yes. We do not require KYC, do not track usage, and only collect the minimum info to deliver your eSIM. Your connection is yours alone.", ES: "Sí. No pedimos KYC, no rastreamos tu uso y solo recopilamos lo mínimo para entregarte la eSIM. Tu conexión es solo tuya.", FR: "Oui. Pas de KYC, aucun suivi d’usage, et nous ne collectons que le minimum pour livrer votre eSIM. Votre connexion vous appartient.", DE: "Ja. Kein KYC, kein Tracking—wir erheben nur das Nötigste zur Bereitstellung deiner eSIM. Deine Verbindung gehört dir allein.", RU: "Да. Без KYC, без отслеживания—собираем лишь минимум для выдачи eSIM. Ваше соединение—только ваше.", ZH: "是。无需 KYC、不跟踪使用，仅收集交付 eSIM 所需的最少信息。你的连接只属于你。", JA: "はい。KYC は不要、利用追跡も行わず、eSIM 提供に必要な最小限のみ取得します。接続はあなただけのものです。", PT: "Sim. Sem KYC, sem rastrear uso, e coletamos só o mínimo para entregar sua eSIM. Sua conexão é apenas sua.", AR: "نعم. لا نطلب KYC ولا نتتبع الاستخدام ونجمع الحد الأدنى فقط لتسليم eSIM. اتصالك ملك لك وحدك.", HI: "हाँ. हम KYC नहीं माँगते, उपयोग ट्रैक नहीं करते और केवल eSIM देने हेतु न्यूनतम जानकारी लेते हैं। आपका कनेक्शन सिर्फ आपका है." },

  // Footer groups (kept; translate as needed later)
  products: { EN: "Products", ES: "Productos", FR: "Produits", DE: "Produkte", RU: "Продукты", ZH: "产品", JA: "製品", PT: "Produtos", AR: "المنتجات", HI: "उत्पाद" },
  company: { EN: "Company", ES: "Empresa", FR: "Entreprise", DE: "Unternehmen", RU: "Компания", ZH: "公司", JA: "会社", PT: "Empresa", AR: "الشركة", HI: "कंपनी" },
  support: { EN: "Support", ES: "Soporte", FR: "Support", DE: "Support", RU: "Поддержка", ZH: "支持", JA: "サポート", PT: "Suporte", AR: "الدعم", HI: "सहायता" },
  
  // Common
  privacy: { EN: "Privacy", ES: "Privacidad", FR: "Confidentialité", DE: "Datenschutz", RU: "Конфиденциальность", ZH: "隐私", JA: "プライバシー", PT: "Privacidade", AR: "الخصوصية", HI: "गोपनीयता" },
  about: { EN: "About", ES: "Acerca de", FR: "À propos", DE: "Über", RU: "О сервисе", ZH: "关于", JA: "概要", PT: "Sobre", AR: "حول", HI: "परिचय" },
};

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("preferredLanguage");
    return (saved as Language) || "EN";
  });

  useEffect(() => {
    localStorage.setItem("preferredLanguage", language);
  }, [language]);

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
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
};
