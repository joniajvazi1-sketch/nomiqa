import { Button } from "@/components/ui/button";
import { Coins, Gift, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const EarnRewardBlock = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: <Coins className="w-5 h-5" />,
      text: "Redeem tokens for extra data"
    },
    {
      icon: <Gift className="w-5 h-5" />,
      text: "Earn rewards for referrals"
    },
    {
      icon: <Users className="w-5 h-5" />,
      text: "Grow your private travel network"
    }
  ];

  return (
    <section className="py-12 px-4 bg-gradient-to-b from-background via-background/95 to-background">
      <div className="max-w-4xl mx-auto">
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 p-8 md:p-12">
          {/* Decorative glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent/20 rounded-full blur-3xl" />
          
          <div className="relative z-10 text-center space-y-6">
            {/* Headline */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <span className="text-2xl">🔥</span>
                <span className="text-sm font-medium text-primary">NEW</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Earn as You Connect.
              </h2>
            </div>

            {/* Subline */}
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Get rewarded with NOMIQA Tokens every time you activate or share your eSIM — powering the world's first crypto-enabled travel network.
            </p>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 rounded-lg bg-background/50 border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    {benefit.icon}
                  </div>
                  <p className="text-sm font-medium text-foreground text-left">
                    {benefit.text}
                  </p>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <div className="pt-6">
              <Button
                size="lg"
                variant="cyber"
                onClick={() => navigate('/token')}
                className="text-base px-8"
              >
                👉 Discover $NOMIQA Token
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
