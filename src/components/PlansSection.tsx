import { PlanCard } from "./PlanCard";

export const PlansSection = () => {
  const plans = [
    {
      name: "Traveler",
      data: "5GB",
      validity: "30 days",
      price: "$19",
      features: [
        "Works in 100+ countries",
        "High-speed 4G/5G data",
        "No KYC required",
        "Instant activation",
      ],
    },
    {
      name: "Explorer",
      data: "10GB",
      validity: "30 days",
      price: "$35",
      popular: true,
      features: [
        "Works in 150+ countries",
        "High-speed 4G/5G data",
        "No KYC required",
        "Instant activation",
        "Priority support",
      ],
    },
    {
      name: "Nomad",
      data: "20GB",
      validity: "60 days",
      price: "$65",
      features: [
        "Works in 200+ countries",
        "High-speed 4G/5G data",
        "No KYC required",
        "Instant activation",
        "Priority support",
        "Earn NMQ tokens",
      ],
    },
  ];

  return (
    <section id="plans" className="py-20 bg-background">
      <div className="container px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Choose Your Plan</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            No contracts. No hidden fees. Just freedom to connect anywhere.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <PlanCard key={index} {...plan} />
          ))}
        </div>
      </div>
    </section>
  );
};