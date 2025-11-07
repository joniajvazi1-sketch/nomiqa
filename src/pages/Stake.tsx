import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, TrendingUp, Lock, Zap, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Stake() {
  const features = [
    {
      icon: Coins,
      title: "Earn Rewards",
      description: "Stake your tokens and earn passive income while holding"
    },
    {
      icon: TrendingUp,
      title: "High APY",
      description: "Competitive annual percentage yields on your staked assets"
    },
    {
      icon: Lock,
      title: "Secure Staking",
      description: "Your assets are secured by smart contracts and blockchain technology"
    },
    {
      icon: Zap,
      title: "Instant Rewards",
      description: "Claim your staking rewards at any time"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
              Coming Soon
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Stake & Earn</h1>
            <p className="text-xl text-muted-foreground">
              Earn rewards by staking your crypto tokens
            </p>
          </div>

          <Card className="mb-12 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center gap-4 mb-6 text-center md:text-left">
                <div className="p-4 bg-primary/10 rounded-lg">
                  <Clock className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Staking Platform Under Development</h2>
                  <p className="text-muted-foreground">
                    We are building a secure and user-friendly staking platform
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground text-center md:text-left">
                Our staking platform will allow you to earn passive income on your crypto holdings. 
                Stake your tokens, earn rewards, and support the network - all in one place.
              </p>
            </CardContent>
          </Card>

          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-center">What to Expect</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <feature.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-center md:text-left">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="border-2 border-dashed border-primary/30">
            <CardContent className="pt-6 text-center">
              <h3 className="text-xl font-bold mb-2">Want to be notified?</h3>
              <p className="text-muted-foreground mb-4">
                Sign up to get early access when staking launches
              </p>
              <p className="text-sm text-muted-foreground">
                Stay tuned for updates on our roadmap!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}