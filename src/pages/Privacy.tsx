import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Shield, Eye, Lock, Globe, Fingerprint, Database } from "lucide-react";

export default function Privacy() {
  const principles = [
    {
      icon: Eye,
      title: "No Tracking",
      description: "We don't track your browsing, location, or usage patterns. Your journey is yours alone.",
    },
    {
      icon: Fingerprint,
      title: "No KYC Required",
      description: "Anonymous eSIMs mean no passport scans, no ID verification, no personal data collection.",
    },
    {
      icon: Database,
      title: "Minimal Data",
      description: "We only collect what's technically necessary to deliver your eSIM. Nothing more.",
    },
    {
      icon: Lock,
      title: "Crypto Payments Only",
      description: "No credit cards, no banks, no financial surveillance. Just pure crypto freedom.",
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
                Connection without
              </span>
              <span className="block bg-gradient-sunset bg-clip-text text-transparent mt-2">
                compromise.
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-foreground/80 max-w-3xl mx-auto mb-6">
              No tracking. No personal data. No compromises. Just connection.
            </p>
            
            <blockquote className="text-lg md:text-xl text-warm-sand/90 font-quote italic max-w-2xl mx-auto border-l-4 border-neon-coral pl-6">
              "Privacy isn't isolation. It's ownership of your connection."
            </blockquote>
          </div>

          {/* Privacy Principles */}
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {principles.map((principle, index) => (
              <div
                key={index}
                className="group p-8 rounded-3xl bg-card/40 backdrop-blur-sm border border-border/50 hover:border-neon-cyan/50 transition-all duration-500 hover:shadow-lg hover:shadow-neon-cyan/20 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-violet p-0.5 mb-6">
                  <div className="w-full h-full bg-card rounded-2xl flex items-center justify-center">
                    <principle.icon className="w-8 h-8 text-neon-cyan" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-foreground">
                  {principle.title}
                </h3>
                <p className="text-foreground/70 leading-relaxed">
                  {principle.description}
                </p>
              </div>
            ))}
          </div>

          {/* Philosophy Section */}
          <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-digital bg-clip-text text-transparent">
              Our Philosophy
            </h2>
            <div className="space-y-4 text-left text-foreground/80 leading-relaxed">
              <p>
                In a world where every click is tracked and every connection is monitored, 
                Nomiqa stands for a different vision: <span className="text-neon-cyan font-semibold">digital freedom without surveillance</span>.
              </p>
              <p>
                We believe that privacy is a fundamental human right, not a luxury. 
                Your travel data, your location history, your communication patterns — 
                <span className="text-neon-coral font-semibold"> they belong to you and you alone</span>.
              </p>
              <p>
                That's why we built Nomiqa on three uncompromising principles:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="flex items-start gap-3">
                  <span className="text-neon-cyan mt-1">•</span>
                  <span><strong className="text-neon-cyan">No personal data collection</strong> — We can't lose what we never had</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-neon-violet mt-1">•</span>
                  <span><strong className="text-neon-violet">Crypto-only payments</strong> — No banks, no financial tracking</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-neon-coral mt-1">•</span>
                  <span><strong className="text-neon-coral">Decentralized by design</strong> — Powered by Web3, owned by you</span>
                </li>
              </ul>
              <p className="pt-4 text-lg">
                Freedom is no longer physical — it's digital. And with Nomiqa, it's finally yours.
              </p>
            </div>
          </div>

          {/* Quote Card */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-neon-violet/10 via-neon-coral/10 to-neon-cyan/10 border border-neon-violet/30 backdrop-blur-sm text-center">
            <p className="text-xl md:text-2xl font-quote italic text-warm-sand mb-4">
              "Your signal. Your rules. Your freedom."
            </p>
            <p className="text-foreground/60">
              — The Nomiqa Promise
            </p>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
