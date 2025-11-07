import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { ShoppingCart, LogOut, LogIn } from "lucide-react";
import { Badge } from "./ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { toast } from "sonner";

export const Navbar = () => {
  const navigate = useNavigate();
  const { items } = useCart();
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate('/');
  };

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
            <button
              onClick={() => navigate('/shop')}
              className="text-white/80 hover:text-white transition-colors"
            >
              Shop
            </button>
            <button
              onClick={() => navigate('/learn-crypto')}
              className="text-white/80 hover:text-white transition-colors"
            >
              Learn Crypto
            </button>
            <button
              onClick={() => navigate('/stake')}
              className="text-white/80 hover:text-white transition-colors"
            >
              Stake
            </button>
            <button
              onClick={() => navigate('/roadmap')}
              className="text-white/80 hover:text-white transition-colors"
            >
              Roadmap
            </button>
            <button
              onClick={() => navigate('/affiliate')}
              className="text-white/80 hover:text-white transition-colors"
            >
              Affiliate
            </button>
            {user && (
              <button
                onClick={() => navigate('/orders')}
                className="text-white/80 hover:text-white transition-colors"
              >
                My Orders
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <Button
                variant="cyber"
                size="sm"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            ) : (
              <Button
                variant="cyber"
                size="sm"
                onClick={() => navigate('/auth')}
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            )}
            
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