import { Navbar } from "@/components/Navbar";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { Mail } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";

const Help = () => {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-deep-space to-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-neon-cyan/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-neon-coral/10 rounded-full blur-3xl"></div>
      
      <Navbar />
      
      <div className="container mx-auto px-3 md:px-4 py-12 md:py-16 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8 md:mb-12 max-w-4xl mx-auto px-4">
            <div className="space-y-3 md:space-y-4 animate-fade-in">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-black font-display leading-tight tracking-tight">
                <span className="block bg-gradient-to-r from-warm-sand to-neon-coral bg-clip-text text-transparent mb-2">
                  {t("contactTitle")}
                </span>
              </h1>
              
              <p className="text-sm md:text-base lg:text-lg text-warm-sand/90 max-w-2xl mx-auto leading-relaxed">
                {t("contactSubtitle")}
              </p>
            </div>
          </div>

          {/* Contact Card */}
          <div className="max-w-3xl mx-auto mb-12 md:mb-16">
            <div className="bg-card/30 backdrop-blur-xl border border-neon-cyan/20 rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-glow-cyan transition-all">
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
                <div className="flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-neon-cyan/10 rounded-full flex-shrink-0">
                  <Mail className="w-7 h-7 md:w-8 md:h-8 text-neon-cyan" />
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
      </div>
      
      {/* FAQ Section */}
      <FAQ />
      
      <Footer />
    </div>
  );
};

export default Help;
