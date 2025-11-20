import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Crown, TrendingUp, Award, Zap } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { localizedPath } from "@/utils/localizedLinks";

export const LoyaltyProgram = () => {
  const navigate = useNavigate();
  const { language } = useTranslation();

  const tiers = [
    {
      name: "Bronze",
      icon: Award,
      cashback: "5%",
      color: "from-amber-600 to-amber-800",
      requirement: "Automatic",
    },
    {
      name: "Silver",
      icon: TrendingUp,
      cashback: "6%",
      color: "from-gray-400 to-gray-600",
      requirement: "$20 spent",
    },
    {
      name: "Gold",
      icon: Zap,
      cashback: "7%",
      color: "from-yellow-400 to-yellow-600",
      requirement: "$50 spent",
    },
    {
      name: "Platinum",
      icon: Crown,
      cashback: "10%",
      color: "from-purple-400 to-purple-600",
      requirement: "$150 spent",
    },
  ];

  return (
    <section className="py-16 md:py-24 px-4 bg-gradient-to-br from-background via-muted/30 to-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>

      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-block mb-4">
            <span className="text-primary text-sm md:text-base font-bold tracking-wider uppercase">
              🏆 Rewards Program
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Earn Cashback on Every Purchase
            </span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            The more you use Nomiqa, the more you save. Unlock higher tiers and earn up to 10% cashback in crypto.
          </p>
        </div>

        {/* Tiers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
          {tiers.map((tier, index) => {
            const Icon = tier.icon;
            return (
              <Card 
                key={tier.name} 
                className={`border-2 transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                  index === 3 ? 'border-primary/50 bg-gradient-to-br from-primary/5 to-accent/5' : 'border-border/50'
                }`}
              >
                <CardContent className="p-6 text-center space-y-4">
                  <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${tier.color} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{tier.name}</h3>
                    <div className="text-3xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      {tier.cashback}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">cashback</p>
                  </div>
                  <div className="pt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground font-medium">{tier.requirement}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Benefits */}
        <div className="bg-muted/30 border border-border/50 rounded-xl p-6 md:p-8 mb-8">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl mb-2">💰</div>
              <h4 className="font-semibold text-foreground mb-2">Real Crypto Cashback</h4>
              <p className="text-sm text-muted-foreground">Earn in USDC or SOL, not platform credits</p>
            </div>
            <div>
              <div className="text-2xl mb-2">⚡</div>
              <h4 className="font-semibold text-foreground mb-2">Instant Rewards</h4>
              <p className="text-sm text-muted-foreground">Cashback credited immediately after purchase</p>
            </div>
            <div>
              <div className="text-2xl mb-2">🚀</div>
              <h4 className="font-semibold text-foreground mb-2">Lifetime Tiers</h4>
              <p className="text-sm text-muted-foreground">Never lose your tier level once unlocked</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button 
            onClick={() => navigate(localizedPath('/account', language))}
            size="lg"
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-semibold px-10 py-6"
          >
            View My Rewards
          </Button>
        </div>
      </div>
    </section>
  );
};
