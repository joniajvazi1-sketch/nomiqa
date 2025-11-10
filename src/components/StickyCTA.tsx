import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { ShoppingBag, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const StickyCTA = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 800px down
      if (window.scrollY > 800 && !isDismissed) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isDismissed]);

  if (isDismissed) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-40 transition-all duration-300 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
      }`}
    >
      <div className="relative group">
        <Button
          variant="neon"
          size="lg"
          onClick={() => navigate('/shop')}
          className="shadow-glow-neon hover:shadow-glow-cyan transition-all pr-12"
        >
          <ShoppingBag className="w-5 h-5 mr-2" />
          <span className="hidden sm:inline">Get Your eSIM Now</span>
          <span className="sm:hidden">Buy Now</span>
        </Button>
        
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-muted/90 hover:bg-muted flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
