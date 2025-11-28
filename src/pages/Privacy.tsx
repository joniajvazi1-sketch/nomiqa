import { Navbar } from "@/components/Navbar";
import { SiteNavigation } from "@/components/SiteNavigation";
import { Footer } from "@/components/Footer";
import { SupportChatbot } from "@/components/SupportChatbot";
import { NetworkBackground } from "@/components/NetworkBackground";
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
    <div className="min-h-screen bg-gradient-to-br from-black/40 via-deep-space/60 to-black/40 relative">
      <NetworkBackground />
      
      <div className="fixed inset-0 -z-10 overflow-hidden opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-neon-cyan/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-neon-violet/30 rounded-full blur-3xl"></div>
      </div>
      
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-deep-space/80 via-midnight-blue/60 to-deep-space/80 backdrop-blur-sm"></div>
        
        <div className="container max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-neon-cyan/20 rounded-2xl blur-xl"></div>
              <div className="relative w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-neon-violet/20 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                <Shield className="w-10 h-10 text-neon-cyan" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 font-display">
              <span className="block bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-coral bg-clip-text text-transparent">
                {t("privacyTitle")}
              </span>
              <span className="block bg-gradient-to-r from-neon-coral via-neon-violet to-neon-cyan bg-clip-text text-transparent mt-2">
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
                className="group p-8 rounded-3xl bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-neon-cyan/30 transition-all duration-500 hover:bg-white/[0.04] animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex flex-col items-center">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-neon-cyan/20 rounded-2xl blur-xl group-hover:bg-neon-cyan/30 transition-all"></div>
                    <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-neon-violet/20 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                      <principle.icon className="w-8 h-8 text-neon-cyan" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-foreground text-center">
                    {principle.title}
                  </h3>
                  <p className="text-foreground/70 leading-relaxed text-center">
                    {principle.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* How We Protect Section - Centered */}
          <div className="text-center max-w-4xl mx-auto mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-extralight mb-8 bg-gradient-to-r from-neon-violet via-neon-cyan to-neon-violet bg-clip-text text-transparent text-center">
              {t("privacyMethodsTitle")}
            </h2>
            <div className="space-y-4 text-foreground/70 leading-relaxed text-center">
              <p className="text-lg md:text-xl font-light text-center">
                {t("privacyMethodsIntro")}
              </p>
              
              <div className="mt-12 space-y-6">
                <div className="group p-8 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:border-neon-cyan/40 hover:bg-white/[0.05] transition-all duration-500">
                  <h3 className="text-2xl font-light text-neon-cyan mb-4 text-center">{t("privacyMethod1Title")}</h3>
                  <p className="text-foreground/70 leading-relaxed text-center">{t("privacyMethod1Desc")}</p>
                </div>

                <div className="group p-8 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:border-neon-violet/40 hover:bg-white/[0.05] transition-all duration-500">
                  <h3 className="text-2xl font-light text-neon-violet mb-4 text-center">{t("privacyMethod2Title")}</h3>
                  <p className="text-foreground/70 leading-relaxed text-center">{t("privacyMethod2Desc")}</p>
                </div>

                <div className="group p-8 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:border-neon-coral/40 hover:bg-white/[0.05] transition-all duration-500">
                  <h3 className="text-2xl font-light text-neon-coral mb-4 text-center">{t("privacyMethod3Title")}</h3>
                  <p className="text-foreground/70 leading-relaxed text-center">{t("privacyMethod3Desc")}</p>
                </div>

                <div className="group p-8 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:border-warm-sand/40 hover:bg-white/[0.05] transition-all duration-500">
                  <h3 className="text-2xl font-light text-warm-sand mb-4 text-center">{t("privacyMethod4Title")}</h3>
                  <p className="text-foreground/70 leading-relaxed text-center">{t("privacyMethod4Desc")}</p>
                </div>

                <div className="group p-8 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:border-neon-cyan/40 hover:bg-white/[0.05] transition-all duration-500">
                  <h3 className="text-2xl font-light text-neon-cyan mb-4 text-center">{t("privacyMethod5Title")}</h3>
                  <p className="text-foreground/70 leading-relaxed text-center">{t("privacyMethod5Desc")}</p>
                </div>
              </div>
              
              <p className="pt-8 text-xl font-light text-neon-coral text-center">
                {t("privacyClosing")}
              </p>
            </div>
          </div>

          {/* Quote Card */}
          <div className="p-8 rounded-3xl bg-white/[0.02] backdrop-blur-xl border border-neon-violet/30 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-violet/5 via-transparent to-neon-coral/5 pointer-events-none"></div>
            <div className="relative">
              <p className="text-xl md:text-2xl text-neon-coral mb-4 font-semibold">
                {t("privacyQuote")}
              </p>
              <p className="text-foreground/60">
                {t("privacyQuoteAttribution")}
              </p>
            </div>
          </div>
        </div>
      </section>
      
      <SiteNavigation />
      <Footer />
      <SupportChatbot />
    </div>
  );
}
