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
      title: "Getting USDC on Solana",
      description: "USDC is a stablecoin (always $1) - also accepted on Nomiqa",
      icon: Coins,
      steps: [
        "In Phantom wallet, click 'Buy' and select USDC",
        "Or buy SOL first, then swap it for USDC using Phantom's swap feature",
        "Make sure you're getting USDC on Solana network (not Ethereum)",
        "USDC on Solana has very low fees compared to other networks",
        "Keep some SOL for transaction fees (about $0.01 per transaction)"
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
      description: "How to complete your purchase with Solana or USDC",
      icon: Download,
      steps: [
        "Select your eSIM plan on Nomiqa",
        "At checkout, choose to pay with SOL or USDC",
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
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Getting Started with Nomiqa</h1>
            <p className="text-xl text-muted-foreground">
              Everything you need to know to buy eSIMs with Solana or USDC on Solana
            </p>
          </div>

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
      </div>

      <Footer />
    </div>
  );
}