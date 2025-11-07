import { Smartphone, CreditCard, Globe, Award } from "lucide-react";

export const HowItWorks = () => {
  const steps = [
    {
      icon: Smartphone,
      title: "Choose Your Plan",
      description: "Select the perfect eSIM plan for your needs from our global coverage options.",
    },
    {
      icon: CreditCard,
      title: "Pay with Crypto",
      description: "Complete your purchase securely using cryptocurrency via NowPayments.",
    },
    {
      icon: Globe,
      title: "Activate Instantly",
      description: "Scan the QR code and activate your eSIM in seconds. No KYC required.",
    },
    {
      icon: Award,
      title: "Earn Rewards",
      description: "Get NMQ tokens with every purchase and refer friends to earn more.",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-gradient-to-br from-background via-secondary/30 to-background">
      <div className="container px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get connected in 4 simple steps. No paperwork, no waiting.
          </p>
        </div>
        
        <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="text-center animate-fade-in-up" style={{ animationDelay: `${index * 0.15}s` }}>
                <div className="mb-4 mx-auto w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow-purple hover:scale-110 transition-transform duration-300 animate-float" style={{ animationDelay: `${index * 0.3}s` }}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-primary">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};