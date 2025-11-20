import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { DollarSign, Coins, XCircle } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";

export const ReferEarn = () => {
  const navigate = useNavigate();
  const { language } = useTranslation();

  return (
    <section className="py-20 md:py-32 px-4 relative overflow-hidden bg-gradient-to-br from-background via-deep-space to-background">
      {/* Background decorations */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-neon-cyan/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-neon-coral/10 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <span className="text-neon-coral text-sm md:text-base font-bold tracking-wider uppercase">
              💰 Real Earnings, Real Crypto
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 font-display">
            <span className="block bg-gradient-to-r from-neon-coral to-neon-purple bg-clip-text text-transparent">
              Refer & Earn
            </span>
            <span className="block text-2xl md:text-3xl text-foreground/80 mt-4 font-normal">
              Unlike Others, We Pay You Real Crypto
            </span>
          </h2>
        </div>

        {/* Comparison Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Competitors */}
          <Card className="border-2 border-red-500/30 bg-red-500/5 relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-foreground mb-4">Other Platforms</h3>
              <ul className="space-y-3 text-warm-sand/70">
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✗</span>
                  <span>Credits locked to their platform</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✗</span>
                  <span>Can't withdraw earnings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✗</span>
                  <span>Only usable for their products</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✗</span>
                  <span>No real financial value</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Nomiqa */}
          <Card className="border-2 border-neon-coral/50 bg-gradient-to-br from-neon-coral/10 to-neon-purple/10 relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <Coins className="w-8 h-8 text-neon-coral" />
            </div>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-neon-coral mb-4">Nomiqa Affiliate</h3>
              <ul className="space-y-3 text-warm-sand">
                <li className="flex items-start gap-2">
                  <span className="text-neon-coral">✓</span>
                  <span className="font-medium">Earn in USDC & SOL</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neon-coral">✓</span>
                  <span className="font-medium">Withdraw to your wallet anytime</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neon-coral">✓</span>
                  <span className="font-medium">Real money, real freedom</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neon-coral">✓</span>
                  <span className="font-medium">Up to 18% multi-level commission</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Earnings Cascade */}
        <Card className="border border-border/50 bg-card/50 backdrop-blur mb-8">
          <CardContent className="p-4 md:p-10">
            <div className="text-center mb-8 md:mb-10 max-w-2xl mx-auto">
              <h3 className="text-xl md:text-4xl font-bold text-foreground mb-3 md:mb-4">
                How Passive Income Works
              </h3>
              <p className="text-sm md:text-lg text-muted-foreground">
                You do the work once. Your network does the rest.
              </p>
            </div>

            <div className="space-y-6 md:space-y-8 max-w-3xl mx-auto">
              {/* Level 1 */}
              <div className="group">
                <div className="flex flex-col md:flex-row md:items-start gap-3 md:gap-6 p-4 md:p-6 bg-gradient-to-r from-neon-coral/5 to-transparent border-l-4 border-neon-coral rounded-lg hover:from-neon-coral/10 transition-all">
                  <div className="flex items-center gap-3 md:block">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-neon-coral/10 border-2 border-neon-coral/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg md:text-xl font-bold text-neon-coral">1</span>
                    </div>
                    <p className="text-xs md:text-sm text-neon-coral/80 font-medium uppercase tracking-wider md:mt-3">Direct Referral</p>
                  </div>
                  <div className="flex-1 space-y-2 md:space-y-3">
                    <p className="text-sm md:text-lg font-semibold text-foreground">You invite Sarah, she buys a $50 eSIM</p>
                    <div className="flex items-baseline gap-2 pt-1 md:pt-2">
                      <span className="text-2xl md:text-4xl font-bold text-neon-coral">$4.50</span>
                      <span className="text-xs md:text-sm text-muted-foreground">9% commission</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="relative py-2">
                <div className="absolute left-5 md:left-6 top-0 bottom-0 w-px bg-gradient-to-b from-border via-primary/50 to-border"></div>
                <div className="pl-12 md:pl-20">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-primary/10 border border-primary/20 rounded-full text-xs md:text-sm font-medium text-primary">
                    Passive income starts
                  </div>
                </div>
              </div>

              {/* Level 2 */}
              <div className="group">
                <div className="flex flex-col md:flex-row md:items-start gap-3 md:gap-6 p-4 md:p-6 bg-gradient-to-r from-neon-purple/5 to-transparent border-l-4 border-neon-purple rounded-lg hover:from-neon-purple/10 transition-all">
                  <div className="flex items-center gap-3 md:block">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-neon-purple/10 border-2 border-neon-purple/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg md:text-xl font-bold text-neon-purple">2</span>
                    </div>
                    <p className="text-xs md:text-sm text-neon-purple/80 font-medium uppercase tracking-wider md:mt-3">Tier 2 · Passive</p>
                  </div>
                  <div className="flex-1 space-y-2 md:space-y-3">
                    <div>
                      <p className="text-sm md:text-lg font-semibold text-foreground">Sarah invites Mike, he buys a $50 eSIM</p>
                      <p className="text-xs md:text-sm text-muted-foreground mt-1 md:mt-1.5">You don't know Mike. You don't talk to Mike.</p>
                    </div>
                    <div className="flex items-baseline gap-2 pt-1 md:pt-2">
                      <span className="text-2xl md:text-4xl font-bold text-neon-purple">$3.00</span>
                      <span className="text-xs md:text-sm text-muted-foreground">6% commission</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="relative py-1 md:py-0">
                <div className="absolute left-5 md:left-6 top-0 bottom-0 w-px bg-gradient-to-b from-border via-primary/50 to-border"></div>
              </div>

              {/* Level 3 */}
              <div className="group">
                <div className="flex flex-col md:flex-row md:items-start gap-3 md:gap-6 p-4 md:p-6 bg-gradient-to-r from-neon-cyan/5 to-transparent border-l-4 border-neon-cyan rounded-lg hover:from-neon-cyan/10 transition-all">
                  <div className="flex items-center gap-3 md:block">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-neon-cyan/10 border-2 border-neon-cyan/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg md:text-xl font-bold text-neon-cyan">3</span>
                    </div>
                    <p className="text-xs md:text-sm text-neon-cyan/80 font-medium uppercase tracking-wider md:mt-3">Tier 3 · Passive</p>
                  </div>
                  <div className="flex-1 space-y-2 md:space-y-3">
                    <div>
                      <p className="text-sm md:text-lg font-semibold text-foreground">Mike invites Lisa, she buys a $50 eSIM</p>
                      <p className="text-xs md:text-sm text-muted-foreground mt-1 md:mt-1.5">You've never heard of Lisa. She doesn't know you exist.</p>
                    </div>
                    <div className="flex items-baseline gap-2 pt-1 md:pt-2">
                      <span className="text-2xl md:text-4xl font-bold text-neon-cyan">$1.50</span>
                      <span className="text-xs md:text-sm text-muted-foreground">3% commission</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="mt-8 md:mt-12 p-5 md:p-8 bg-gradient-to-br from-background to-muted/20 border border-border rounded-xl">
                <div className="flex flex-col items-center gap-4 md:gap-6 md:flex-row md:justify-between">
                  <div className="text-center md:text-left w-full md:w-auto">
                    <p className="text-xs md:text-sm text-muted-foreground mb-2">Total from 3 sales</p>
                    <div className="flex items-baseline gap-2 justify-center md:justify-start">
                      <span className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-neon-coral via-neon-purple to-neon-cyan bg-clip-text text-transparent">
                        $9.00
                      </span>
                      <span className="text-sm md:text-base text-muted-foreground">USDC or SOL</span>
                    </div>
                  </div>
                  <div className="flex gap-4 md:flex-col md:gap-2 text-center md:text-right">
                    <div className="text-xs md:text-sm font-medium text-foreground">
                      $4.50 your work
                    </div>
                    <div className="text-xs md:text-sm font-medium text-primary">
                      $4.50 passive income
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 md:mt-12 max-w-2xl mx-auto space-y-5 md:space-y-6">
              <div className="p-4 md:p-6 bg-muted/30 border border-border/50 rounded-lg">
                <p className="text-xs md:text-base text-foreground/90 leading-relaxed">
                  When you have 10 people in your network, and they each bring 5 more, that's 50 people.
                  If those 50 each bring 3, that's 150 more people.
                  <span className="block mt-2 font-semibold text-primary text-sm md:text-base">
                    You earn from all of them. Without talking to 140 of them.
                  </span>
                </p>
              </div>
              
              <div className="text-center">
                <Button 
                  onClick={() => navigate(`/${language}/affiliate`)}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm md:text-base px-8 md:px-10 py-5 md:py-6 w-full md:w-auto"
                >
                  Get Started
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
