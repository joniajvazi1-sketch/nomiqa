import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { DollarSign, Coins, XCircle } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { localizedPath } from "@/utils/localizedLinks";
import { useEffect, useRef, useState } from "react";

export const ReferEarn = () => {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 md:py-24 lg:py-32 px-4 sm:px-6 relative overflow-hidden bg-gradient-to-br from-black/40 via-deep-space/60 to-black/40 border-y border-white/5">
      {/* Premium background decorations */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-cyan/3 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-coral/3 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Header */}
        <div className={`text-center mb-12 md:mb-16 lg:mb-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-block mb-3 md:mb-4">
            <span className="text-neon-coral text-[10px] sm:text-xs md:text-sm font-light tracking-[0.25em] uppercase">
              💰 Real Earnings, Real Crypto
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light mb-4 md:mb-6 px-4">
            <span className="block bg-gradient-to-r from-white via-white/95 to-white/90 bg-clip-text text-transparent">
              Refer & Earn
            </span>
            <span className="block text-lg sm:text-xl md:text-2xl lg:text-3xl text-white/70 mt-3 md:mt-4 font-extralight">
              Unlike Others, We Pay You Real Crypto
            </span>
          </h2>
        </div>

        {/* Comparison Cards */}
        <div className={`grid md:grid-cols-2 gap-5 sm:gap-6 md:gap-8 mb-12 md:mb-16 lg:mb-20 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Competitors */}
          <div className="relative p-6 sm:p-7 md:p-8 rounded-2xl md:rounded-3xl bg-white/[0.02] backdrop-blur-xl border-2 border-red-500/20 hover:border-red-500/30 transition-all duration-500">
            <div className="absolute top-4 right-4 sm:top-5 sm:right-5 md:top-6 md:right-6">
              <XCircle className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-red-500/70" />
            </div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-light text-white mb-5 md:mb-6">Other Platforms</h3>
            <ul className="space-y-3 sm:space-y-4 text-white/60">
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-red-500 text-sm sm:text-base flex-shrink-0">✗</span>
                <span className="text-xs sm:text-sm md:text-base font-light">Credits locked to their platform</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-red-500 text-sm sm:text-base flex-shrink-0">✗</span>
                <span className="text-xs sm:text-sm md:text-base font-light">Can't withdraw earnings</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-red-500 text-sm sm:text-base flex-shrink-0">✗</span>
                <span className="text-xs sm:text-sm md:text-base font-light">Only usable for their products</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-red-500 text-sm sm:text-base flex-shrink-0">✗</span>
                <span className="text-xs sm:text-sm md:text-base font-light">No real financial value</span>
              </li>
            </ul>
          </div>

          {/* Nomiqa */}
          <div className="relative p-6 sm:p-7 md:p-8 rounded-2xl md:rounded-3xl bg-gradient-to-br from-neon-coral/5 to-neon-violet/5 backdrop-blur-xl border-2 border-neon-coral/30 hover:border-neon-coral/50 transition-all duration-500 hover-lift">
            <div className="absolute top-4 right-4 sm:top-5 sm:right-5 md:top-6 md:right-6">
              <Coins className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-neon-coral" />
            </div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-light text-neon-coral mb-5 md:mb-6">Nomiqa Affiliate</h3>
            <ul className="space-y-3 sm:space-y-4 text-white">
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-neon-coral text-sm sm:text-base flex-shrink-0">✓</span>
                <span className="text-xs sm:text-sm md:text-base font-light">Earn in USDC & SOL</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-neon-coral text-sm sm:text-base flex-shrink-0">✓</span>
                <span className="text-xs sm:text-sm md:text-base font-light">Withdraw to your wallet anytime</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-neon-coral text-sm sm:text-base flex-shrink-0">✓</span>
                <span className="text-xs sm:text-sm md:text-base font-light">Real money, real freedom</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-neon-coral text-sm sm:text-base flex-shrink-0">✓</span>
                <span className="text-xs sm:text-sm md:text-base font-light">Up to 18% multi-level commission</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Earnings Cascade */}
        <div className="border border-white/10 bg-white/[0.02] backdrop-blur-xl rounded-2xl md:rounded-3xl mb-10 md:mb-12">
          <div className="p-6 sm:p-8 md:p-10 lg:p-12">
            <div className="text-center mb-10 md:mb-12 lg:mb-16 max-w-2xl mx-auto">
              <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-white mb-3 md:mb-5 px-4">
                How Passive Income Works
              </h3>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/70 font-light leading-relaxed px-4">
                You do the work once. Your network does the rest.
              </p>
            </div>

            <div className="space-y-6 sm:space-y-7 md:space-y-8 max-w-3xl mx-auto">
              {/* Level 1 */}
              <div className="group">
                <div className="flex flex-col md:flex-row md:items-start gap-3 sm:gap-4 md:gap-6 p-5 sm:p-6 md:p-7 bg-gradient-to-r from-neon-coral/5 to-transparent border-l-4 border-neon-coral rounded-xl md:rounded-2xl hover:from-neon-coral/10 transition-all duration-500 hover-lift text-center md:text-left">
                  <div className="flex items-center gap-3 md:block justify-center md:justify-start">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-neon-coral/10 border-2 border-neon-coral/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg sm:text-xl md:text-2xl font-light text-neon-coral">1</span>
                    </div>
                    <p className="text-[10px] sm:text-xs md:text-sm text-neon-coral/80 font-light uppercase tracking-[0.2em] md:mt-3">Direct Referral</p>
                  </div>
                  <div className="flex-1 space-y-2 sm:space-y-3">
                    <p className="text-sm sm:text-base md:text-lg font-light text-white">You invite Sarah, she buys a $50 eSIM</p>
                    <div className="flex items-baseline gap-2 pt-1 sm:pt-2 justify-center md:justify-start">
                      <span className="text-2xl sm:text-3xl md:text-4xl font-extralight text-neon-coral">$4.50</span>
                      <span className="text-xs sm:text-sm text-white/60 font-light">9% commission</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="relative py-2 sm:py-3">
                <div className="absolute left-1/2 md:left-7 top-0 bottom-0 w-px bg-gradient-to-b from-white/10 via-neon-coral/30 to-white/10 -translate-x-1/2 md:translate-x-0"></div>
                <div className="flex justify-center md:justify-start md:pl-20">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-neon-coral/10 border border-neon-coral/20 rounded-full text-[10px] sm:text-xs md:text-sm font-light text-neon-coral">
                    Passive income starts
                  </div>
                </div>
              </div>

              {/* Level 2 */}
              <div className="group">
                <div className="flex flex-col md:flex-row md:items-start gap-3 sm:gap-4 md:gap-6 p-5 sm:p-6 md:p-7 bg-gradient-to-r from-neon-violet/5 to-transparent border-l-4 border-neon-violet rounded-xl md:rounded-2xl hover:from-neon-violet/10 transition-all duration-500 hover-lift text-center md:text-left">
                  <div className="flex items-center gap-3 md:block justify-center md:justify-start">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-neon-violet/10 border-2 border-neon-violet/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg sm:text-xl md:text-2xl font-light text-neon-violet">2</span>
                    </div>
                    <p className="text-[10px] sm:text-xs md:text-sm text-neon-violet/80 font-light uppercase tracking-[0.2em] md:mt-3">Tier 2 · Passive</p>
                  </div>
                  <div className="flex-1 space-y-2 sm:space-y-3">
                    <div>
                      <p className="text-sm sm:text-base md:text-lg font-light text-white">Sarah invites Mike, he buys a $50 eSIM</p>
                      <p className="text-xs sm:text-sm text-white/60 font-light mt-1 sm:mt-1.5">You don't know Mike. You don't talk to Mike.</p>
                    </div>
                    <div className="flex items-baseline gap-2 pt-1 sm:pt-2 justify-center md:justify-start">
                      <span className="text-2xl sm:text-3xl md:text-4xl font-extralight text-neon-violet">$3.00</span>
                      <span className="text-xs sm:text-sm text-white/60 font-light">6% commission</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="relative py-1 sm:py-2">
                <div className="absolute left-1/2 md:left-7 top-0 bottom-0 w-px bg-gradient-to-b from-white/10 via-neon-violet/30 to-white/10 -translate-x-1/2 md:translate-x-0"></div>
              </div>

              {/* Level 3 */}
              <div className="group">
                <div className="flex flex-col md:flex-row md:items-start gap-3 sm:gap-4 md:gap-6 p-5 sm:p-6 md:p-7 bg-gradient-to-r from-neon-cyan/5 to-transparent border-l-4 border-neon-cyan rounded-xl md:rounded-2xl hover:from-neon-cyan/10 transition-all duration-500 hover-lift text-center md:text-left">
                  <div className="flex items-center gap-3 md:block justify-center md:justify-start">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-neon-cyan/10 border-2 border-neon-cyan/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg sm:text-xl md:text-2xl font-light text-neon-cyan">3</span>
                    </div>
                    <p className="text-[10px] sm:text-xs md:text-sm text-neon-cyan/80 font-light uppercase tracking-[0.2em] md:mt-3">Tier 3 · Passive</p>
                  </div>
                  <div className="flex-1 space-y-2 sm:space-y-3">
                    <div>
                      <p className="text-sm sm:text-base md:text-lg font-light text-white">Mike invites Lisa, she buys a $50 eSIM</p>
                      <p className="text-xs sm:text-sm text-white/60 font-light mt-1 sm:mt-1.5">You've never heard of Lisa. She doesn't know you exist.</p>
                    </div>
                    <div className="flex items-baseline gap-2 pt-1 sm:pt-2 justify-center md:justify-start">
                      <span className="text-2xl sm:text-3xl md:text-4xl font-extralight text-neon-cyan">$1.50</span>
                      <span className="text-xs sm:text-sm text-white/60 font-light">3% commission</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="mt-8 sm:mt-10 md:mt-12 p-6 sm:p-7 md:p-9 bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 rounded-xl md:rounded-2xl">
                <div className="flex flex-col items-center gap-5 md:gap-6 md:flex-row md:justify-between text-center md:text-left">
                  <div className="w-full md:w-auto">
                    <p className="text-xs sm:text-sm text-white/60 font-light mb-2">Total from 3 sales</p>
                    <div className="flex items-baseline gap-2 justify-center md:justify-start flex-wrap">
                      <span className="text-3xl sm:text-4xl md:text-5xl font-extralight bg-gradient-to-r from-neon-coral via-neon-violet to-neon-cyan bg-clip-text text-transparent">
                        $9.00
                      </span>
                      <span className="text-sm sm:text-base text-white/60 font-light">USDC or SOL</span>
                    </div>
                  </div>
                  <div className="flex gap-4 sm:gap-5 md:flex-col md:gap-2">
                    <div className="text-xs sm:text-sm font-light text-white/80">
                      $4.50 your work
                    </div>
                    <div className="text-xs sm:text-sm font-light text-neon-coral">
                      $4.50 passive income
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 sm:mt-10 md:mt-14 max-w-2xl mx-auto space-y-6 sm:space-y-7 md:space-y-8">
              <div className="p-5 sm:p-6 md:p-8 bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-xl md:rounded-2xl text-center md:text-left">
                <p className="text-sm sm:text-base md:text-lg text-white/80 font-light leading-relaxed">
                  When you have 10 people in your network, and they each bring 5 more, that's 50 people.
                  If those 50 each bring 3, that's 150 more people.
                  <span className="block mt-3 sm:mt-4 font-light text-neon-coral text-sm sm:text-base md:text-lg">
                    You earn from all of them. Without talking to 140 of them.
                  </span>
                </p>
              </div>
              
              <div className="text-center">
                <Button 
                  onClick={() => navigate(localizedPath('/affiliate', language))}
                  size="lg"
                  className="bg-white text-black hover:bg-white/90 font-light text-sm sm:text-base md:text-lg px-8 sm:px-10 md:px-12 py-5 sm:py-6 md:py-7 rounded-xl md:rounded-2xl shadow-lg hover:scale-105 transition-all duration-300 w-full sm:w-auto"
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
