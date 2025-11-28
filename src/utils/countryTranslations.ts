import type { Language } from "@/contexts/TranslationContext";

// Country name translations for all supported languages
export const countryTranslations: Record<string, Record<Language, string>> = {
  // A
  "AL": { EN: "Albania", ES: "Albania", FR: "Albanie", DE: "Albanien", IT: "Albania", PT: "Albânia", RU: "Албания", ZH: "阿尔巴尼亚", JA: "アルバニア", AR: "ألبانيا" },
  "DZ": { EN: "Algeria", ES: "Argelia", FR: "Algérie", DE: "Algerien", IT: "Algeria", PT: "Argélia", RU: "Алжир", ZH: "阿尔及利亚", JA: "アルジェリア", AR: "الجزائر" },
  "AR": { EN: "Argentina", ES: "Argentina", FR: "Argentine", DE: "Argentinien", IT: "Argentina", PT: "Argentina", RU: "Аргентина", ZH: "阿根廷", JA: "アルゼンチン", AR: "الأرجنتين" },
  "AM": { EN: "Armenia", ES: "Armenia", FR: "Arménie", DE: "Armenien", IT: "Armenia", PT: "Armênia", RU: "Армения", ZH: "亚美尼亚", JA: "アルメニア", AR: "أرمينيا" },
  "AU": { EN: "Australia", ES: "Australia", FR: "Australie", DE: "Australien", IT: "Australia", PT: "Austrália", RU: "Австралия", ZH: "澳大利亚", JA: "オーストラリア", AR: "أستراليا" },
  "AT": { EN: "Austria", ES: "Austria", FR: "Autriche", DE: "Österreich", IT: "Austria", PT: "Áustria", RU: "Австрия", ZH: "奥地利", JA: "オーストリア", AR: "النمسا" },
  "AZ": { EN: "Azerbaijan", ES: "Azerbaiyán", FR: "Azerbaïdjan", DE: "Aserbaidschan", IT: "Azerbaigian", PT: "Azerbaijão", RU: "Азербайджан", ZH: "阿塞拜疆", JA: "アゼルバイジャン", AR: "أذربيجان" },
  
  // B
  "BH": { EN: "Bahrain", ES: "Baréin", FR: "Bahreïn", DE: "Bahrain", IT: "Bahrein", PT: "Bahrein", RU: "Бахрейн", ZH: "巴林", JA: "バーレーン", AR: "البحرين" },
  "BD": { EN: "Bangladesh", ES: "Bangladés", FR: "Bangladesh", DE: "Bangladesch", IT: "Bangladesh", PT: "Bangladesh", RU: "Бангладеш", ZH: "孟加拉国", JA: "バングラデシュ", AR: "بنغلاديش" },
  "BY": { EN: "Belarus", ES: "Bielorrusia", FR: "Biélorussie", DE: "Weißrussland", IT: "Bielorussia", PT: "Bielorrússia", RU: "Беларусь", ZH: "白俄罗斯", JA: "ベラルーシ", AR: "بيلاروسيا" },
  "BE": { EN: "Belgium", ES: "Bélgica", FR: "Belgique", DE: "Belgien", IT: "Belgio", PT: "Bélgica", RU: "Бельгия", ZH: "比利时", JA: "ベルギー", AR: "بلجيكا" },
  "BR": { EN: "Brazil", ES: "Brasil", FR: "Brésil", DE: "Brasilien", IT: "Brasile", PT: "Brasil", RU: "Бразилия", ZH: "巴西", JA: "ブラジル", AR: "البرازيل" },
  "BG": { EN: "Bulgaria", ES: "Bulgaria", FR: "Bulgarie", DE: "Bulgarien", IT: "Bulgaria", PT: "Bulgária", RU: "Болгария", ZH: "保加利亚", JA: "ブルガリア", AR: "بلغاريا" },
  
  // C
  "KH": { EN: "Cambodia", ES: "Camboya", FR: "Cambodge", DE: "Kambodscha", IT: "Cambogia", PT: "Camboja", RU: "Камбоджа", ZH: "柬埔寨", JA: "カンボジア", AR: "كمبوديا" },
  "CA": { EN: "Canada", ES: "Canadá", FR: "Canada", DE: "Kanada", IT: "Canada", PT: "Canadá", RU: "Канада", ZH: "加拿大", JA: "カナダ", AR: "كندا" },
  "CL": { EN: "Chile", ES: "Chile", FR: "Chili", DE: "Chile", IT: "Cile", PT: "Chile", RU: "Чили", ZH: "智利", JA: "チリ", AR: "تشيلي" },
  "CN": { EN: "China", ES: "China", FR: "Chine", DE: "China", IT: "Cina", PT: "China", RU: "Китай", ZH: "中国", JA: "中国", AR: "الصين" },
  "CO": { EN: "Colombia", ES: "Colombia", FR: "Colombie", DE: "Kolumbien", IT: "Colombia", PT: "Colômbia", RU: "Колумбия", ZH: "哥伦比亚", JA: "コロンビア", AR: "كولومبيا" },
  "CR": { EN: "Costa Rica", ES: "Costa Rica", FR: "Costa Rica", DE: "Costa Rica", IT: "Costa Rica", PT: "Costa Rica", RU: "Коста-Рика", ZH: "哥斯达黎加", JA: "コスタリカ", AR: "كوستاريكا" },
  "HR": { EN: "Croatia", ES: "Croacia", FR: "Croatie", DE: "Kroatien", IT: "Croazia", PT: "Croácia", RU: "Хорватия", ZH: "克罗地亚", JA: "クロアチア", AR: "كرواتيا" },
  "CY": { EN: "Cyprus", ES: "Chipre", FR: "Chypre", DE: "Zypern", IT: "Cipro", PT: "Chipre", RU: "Кипр", ZH: "塞浦路斯", JA: "キプロス", AR: "قبرص" },
  "CZ": { EN: "Czech Republic", ES: "República Checa", FR: "République tchèque", DE: "Tschechien", IT: "Repubblica Ceca", PT: "República Tcheca", RU: "Чехия", ZH: "捷克", JA: "チェコ", AR: "التشيك" },
  
  // D
  "DK": { EN: "Denmark", ES: "Dinamarca", FR: "Danemark", DE: "Dänemark", IT: "Danimarca", PT: "Dinamarca", RU: "Дания", ZH: "丹麦", JA: "デンマーク", AR: "الدنمارك" },
  
  // E
  "EC": { EN: "Ecuador", ES: "Ecuador", FR: "Équateur", DE: "Ecuador", IT: "Ecuador", PT: "Equador", RU: "Эквадор", ZH: "厄瓜多尔", JA: "エクアドル", AR: "الإكوادور" },
  "EG": { EN: "Egypt", ES: "Egipto", FR: "Égypte", DE: "Ägypten", IT: "Egitto", PT: "Egito", RU: "Египет", ZH: "埃及", JA: "エジプト", AR: "مصر" },
  "EE": { EN: "Estonia", ES: "Estonia", FR: "Estonie", DE: "Estland", IT: "Estonia", PT: "Estônia", RU: "Эстония", ZH: "爱沙尼亚", JA: "エストニア", AR: "إستونيا" },
  
  // F
  "FI": { EN: "Finland", ES: "Finlandia", FR: "Finlande", DE: "Finnland", IT: "Finlandia", PT: "Finlândia", RU: "Финляндия", ZH: "芬兰", JA: "フィンランド", AR: "فنلندا" },
  "FR": { EN: "France", ES: "Francia", FR: "France", DE: "Frankreich", IT: "Francia", PT: "França", RU: "Франция", ZH: "法国", JA: "フランス", AR: "فرنسا" },
  
  // G
  "GE": { EN: "Georgia", ES: "Georgia", FR: "Géorgie", DE: "Georgien", IT: "Georgia", PT: "Geórgia", RU: "Грузия", ZH: "格鲁吉亚", JA: "ジョージア", AR: "جورجيا" },
  "DE": { EN: "Germany", ES: "Alemania", FR: "Allemagne", DE: "Deutschland", IT: "Germania", PT: "Alemanha", RU: "Германия", ZH: "德国", JA: "ドイツ", AR: "ألمانيا" },
  "GH": { EN: "Ghana", ES: "Ghana", FR: "Ghana", DE: "Ghana", IT: "Ghana", PT: "Gana", RU: "Гана", ZH: "加纳", JA: "ガーナ", AR: "غانا" },
  "GR": { EN: "Greece", ES: "Grecia", FR: "Grèce", DE: "Griechenland", IT: "Grecia", PT: "Grécia", RU: "Греция", ZH: "希腊", JA: "ギリシャ", AR: "اليونان" },
  
  // H
  "HK": { EN: "Hong Kong", ES: "Hong Kong", FR: "Hong Kong", DE: "Hongkong", IT: "Hong Kong", PT: "Hong Kong", RU: "Гонконг", ZH: "香港", JA: "香港", AR: "هونغ كونغ" },
  "HU": { EN: "Hungary", ES: "Hungría", FR: "Hongrie", DE: "Ungarn", IT: "Ungheria", PT: "Hungria", RU: "Венгрия", ZH: "匈牙利", JA: "ハンガリー", AR: "المجر" },
  
  // I
  "IS": { EN: "Iceland", ES: "Islandia", FR: "Islande", DE: "Island", IT: "Islanda", PT: "Islândia", RU: "Исландия", ZH: "冰岛", JA: "アイスランド", AR: "أيسلندا" },
  "IN": { EN: "India", ES: "India", FR: "Inde", DE: "Indien", IT: "India", PT: "Índia", RU: "Индия", ZH: "印度", JA: "インド", AR: "الهند" },
  "ID": { EN: "Indonesia", ES: "Indonesia", FR: "Indonésie", DE: "Indonesien", IT: "Indonesia", PT: "Indonésia", RU: "Индонезия", ZH: "印度尼西亚", JA: "インドネシア", AR: "إندونيسيا" },
  "IE": { EN: "Ireland", ES: "Irlanda", FR: "Irlande", DE: "Irland", IT: "Irlanda", PT: "Irlanda", RU: "Ирландия", ZH: "爱尔兰", JA: "アイルランド", AR: "أيرلندا" },
  "IL": { EN: "Israel", ES: "Israel", FR: "Israël", DE: "Israel", IT: "Israele", PT: "Israel", RU: "Израиль", ZH: "以色列", JA: "イスラエル", AR: "إسرائيل" },
  "IT": { EN: "Italy", ES: "Italia", FR: "Italie", DE: "Italien", IT: "Italia", PT: "Itália", RU: "Италия", ZH: "意大利", JA: "イタリア", AR: "إيطاليا" },
  
  // J
  "JP": { EN: "Japan", ES: "Japón", FR: "Japon", DE: "Japan", IT: "Giappone", PT: "Japão", RU: "Япония", ZH: "日本", JA: "日本", AR: "اليابان" },
  "JO": { EN: "Jordan", ES: "Jordania", FR: "Jordanie", DE: "Jordanien", IT: "Giordania", PT: "Jordânia", RU: "Иордания", ZH: "约旦", JA: "ヨルダン", AR: "الأردن" },
  
  // K
  "KZ": { EN: "Kazakhstan", ES: "Kazajistán", FR: "Kazakhstan", DE: "Kasachstan", IT: "Kazakistan", PT: "Cazaquistão", RU: "Казахстан", ZH: "哈萨克斯坦", JA: "カザフスタン", AR: "كازاخستان" },
  "KE": { EN: "Kenya", ES: "Kenia", FR: "Kenya", DE: "Kenia", IT: "Kenya", PT: "Quênia", RU: "Кения", ZH: "肯尼亚", JA: "ケニア", AR: "كينيا" },
  "KR": { EN: "South Korea", ES: "Corea del Sur", FR: "Corée du Sud", DE: "Südkorea", IT: "Corea del Sud", PT: "Coreia do Sul", RU: "Южная Корея", ZH: "韩国", JA: "韓国", AR: "كوريا الجنوبية" },
  "KW": { EN: "Kuwait", ES: "Kuwait", FR: "Koweït", DE: "Kuwait", IT: "Kuwait", PT: "Kuwait", RU: "Кувейт", ZH: "科威特", JA: "クウェート", AR: "الكويت" },
  
  // L
  "LV": { EN: "Latvia", ES: "Letonia", FR: "Lettonie", DE: "Lettland", IT: "Lettonia", PT: "Letônia", RU: "Латвия", ZH: "拉脱维亚", JA: "ラトビア", AR: "لاتفيا" },
  "LT": { EN: "Lithuania", ES: "Lituania", FR: "Lituanie", DE: "Litauen", IT: "Lituania", PT: "Lituânia", RU: "Литва", ZH: "立陶宛", JA: "リトアニア", AR: "ليتوانيا" },
  "LU": { EN: "Luxembourg", ES: "Luxemburgo", FR: "Luxembourg", DE: "Luxemburg", IT: "Lussemburgo", PT: "Luxemburgo", RU: "Люксембург", ZH: "卢森堡", JA: "ルクセンブルク", AR: "لوكسمبورغ" },
  
  // M
  "MO": { EN: "Macao", ES: "Macao", FR: "Macao", DE: "Macau", IT: "Macao", PT: "Macau", RU: "Макао", ZH: "澳门", JA: "マカオ", AR: "ماكاو" },
  "MY": { EN: "Malaysia", ES: "Malasia", FR: "Malaisie", DE: "Malaysia", IT: "Malesia", PT: "Malásia", RU: "Малайзия", ZH: "马来西亚", JA: "マレーシア", AR: "ماليزيا" },
  "MT": { EN: "Malta", ES: "Malta", FR: "Malte", DE: "Malta", IT: "Malta", PT: "Malta", RU: "Мальта", ZH: "马耳他", JA: "マルタ", AR: "مالطا" },
  "MX": { EN: "Mexico", ES: "México", FR: "Mexique", DE: "Mexiko", IT: "Messico", PT: "México", RU: "Мексика", ZH: "墨西哥", JA: "メキシコ", AR: "المكسيك" },
  "MD": { EN: "Moldova", ES: "Moldavia", FR: "Moldavie", DE: "Moldawien", IT: "Moldavia", PT: "Moldávia", RU: "Молдова", ZH: "摩尔多瓦", JA: "モルドバ", AR: "مولدوفا" },
  "MA": { EN: "Morocco", ES: "Marruecos", FR: "Maroc", DE: "Marokko", IT: "Marocco", PT: "Marrocos", RU: "Марокко", ZH: "摩洛哥", JA: "モロッコ", AR: "المغرب" },
  
  // N
  "NL": { EN: "Netherlands", ES: "Países Bajos", FR: "Pays-Bas", DE: "Niederlande", IT: "Paesi Bassi", PT: "Países Baixos", RU: "Нидерланды", ZH: "荷兰", JA: "オランダ", AR: "هولندا" },
  "NZ": { EN: "New Zealand", ES: "Nueva Zelanda", FR: "Nouvelle-Zélande", DE: "Neuseeland", IT: "Nuova Zelanda", PT: "Nova Zelândia", RU: "Новая Зеландия", ZH: "新西兰", JA: "ニュージーランド", AR: "نيوزيلندا" },
  "NG": { EN: "Nigeria", ES: "Nigeria", FR: "Nigeria", DE: "Nigeria", IT: "Nigeria", PT: "Nigéria", RU: "Нигерия", ZH: "尼日利亚", JA: "ナイジェリア", AR: "نيجيريا" },
  "NO": { EN: "Norway", ES: "Noruega", FR: "Norvège", DE: "Norwegen", IT: "Norvegia", PT: "Noruega", RU: "Норвегия", ZH: "挪威", JA: "ノルウェー", AR: "النرويج" },
  
  // O
  "OM": { EN: "Oman", ES: "Omán", FR: "Oman", DE: "Oman", IT: "Oman", PT: "Omã", RU: "Оман", ZH: "阿曼", JA: "オマーン", AR: "عمان" },
  
  // P
  "PK": { EN: "Pakistan", ES: "Pakistán", FR: "Pakistan", DE: "Pakistan", IT: "Pakistan", PT: "Paquistão", RU: "Пакистан", ZH: "巴基斯坦", JA: "パキスタン", AR: "باكستان" },
  "PE": { EN: "Peru", ES: "Perú", FR: "Pérou", DE: "Peru", IT: "Perù", PT: "Peru", RU: "Перу", ZH: "秘鲁", JA: "ペルー", AR: "بيرو" },
  "PH": { EN: "Philippines", ES: "Filipinas", FR: "Philippines", DE: "Philippinen", IT: "Filippine", PT: "Filipinas", RU: "Филиппины", ZH: "菲律宾", JA: "フィリピン", AR: "الفلبين" },
  "PL": { EN: "Poland", ES: "Polonia", FR: "Pologne", DE: "Polen", IT: "Polonia", PT: "Polônia", RU: "Польша", ZH: "波兰", JA: "ポーランド", AR: "بولندا" },
  "PT": { EN: "Portugal", ES: "Portugal", FR: "Portugal", DE: "Portugal", IT: "Portogallo", PT: "Portugal", RU: "Португалия", ZH: "葡萄牙", JA: "ポルトガル", AR: "البرتغال" },
  "USPR": { EN: "Puerto Rico", ES: "Puerto Rico", FR: "Porto Rico", DE: "Puerto Rico", IT: "Porto Rico", PT: "Porto Rico", RU: "Пуэрто-Рико", ZH: "波多黎各", JA: "プエルトリコ", AR: "بورتوريكو" },
  
  // Q
  "QA": { EN: "Qatar", ES: "Catar", FR: "Qatar", DE: "Katar", IT: "Qatar", PT: "Catar", RU: "Катар", ZH: "卡塔尔", JA: "カタール", AR: "قطر" },
  
  // R
  "RO": { EN: "Romania", ES: "Rumanía", FR: "Roumanie", DE: "Rumänien", IT: "Romania", PT: "Romênia", RU: "Румыния", ZH: "罗马尼亚", JA: "ルーマニア", AR: "رومانيا" },
  "RU": { EN: "Russia", ES: "Rusia", FR: "Russie", DE: "Russland", IT: "Russia", PT: "Rússia", RU: "Россия", ZH: "俄罗斯", JA: "ロシア", AR: "روسيا" },
  
  // S
  "SA": { EN: "Saudi Arabia", ES: "Arabia Saudita", FR: "Arabie saoudite", DE: "Saudi-Arabien", IT: "Arabia Saudita", PT: "Arábia Saudita", RU: "Саудовская Аравия", ZH: "沙特阿拉伯", JA: "サウジアラビア", AR: "المملكة العربية السعودية" },
  "RS": { EN: "Serbia", ES: "Serbia", FR: "Serbie", DE: "Serbien", IT: "Serbia", PT: "Sérvia", RU: "Сербия", ZH: "塞尔维亚", JA: "セルビア", AR: "صربيا" },
  "SG": { EN: "Singapore", ES: "Singapur", FR: "Singapour", DE: "Singapur", IT: "Singapore", PT: "Singapura", RU: "Сингапур", ZH: "新加坡", JA: "シンガポール", AR: "سنغافورة" },
  "SK": { EN: "Slovakia", ES: "Eslovaquia", FR: "Slovaquie", DE: "Slowakei", IT: "Slovacchia", PT: "Eslováquia", RU: "Словакия", ZH: "斯洛伐克", JA: "スロバキア", AR: "سلوفاكيا" },
  "SI": { EN: "Slovenia", ES: "Eslovenia", FR: "Slovénie", DE: "Slowenien", IT: "Slovenia", PT: "Eslovênia", RU: "Словения", ZH: "斯洛文尼亚", JA: "スロベニア", AR: "سلوفينيا" },
  "ZA": { EN: "South Africa", ES: "Sudáfrica", FR: "Afrique du Sud", DE: "Südafrika", IT: "Sudafrica", PT: "África do Sul", RU: "ЮАР", ZH: "南非", JA: "南アフリカ", AR: "جنوب أفريقيا" },
  "ES": { EN: "Spain", ES: "España", FR: "Espagne", DE: "Spanien", IT: "Spagna", PT: "Espanha", RU: "Испания", ZH: "西班牙", JA: "スペイン", AR: "إسبانيا" },
  "LK": { EN: "Sri Lanka", ES: "Sri Lanka", FR: "Sri Lanka", DE: "Sri Lanka", IT: "Sri Lanka", PT: "Sri Lanka", RU: "Шри-Ланка", ZH: "斯里兰卡", JA: "スリランカ", AR: "سريلانكا" },
  "SE": { EN: "Sweden", ES: "Suecia", FR: "Suède", DE: "Schweden", IT: "Svezia", PT: "Suécia", RU: "Швеция", ZH: "瑞典", JA: "スウェーデン", AR: "السويد" },
  "CH": { EN: "Switzerland", ES: "Suiza", FR: "Suisse", DE: "Schweiz", IT: "Svizzera", PT: "Suíça", RU: "Швейцария", ZH: "瑞士", JA: "スイス", AR: "سويسرا" },
  
  // T
  "TW": { EN: "Taiwan", ES: "Taiwán", FR: "Taïwan", DE: "Taiwan", IT: "Taiwan", PT: "Taiwan", RU: "Тайвань", ZH: "台湾", JA: "台湾", AR: "تايوان" },
  "TH": { EN: "Thailand", ES: "Tailandia", FR: "Thaïlande", DE: "Thailand", IT: "Tailandia", PT: "Tailândia", RU: "Таиланд", ZH: "泰国", JA: "タイ", AR: "تايلاند" },
  "TR": { EN: "Turkey", ES: "Turquía", FR: "Turquie", DE: "Türkei", IT: "Turchia", PT: "Turquia", RU: "Турция", ZH: "土耳其", JA: "トルコ", AR: "تركيا" },
  
  // U
  "UA": { EN: "Ukraine", ES: "Ucrania", FR: "Ukraine", DE: "Ukraine", IT: "Ucraina", PT: "Ucrânia", RU: "Украина", ZH: "乌克兰", JA: "ウクライナ", AR: "أوكرانيا" },
  "AE": { EN: "United Arab Emirates", ES: "Emiratos Árabes Unidos", FR: "Émirats arabes unis", DE: "Vereinigte Arabische Emirate", IT: "Emirati Arabi Uniti", PT: "Emirados Árabes Unidos", RU: "ОАЭ", ZH: "阿联酋", JA: "アラブ首長国連邦", AR: "الإمارات العربية المتحدة" },
  "GB": { EN: "United Kingdom", ES: "Reino Unido", FR: "Royaume-Uni", DE: "Vereinigtes Königreich", IT: "Regno Unito", PT: "Reino Unido", RU: "Великобритания", ZH: "英国", JA: "イギリス", AR: "المملكة المتحدة" },
  "US": { EN: "United States", ES: "Estados Unidos", FR: "États-Unis", DE: "Vereinigte Staaten", IT: "Stati Uniti", PT: "Estados Unidos", RU: "США", ZH: "美国", JA: "アメリカ", AR: "الولايات المتحدة" },
  "UY": { EN: "Uruguay", ES: "Uruguay", FR: "Uruguay", DE: "Uruguay", IT: "Uruguay", PT: "Uruguai", RU: "Уругвай", ZH: "乌拉圭", JA: "ウルグアイ", AR: "أوروغواي" },
  
  // V
  "VN": { EN: "Vietnam", ES: "Vietnam", FR: "Viêt Nam", DE: "Vietnam", IT: "Vietnam", PT: "Vietnã", RU: "Вьетнам", ZH: "越南", JA: "ベトナム", AR: "فيتنام" },
};

// Get translated country name
export function getTranslatedCountryName(countryCode: string, language: Language): string {
  const upperCode = countryCode?.toUpperCase();
  const translation = countryTranslations[upperCode];
  
  if (translation) {
    return translation[language] || translation.EN;
  }
  
  // Return the country code if no translation found
  return countryCode;
}

// Get all translated country names for search
export function getAllTranslatedNames(countryCode: string): string[] {
  const upperCode = countryCode?.toUpperCase();
  const translation = countryTranslations[upperCode];
  
  if (translation) {
    return Object.values(translation);
  }
  
  return [countryCode];
}
