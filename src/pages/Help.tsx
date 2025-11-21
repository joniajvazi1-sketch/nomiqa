import { Navbar } from "@/components/Navbar";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { NetworkBackground } from "@/components/NetworkBackground";
import { Mail } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";

const Help = () => {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-black/40 via-deep-space/60 to-black/40 relative">
      <NetworkBackground />
      
      <div className="fixed inset-0 -z-10 overflow-hidden opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-neon-cyan/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-neon-violet/30 rounded-full blur-3xl"></div>
      </div>
      
      <Navbar />
      
      {/* Contact Section */}
      <section className="pt-24 pb-12 md:pt-32 md:pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-deep-space/80 via-midnight-blue/60 to-deep-space/80 backdrop-blur-sm"></div>
        
        <div className="container px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-coral bg-clip-text text-transparent">
              {t("contactTitle")}
            </h1>
            <p className="text-base md:text-lg text-foreground/80 mb-8">
              {t("contactSubtitle")}
            </p>
            
            <div className="bg-white/[0.02] backdrop-blur-xl border border-neon-cyan/30 rounded-2xl p-6 md:p-8 hover:border-neon-cyan/50 transition-all">
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-neon-cyan/20 rounded-full blur-xl"></div>
                  <div className="relative flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-neon-cyan/10 rounded-full flex-shrink-0">
                    <Mail className="w-7 h-7 md:w-8 md:h-8 text-neon-cyan" />
                  </div>
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">
                    {t("contactAvailable")}
                  </h3>
                  <a 
                    href="mailto:support@nomiqa.com" 
                    className="text-lg md:text-2xl font-bold text-neon-cyan hover:text-neon-violet transition-colors break-all"
                  >
                    support@nomiqa.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <FAQ />
      
      <Footer />
    </div>
  );
};

export default Help;
