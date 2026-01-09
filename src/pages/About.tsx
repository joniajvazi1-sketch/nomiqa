import { SiteNavigation } from "@/components/SiteNavigation";
import { SupportChatbot } from "@/components/SupportChatbot";
import { NetworkBackground } from "@/components/NetworkBackground";
import { SEO } from "@/components/SEO";
import { Globe, Heart, Users, Zap, Wifi, Shield, Coins } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";

export default function About() {
  const { t } = useTranslation();
  
  const values = [
    {
      icon: Globe,
      title: t("aboutValueBorderlessTitle"),
      description: t("aboutValueBorderlessDesc"),
    },
    {
      icon: Heart,
      title: t("aboutValueHumanTitle"),
      description: t("aboutValueHumanDesc"),
    },
    {
      icon: Users,
      title: t("aboutValueCommunityTitle"),
      description: t("aboutValueCommunityDesc"),
    },
    {
      icon: Zap,
      title: t("aboutValueFreedomTitle"),
      description: t("aboutValueFreedomDesc"),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black/40 via-deep-space/60 to-black/40 relative">
      <SEO page="about" />
      <NetworkBackground color="rgb(251, 146, 60)" />
      
      <div className="fixed inset-0 -z-10 overflow-hidden opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-orange-400/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-neon-coral/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-rose-500/20 rounded-full blur-3xl"></div>
      </div>
      
      {/* Hero Section */}
      <section className="relative pt-32 md:pt-40 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-deep-space/40 to-black/60"></div>
        
        <div className="container max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-12 md:mb-16 animate-fade-in-up">
            {/* Premium badge */}
            <div className="inline-block mb-6 md:mb-8">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-neon-coral via-neon-violet to-neon-cyan rounded-full blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
                <span className="relative block px-6 md:px-8 py-2.5 md:py-3 bg-white/[0.03] backdrop-blur-2xl border border-white/20 rounded-full text-xs md:text-sm font-light tracking-widest uppercase">
                  <span className="bg-gradient-to-r from-neon-coral via-neon-violet to-neon-cyan bg-clip-text text-transparent">
                    {t("aboutUs")}
                  </span>
                </span>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-extralight tracking-tight mb-6 md:mb-8">
              <span className="block bg-gradient-to-r from-white via-neon-cyan to-white bg-clip-text text-transparent">
                {t("aboutTitle")}
              </span>
            </h1>
            
            <p className="text-lg md:text-xl lg:text-2xl text-white/70 max-w-4xl mx-auto font-light leading-relaxed">
              {t("aboutSubtitle")}
            </p>
          </div>

          {/* Icon Grid instead of images */}
          <div className="grid grid-cols-3 gap-4 md:gap-6 mb-12 md:mb-16 max-w-2xl mx-auto">
            <div className="rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up group relative bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <Wifi className="w-12 h-12 md:w-16 md:h-16 text-neon-cyan" />
            </div>
            <div className="rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up group relative bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8 flex items-center justify-center" style={{ animationDelay: "0.1s" }}>
              <div className="absolute inset-0 bg-gradient-to-br from-neon-violet/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <Shield className="w-12 h-12 md:w-16 md:h-16 text-neon-violet" />
            </div>
            <div className="rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up group relative bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8 flex items-center justify-center" style={{ animationDelay: "0.2s" }}>
              <div className="absolute inset-0 bg-gradient-to-br from-neon-coral/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <Coins className="w-12 h-12 md:w-16 md:h-16 text-neon-coral" />
            </div>
          </div>

          {/* Story Section */}
          <div className="max-w-4xl mx-auto mb-12 md:mb-16">
            <div className="relative group p-8 md:p-12 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-white/20 animate-fade-in-up transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-neon-violet/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-light mb-6 md:mb-8 bg-gradient-to-r from-white via-neon-cyan to-white bg-clip-text text-transparent tracking-wide text-center">
                  {t("aboutStoryTitle")}
                </h2>
                <div className="space-y-4 md:space-y-5 text-white/70 leading-relaxed font-light text-center">
                  <p className="text-base md:text-lg">
                    {t("aboutStory1")}
                  </p>
                  <p className="text-base md:text-lg">
                    {t("aboutStory2")}
                  </p>
                  <p className="text-base md:text-lg text-white/90">
                    {t("aboutStory3")}
                  </p>
                  <p className="text-base md:text-lg">
                    {t("aboutStory4")}
                  </p>
                  <p className="text-base md:text-lg">
                    {t("aboutStory5")}
                  </p>
                  <p className="text-base md:text-lg">
                    {t("aboutStory6")}
                  </p>
                  <p className="text-base md:text-lg text-neon-coral">
                    {t("aboutStory7")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Values Grid */}
          <div className="mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light mb-8 md:mb-12 text-center bg-gradient-to-r from-white via-neon-violet to-white bg-clip-text text-transparent tracking-wide">
              {t("aboutValuesSubtitle")}
            </h2>
            <div className="grid md:grid-cols-2 gap-4 md:gap-6">
              {values.map((value, index) => (
                <div
                  key={index}
                  className="group relative p-6 md:p-8 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-500 hover:bg-white/[0.04] hover:scale-[1.02] animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="relative inline-block mb-4 md:mb-6">
                      <div className="absolute inset-0 bg-neon-cyan/20 rounded-full blur-xl group-hover:bg-neon-cyan/30 transition-all"></div>
                      <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center">
                        <value.icon className="w-6 h-6 md:w-7 md:h-7 text-neon-cyan" />
                      </div>
                    </div>
                    <h3 className="text-xl md:text-2xl font-light mb-2 md:mb-3 text-white text-center tracking-wide">
                      {value.title}
                    </h3>
                    <p className="text-sm md:text-base text-white/60 font-light leading-relaxed text-center">
                      {value.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vision Statement */}
          <div className="relative group p-8 md:p-12 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-white/20 text-center overflow-hidden transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-violet/5 via-transparent to-neon-coral/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-light mb-6 md:mb-8 bg-gradient-to-r from-white via-neon-violet to-white bg-clip-text text-transparent tracking-wide">
                {t("aboutVisionTitle")}
              </h2>
              <p className="text-lg md:text-xl lg:text-2xl text-white/80 mb-4 md:mb-6 leading-relaxed font-light">
                {t("aboutVision1")}
              </p>
              <p className="text-base md:text-lg text-white/60 max-w-3xl mx-auto mb-6 md:mb-8 font-light leading-relaxed">
                {t("aboutVision2")}
              </p>
              <p className="text-xl md:text-2xl text-neon-coral font-light">
                {t("aboutVision3")}
              </p>
            </div>
          </div>
        </div>
      </section>
      
      <SiteNavigation />
      <SupportChatbot />
    </div>
  );
}