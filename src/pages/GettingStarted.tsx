import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StickyCTA } from "@/components/StickyCTA";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Wallet, Shield, Coins, ArrowRight, ExternalLink, Download, TrendingUp, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/contexts/TranslationContext";

export default function GettingStarted() {
  const { t } = useTranslation();
  const guides = [
    {
      title: "Setting Up Phantom Wallet",
      description: "Your gateway to Solana - the fastest blockchain for payments",
      icon: Wallet,
      steps: [
        "Download Phantom from phantom.app (available as browser extension or mobile app)",
        "Click 'Create a new wallet' and follow the setup wizard",
        "Write down your 12-word recovery phrase on paper - NEVER share this with anyone",
        "Store your recovery phrase in a safe place - this is the only way to recover your wallet",
        "Set a strong password for quick access to your wallet"
      ]
    },
    {
      title: "Buying Solana (SOL)",
      description: "Get SOL to pay for eSIMs on Nomiqa",
      icon: Coins,
      steps: [
        "Open your Phantom wallet and click 'Buy'",
        "Choose a payment provider (Moonpay, Coinbase, etc.)",
        "Enter the amount of SOL you want to buy",
        "Complete the payment with your credit/debit card or bank transfer",
        "SOL will appear in your Phantom wallet within minutes"
      ]
    },
    {
      title: "Buying $NOMIQA Token",
      description: "Get Nomiqa tokens to earn rewards and access exclusive benefits",
      icon: TrendingUp,
      steps: [
        "Make sure you have SOL in your Phantom wallet (you'll need it to swap)",
        "Open Phantom and click on the 'Swap' button at the bottom",
        "Select SOL as the token you're swapping from",
        "Search for 'NOMIQA' or paste the token contract address in the 'To' field",
        "Enter the amount of SOL you want to swap for $NOMIQA",
        "Review the exchange rate and click 'Swap'",
        "Confirm the transaction - your $NOMIQA tokens will appear in your wallet",
        "Alternative: Use Jupiter (jup.ag) - Solana's most popular DEX for better rates"
      ]
    },
    {
      title: "Paying for Your eSIM",
      description: "How to complete your purchase with crypto",
      icon: Download,
      steps: [
        "Select your eSIM plan on Nomiqa",
        "At checkout, choose to pay with SOL, USDC, or $NOMIQA token for discount",
        "Copy the payment address shown",
        "Open Phantom wallet and click 'Send'",
        "Paste the address, enter the exact amount, and confirm",
        "Your eSIM will be delivered instantly after payment confirmation"
      ]
    },
    {
      title: "Security Best Practices",
      description: "Keep your crypto safe with Phantom",
      icon: Shield,
      steps: [
        "NEVER share your 12-word recovery phrase with anyone - not even Nomiqa support",
        "Enable biometric authentication (Face ID/fingerprint) in Phantom settings",
        "Beware of fake Phantom apps - only download from phantom.app",
        "Double-check wallet addresses before sending - crypto transactions are irreversible",
        "Start with small amounts until you're comfortable with the process"
      ]
    }
  ];

  const resources = [
    {
      title: "Phantom Wallet",
      description: "Download Phantom - the #1 Solana wallet",
      url: "https://phantom.app/"
    },
    {
      title: "What is Solana?",
      description: "Learn about the Solana blockchain",
      url: "https://solana.com/learn"
    },
    {
      title: "USDC on Solana",
      description: "Learn about USDC stablecoin on Solana",
      url: "https://www.circle.com/usdc"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-deep-space to-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Animated background glows */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-96 h-96 bg-neon-cyan/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-neon-violet/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-neon-coral/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }}></div>
        </div>
        
        <div className="container max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-neon-cyan via-neon-violet to-neon-coral p-0.5">
              <div className="w-full h-full bg-card rounded-2xl flex items-center justify-center">
                <Wallet className="w-10 h-10 text-neon-cyan" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 font-display">
              <span className="block bg-gradient-neon bg-clip-text text-transparent">
                {t("gettingStartedTitle1")}
              </span>
              <span className="block bg-gradient-sunset bg-clip-text text-transparent mt-2">
                {t("gettingStartedTitle2")}
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-foreground/80 max-w-3xl mx-auto">
              {t("gettingStartedSubtitle")}
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="relative pb-20 px-4">
        <div className="container mx-auto max-w-5xl relative z-10">

          {/* Guide Cards with Accordion */}
          <div className="mb-16">
            <Accordion type="single" collapsible defaultValue="item-0" className="space-y-4">
              {guides.map((guide, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="border-0 bg-card/40 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
                >
                  <AccordionTrigger className="px-6 py-6 hover:no-underline group">
                    <div className="flex items-center gap-4 text-left w-full">
                      <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-neon-cyan/20 via-neon-violet/20 to-neon-coral/20 flex items-center justify-center border border-neon-cyan/30 group-hover:border-neon-violet/50 transition-colors">
                        <guide.icon className="w-7 h-7 text-neon-cyan group-hover:text-neon-violet transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-foreground group-hover:text-neon-cyan transition-colors mb-1">
                          {guide.title}
                        </h3>
                        <p className="text-sm text-foreground/60 mb-2">
                          {guide.description}
                        </p>
                        <p className="text-xs text-neon-cyan/70 md:hidden flex items-center gap-1">
                          <span>Tap to expand</span>
                          <span className="animate-pulse">→</span>
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <div className="pt-4 space-y-4">
                      {guide.steps.map((step, stepIndex) => (
                        <div 
                          key={stepIndex} 
                          className="flex items-start gap-4 p-4 rounded-xl bg-background/50 border border-border/50 hover:border-neon-cyan/30 transition-all group/step"
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan to-neon-violet flex items-center justify-center text-white font-bold text-sm shadow-lg">
                            {stepIndex + 1}
                          </div>
                          <p className="text-sm text-foreground/80 leading-relaxed pt-1">
                            {step}
                          </p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Resources Section */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-3 bg-gradient-neon bg-clip-text text-transparent">
                Helpful Resources
              </h2>
              <p className="text-foreground/60">Quick links to get you started</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {resources.map((resource, index) => (
                <Card 
                  key={index} 
                  className="bg-card/40 backdrop-blur-sm border-border/50 hover:border-neon-cyan/50 transition-all hover:shadow-glow-cyan cursor-pointer group"
                  onClick={() => window.open(resource.url, '_blank')}
                >
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg group-hover:text-neon-cyan transition-colors">
                      {resource.title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {resource.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2 text-sm text-neon-cyan group-hover:gap-3 transition-all">
                      <span>Visit</span>
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-neon-violet/10 via-neon-coral/10 to-neon-cyan/10 border-neon-violet/30 backdrop-blur-sm shadow-glow-coral">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-neon-violet/5"></div>
            <CardContent className="pt-8 pb-8 relative z-10">
              <div className="flex flex-col items-center justify-center text-center gap-6">
                <div className="space-y-3">
                  <h3 className="text-3xl md:text-4xl font-bold bg-gradient-sunset bg-clip-text text-transparent">
                    Ready to Get Your eSIM?
                  </h3>
                  <p className="text-foreground/70 text-base md:text-lg max-w-xl mx-auto">
                    Now that you know how to use Phantom and Solana, browse our plans and connect anywhere
                  </p>
                </div>
                <Button 
                  size="lg" 
                  onClick={() => window.location.href = '/shop'}
                  className="bg-gradient-to-r from-neon-coral to-neon-violet hover:opacity-90 text-white shadow-glow-coral text-lg px-8 py-6 h-auto group"
                >
                  Browse Plans
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
      <StickyCTA />
    </div>
  );
}