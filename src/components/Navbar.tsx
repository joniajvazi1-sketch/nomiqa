import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { ShoppingCart, LogOut, LogIn, Menu, Globe } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/contexts/TranslationContext";

export const Navbar = () => {
  const navigate = useNavigate();
  const { items } = useCart();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useTranslation();

  const languages = [
    { code: "EN" as const, name: "English" },
    { code: "ES" as const, name: "Español" },
    { code: "FR" as const, name: "Français" },
    { code: "DE" as const, name: "Deutsch" },
    { code: "RU" as const, name: "Русский" },
    { code: "ZH" as const, name: "中文" },
    { code: "JA" as const, name: "日本語" },
    { code: "PT" as const, name: "Português" },
    { code: "AR" as const, name: "العربية" },
    { code: "HI" as const, name: "हिन्दी" },
  ];

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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-deep-space/95 backdrop-blur-xl border-b border-neon-cyan/20 shadow-lg shadow-neon-cyan/5">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="flex items-center gap-3 group">
              <img src="/src/assets/nomiqa-logo.jpg" alt="nomiqa" className="w-10 h-10 rounded-lg opacity-80 hover:opacity-100 transition-opacity" />
              <span className="text-2xl font-bold bg-gradient-neon bg-clip-text text-transparent hover:opacity-80 transition font-display">
                nomiqa
              </span>
            </button>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => navigate('/shop')}
              className="text-foreground/80 hover:text-neon-cyan transition-colors font-medium"
            >
              {t("shop")}
            </button>
            <button
              onClick={() => navigate('/getting-started')}
              className="text-foreground/80 hover:text-neon-cyan transition-colors font-medium"
            >
              How to Buy
            </button>
            <button
              onClick={() => navigate('/affiliate')}
              className="text-foreground/80 hover:text-neon-cyan transition-colors font-medium"
            >
              {t("affiliate")}
            </button>
            <button
              onClick={() => navigate('/stake')}
              className="text-foreground/80 hover:text-neon-cyan transition-colors font-medium"
            >
              Stake
            </button>
            <button
              onClick={() => navigate('/about')}
              className="text-foreground/80 hover:text-neon-cyan transition-colors font-medium"
            >
              About
            </button>
            <button
              onClick={() => navigate('/privacy')}
              className="text-foreground/80 hover:text-neon-cyan transition-colors font-medium"
            >
              Privacy
            </button>
            {user && (
              <button
                onClick={() => navigate('/orders')}
                className="text-foreground/80 hover:text-neon-cyan transition-colors font-medium"
              >
                {t("myOrders")}
              </button>
            )}
          </div>
          
          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="text-foreground">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] bg-background border-border">
                <SheetHeader>
                  <SheetTitle className="text-foreground">Menu</SheetTitle>
                </SheetHeader>
                
                <div className="flex flex-col gap-4 mt-8">
                  <button
                    onClick={() => handleNavClick('/shop')}
                    className="text-left text-foreground/70 hover:text-foreground transition-colors py-2 px-4 rounded hover:bg-muted"
                  >
                    {t("shop")}
                  </button>
                  <button
                    onClick={() => handleNavClick('/getting-started')}
                    className="text-left text-foreground/70 hover:text-foreground transition-colors py-2 px-4 rounded hover:bg-muted"
                  >
                    How to Buy
                  </button>
                  <button
                    onClick={() => handleNavClick('/affiliate')}
                    className="text-left text-foreground/70 hover:text-foreground transition-colors py-2 px-4 rounded hover:bg-muted"
                  >
                    {t("affiliate")}
                  </button>
                  <button
                    onClick={() => handleNavClick('/stake')}
                    className="text-left text-foreground/70 hover:text-foreground transition-colors py-2 px-4 rounded hover:bg-muted"
                  >
                    Stake
                  </button>
                  <button
                    onClick={() => handleNavClick('/about')}
                    className="text-left text-foreground/70 hover:text-foreground transition-colors py-2 px-4 rounded hover:bg-muted"
                  >
                    About
                  </button>
                  <button
                    onClick={() => handleNavClick('/privacy')}
                    className="text-left text-foreground/70 hover:text-foreground transition-colors py-2 px-4 rounded hover:bg-muted"
                  >
                    Privacy
                  </button>
                  {user && (
                    <button
                      onClick={() => handleNavClick('/orders')}
                      className="text-left text-foreground/70 hover:text-foreground transition-colors py-2 px-4 rounded hover:bg-muted"
                    >
                      {t("myOrders")}
                    </button>
                  )}
                  
                  <div className="border-t border-border pt-4 mt-4 space-y-2">
                    {user ? (
                      <Button
                        variant="cyber"
                        className="w-full"
                        onClick={handleSignOut}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        {t("signOut")}
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="cyber"
                          className="w-full"
                          onClick={() => handleNavClick('/auth')}
                        >
                          <LogIn className="w-4 h-4 mr-2" />
                          {t("signIn")}
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => handleNavClick('/auth')}
                        >
                          {t("signUp")}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">{language}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white z-50">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      toast.success(`Language changed to ${lang.name}`);
                    }}
                    className="cursor-pointer"
                  >
                    {lang.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <Button
                  variant="cyber"
                  size="sm"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {t("signOut")}
                </Button>
              ) : (
                <Button
                  variant="cyber"
                  size="sm"
                  onClick={() => navigate('/auth')}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  {t("signIn")}
                </Button>
              )}
            </div>
            
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