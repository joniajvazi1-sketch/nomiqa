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
  shop: { EN: "Shop", ES: "Shop", FR: "Shop", DE: "Shop", RU: "Shop", ZH: "Shop", JA: "Shop", PT: "Shop", AR: "Shop", HI: "Shop" },
  gettingStarted: { EN: "Getting Started", ES: "Getting Started", FR: "Getting Started", DE: "Getting Started", RU: "Getting Started", ZH: "Getting Started", JA: "Getting Started", PT: "Getting Started", AR: "Getting Started", HI: "Getting Started" },
  stake: { EN: "Stake", ES: "Stake", FR: "Stake", DE: "Stake", RU: "Stake", ZH: "Stake", JA: "Stake", PT: "Stake", AR: "Stake", HI: "Stake" },
  roadmap: { EN: "Roadmap", ES: "Roadmap", FR: "Roadmap", DE: "Roadmap", RU: "Roadmap", ZH: "Roadmap", JA: "Roadmap", PT: "Roadmap", AR: "Roadmap", HI: "Roadmap" },
  affiliate: { EN: "Affiliate", ES: "Affiliate", FR: "Affiliate", DE: "Affiliate", RU: "Affiliate", ZH: "Affiliate", JA: "Affiliate", PT: "Affiliate", AR: "Affiliate", HI: "Affiliate" },
  myOrders: { EN: "My Orders", ES: "My Orders", FR: "My Orders", DE: "My Orders", RU: "My Orders", ZH: "My Orders", JA: "My Orders", PT: "My Orders", AR: "My Orders", HI: "My Orders" },
  signIn: { EN: "Sign In", ES: "Sign In", FR: "Sign In", DE: "Sign In", RU: "Sign In", ZH: "Sign In", JA: "Sign In", PT: "Sign In", AR: "Sign In", HI: "Sign In" },
  signOut: { EN: "Sign Out", ES: "Sign Out", FR: "Sign Out", DE: "Sign Out", RU: "Sign Out", ZH: "Sign Out", JA: "Sign Out", PT: "Sign Out", AR: "Sign Out", HI: "Sign Out" },
  signUp: { EN: "Sign Up", ES: "Sign Up", FR: "Sign Up", DE: "Sign Up", RU: "Sign Up", ZH: "Sign Up", JA: "Sign Up", PT: "Sign Up", AR: "Sign Up", HI: "Sign Up" },

  // Hero
  heroTagline: { EN: "Your Signal Moves With You", ES: "Your Signal Moves With You", FR: "Your Signal Moves With You", DE: "Your Signal Moves With You", RU: "Your Signal Moves With You", ZH: "Your Signal Moves With You", JA: "Your Signal Moves With You", PT: "Your Signal Moves With You", AR: "Your Signal Moves With You", HI: "Your Signal Moves With You" },
  heroTitle: { EN: "The Signal of the Moving Class", ES: "The Signal of the Moving Class", FR: "The Signal of the Moving Class", DE: "The Signal of the Moving Class", RU: "The Signal of the Moving Class", ZH: "The Signal of the Moving Class", JA: "The Signal of the Moving Class", PT: "The Signal of the Moving Class", AR: "The Signal of the Moving Class", HI: "The Signal of the Moving Class" },
  heroSubtitle: { EN: "I navigate the world by my own rules.", ES: "I navigate the world by my own rules.", FR: "I navigate the world by my own rules.", DE: "I navigate the world by my own rules.", RU: "I navigate the world by my own rules.", ZH: "I navigate the world by my own rules.", JA: "I navigate the world by my own rules.", PT: "I navigate the world by my own rules.", AR: "I navigate the world by my own rules.", HI: "I navigate the world by my own rules." },
  browseEsims: { EN: "Explore eSIMs", ES: "Explore eSIMs", FR: "Explore eSIMs", DE: "Explore eSIMs", RU: "Explore eSIMs", ZH: "Explore eSIMs", JA: "Explore eSIMs", PT: "Explore eSIMs", AR: "Explore eSIMs", HI: "Explore eSIMs" },
  getStarted: { EN: "Begin Journey", ES: "Begin Journey", FR: "Begin Journey", DE: "Begin Journey", RU: "Begin Journey", ZH: "Begin Journey", JA: "Begin Journey", PT: "Begin Journey", AR: "Begin Journey", HI: "Begin Journey" },
  countries: { EN: "190+ Countries", ES: "190+ Countries", FR: "190+ Countries", DE: "190+ Countries", RU: "190+ Countries", ZH: "190+ Countries", JA: "190+ Countries", PT: "190+ Countries", AR: "190+ Countries", HI: "190+ Countries" },
  noKyc: { EN: "No KYC Required", ES: "No KYC Required", FR: "No KYC Required", DE: "No KYC Required", RU: "No KYC Required", ZH: "No KYC Required", JA: "No KYC Required", PT: "No KYC Required", AR: "No KYC Required", HI: "No KYC Required" },
  cryptoPayments: { EN: "Crypto Payments Only", ES: "Crypto Payments Only", FR: "Crypto Payments Only", DE: "Crypto Payments Only", RU: "Crypto Payments Only", ZH: "Crypto Payments Only", JA: "Crypto Payments Only", PT: "Crypto Payments Only", AR: "Crypto Payments Only", HI: "Crypto Payments Only" },

  // Footer
  footerTagline: { EN: "nomiqa - where privacy meets connection.", ES: "nomiqa - where privacy meets connection.", FR: "nomiqa - where privacy meets connection.", DE: "nomiqa - where privacy meets connection.", RU: "nomiqa - where privacy meets connection.", ZH: "nomiqa - where privacy meets connection.", JA: "nomiqa - where privacy meets connection.", PT: "nomiqa - where privacy meets connection.", AR: "nomiqa - where privacy meets connection.", HI: "nomiqa - where privacy meets connection." },
  footerSubtagline: { EN: "Powered by the people. Built for the borderless.", ES: "Powered by the people. Built for the borderless.", FR: "Powered by the people. Built for the borderless.", DE: "Powered by the people. Built for the borderless.", RU: "Powered by the people. Built for the borderless.", ZH: "Powered by the people. Built for the borderless.", JA: "Powered by the people. Built for the borderless.", PT: "Powered by the people. Built for the borderless.", AR: "Powered by the people. Built for the borderless.", HI: "Powered by the people. Built for the borderless." },
  
  // Common
  privacy: { EN: "Privacy", ES: "Privacy", FR: "Privacy", DE: "Privacy", RU: "Privacy", ZH: "Privacy", JA: "Privacy", PT: "Privacy", AR: "Privacy", HI: "Privacy" },
  about: { EN: "About", ES: "About", FR: "About", DE: "About", RU: "About", ZH: "About", JA: "About", PT: "About", AR: "About", HI: "About" },
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
