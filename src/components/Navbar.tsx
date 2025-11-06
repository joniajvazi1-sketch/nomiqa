import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { ShoppingCart } from "lucide-react";
import { Badge } from "./ui/badge";

export const Navbar = () => {
  const navigate = useNavigate();
  const { items } = useCart();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-nomiqa-dark/95 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/')} className="text-2xl font-bold text-white hover:opacity-80 transition">
              nomiqa
            </button>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="/#shop" className="text-white/80 hover:text-white transition-colors">
              Shop
            </a>
            <a href="/#coverage" className="text-white/80 hover:text-white transition-colors">
              Coverage
            </a>
            <a href="/#how-it-works" className="text-white/80 hover:text-white transition-colors">
              How It Works
            </a>
            <button
              onClick={() => navigate('/orders')}
              className="text-white/80 hover:text-white transition-colors"
            >
              My Orders
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            {items.length > 0 && (
              <Button
                variant="cyber"
                size="sm"
                onClick={() => navigate('/checkout')}
                className="relative"
              >
                <ShoppingCart className="w-4 h-4" />
                <Badge className="ml-1 bg-accent text-white">
                  {items.reduce((sum, item) => sum + item.quantity, 0)}
                </Badge>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};