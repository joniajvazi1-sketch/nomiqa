import { Navbar } from "@/components/Navbar";
import { SiteNavigation } from "@/components/SiteNavigation";
import { Footer } from "@/components/Footer";
import { SupportChatbot } from "@/components/SupportChatbot";
import { NetworkBackground } from "@/components/NetworkBackground";
import { Globe, Heart, Users, Zap } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import heroHappy from "@/assets/hero-happy.jpg";
import worldTravelers from "@/assets/world-travelers.jpg";
import teamCollaboration from "@/assets/team-collaboration.png";

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
      <NetworkBackground />
      
      <div className="fixed inset-0 -z-10 overflow-hidden opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-neon-coral/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-neon-violet/30 rounded-full blur-3xl"></div>
      </div>
      
      <Navbar />
      
      {/* Hero Section with warm imagery */}
      <section className="relative pt-40 md:pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-deep-space/80 via-midnight-blue/60 to-deep-space/80 backdrop-blur-sm"></div>
        
        <div className="container max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16 animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 font-display">
              <span className="block bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-coral bg-clip-text text-transparent">
                {t("aboutTitle")}
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-foreground/80 max-w-3xl mx-auto mb-6">
              {t("aboutSubtitle")}
            </p>
          </div>

          {/* Image Grid - Human Photography - Horizontal Scroll on Mobile */}
          <div className="flex md:grid md:grid-cols-3 gap-6 mb-16 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 snap-x snap-mandatory md:snap-none scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            <div className="min-w-[85vw] md:min-w-0 rounded-3xl overflow-hidden shadow-2xl animate-fade-in-up group snap-center">
              <img 
                src={heroHappy} 
                alt="Traveler with laptop" 
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
              />
            </div>
            <div className="min-w-[85vw] md:min-w-0 rounded-3xl overflow-hidden shadow-2xl animate-fade-in-up group snap-center" style={{ animationDelay: "0.1s" }}>
              <img 
                src={worldTravelers} 
                alt="People traveling" 
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
              />
            </div>
            <div className="min-w-[85vw] md:min-w-0 rounded-3xl overflow-hidden shadow-2xl animate-fade-in-up group snap-center" style={{ animationDelay: "0.2s" }}>
              <img 
                src={teamCollaboration} 
                alt="Team collaboration" 
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
              />
            </div>
          </div>

          <div className="max-w-4xl mx-auto mb-16">
            <div className="p-8 md:p-12 rounded-3xl bg-white/[0.02] backdrop-blur-xl border border-white/10 animate-fade-in-up">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 bg-gradient-to-r from-neon-cyan to-neon-violet bg-clip-text text-transparent">
                {t("aboutStoryTitle")}
              </h2>
              <div className="space-y-4 text-foreground/80 leading-relaxed text-center md:text-left">
                <p className="text-lg">
                  {t("aboutStory1")}
                </p>
                <p className="text-lg">
                  {t("aboutStory2")}
                </p>
                <p className="text-lg font-semibold">
                  {t("aboutStory3")}
                </p>
                <p className="text-lg">
                  {t("aboutStory4")}
                </p>
                <p className="text-lg">
                  {t("aboutStory5")}
                </p>
                <p className="text-lg">
                  {t("aboutStory6")}
                </p>
                <p className="text-lg font-semibold text-neon-coral">
                  {t("aboutStory7")}
                </p>
              </div>
            </div>
          </div>

          {/* Values Grid */}
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center bg-gradient-to-r from-neon-violet to-neon-cyan bg-clip-text text-transparent">
              {t("aboutValuesSubtitle")}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {values.map((value, index) => (
                <div
                  key={index}
                  className="group p-8 rounded-3xl bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-neon-cyan/30 transition-all duration-500 hover:bg-white/[0.04] animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex flex-col items-center">
                    <div className="relative inline-block mb-6">
                      <div className="absolute inset-0 bg-neon-cyan/20 rounded-2xl blur-xl group-hover:bg-neon-cyan/30 transition-all"></div>
                      <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-neon-coral/20 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                        <value.icon className="w-8 h-8 text-neon-cyan" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-foreground text-center">
                      {value.title}
                    </h3>
                    <p className="text-foreground/70 leading-relaxed text-center">
                      {value.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vision Statement */}
          <div className="relative p-12 rounded-3xl bg-white/[0.02] backdrop-blur-xl border border-neon-violet/30 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-violet/5 via-transparent to-neon-coral/5 pointer-events-none"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-coral bg-clip-text text-transparent">
                {t("aboutVisionTitle")}
              </h2>
              <p className="text-xl md:text-2xl text-foreground/90 mb-6 leading-relaxed">
                {t("aboutVision1")}
              </p>
              <p className="text-lg text-foreground/70 max-w-3xl mx-auto mb-8">
                {t("aboutVision2")}
              </p>
              <p className="text-2xl text-neon-coral font-semibold">
                {t("aboutVision3")}
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
