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
          <CardContent className="p-6 md:p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Here's How You Get Paid Real Crypto
              </h3>
              <p className="text-base md:text-lg text-warm-sand/90 max-w-2xl mx-auto">
                You earn from 3 levels. Simple example: if someone YOU invited buys a $50 eSIM, here's what happens...
              </p>
            </div>

            <div className="space-y-4 md:space-y-6 max-w-3xl mx-auto">
              {/* Level 1 */}
              <div className="animate-fade-in flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 p-4 md:p-5 bg-neon-coral/10 border-2 border-neon-coral/30 rounded-xl shadow-lg">
                <div className="flex items-center gap-3 md:gap-4 flex-1">
                  <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full bg-neon-coral/30 flex items-center justify-center border-2 border-neon-coral">
                    <span className="text-xl md:text-2xl font-black text-neon-coral">1</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs md:text-sm text-warm-sand/80 mb-1 font-medium">STEP 1</p>
                    <p className="text-base md:text-lg font-bold text-foreground">Someone YOU invited buys $50 eSIM</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 md:gap-0 md:flex-col md:text-right ml-auto md:ml-0">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl md:text-4xl font-black text-neon-coral">$4.50</span>
                    <span className="text-sm md:text-base text-neon-coral/80 font-bold">= 9%</span>
                  </div>
                  <div className="px-3 py-1 bg-neon-coral/20 rounded-full">
                    <p className="text-[10px] md:text-xs text-neon-coral font-bold uppercase tracking-wide">Your Money</p>
                  </div>
                </div>
              </div>

              {/* Running Total 1 */}
              <div className="flex justify-center -my-2 md:-my-3">
                <div className="px-4 py-2 bg-background border-2 border-primary/30 rounded-full">
                  <p className="text-xs md:text-sm text-warm-sand/70">Your total so far: <span className="font-bold text-neon-coral">$4.50</span></p>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="text-neon-purple text-3xl md:text-4xl animate-pulse">↓</div>
              </div>

              {/* Level 2 */}
              <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 p-4 md:p-5 bg-neon-purple/10 border-2 border-neon-purple/30 rounded-xl shadow-lg">
                <div className="flex items-center gap-3 md:gap-4 flex-1">
                  <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full bg-neon-purple/30 flex items-center justify-center border-2 border-neon-purple">
                    <span className="text-xl md:text-2xl font-black text-neon-purple">2</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs md:text-sm text-warm-sand/80 mb-1 font-medium">STEP 2</p>
                    <p className="text-base md:text-lg font-bold text-foreground">That person invites someone, they buy $50</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 md:gap-0 md:flex-col md:text-right ml-auto md:ml-0">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl md:text-4xl font-black text-neon-purple">+$3.00</span>
                    <span className="text-sm md:text-base text-neon-purple/80 font-bold">= 6%</span>
                  </div>
                  <div className="px-3 py-1 bg-neon-purple/20 rounded-full">
                    <p className="text-[10px] md:text-xs text-neon-purple font-bold uppercase tracking-wide">Bonus!</p>
                  </div>
                </div>
              </div>

              {/* Running Total 2 */}
              <div className="flex justify-center -my-2 md:-my-3">
                <div className="px-4 py-2 bg-background border-2 border-primary/30 rounded-full">
                  <p className="text-xs md:text-sm text-warm-sand/70">Your total so far: <span className="font-bold text-neon-purple">$7.50</span></p>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="text-neon-cyan text-3xl md:text-4xl animate-pulse">↓</div>
              </div>

              {/* Level 3 */}
              <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 p-4 md:p-5 bg-neon-cyan/10 border-2 border-neon-cyan/30 rounded-xl shadow-lg">
                <div className="flex items-center gap-3 md:gap-4 flex-1">
                  <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full bg-neon-cyan/30 flex items-center justify-center border-2 border-neon-cyan">
                    <span className="text-xl md:text-2xl font-black text-neon-cyan">3</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs md:text-sm text-warm-sand/80 mb-1 font-medium">STEP 3</p>
                    <p className="text-base md:text-lg font-bold text-foreground">Their friend invites someone, they buy $50</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 md:gap-0 md:flex-col md:text-right ml-auto md:ml-0">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl md:text-4xl font-black text-neon-cyan">+$1.50</span>
                    <span className="text-sm md:text-base text-neon-cyan/80 font-bold">= 3%</span>
                  </div>
                  <div className="px-3 py-1 bg-neon-cyan/20 rounded-full">
                    <p className="text-[10px] md:text-xs text-neon-cyan font-bold uppercase tracking-wide">More!</p>
                  </div>
                </div>
              </div>

              {/* Final Total */}
              <div className="border-t-4 border-primary/30 pt-6 mt-8">
                <div className="p-6 md:p-8 bg-gradient-to-r from-neon-coral/20 via-neon-purple/20 to-neon-cyan/20 rounded-2xl border-4 border-primary/40 shadow-2xl">
                  <div className="text-center space-y-4">
                    <div className="space-y-2">
                      <p className="text-base md:text-lg text-warm-sand/80 font-medium uppercase tracking-wide">💰 YOU EARNED FROM JUST 3 SALES</p>
                      <div className="flex items-center justify-center gap-3">
                        <DollarSign className="w-8 h-8 md:w-10 md:h-10 text-neon-coral" />
                        <p className="text-5xl md:text-7xl font-black bg-gradient-to-r from-neon-coral via-neon-purple to-neon-cyan bg-clip-text text-transparent">
                          $9.00
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm md:text-base text-warm-sand/90 font-bold">✓ Withdrawn instantly to YOUR wallet</p>
                      <p className="text-xs md:text-sm text-warm-sand/70">Real USDC or SOL on Solana — not locked credits</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 md:mt-10 text-center space-y-6">
              <div className="p-6 bg-primary/10 border-2 border-primary/30 rounded-xl max-w-2xl mx-auto">
                <p className="text-base md:text-lg text-foreground font-bold mb-2">
                  🚀 Now imagine you have 10 people... 50 people... 100 people in your network
                </p>
                <p className="text-sm md:text-base text-warm-sand/80">
                  Each one buying, referring, creating MORE chains = MORE passive crypto income for you!
                </p>
              </div>
              
              <Button 
                onClick={() => navigate(`/${language}/affiliate`)}
                size="lg"
                className="bg-gradient-to-r from-neon-coral to-neon-purple hover:opacity-90 text-white font-bold text-base md:text-lg px-8 md:px-12 py-6 md:py-7 shadow-xl"
              >
                Start Earning Real Crypto Now →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
