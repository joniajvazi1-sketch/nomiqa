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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/90 via-deep-space/50 to-black/80 backdrop-blur-2xl border-b border-neon-cyan/20 shadow-2xl shadow-neon-cyan/5">
      {/* Decorative glow effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-neon-violet/5 via-transparent to-neon-cyan/5 pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-px bg-gradient-to-r from-transparent via-neon-cyan/30 to-transparent" />
      
      <div className="container mx-auto px-4 sm:px-6 relative">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-18">
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 sm:gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-neon-cyan/20 rounded-lg blur-md group-hover:bg-neon-cyan/30 transition-all duration-500" />
                <img src="/nomiqa-logo.jpg" alt="nomiqa" className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg relative z-10 opacity-95 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105" />
              </div>
              <span className="text-xl sm:text-2xl font-light bg-gradient-to-r from-neon-cyan via-white to-neon-violet bg-clip-text text-transparent group-hover:from-white group-hover:via-neon-cyan group-hover:to-white transition-all duration-500">
                nomiqa
              </span>
            </button>
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-5 xl:gap-6 ml-8">
            <button onClick={() => navigate(localizedPath('/shop', language))} className="text-white/60 hover:text-neon-cyan transition-all duration-300 font-light text-sm relative group">
              <span className="relative z-10">{t("shop")}</span>
              <span className="absolute inset-x-0 -bottom-1 h-px bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
            <button onClick={() => navigate(localizedPath('/getting-started', language))} className="text-white/60 hover:text-neon-cyan transition-all duration-300 font-light text-sm relative group">
              <span className="relative z-10">{t("howToBuy")}</span>
              <span className="absolute inset-x-0 -bottom-1 h-px bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
            <button onClick={() => navigate(localizedPath('/affiliate', language))} className="text-white/60 hover:text-neon-cyan transition-all duration-300 font-light text-sm relative group">
              <span className="relative z-10">{t("affiliate")}</span>
              <span className="absolute inset-x-0 -bottom-1 h-px bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
            <button onClick={() => navigate(localizedPath('/stake', language))} className="text-white/60 hover:text-neon-cyan transition-all duration-300 font-light text-sm relative group">
              <span className="relative z-10">{t("stake")}</span>
              <span className="absolute inset-x-0 -bottom-1 h-px bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
            <button onClick={() => navigate(localizedPath('/about', language))} className="text-white/60 hover:text-neon-cyan transition-all duration-300 font-light text-sm relative group">
              <span className="relative z-10">{t("aboutUs")}</span>
              <span className="absolute inset-x-0 -bottom-1 h-px bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
            <button onClick={() => navigate(localizedPath('/privacy', language))} className="text-white/60 hover:text-neon-cyan transition-all duration-300 font-light text-sm relative group">
              <span className="relative z-10">{t("howWeProtect")}</span>
              <span className="absolute inset-x-0 -bottom-1 h-px bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
            <button onClick={() => navigate(localizedPath('/help', language))} className="text-white/60 hover:text-neon-cyan transition-all duration-300 font-light text-sm relative group">
              <span className="relative z-10">{t("help")}</span>
              <span className="absolute inset-x-0 -bottom-1 h-px bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
            {user && (
              <button onClick={() => navigate(localizedPath('/orders', language))} className="text-white/60 hover:text-neon-cyan transition-all duration-300 font-light text-sm relative group">
                <span className="relative z-10">{t("myEsims")}</span>
                <span className="absolute inset-x-0 -bottom-1 h-px bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            )}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white/80 hover:text-neon-cyan hover:bg-neon-cyan/5 h-8 sm:h-9 gap-1 font-light border border-white/5 hover:border-neon-cyan/30 transition-all duration-300">
                  <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 hidden sm:block" />
                  <span className="text-xs sm:text-sm">{language} {languages.find(l => l.code === language)?.flag}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-[60] bg-gradient-to-b from-deep-space/98 to-black/98 backdrop-blur-2xl border-neon-cyan/20">
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
                    className="flex items-center justify-between hover:bg-white/5 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span>{l.flag}</span>
                      <span className="text-white/90 font-light">{l.name}</span>
                    </span>
                    {language === l.code && <Check className="w-4 h-4 text-neon-cyan" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Cart */}
            <Button variant="ghost" size="icon" className="relative hover:bg-neon-cyan/5 hover:border-neon-cyan/30 border border-white/5 transition-all duration-300 h-8 w-8 sm:h-9 sm:w-9" onClick={() => navigate(localizedPath('/checkout', language))} aria-label="Open cart">
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-white/80 group-hover:text-neon-cyan transition-colors duration-300" />
              {items.length > 0 && (
                <Badge className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-gradient-to-r from-neon-coral to-neon-orange text-white border-0 px-1 sm:px-1.5 py-0 text-[9px] sm:text-[10px] min-w-[16px] sm:min-w-[18px] h-4 sm:h-[18px] flex items-center justify-center shadow-glow-coral">
                  {items.length}
                </Badge>
              )}
            </Button>

            {/* Desktop Auth - Hidden on mobile */}
            <div className="hidden lg:flex gap-2">
              {user ? (
                <>
                  <Button variant="ghost" size="sm" onClick={() => navigate(localizedPath('/account', language))} className="text-white/80 hover:text-neon-cyan hover:bg-neon-cyan/5 border border-white/5 hover:border-neon-cyan/30 font-light text-sm transition-all duration-300">
                    My Account
                  </Button>
                  <Button variant="outline" size="sm" className="border-neon-violet/30 text-white/90 hover:bg-neon-violet/10 hover:border-neon-violet/50 hover:text-neon-violet font-light text-sm transition-all duration-300" onClick={handleSignOut}>
                    <LogOut className="w-3.5 h-3.5 mr-1.5" /> {t("signOut")}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/auth?mode=login')} className="text-white/80 hover:text-neon-cyan hover:bg-neon-cyan/5 border border-white/5 hover:border-neon-cyan/30 font-light text-sm transition-all duration-300">
                    Login
                  </Button>
                  <Button variant="outline" size="sm" className="border-neon-cyan/30 bg-neon-cyan/5 text-neon-cyan hover:bg-neon-cyan/10 hover:border-neon-cyan/50 font-light text-sm shadow-glow-cyan transition-all duration-300" onClick={() => navigate('/auth?mode=register')}>
                    Register
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu */}
            <div className="lg:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white/90 hover:text-neon-cyan hover:bg-neon-cyan/5 border border-white/5 hover:border-neon-cyan/30 h-8 w-8 sm:h-10 sm:w-10 transition-all duration-300">
                    <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] sm:w-[300px] bg-gradient-to-b from-deep-space/98 to-black/98 backdrop-blur-2xl border-neon-cyan/20">
                  <SheetHeader>
                    <SheetTitle className="text-white font-light text-lg">{t("menu")}</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-2 mt-8">
                    <button onClick={() => handleNavClick('/shop')} className="text-left text-white/70 hover:text-white hover:bg-white/5 transition-all duration-300 py-3 px-4 rounded-lg font-light text-sm">
                      {t("shop")}
                    </button>
                    <button onClick={() => handleNavClick('/getting-started')} className="text-left text-white/70 hover:text-white hover:bg-white/5 transition-all duration-300 py-3 px-4 rounded-lg font-light text-sm">
                      {t("howToBuy")}
                    </button>
                    <button onClick={() => handleNavClick('/affiliate')} className="text-left text-white/70 hover:text-white hover:bg-white/5 transition-all duration-300 py-3 px-4 rounded-lg font-light text-sm">
                      {t("affiliate")}
                    </button>
                    <button onClick={() => handleNavClick('/stake')} className="text-left text-white/70 hover:text-white hover:bg-white/5 transition-all duration-300 py-3 px-4 rounded-lg font-light text-sm">
                      {t("stake")}
                    </button>
                    <button onClick={() => handleNavClick('/about')} className="text-left text-white/70 hover:text-white hover:bg-white/5 transition-all duration-300 py-3 px-4 rounded-lg font-light text-sm">
                      {t("aboutUs")}
                    </button>
                    <button onClick={() => handleNavClick('/privacy')} className="text-left text-white/70 hover:text-white hover:bg-white/5 transition-all duration-300 py-3 px-4 rounded-lg font-light text-sm">
                      {t("howWeProtect")}
                    </button>
                    <button onClick={() => handleNavClick('/help')} className="text-left text-white/70 hover:text-white hover:bg-white/5 transition-all duration-300 py-3 px-4 rounded-lg font-light text-sm">
                      {t("help")}
                    </button>
                    {user && (
                      <>
                        <button onClick={() => handleNavClick('/account')} className="text-left text-white/70 hover:text-white hover:bg-white/5 transition-all duration-300 py-3 px-4 rounded-lg font-light text-sm">
                          My Account
                        </button>
                        <button onClick={() => handleNavClick('/orders')} className="text-left text-white/70 hover:text-white hover:bg-white/5 transition-all duration-300 py-3 px-4 rounded-lg font-light text-sm">
                          {t("myEsims")}
                        </button>
                      </>
                    )}

                    <div className="h-px bg-white/10 my-3" />

                    {/* Auth action in mobile menu */}
                    {user ? (
                      <button onClick={handleSignOut} className="text-left text-white/80 hover:text-white hover:bg-white/5 transition-all duration-300 py-3 px-4 rounded-lg font-light text-sm">
                        <span className="inline-flex items-center"><LogOut className="w-4 h-4 mr-2" /> {t('signOut')}</span>
                      </button>
                    ) : (
                      <>
                        <button onClick={() => { setMobileMenuOpen(false); navigate('/auth?mode=login'); }} className="text-left text-white/80 hover:text-white hover:bg-white/5 transition-all duration-300 py-3 px-4 rounded-lg font-light text-sm">
                          <span className="inline-flex items-center"><LogIn className="w-4 h-4 mr-2" /> Login</span>
                        </button>
                        <button onClick={() => { setMobileMenuOpen(false); navigate('/auth?mode=register'); }} className="text-left text-white/80 hover:text-white hover:bg-white/5 transition-all duration-300 py-3 px-4 rounded-lg font-light text-sm">
                          Register
                        </button>
                      </>
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
