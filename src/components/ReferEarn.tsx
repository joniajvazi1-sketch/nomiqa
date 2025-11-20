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
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 mb-8">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                See How One $50 Sale Multiplies Into Real Crypto
              </h3>
              <p className="text-warm-sand/80">Your earnings cascade through your network</p>
            </div>

            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Level 1 */}
              <div className="animate-fade-in flex items-center gap-4 p-4 bg-neon-coral/10 border-2 border-neon-coral/30 rounded-lg">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-neon-coral/20 flex items-center justify-center">
                  <span className="text-xl font-bold text-neon-coral">1</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-warm-sand/70 mb-1">Your Direct Referral Buys</p>
                  <p className="text-lg font-bold text-foreground">$50 eSIM Sale</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-warm-sand/70 mb-1">You Earn</p>
                  <p className="text-2xl font-black text-neon-coral">$4.50</p>
                  <p className="text-xs text-warm-sand/60">(9%)</p>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="text-neon-purple text-3xl">↓</div>
              </div>

              {/* Level 2 */}
              <div className="flex items-center gap-4 p-4 bg-neon-purple/10 border-2 border-neon-purple/30 rounded-lg">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-neon-purple/20 flex items-center justify-center">
                  <span className="text-xl font-bold text-neon-purple">2</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-warm-sand/70 mb-1">Your Referral's Customer Buys</p>
                  <p className="text-lg font-bold text-foreground">$50 eSIM Sale</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-warm-sand/70 mb-1">You Earn</p>
                  <p className="text-2xl font-black text-neon-purple">+$3.00</p>
                  <p className="text-xs text-warm-sand/60">(6%)</p>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="text-neon-cyan text-3xl">↓</div>
              </div>

              {/* Level 3 */}
              <div className="flex items-center gap-4 p-4 bg-neon-cyan/10 border-2 border-neon-cyan/30 rounded-lg">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-neon-cyan/20 flex items-center justify-center">
                  <span className="text-xl font-bold text-neon-cyan">3</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-warm-sand/70 mb-1">Their Referral's Customer Buys</p>
                  <p className="text-lg font-bold text-foreground">$50 eSIM Sale</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-warm-sand/70 mb-1">You Earn</p>
                  <p className="text-2xl font-black text-neon-cyan">+$1.50</p>
                  <p className="text-xs text-warm-sand/60">(3%)</p>
                </div>
              </div>

              {/* Total */}
              <div className="border-t-2 border-primary/20 pt-6 mt-6">
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-neon-coral/20 via-neon-purple/20 to-neon-cyan/20 rounded-lg border-2 border-primary/30">
                  <div>
                    <p className="text-warm-sand/70 mb-1">Total Withdrawn to Your Wallet</p>
                    <p className="text-sm text-warm-sand/60">Real crypto, not platform credits</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end mb-1">
                      <DollarSign className="w-6 h-6 text-neon-coral" />
                      <p className="text-4xl font-black bg-gradient-to-r from-neon-coral via-neon-purple to-neon-cyan bg-clip-text text-transparent">
                        $9.00
                      </p>
                    </div>
                    <p className="text-sm text-warm-sand/70">in USDC or SOL</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center space-y-4">
              <p className="text-sm text-warm-sand/80 italic">
                Now imagine 10, 50, or 100 network chains... All paying you real crypto 🚀
              </p>
              
              <Button 
                onClick={() => navigate(`/${language}/affiliate`)}
                size="lg"
                className="bg-gradient-to-r from-neon-coral to-neon-purple hover:opacity-90 text-white font-bold px-8"
              >
                Start Earning Real Crypto Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
