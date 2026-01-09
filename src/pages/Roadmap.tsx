import { SiteNavigation } from "@/components/SiteNavigation";
import { SupportChatbot } from "@/components/SupportChatbot";
import { NetworkBackground } from "@/components/NetworkBackground";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";

export default function Roadmap() {
  const { t } = useTranslation();
  
  const phases = [
    {
      phase: t("roadmapPhase1Title"),
      status: "completed",
      title: t("roadmapPhase1Subtitle"),
      items: [
        { text: t("roadmapPhase1Item1"), done: true },
        { text: t("roadmapPhase1Item2"), done: true },
        { text: t("roadmapPhase1Item3"), done: true },
        { text: t("roadmapPhase1Item4"), done: true }
      ]
    },
    {
      phase: t("roadmapPhase2Title"),
      status: "completed",
      title: t("roadmapPhase2Subtitle"),
      items: [
        { text: t("roadmapPhase2Item1"), done: true },
        { text: t("roadmapPhase2Item2"), done: true },
        { text: t("roadmapPhase2Item3"), done: true },
        { text: t("roadmapPhase2Item4"), done: true }
      ]
    },
    {
      phase: t("roadmapPhase3Title"),
      status: "in-progress",
      title: t("roadmapPhase3Subtitle"),
      items: [
        { text: t("roadmapPhase3Item1"), done: true },
        { text: t("roadmapPhase3Item2"), done: true },
        { text: t("roadmapPhase3Item3"), done: false },
        { text: t("roadmapPhase3Item4"), done: false }
      ]
    },
    {
      phase: t("roadmapPhase4Title"),
      status: "upcoming",
      title: t("roadmapPhase4Subtitle"),
      items: [
        { text: t("roadmapPhase4Item1"), done: false },
        { text: t("roadmapPhase4Item2"), done: false },
        { text: t("roadmapPhase4Item3"), done: false },
        { text: t("roadmapPhase4Item4"), done: false }
      ]
    },
    {
      phase: t("roadmapPhase5Title"),
      status: "future",
      title: t("roadmapPhase5Subtitle"),
      items: [
        { text: t("roadmapPhase5Item1"), done: false },
        { text: t("roadmapPhase5Item2"), done: false },
        { text: t("roadmapPhase5Item3"), done: false },
        { text: t("roadmapPhase5Item4"), done: false }
      ]
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">{t("roadmapStatusCompleted")}</Badge>;
      case "in-progress":
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">{t("roadmapStatusInProgress")}</Badge>;
      case "upcoming":
        return <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">{t("roadmapStatusUpcoming")}</Badge>;
      case "future":
        return <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30">{t("roadmapStatusFuture")}</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black/40 via-deep-space/60 to-black/40 relative overflow-hidden">
      <SEO page="roadmap" />
      <NetworkBackground />
      
      {/* Premium glowing orbs background */}
      <div className="fixed inset-0 -z-10 overflow-hidden opacity-20">
        <div className="absolute top-20 right-20 w-96 h-96 bg-neon-violet/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 left-20 w-[500px] h-[500px] bg-neon-cyan/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-neon-coral/20 rounded-full blur-3xl"></div>
      </div>
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light mb-4 bg-gradient-to-r from-white via-neon-cyan to-white bg-clip-text text-transparent">{t("roadmapTitle")}</h1>
            <p className="text-lg md:text-xl text-white/70 font-light">
              {t("roadmapSubtitle")}
            </p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-neon-cyan via-neon-violet/50 to-neon-violet/20 hidden md:block" />

            <div className="space-y-8">
              {phases.map((phase, index) => (
                <Card key={index} className="relative bg-white/[0.03] backdrop-blur-xl border-white/10 hover:border-white/20 transition-all duration-300">
                  {/* Timeline dot */}
                  <div className="absolute -left-4 top-8 w-8 h-8 bg-gradient-to-br from-neon-cyan to-neon-violet border-4 border-background rounded-full hidden md:flex items-center justify-center shadow-lg shadow-neon-cyan/30">
                    {phase.status === "completed" ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : phase.status === "in-progress" ? (
                      <Clock className="w-4 h-4 text-white" />
                    ) : (
                      <Circle className="w-4 h-4 text-white" />
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
              <h3 className="text-xl font-bold mb-2">{t("roadmapEvolvingTitle")}</h3>
              <p className="text-muted-foreground">
                {t("roadmapEvolvingDesc")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <SiteNavigation />
      <SupportChatbot />
    </div>
  );
}
