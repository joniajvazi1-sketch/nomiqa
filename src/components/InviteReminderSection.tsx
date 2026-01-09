import { useTranslation } from '@/contexts/TranslationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift, Users, Zap, TrendingUp, ChevronRight, Percent } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const InviteReminderSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const tiers = [
    {
      title: t("inviteRewardBoostTitle"),
      description: t("inviteRewardBoostDesc"),
      icon: Zap,
      color: 'text-neon-cyan',
      bg: 'bg-neon-cyan/20',
      highlight: t("inviteRewardBoostHighlight"),
      detail: t("inviteRewardBoostDetail")
    },
    {
      title: t("inviteSalesCommissionTitle"),
      description: t("inviteSalesCommissionDesc"),
      icon: Percent,
      color: 'text-primary',
      bg: 'bg-primary/20',
      highlight: t("inviteSalesCommissionHighlight"),
      detail: t("inviteSalesCommissionDetail")
    },
    {
      title: t("inviteNetworkEarningsTitle"),
      description: t("inviteNetworkEarningsDesc"),
      icon: TrendingUp,
      color: 'text-green-500',
      bg: 'bg-green-500/20',
      highlight: t("inviteNetworkEarningsHighlight"),
      detail: t("inviteNetworkEarningsDetail")
    }
  ];

  return (
    <section className="py-16 md:py-24 px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-neon-cyan/10 rounded-full blur-[120px] -translate-y-1/2" />
      <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -translate-y-1/2" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 border-neon-cyan/30 text-neon-cyan bg-neon-cyan/5">
            <Gift className="w-3 h-3 mr-1" />
            {t("inviteBadge")}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("inviteTitle")} <span className="text-gradient-primary">{t("inviteTitleHighlight")}</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("inviteSubtitle")}
          </p>
        </div>

        {/* 3 Tier Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {tiers.map((tier, index) => {
            const Icon = tier.icon;
            return (
              <Card 
                key={tier.title}
                className="bg-card/50 border-border/50 backdrop-blur-sm overflow-hidden group hover:border-primary/30 transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`p-3 rounded-xl ${tier.bg}`}>
                      <Icon className={`w-6 h-6 ${tier.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground mb-1">{tier.title}</h3>
                      <p className="text-xs text-muted-foreground">{tier.description}</p>
                    </div>
                  </div>
                  
                  <div className="bg-background/50 rounded-xl p-4 text-center">
                    <p className={`text-2xl font-bold ${tier.color}`}>{tier.highlight}</p>
                    <p className="text-xs text-muted-foreground">{tier.detail}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            size="lg"
            onClick={() => navigate('/affiliate')}
            className="bg-gradient-to-r from-neon-cyan to-neon-violet hover:from-neon-cyan/90 hover:to-neon-violet/90 text-white font-semibold px-8 border-0"
          >
            <Users className="w-5 h-5 mr-2" />
            {t("inviteStartButton")}
          </Button>
          <Button 
            variant="outline"
            size="lg"
            onClick={() => navigate('/affiliate')}
            className="border-white/20 hover:border-white/40 hover:bg-white/5"
          >
            {t("learnMore")}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default InviteReminderSection;