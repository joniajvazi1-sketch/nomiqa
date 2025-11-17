import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StickyCTA } from "@/components/StickyCTA";
import { Shield, Eye, Lock, Globe, Fingerprint, Database } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";

export default function Privacy() {
  const { t } = useTranslation();
  
  const principles = [
    {
      icon: Eye,
      title: t("privacyPrinciple1Title"),
      description: t("privacyPrinciple1Desc"),
    },
    {
      icon: Fingerprint,
      title: t("privacyPrinciple2Title"),
      description: t("privacyPrinciple2Desc"),
    },
    {
      icon: Database,
      title: t("privacyPrinciple3Title"),
      description: t("privacyPrinciple3Desc"),
    },
    {
      icon: Lock,
      title: t("privacyPrinciple4Title"),
      description: t("privacyPrinciple4Desc"),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-deep-space to-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Encrypted data pattern background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-96 h-96 bg-neon-cyan/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-neon-violet/30 rounded-full blur-3xl"></div>
        </div>
        
        {/* Digital globe half-lit */}
        <div className="absolute right-10 top-1/2 -translate-y-1/2 hidden xl:block opacity-20">
          <div className="relative w-64 h-64">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-neon-coral via-neon-violet to-neon-cyan opacity-50 blur-2xl animate-pulse"></div>
            <Globe className="w-64 h-64 text-neon-cyan/50" />
          </div>
        </div>
        
        <div className="container max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-violet p-0.5">
              <div className="w-full h-full bg-card rounded-2xl flex items-center justify-center">
                <Shield className="w-10 h-10 text-neon-cyan" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 font-display">
              <span className="block bg-gradient-freedom bg-clip-text text-transparent">
                {t("privacyTitle")}
              </span>
              <span className="block bg-gradient-sunset bg-clip-text text-transparent mt-2">
                {t("privacySubtitle")}
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-foreground/80 max-w-3xl mx-auto mb-6">
              {t("privacyDescription")}
            </p>
          </div>

          {/* Privacy Principles */}
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {principles.map((principle, index) => (
              <div
                key={index}
                className="group p-8 rounded-3xl bg-card/40 backdrop-blur-sm border border-border/50 hover:border-neon-cyan/50 transition-all duration-500 hover:shadow-lg hover:shadow-neon-cyan/20 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-violet p-0.5 mb-6 mx-auto md:mx-0">
                  <div className="w-full h-full bg-card rounded-2xl flex items-center justify-center">
                    <principle.icon className="w-8 h-8 text-neon-cyan mx-auto" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-foreground text-center md:text-left">
                  {principle.title}
                </h3>
                <p className="text-foreground/70 leading-relaxed text-center md:text-left">
                  {principle.description}
                </p>
              </div>
            ))}
          </div>

          {/* How We Protect Section */}
          <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-digital bg-clip-text text-transparent">
              {t("privacyMethodsTitle")}
            </h2>
            <div className="space-y-4 text-foreground/80 leading-relaxed text-center md:text-left">
              <p>
                {t("privacyMethodsIntro")}
              </p>
              
              <div className="mt-8 space-y-6">
                <div className="p-6 rounded-2xl bg-card/60 border border-neon-cyan/20 text-center">
                  <h3 className="text-xl font-bold text-neon-cyan mb-3">{t("privacyMethod1Title")}</h3>
                  <p className="text-left">{t("privacyMethod1Desc")}</p>
                </div>

                <div className="p-6 rounded-2xl bg-card/60 border border-neon-violet/20 text-center">
                  <h3 className="text-xl font-bold text-neon-violet mb-3">{t("privacyMethod2Title")}</h3>
                  <p className="text-left">{t("privacyMethod2Desc")}</p>
                </div>

                <div className="p-6 rounded-2xl bg-card/60 border border-neon-coral/20 text-center">
                  <h3 className="text-xl font-bold text-neon-coral mb-3">{t("privacyMethod3Title")}</h3>
                  <p className="text-left">{t("privacyMethod3Desc")}</p>
                </div>

                <div className="p-6 rounded-2xl bg-card/60 border border-warm-sand/20 text-center">
                  <h3 className="text-xl font-bold text-warm-sand mb-3">{t("privacyMethod4Title")}</h3>
                  <p className="text-left">{t("privacyMethod4Desc")}</p>
                </div>

                <div className="p-6 rounded-2xl bg-card/60 border border-neon-cyan/20 text-center">
                  <h3 className="text-xl font-bold text-neon-cyan mb-3">{t("privacyMethod5Title")}</h3>
                  <p className="text-left">{t("privacyMethod5Desc")}</p>
                </div>
              </div>
              
              <p className="pt-6 text-lg font-semibold text-neon-coral text-center">
                {t("privacyClosing")}
              </p>
            </div>
          </div>

          {/* Quote Card */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-neon-violet/10 via-neon-coral/10 to-neon-cyan/10 border border-neon-violet/30 backdrop-blur-sm text-center">
            <p className="text-xl md:text-2xl text-warm-sand mb-4">
              {t("privacyQuote")}
            </p>
            <p className="text-foreground/60">
              {t("privacyQuoteAttribution")}
            </p>
          </div>
        </div>
      </section>
      
      <Footer />
      <StickyCTA />
    </div>
  );
}
