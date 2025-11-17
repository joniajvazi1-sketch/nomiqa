import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StickyCTA } from "@/components/StickyCTA";
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
    <div className="min-h-screen bg-gradient-to-br from-background via-deep-space to-background">
      <Navbar />
      
      {/* Hero Section with warm imagery */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Warm gradient background - sunrise feeling */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-neon-coral/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-warm-sand/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        
        <div className="container max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16 animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 font-display">
              <span className="block bg-gradient-warmth bg-clip-text text-transparent">
                {t("aboutTitle")}
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-foreground/80 max-w-3xl mx-auto mb-6">
              {t("aboutSubtitle")}
            </p>
          </div>

          {/* Image Grid - Human Photography */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <div className="rounded-3xl overflow-hidden shadow-2xl animate-fade-in-up group">
              <img 
                src={heroHappy} 
                alt="Traveler with laptop" 
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
              />
            </div>
            <div className="rounded-3xl overflow-hidden shadow-2xl animate-fade-in-up group" style={{ animationDelay: "0.1s" }}>
              <img 
                src={worldTravelers} 
                alt="People traveling" 
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
              />
            </div>
            <div className="rounded-3xl overflow-hidden shadow-2xl animate-fade-in-up group" style={{ animationDelay: "0.2s" }}>
              <img 
                src={teamCollaboration} 
                alt="Team collaboration" 
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
              />
            </div>
          </div>

          <div className="max-w-4xl mx-auto mb-16">
            <div className="p-8 md:p-12 rounded-3xl bg-card/40 backdrop-blur-sm border border-warm-sand/20 animate-fade-in-up">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 bg-gradient-sunrise bg-clip-text text-transparent">
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
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center bg-gradient-digital bg-clip-text text-transparent">
              {t("aboutValuesSubtitle")}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {values.map((value, index) => (
                <div
                  key={index}
                  className="group p-8 rounded-3xl bg-card/40 backdrop-blur-sm border border-border/50 hover:border-neon-cyan/50 transition-all duration-500 hover:shadow-lg hover:shadow-neon-cyan/20 animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-coral p-0.5 mb-6 mx-auto md:mx-0">
                    <div className="w-full h-full bg-card rounded-2xl flex items-center justify-center">
                      <value.icon className="w-8 h-8 text-neon-cyan mx-auto" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-foreground text-center md:text-left">
                    {value.title}
                  </h3>
                  <p className="text-foreground/70 leading-relaxed text-center md:text-left">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Vision Statement with moving gradients */}
          <div className="relative p-12 rounded-3xl bg-gradient-to-br from-neon-violet/10 via-neon-coral/10 to-warm-sand/10 border border-neon-violet/30 backdrop-blur-sm text-center overflow-hidden">
            {/* Subtle moving gradient effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/5 via-neon-coral/5 to-warm-sand/5 animate-shimmer-soft" style={{ backgroundSize: '200% 100%' }}></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-sunset bg-clip-text text-transparent">
                {t("aboutVisionTitle")}
              </h2>
              <p className="text-xl md:text-2xl text-foreground/90 mb-6 leading-relaxed">
                {t("aboutVision1")}
              </p>
              <p className="text-lg text-foreground/70 max-w-3xl mx-auto mb-8">
                {t("aboutVision2")}
              </p>
              <p className="text-2xl text-warm-sand font-semibold">
                {t("aboutVision3")}
              </p>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
      <StickyCTA />
    </div>
  );
}
