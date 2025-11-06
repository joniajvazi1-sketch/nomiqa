import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useState } from "react";

export const Navbar = () => {
  const [cartCount] = useState(0);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-nomiqa-dark/95 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-white">
              nomiqa
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#shop" className="text-white/80 hover:text-white transition-colors">
              Shop
            </a>
            <a href="#coverage" className="text-white/80 hover:text-white transition-colors">
              Coverage
            </a>
            <a href="#how-it-works" className="text-white/80 hover:text-white transition-colors">
              How It Works
            </a>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="cyber" size="sm" className="relative">
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};