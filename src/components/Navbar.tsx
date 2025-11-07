import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { ShoppingCart, LogOut, LogIn, Menu, X } from "lucide-react";
import { Badge } from "./ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const Navbar = () => {
  const navigate = useNavigate();
  const { items } = useCart();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    setMobileMenuOpen(false);
    navigate('/');
  };

  const handleNavClick = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
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
              onClick={() => navigate('/getting-started')}
              className="text-white/80 hover:text-white transition-colors"
            >
              Getting Started
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
          
          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] bg-nomiqa-dark border-white/10">
                <SheetHeader>
                  <SheetTitle className="text-white">Menu</SheetTitle>
                </SheetHeader>
                
                <div className="flex flex-col gap-4 mt-8">
                  <button
                    onClick={() => handleNavClick('/shop')}
                    className="text-left text-white/80 hover:text-white transition-colors py-2 px-4 rounded hover:bg-white/5"
                  >
                    Shop
                  </button>
                  <button
                    onClick={() => handleNavClick('/getting-started')}
                    className="text-left text-white/80 hover:text-white transition-colors py-2 px-4 rounded hover:bg-white/5"
                  >
                    Getting Started
                  </button>
                  <button
                    onClick={() => handleNavClick('/stake')}
                    className="text-left text-white/80 hover:text-white transition-colors py-2 px-4 rounded hover:bg-white/5"
                  >
                    Stake
                  </button>
                  <button
                    onClick={() => handleNavClick('/roadmap')}
                    className="text-left text-white/80 hover:text-white transition-colors py-2 px-4 rounded hover:bg-white/5"
                  >
                    Roadmap
                  </button>
                  <button
                    onClick={() => handleNavClick('/affiliate')}
                    className="text-left text-white/80 hover:text-white transition-colors py-2 px-4 rounded hover:bg-white/5"
                  >
                    Affiliate
                  </button>
                  {user && (
                    <button
                      onClick={() => handleNavClick('/orders')}
                      className="text-left text-white/80 hover:text-white transition-colors py-2 px-4 rounded hover:bg-white/5"
                    >
                      My Orders
                    </button>
                  )}
                  
                  <div className="border-t border-white/10 pt-4 mt-4">
                    {user ? (
                      <Button
                        variant="cyber"
                        className="w-full"
                        onClick={handleSignOut}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </Button>
                    ) : (
                      <Button
                        variant="cyber"
                        className="w-full"
                        onClick={() => handleNavClick('/auth')}
                      >
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
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