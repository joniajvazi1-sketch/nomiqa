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
                How We Protect
              </span>
              <span className="block bg-gradient-sunset bg-clip-text text-transparent mt-2">
                Customer Privacy
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-foreground/80 max-w-3xl mx-auto mb-6">
              Your data belongs to you. Here's how we keep it that way.
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
              Our Protection Methods
            </h2>
            <div className="space-y-4 text-foreground/80 leading-relaxed text-center md:text-left">
              <p>
                At Nomiqa, protecting customer privacy isn't just a feature — it's the foundation of everything we build. 
                Here's exactly how we keep your data secure and private:
              </p>
              
              <div className="mt-8 space-y-6">
                <div className="p-6 rounded-2xl bg-card/60 border border-neon-cyan/20 text-center">
                  <h3 className="text-xl font-bold text-neon-cyan mb-3">Zero-Knowledge Architecture</h3>
                  <p className="text-left">We operate on a zero-knowledge basis. No passport scans, no ID verification, no personal information collected. 
                  We don't know who you are, where you're going, or what you're doing online — and that's by design.</p>
                </div>

                <div className="p-6 rounded-2xl bg-card/60 border border-neon-violet/20 text-center">
                  <h3 className="text-xl font-bold text-neon-violet mb-3">Crypto-Only Payments</h3>
                  <p className="text-left">All transactions are conducted exclusively in cryptocurrency (Solana, USDC). This means no credit card companies, 
                  no banks, no payment processors with access to your purchase history. Your financial privacy is absolute.</p>
                </div>

                <div className="p-6 rounded-2xl bg-card/60 border border-neon-coral/20 text-center">
                  <h3 className="text-xl font-bold text-neon-coral mb-3">No Usage Tracking</h3>
                  <p className="text-left">Unlike traditional carriers, we don't monitor your browsing history, track your location, or log your data usage patterns. 
                  Once your eSIM is activated, your connection is yours alone.</p>
                </div>

                <div className="p-6 rounded-2xl bg-card/60 border border-warm-sand/20 text-center">
                  <h3 className="text-xl font-bold text-warm-sand mb-3">Decentralized Infrastructure</h3>
                  <p className="text-left">Built on Web3 principles with decentralized systems. No single point of failure, no central database of customer information 
                  that can be hacked or subpoenaed. Your privacy is protected by design, not just by policy.</p>
                </div>

                <div className="p-6 rounded-2xl bg-card/60 border border-neon-cyan/20 text-center">
                  <h3 className="text-xl font-bold text-neon-cyan mb-3">Minimal Data Retention</h3>
                  <p className="text-left">We only collect the absolute minimum data required to deliver your eSIM — typically just a delivery email address (which can be 
                  anonymous). No storage of browsing data, no retention of connection logs, no permanent records.</p>
                </div>
              </div>
              
              <p className="pt-6 text-lg font-semibold text-neon-coral text-center">
                Bottom line: We can't compromise what we never collect. Your privacy is mathematically guaranteed.
              </p>
            </div>
          </div>

          {/* Quote Card */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-neon-violet/10 via-neon-coral/10 to-neon-cyan/10 border border-neon-violet/30 backdrop-blur-sm text-center">
            <p className="text-xl md:text-2xl text-warm-sand mb-4">
              Your signal. Your rules. Your freedom.
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
