import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ShoppingCart, LogOut, LogIn, Menu, Globe, Check } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Language, useTranslation } from "@/contexts/TranslationContext";
import { localizedPath } from "@/utils/localizedLinks";

export const Navbar = () => {
  const navigate = useNavigate();
  const { items } = useCart();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useTranslation();

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: "EN", name: "English", flag: "🇬🇧" },
    { code: "ES", name: "Español", flag: "🇪🇸" },
    { code: "FR", name: "Français", flag: "🇫🇷" },
    { code: "DE", name: "Deutsch", flag: "🇩🇪" },
    { code: "IT", name: "Italiano", flag: "🇮🇹" },
    { code: "PT", name: "Português", flag: "🇵🇹" },
    { code: "RU", name: "Русский", flag: "🇷🇺" },
    { code: "ZH", name: "中文", flag: "🇨🇳" },
    { code: "JA", name: "日本語", flag: "🇯🇵" },
    { code: "AR", name: "العربية", flag: "🇸🇦" },
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
    navigate("/");
  };

  const handleNavClick = (path: string) => {
    setMobileMenuOpen(false);
    navigate(localizedPath(path, language));
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-deep-space/95 backdrop-blur-xl border-b border-neon-cyan/20 shadow-lg shadow-neon-cyan/5">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="flex items-center gap-3 group">
              <img src="/nomiqa-logo.jpg" alt="nomiqa" className="w-10 h-10 rounded-lg opacity-80 hover:opacity-100 transition-opacity" />
              <span className="text-2xl font-bold bg-gradient-neon bg-clip-text text-transparent hover:opacity-80 transition font-display">
                nomiqa
              </span>
            </button>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6 ml-8">
            <button onClick={() => navigate(localizedPath('/shop', language))} className="text-foreground/80 hover:text-neon-cyan transition-colors font-medium">
              {t("shop")}
            </button>
            <button onClick={() => navigate(localizedPath('/getting-started', language))} className="text-foreground/80 hover:text-neon-cyan transition-colors font-medium text-sm">
              {t("howToBuy")}
            </button>
            <button onClick={() => navigate(localizedPath('/affiliate', language))} className="text-foreground/80 hover:text-neon-cyan transition-colors font-medium">
              {t("affiliate")}
            </button>
            <button onClick={() => navigate(localizedPath('/stake', language))} className="text-foreground/80 hover:text-neon-cyan transition-colors font-medium">
              {t("stake")}
            </button>
            <button onClick={() => navigate(localizedPath('/about', language))} className="text-foreground/80 hover:text-neon-cyan transition-colors font-medium">
              {t("aboutUs")}
            </button>
            <button onClick={() => navigate(localizedPath('/privacy', language))} className="text-foreground/80 hover:text-neon-cyan transition-colors font-medium text-sm">
              {t("howWeProtect")}
            </button>
            {user && (
              <button onClick={() => navigate(localizedPath('/orders', language))} className="text-foreground/80 hover:text-neon-cyan transition-colors font-medium">
                {t("myEsims")}
              </button>
            )}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-foreground h-9 gap-1">
                  <Globe className="w-4 h-4" />
                  <span className="text-sm">{language} {languages.find(l => l.code === language)?.flag}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-[60] bg-popover border-border">
                {languages.map((l) => (
                  <DropdownMenuItem
                    key={l.code}
                    onSelect={() => {
                      // Map languages to locale slugs used in routes
                      const slugMap: Record<Language, string> = {
                        EN: 'english', ES: 'espanol', FR: 'francais', DE: 'deutsch',
                        RU: 'russian', ZH: 'chinese', JA: 'japanese', PT: 'portugues', AR: 'arabic', IT: 'italiano'
                      };
                      const current = window.location.pathname;
                      const parts = current.split('/').filter(Boolean);
                      const knownSlugs = Object.values(slugMap);
                      if (parts.length && knownSlugs.includes(parts[0])) {
                        parts.shift();
                      }
                      const newPath = '/' + [slugMap[l.code], ...parts].join('/');
                      setLanguage(l.code);
                      navigate(newPath || '/');
                    }}
                    className="flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <span>{l.flag}</span>
                      <span>{l.name}</span>
                    </span>
                    {language === l.code && <Check className="w-4 h-4 text-neon-cyan" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Cart */}
            <Button variant="ghost" size="icon" className="relative" onClick={() => navigate(localizedPath('/checkout', language))} aria-label="Open cart">
              <ShoppingCart className="w-5 h-5 text-foreground" />
              {items.length > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-neon-coral text-white border-0 px-1.5 py-0 text-[10px]">
                  {items.length}
                </Badge>
              )}
            </Button>

            {/* Desktop Auth - Hidden on mobile */}
            <div className="hidden md:flex">
              {user ? (
                <Button variant="outline" className="border-neon-cyan/40 text-foreground hover:bg-neon-cyan/10" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" /> {t("signOut")}
                </Button>
              ) : (
                <Button variant="outline" className="border-neon-cyan/40 text-foreground hover:bg-neon-cyan/10" onClick={() => navigate('/auth')}>
                  <LogIn className="w-4 h-4 mr-2" /> {t("signIn")}
                </Button>
              )}
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-foreground h-10 w-10">
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] bg-background border-border">
                  <SheetHeader>
                    <SheetTitle className="text-foreground">{t("menu")}</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-4 mt-8">
                    <button onClick={() => handleNavClick('/shop')} className="text-left text-foreground/70 hover:text-foreground transition-colors py-2 px-4 rounded hover:bg-muted">
                      {t("shop")}
                    </button>
                    <button onClick={() => handleNavClick('/getting-started')} className="text-left text-foreground/70 hover:text-foreground transition-colors py-2 px-4 rounded hover:bg-muted">
                      {t("howToBuy")}
                    </button>
                    <button onClick={() => handleNavClick('/affiliate')} className="text-left text-foreground/70 hover:text-foreground transition-colors py-2 px-4 rounded hover:bg-muted">
                      {t("affiliate")}
                    </button>
                    <button onClick={() => handleNavClick('/stake')} className="text-left text-foreground/70 hover:text-foreground transition-colors py-2 px-4 rounded hover:bg-muted">
                      {t("stake")}
                    </button>
                    <button onClick={() => handleNavClick('/about')} className="text-left text-foreground/70 hover:text-foreground transition-colors py-2 px-4 rounded hover:bg-muted">
                      {t("aboutUs")}
                    </button>
                    <button onClick={() => handleNavClick('/privacy')} className="text-left text-foreground/70 hover:text-foreground transition-colors py-2 px-4 rounded hover:bg-muted">
                      {t("howWeProtect")}
                    </button>
                    {user && (
                      <button onClick={() => handleNavClick('/orders')} className="text-left text-foreground/70 hover:text-foreground transition-colors py-2 px-4 rounded hover:bg-muted">
                        {t("myEsims")}
                      </button>
                    )}

                    <div className="h-px bg-border my-2" />

                    {/* Auth action in mobile menu */}
                    {user ? (
                      <button onClick={handleSignOut} className="text-left text-foreground/80 hover:text-foreground transition-colors py-2 px-4 rounded hover:bg-muted">
                        <span className="inline-flex items-center"><LogOut className="w-4 h-4 mr-2" /> {t('signOut')}</span>
                      </button>
                    ) : (
                      <button onClick={() => handleNavClick('/auth')} className="text-left text-foreground/80 hover:text-foreground transition-colors py-2 px-4 rounded hover:bg-muted">
                        <span className="inline-flex items-center"><LogIn className="w-4 h-4 mr-2" /> {t('signIn')}</span>
                      </button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
