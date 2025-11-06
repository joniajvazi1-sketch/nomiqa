import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bitcoin, Wallet, Shield, Coins, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LearnCrypto() {
  const guides = [
    {
      title: "Getting Started with Crypto Wallets",
      description: "Learn how to set up and secure your first crypto wallet",
      icon: Wallet,
      steps: [
        "Choose a reputable wallet (MetaMask, Trust Wallet, etc.)",
        "Download and install from official sources only",
        "Secure your seed phrase - never share it with anyone",
        "Enable 2FA and biometric authentication"
      ]
    },
    {
      title: "Buying Your First Crypto",
      description: "Step-by-step guide to purchasing cryptocurrency",
      icon: Bitcoin,
      steps: [
        "Create an account on a crypto exchange",
        "Complete identity verification (KYC)",
        "Add payment method (bank account or card)",
        "Purchase crypto and transfer to your wallet"
      ]
    },
    {
      title: "Paying with Crypto",
      description: "How to use crypto for purchases like eSIMs",
      icon: Coins,
      steps: [
        "Ensure you have enough crypto + gas fees",
        "Copy the payment address carefully",
        "Double-check the network (e.g., Ethereum, BSC)",
        "Confirm transaction and wait for confirmations"
      ]
    },
    {
      title: "Security Best Practices",
      description: "Keep your crypto safe from threats",
      icon: Shield,
      steps: [
        "Never share your private keys or seed phrase",
        "Use hardware wallets for large amounts",
        "Beware of phishing sites and scams",
        "Keep your wallet software updated"
      ]
    }
  ];

  const resources = [
    {
      title: "Ethereum.org",
      description: "Official Ethereum documentation and guides",
      url: "https://ethereum.org/en/wallets/"
    },
    {
      title: "MetaMask Learn",
      description: "Interactive tutorials for MetaMask wallet",
      url: "https://learn.metamask.io/"
    },
    {
      title: "CoinGecko",
      description: "Track crypto prices and learn about tokens",
      url: "https://www.coingecko.com/learn"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Learn How to Use Crypto</h1>
            <p className="text-xl text-muted-foreground">
              Everything you need to know to get started with cryptocurrency payments
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
                    Now that you know how crypto works, browse our plans
                  </p>
                </div>
                <Button size="lg" onClick={() => window.location.href = '/#shop'}>
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