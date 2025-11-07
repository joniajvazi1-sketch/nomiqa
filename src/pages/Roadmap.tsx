import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { HappyPeople } from "@/components/HappyPeople";

export default function Roadmap() {
  const phases = [
    {
      phase: "Q1 2025",
      status: "completed",
      title: "Foundation",
      items: [
        { text: "Platform launch with global eSIM coverage", done: true },
        { text: "Crypto payment integration", done: true },
        { text: "200+ countries supported", done: true },
        { text: "Anonymous activation system", done: true }
      ]
    },
    {
      phase: "Q2 2025",
      status: "in-progress",
      title: "Enhancement",
      items: [
        { text: "Mobile app release (iOS & Android)", done: true },
        { text: "Multi-chain payment support", done: true },
        { text: "Token rewards program", done: false },
        { text: "Referral system", done: false }
      ]
    },
    {
      phase: "Q3 2025",
      status: "upcoming",
      title: "DeFi Integration",
      items: [
        { text: "Staking platform launch", done: false },
        { text: "Governance token introduction", done: false },
        { text: "DAO formation", done: false },
        { text: "Liquidity mining programs", done: false }
      ]
    },
    {
      phase: "Q4 2025",
      status: "upcoming",
      title: "Expansion",
      items: [
        { text: "Partnership with major crypto wallets", done: false },
        { text: "Web3 identity integration", done: false },
        { text: "Decentralized roaming network", done: false },
        { text: "NFT-based membership tiers", done: false }
      ]
    },
    {
      phase: "2026",
      status: "future",
      title: "Innovation",
      items: [
        { text: "AI-powered network optimization", done: false },
        { text: "Cross-chain bridge for multiple tokens", done: false },
        { text: "Decentralized marketplace for eSIMs", done: false },
        { text: "Privacy-first messaging integration", done: false }
      ]
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Completed</Badge>;
      case "in-progress":
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">In Progress</Badge>;
      case "upcoming":
        return <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">Upcoming</Badge>;
      case "future":
        return <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30">Future</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Roadmap</h1>
            <p className="text-xl text-muted-foreground">
              Our journey to revolutionize global connectivity with crypto
            </p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-primary/20 hidden md:block" />

            <div className="space-y-8">
              {phases.map((phase, index) => (
                <Card key={index} className="relative">
                  {/* Timeline dot */}
                  <div className="absolute -left-4 top-8 w-8 h-8 bg-background border-4 border-primary rounded-full hidden md:flex items-center justify-center">
                    {phase.status === "completed" ? (
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    ) : phase.status === "in-progress" ? (
                      <Clock className="w-4 h-4 text-primary" />
                    ) : (
                      <Circle className="w-4 h-4 text-primary" />
                    )}
                  </div>

                  <CardHeader>
                    <div className="flex flex-col md:flex-row items-center md:items-start justify-between text-center md:text-left">
                      <div>
                        <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                          <CardTitle className="text-2xl">{phase.phase}</CardTitle>
                          {getStatusBadge(phase.status)}
                        </div>
                        <CardDescription className="text-lg font-semibold">
                          {phase.title}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-center md:text-left">
                      {phase.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start md:items-center gap-3 justify-center md:justify-start">
                          {item.done ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                          )}
                          <span className={item.done ? "text-foreground" : "text-muted-foreground"}>
                            {item.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="mt-12 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
            <CardContent className="pt-6 text-center">
              <h3 className="text-xl font-bold mb-2">This roadmap is evolving</h3>
              <p className="text-muted-foreground">
                We are constantly listening to our community and adapting our plans. 
                Follow our progress and share your feedback!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
      <HappyPeople />
    </div>
  );
}