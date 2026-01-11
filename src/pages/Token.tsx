import { SiteNavigation } from "@/components/SiteNavigation";
import { SupportChatbot } from "@/components/SupportChatbot";
import { SEO } from "@/components/SEO";
import { Rocket, Users, Globe, Shield, TrendingUp, ArrowRight, Sparkles, Mail, CheckCircle, Loader2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useTranslation } from "@/contexts/TranslationContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Token = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
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

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      toast.error(t("tokenInvalidEmail"));
      return;
    }

    // Length limit
    if (email.length > 255) {
      toast.error(t("tokenInvalidEmail"));
      return;
    }

    setIsSubmitting(true);

    try {
      // Use secure Edge Function with rate limiting
      const { data, error } = await supabase.functions.invoke('join-waitlist', {
        body: { email: email.trim().toLowerCase(), source: "token_page" }
      });

      if (error) {
        // Handle edge function errors
        console.error("Waitlist error:", error);
        toast.error(t("tokenWaitlistError"));
        return;
      }

      if (data?.code === "ALREADY_EXISTS") {
        toast.info(t("tokenAlreadySubscribed"));
        setIsSubscribed(true);
      } else if (data?.code === "RATE_LIMITED") {
        toast.error("Too many requests. Please try again later.");
      } else if (data?.code === "DISPOSABLE_EMAIL") {
        toast.error("Please use a permanent email address.");
      } else if (data?.success) {
        setIsSubscribed(true);
        toast.success(t("tokenWaitlistSuccess"));
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (error) {
      console.error("Waitlist error:", error);
      toast.error(t("tokenWaitlistError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const utilities = [
    {
      icon: Users,
      title: t("tokenUtility1Title"),
      description: t("tokenUtility1Desc"),
    },
    {
      icon: TrendingUp,
      title: t("tokenUtility2Title"),
      description: t("tokenUtility2Desc"),
    },
    {
      icon: Shield,
      title: t("tokenUtility3Title"),
      description: t("tokenUtility3Desc"),
    },
    {
      icon: Globe,
      title: t("tokenUtility4Title"),
      description: t("tokenUtility4Desc"),
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <SEO page="token" />
      
      {/* Subtle gradient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      <main className="relative z-10 pt-28 md:pt-36 pb-24 px-4" ref={sectionRef}>
        <div className="max-w-5xl mx-auto">
          
          {/* Hero Section */}
          <div className={`text-center space-y-8 mb-20 md:mb-28 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">{t("tokenBadge")}</span>
            </div>

            {/* Main heading */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-light tracking-tight text-foreground">
                NOMIQA
              </h1>
              <p className="text-xl md:text-2xl lg:text-3xl font-light text-muted-foreground">
                {t("tokenComingSoon")}
              </p>
            </div>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-muted-foreground/80 max-w-2xl mx-auto font-light leading-relaxed">
              {t("tokenSubtitle")}
            </p>

            {/* Email Waitlist Form */}
            <div className="max-w-md mx-auto pt-4">
              {!isSubscribed ? (
                <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder={t("tokenEmailPlaceholder")}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 bg-white/[0.03] backdrop-blur-xl border-white/10 focus:border-primary/50 rounded-xl"
                      disabled={isSubmitting}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-12 px-6 gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t("tokenSubmitting")}
                      </>
                    ) : (
                      <>
                        {t("tokenNotifyMe")}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span className="text-primary font-medium">{t("tokenSubscribed")}</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground/60 mt-3">
                {t("tokenWaitlistNote")}
              </p>
            </div>

            {/* Subtle glow effect */}
            <div className="py-4 md:py-8">
              <div className="w-24 h-1 mx-auto bg-gradient-to-r from-transparent via-primary/50 to-transparent rounded-full" />
            </div>
            
            {/* Launch info */}
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Rocket className="w-5 h-5 text-accent" />
              <span className="font-light">{t("tokenLaunchingOn")}</span>
            </div>
          </div>

          {/* Token Utilities Section */}
          <div className={`mb-20 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-light text-foreground mb-3">
                {t("tokenUtilitiesTitle")}
              </h2>
              <p className="text-muted-foreground font-light">
                {t("tokenUtilitiesSubtitle")}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 md:gap-6">
              {utilities.map((utility, index) => (
                <div
                  key={index}
                  className="group p-6 md:p-8 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:bg-card/80"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                      <utility.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        {utility.title}
                      </h3>
                      <p className="text-muted-foreground font-light leading-relaxed text-sm md:text-base">
                        {utility.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Description Section */}
          <div className={`text-center max-w-2xl mx-auto mb-16 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-lg text-muted-foreground font-light leading-relaxed mb-6">
              {t("tokenDescription1")}
            </p>
            <p className="text-muted-foreground/70 font-light">
              {t("tokenDescription2")}
            </p>
          </div>

          {/* CTA Section */}
          <div className={`text-center transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="gap-2">
                <Link to="/affiliate">
                  {t("tokenStartEarning")}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/getting-started">
                  {t("tokenLearnMore")}
                </Link>
              </Button>
            </div>
          </div>

        </div>
      </main>

      <SiteNavigation />
      <SupportChatbot />
    </div>
  );
};

export default Token;