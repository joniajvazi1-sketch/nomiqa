import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";

interface PlanCardProps {
  name: string;
  data: string;
  validity: string;
  price: string;
  features: string[];
  popular?: boolean;
}

export const PlanCard = ({ name, data, validity, price, features, popular }: PlanCardProps) => {
  return (
    <Card className={`relative p-6 ${popular ? 'border-accent border-2 shadow-glow-cyan' : ''}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-gradient-primary text-white px-4 py-1 rounded-full text-sm font-semibold">
            Most Popular
          </span>
        </div>
      )}
      
      <div className="mb-4">
        <h3 className="text-xl font-bold mb-2">{name}</h3>
        <div className="text-3xl font-bold text-accent mb-1">{price}</div>
        <div className="text-sm text-muted-foreground">{data} · {validity}</div>
      </div>
      
      <ul className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>
      
      <Button 
        variant={popular ? "hero" : "outline"} 
        className="w-full"
      >
        Add to Cart
      </Button>
    </Card>
  );
};