import { FAQ } from "@/components/FAQ";
import { SiteNavigation } from "@/components/SiteNavigation";
import { SupportChatbot } from "@/components/SupportChatbot";
import { NetworkBackground } from "@/components/NetworkBackground";
import { SEO } from "@/components/SEO";
import { MessageCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/contexts/TranslationContext";

const Help = () => {
  const { t } = useTranslation();

  const handleChatbotClick = () => {
    // Trigger the chatbot
    const chatbotButton = document.querySelector('[aria-label="Open support chat"]');
    if (chatbotButton instanceof HTMLElement) {
      chatbotButton.click();
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-black/40 via-deep-space/60 to-black/40 relative">
      <SEO page="help" />
      <NetworkBackground />
      
      <div className="fixed inset-0 -z-10 overflow-hidden opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-neon-cyan/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-neon-violet/30 rounded-full blur-3xl"></div>
      </div>
      
      {/* Help Center Section */}
      <section className="pt-8 md:pt-16 pb-12 md:pb-16 relative overflow-hidden">
        {/* Premium background decorations */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-neon-cyan/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-neon-violet/5 rounded-full blur-3xl"></div>
        
        <div className="container px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-light mb-4 md:mb-6">
              <span className="bg-gradient-to-r from-neon-cyan via-white to-neon-violet bg-clip-text text-transparent">
                {t("helpCenterTitle")}
              </span>
            </h1>
            <p className="text-base md:text-lg text-white/70 mb-10 md:mb-12 font-light">
              {t("helpCenterSubtitle")}
            </p>

            {/* Support Options */}
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Ask Chatbot */}
              <div className="group relative bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:border-neon-cyan/40 rounded-2xl p-6 md:p-8 transition-all duration-300 hover:bg-white/[0.05] hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10">
                  <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-5 md:mb-6 bg-gradient-to-br from-neon-cyan/20 to-neon-cyan/10 rounded-2xl flex items-center justify-center border border-neon-cyan/20 group-hover:scale-110 transition-transform duration-300">
                    <MessageCircle className="w-7 h-7 md:w-8 md:h-8 text-neon-cyan" />
                  </div>
                  
                  <h3 className="text-lg md:text-xl font-light text-white mb-3">
                    {t("helpCenterChatbotTitle")}
                  </h3>
                  <p className="text-white/60 mb-5 md:mb-6 font-light text-sm">
                    {t("helpCenterChatbotDesc")}
                  </p>
                  
                  <Button 
                    onClick={handleChatbotClick}
                    className="w-full bg-white/[0.05] backdrop-blur-xl border-2 border-neon-cyan/30 text-white hover:bg-neon-cyan/10 hover:border-neon-cyan/50 font-light rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-neon-cyan/20"
                  >
                    {t("helpCenterChatbotButton")}
                  </Button>
                </div>
              </div>

              {/* Contact Us */}
              <div className="group relative bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:border-neon-violet/40 rounded-2xl p-6 md:p-8 transition-all duration-300 hover:bg-white/[0.05] hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-neon-violet/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10">
                  <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-5 md:mb-6 bg-gradient-to-br from-neon-violet/20 to-neon-violet/10 rounded-2xl flex items-center justify-center border border-neon-violet/20 group-hover:scale-110 transition-transform duration-300">
                    <Mail className="w-7 h-7 md:w-8 md:h-8 text-neon-violet" />
                  </div>
                  
                  <h3 className="text-lg md:text-xl font-light text-white mb-3">
                    {t("helpCenterEmailTitle")}
                  </h3>
                  <p className="text-white/60 mb-5 md:mb-6 font-light text-sm">
                    {t("helpCenterEmailDesc")}
                  </p>
                  
                  <a 
                    href="mailto:support@nomiqa-esim.com"
                    className="block w-full"
                  >
                    <Button 
                      className="w-full bg-white/[0.05] backdrop-blur-xl border-2 border-neon-violet/30 text-white hover:bg-neon-violet/10 hover:border-neon-violet/50 font-light rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-neon-violet/20"
                    >
                      support@nomiqa-esim.com
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <FAQ showAll />
      
      <SiteNavigation />
      <SupportChatbot />
    </div>
  );
};

export default Help;
