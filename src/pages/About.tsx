import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Globe, Heart, Users, Zap } from "lucide-react";
import heroHappy from "@/assets/hero-happy.jpg";
import worldTravelers from "@/assets/world-travelers.jpg";
import happyTravelers from "@/assets/happy-travelers.jpg";

export default function About() {
  const values = [
    {
      icon: Globe,
      title: "Borderless",
      description: "We believe the world is one network, not 195 countries with walls between them.",
    },
    {
      icon: Heart,
      title: "Human-First",
      description: "Technology should serve people, not track them. Privacy is respect.",
    },
    {
      icon: Users,
      title: "Community-Owned",
      description: "Built on Web3 principles. Powered by the people who use it.",
    },
    {
      icon: Zap,
      title: "Instant Freedom",
      description: "No waiting, no verification, no barriers. Just instant global connection.",
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
                About Us
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-foreground/80 max-w-3xl mx-auto mb-6">
              How Nomiqa became the world's first privacy-first eSIM platform
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
                src={happyTravelers} 
                alt="Happy travelers" 
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
              />
            </div>
          </div>

          <div className="max-w-4xl mx-auto mb-16">
            <div className="p-8 md:p-12 rounded-3xl bg-card/40 backdrop-blur-sm border border-warm-sand/20 animate-fade-in-up">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 bg-gradient-sunrise bg-clip-text text-transparent">
                The Beginning
              </h2>
              <div className="space-y-4 text-foreground/80 leading-relaxed text-center md:text-left">
                <p className="text-lg">
                  Nomiqa was born from a simple frustration: <span className="text-neon-coral font-semibold">why should staying connected 
                  while traveling mean surrendering your privacy?</span>
                </p>
                <p>
                  Every international SIM required passport scans. Every data plan tracked your location. 
                  Every payment left a digital trail. The promise of a connected world came with invisible chains.
                </p>
                <p>
                  So we built the alternative: <span className="text-neon-cyan font-semibold">anonymous eSIMs powered by crypto</span>. 
                  No KYC. No tracking. No compromises. Just instant global connectivity that respects your right to privacy.
                </p>
                <p>
                  Today, Nomiqa serves the borderless generation — digital nomads, crypto natives, privacy advocates, 
                  and anyone who believes that <span className="text-warm-sand font-semibold">freedom shouldn't come with surveillance</span>.
                </p>
              </div>
            </div>
          </div>

          {/* Values Grid */}
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center bg-gradient-digital bg-clip-text text-transparent">
              What We Stand For
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
            <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/10 via-neon-coral/10 to-warm-sand/10 animate-shimmer"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-sunset bg-clip-text text-transparent">
                Our Vision
              </h2>
              <p className="text-xl md:text-2xl text-foreground/90 mb-6 leading-relaxed">
                A world where staying connected doesn't mean being tracked.
              </p>
              <p className="text-lg text-foreground/70 max-w-3xl mx-auto mb-8">
                Where digital nomads can roam freely, crypto natives can transact privately, 
                and everyone can access the internet without surveillance. 
                That's the world Nomiqa is building — one anonymous eSIM at a time.
              </p>
              <p className="text-2xl text-warm-sand">
                Your journey is global. Your data should be too.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
