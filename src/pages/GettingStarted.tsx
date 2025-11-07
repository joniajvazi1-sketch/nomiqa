import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Shield, Coins, ArrowRight, ExternalLink, Download, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GettingStarted() {
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
                Get Started with
              </span>
              <span className="block bg-gradient-sunset bg-clip-text text-transparent mt-2">
                $NOMIQA
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-foreground/80 max-w-3xl mx-auto">
              Step-by-step guide to buying our token and using it for eSIM purchases
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="relative pb-20 px-4">
        <div className="container mx-auto max-w-4xl relative z-10">

          <div className="grid gap-6 mb-12">
            {guides.map((guide, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <guide.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{guide.title}</CardTitle>
                      <CardDescription>{guide.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3">
                    {guide.steps.map((step, stepIndex) => (
                      <li key={stepIndex} className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-medium flex-shrink-0">
                          {stepIndex + 1}
                        </div>
                        <span className="text-sm">{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Helpful Resources</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {resources.map((resource, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{resource.title}</CardTitle>
                    <CardDescription>{resource.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => window.open(resource.url, '_blank')}
                    >
                      Visit
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2">Ready to get your eSIM?</h3>
                  <p className="text-muted-foreground">
                    Now that you know how to use Phantom and Solana, browse our plans
                  </p>
                </div>
                <Button size="lg" onClick={() => window.location.href = '/shop'}>
                  Browse Plans
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}