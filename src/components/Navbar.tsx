import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ShoppingCart, LogOut, LogIn, Menu, Globe, Check, User as UserIcon, Search, MapPin } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useProducts } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Language, useTranslation } from "@/contexts/TranslationContext";
import { localizedPath } from "@/utils/localizedLinks";
import { getTranslatedCountryName, getAllTranslatedNames } from "@/utils/countryTranslations";
import * as CountryFlags from 'country-flag-icons/react/3x2';

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items } = useCart();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const { language, setLanguage, t } = useTranslation();
  const { data: products } = useProducts();

  // Check if we're on the shop page
  const isShopPage = location.pathname.includes('/shop');

  // Scroll detection for blur effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    setDesktopMenuOpen(false);
    navigate("/");
  };

  const handleNavClick = (path: string) => {
    setMobileMenuOpen(false);
    setDesktopMenuOpen(false);
    navigate(localizedPath(path, language));
  };

  // Fuzzy search helper - calculates similarity between two strings
  const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    // Exact match
    if (s1 === s2) return 1;
    
    // Substring match
    if (s2.includes(s1) || s1.includes(s2)) return 0.8;
    
    // Character-based similarity
    let matches = 0;
    const maxLength = Math.max(s1.length, s2.length);
    for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
      if (s1[i] === s2[i]) matches++;
    }
    
    return matches / maxLength;
  };

  // Get search results with fuzzy matching - show unique countries only
  const getSearchResults = () => {
    if (!searchQuery.trim() || !products) return [];
    
    const searchLower = searchQuery.toLowerCase();
    
    // Group products by country and calculate best score for each country
    const countryMap = new Map<string, { countryCode: string; countryName: string; score: number }>();
    
    products.forEach(product => {
      const allCountryNames = getAllTranslatedNames(product.country_code);
      const currentCountryName = getTranslatedCountryName(product.country_code, language);
      
      // Calculate similarity scores
      const scores = [
        calculateSimilarity(searchLower, currentCountryName.toLowerCase()),
        ...allCountryNames.map(name => calculateSimilarity(searchLower, name.toLowerCase())),
      ];
      
      const maxScore = Math.max(...scores);
      
      // Only keep the best score for each country
      const existing = countryMap.get(product.country_code);
      if (!existing || maxScore > existing.score) {
        countryMap.set(product.country_code, {
          countryCode: product.country_code,
          countryName: currentCountryName,
          score: maxScore
        });
      }
    });
    
    // Convert to array, filter, sort and limit
    const results = Array.from(countryMap.values())
      .filter(item => item.score > 0.4)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    
    return results;
  };

  const searchResults = getSearchResults();

  const handleSearch = (e: React.FormEvent, fromMobile: boolean = false) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (fromMobile) setMobileMenuOpen(false);
      setDesktopMenuOpen(false);
      setShowSearchResults(false);
      navigate(localizedPath(`/shop?search=${encodeURIComponent(searchQuery.trim())}`, language));
      setSearchQuery("");
    }
  };

  const handleResultClick = (countryName: string) => {
    navigate(localizedPath(`/shop?search=${encodeURIComponent(countryName)}`, language));
    setSearchQuery("");
    setShowSearchResults(false);
    setMobileMenuOpen(false);
  };

  const getCountryFlag = (countryCode: string) => {
    const FlagComponent = (CountryFlags as any)[countryCode];
    return FlagComponent ? <FlagComponent className="w-6 h-4 rounded shadow" /> : null;
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled 
        ? 'bg-black/40 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-black/30' 
        : 'bg-gradient-to-b from-black/70 via-black/40 to-transparent backdrop-blur-md border-b border-white/5'
    }`}>
      {/* Decorative glow effects */}
      <div className={`absolute inset-0 bg-gradient-to-r from-neon-violet/5 via-transparent to-neon-cyan/5 pointer-events-none transition-opacity duration-500 ${scrolled ? 'opacity-50' : 'opacity-100'}`} />
      <div className={`absolute top-0 left-1/4 w-96 h-px bg-gradient-to-r from-transparent via-neon-cyan/30 to-transparent transition-opacity duration-500 ${scrolled ? 'opacity-30' : 'opacity-100'}`} />
      
      <div className="container mx-auto px-4 sm:px-6 relative">
        <div className="flex items-center justify-between gap-4 h-16 sm:h-18 md:h-20">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 sm:gap-3 group">
              <div className="relative">
                {/* Pulsing outer glow */}
                <div className="absolute inset-0 bg-neon-cyan/20 rounded-lg blur-lg group-hover:animate-pulse transition-all duration-500" />
                <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/30 via-neon-violet/20 to-neon-cyan/30 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-all duration-700 animate-pulse" />
                
                {/* Logo image with smooth transitions */}
                <img 
                  src="/nomiqa-logo.jpg" 
                  alt="nomiqa" 
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg relative z-10 opacity-95 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110 group-hover:rotate-2 shadow-lg group-hover:shadow-neon-cyan/50" 
                />
                
                {/* Shine effect on hover */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-20 pointer-events-none" />
              </div>
              
              <span className="text-xl sm:text-2xl font-light bg-gradient-to-r from-neon-cyan via-white to-neon-violet bg-clip-text text-transparent group-hover:from-white group-hover:via-neon-cyan group-hover:to-white transition-all duration-700 group-hover:tracking-wide">
                nomiqa
              </span>
            </button>
          </div>

          {/* Desktop Search Bar - Hidden on shop page */}
          {!isShopPage && (
            <div className="hidden lg:flex flex-1 max-w-md">
              <form onSubmit={(e) => handleSearch(e, false)} className="w-full relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-hover:text-neon-cyan transition-colors duration-300" />
                <Input
                  type="text"
                  placeholder={t("searchEsims")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 backdrop-blur-xl border border-white/10 hover:border-neon-cyan/30 focus:border-neon-cyan/50 text-white placeholder:text-white/40 pl-10 pr-4 py-2 rounded-lg font-light text-sm transition-all duration-300 focus-visible:ring-neon-cyan/20"
                />
              </form>
            </div>
          )}

          {/* Right controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
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
            <Button variant="ghost" size="icon" className="relative hover:bg-neon-cyan/5 hover:border-neon-cyan/30 border border-white/5 transition-all duration-300 h-9 w-9 sm:h-10 sm:w-10" onClick={() => navigate(localizedPath('/checkout', language))} aria-label="Open cart">
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-white/80 group-hover:text-neon-cyan transition-colors duration-300" />
              {items.length > 0 && (
                <Badge className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-gradient-to-r from-neon-coral to-neon-orange text-white border-0 px-1 sm:px-1.5 py-0 text-[9px] sm:text-[10px] min-w-[16px] sm:min-w-[18px] h-4 sm:h-[18px] flex items-center justify-center shadow-glow-coral">
                  {items.length}
                </Badge>
              )}
            </Button>

            {/* Mobile Register Button - Show only when NOT logged in */}
            {!user && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex lg:hidden text-white/80 hover:text-neon-cyan hover:bg-neon-cyan/5 border border-white/5 hover:border-neon-cyan/30 font-light text-xs px-3 h-9 transition-all duration-300" 
                onClick={() => navigate('/auth?mode=register')}
              >
                {t('register')}
              </Button>
            )}

            {/* Mobile My Account Icon - Show only when logged in */}
            {user && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="flex lg:hidden relative hover:bg-neon-cyan/5 hover:border-neon-cyan/30 border border-white/5 transition-all duration-300 h-9 w-9" 
                onClick={() => navigate(localizedPath('/account', language))} 
                aria-label="My Account"
              >
                <UserIcon className="w-4 h-4 text-white/80 hover:text-neon-cyan transition-colors duration-300" />
              </Button>
            )}

            {/* Desktop Menu Button with Text */}
            <div className="hidden lg:block">
              <Sheet open={desktopMenuOpen} onOpenChange={setDesktopMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" className="text-white/80 hover:text-neon-cyan hover:bg-neon-cyan/5 border border-white/5 hover:border-neon-cyan/30 h-10 px-4 gap-2 font-light transition-all duration-300">
                    <Menu className="w-5 h-5" />
                    <span className="text-sm">{t("menu")}</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[85vw] max-w-[380px] bg-white/[0.03] backdrop-blur-2xl border-l border-white/20 shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-white/[0.02] to-transparent pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-tl from-neon-cyan/[0.05] via-transparent to-neon-violet/[0.03] pointer-events-none" />
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.05] rounded-full blur-3xl pointer-events-none" />
                  
                  <SheetHeader className="relative z-10 border-b border-white/20 pb-5 mb-1">
                    <SheetTitle className="text-white font-light text-lg tracking-wider uppercase">{t("menu")}</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-0.5 mt-6 relative z-10">
                    <button onClick={() => handleNavClick('/shop')} className="group text-left text-white/90 hover:text-white hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-light text-base tracking-wide backdrop-blur-sm border border-transparent hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                      <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">{t("shop")}</span>
                    </button>
                    <button onClick={() => handleNavClick('/getting-started')} className="group text-left text-white/90 hover:text-white hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-light text-base tracking-wide backdrop-blur-sm border border-transparent hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                      <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">{t("howToBuy")}</span>
                    </button>
                    <button onClick={() => handleNavClick('/affiliate')} className="group text-left text-white/90 hover:text-white hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-light text-base tracking-wide backdrop-blur-sm border border-transparent hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                      <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">{t("affiliate")}</span>
                    </button>
                    <button onClick={() => handleNavClick('/stake')} className="group text-left text-white/90 hover:text-white hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-light text-base tracking-wide backdrop-blur-sm border border-transparent hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                      <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">{t("stake")}</span>
                    </button>
                    <button onClick={() => handleNavClick('/token')} className="group text-left text-white/90 hover:text-white hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-light text-base tracking-wide backdrop-blur-sm border border-transparent hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                      <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">{t("token")}</span>
                    </button>
                    <button onClick={() => handleNavClick('/help')} className="group text-left text-white/90 hover:text-white hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-light text-base tracking-wide backdrop-blur-sm border border-transparent hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                      <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">$NOMIQA</span>
                    </button>
                    <button onClick={() => handleNavClick('/about')} className="group text-left text-white/90 hover:text-white hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-light text-base tracking-wide backdrop-blur-sm border border-transparent hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                      <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">{t("aboutUs")}</span>
                    </button>
                    <button onClick={() => handleNavClick('/privacy')} className="group text-left text-white/90 hover:text-white hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-light text-base tracking-wide backdrop-blur-sm border border-transparent hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                      <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">{t("howWeProtect")}</span>
                    </button>
                    <button onClick={() => handleNavClick('/help')} className="group text-left text-white/90 hover:text-white hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-light text-base tracking-wide backdrop-blur-sm border border-transparent hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                      <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">{t("help")}</span>
                    </button>
                    {user && (
                      <>
                        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-3" />
                        <button onClick={() => handleNavClick('/account')} className="group text-left text-white/90 hover:text-white hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-light text-base tracking-wide backdrop-blur-sm border border-transparent hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                          <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">My Account</span>
                        </button>
                        <button onClick={() => handleNavClick('/orders')} className="group text-left text-white/90 hover:text-white hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-light text-base tracking-wide backdrop-blur-sm border border-transparent hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                          <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">{t("myEsims")}</span>
                        </button>
                      </>
                    )}

                    <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-4" />

                    {user ? (
                      <button onClick={handleSignOut} className="group text-left text-white/70 hover:text-white/95 hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-light text-base tracking-wide flex items-center gap-3 backdrop-blur-sm border border-transparent hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                        <LogOut className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
                        <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">{t('signOut')}</span>
                      </button>
                    ) : (
                      <>
                        <button onClick={() => { setDesktopMenuOpen(false); navigate('/auth?mode=login'); }} className="group text-left text-white/80 hover:text-white hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-light text-base tracking-wide flex items-center gap-3 backdrop-blur-sm border border-transparent hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                          <LogIn className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                          <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">{t('login')}</span>
                        </button>
                        <button onClick={() => { setDesktopMenuOpen(false); navigate('/auth?mode=register'); }} className="text-left text-white hover:text-white bg-white/[0.1] hover:bg-white/[0.15] transition-all duration-300 py-4 px-5 rounded-lg font-normal text-base tracking-wide border border-white/30 hover:border-white/40 mt-2 backdrop-blur-sm shadow-lg shadow-white/5">
                          {t('register')}
                        </button>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Mobile Menu */}
            <div className="lg:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white/90 hover:text-neon-cyan hover:bg-neon-cyan/5 border border-white/5 hover:border-neon-cyan/30 h-10 w-10 transition-all duration-300">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[95vw] max-w-[450px] bg-white/[0.03] backdrop-blur-2xl border-l border-white/20 shadow-2xl overflow-y-auto">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-white/[0.02] to-transparent pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-tl from-neon-cyan/[0.05] via-transparent to-neon-violet/[0.03] pointer-events-none" />
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.05] rounded-full blur-3xl pointer-events-none" />
                  
                  <SheetHeader className="relative z-10 border-b border-white/20 pb-5 mb-1">
                    <SheetTitle className="text-white font-light text-base tracking-wider uppercase">{t("menu")}</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-0.5 mt-6 relative z-10">
                    <button onClick={() => handleNavClick('/shop')} className="group text-left text-white/90 hover:text-white hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-light text-[15px] tracking-wide backdrop-blur-sm border border-transparent hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                      <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">{t("shop")}</span>
                    </button>
                    <button onClick={() => handleNavClick('/getting-started')} className="group text-left text-white/90 hover:text-white hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-light text-[15px] tracking-wide backdrop-blur-sm border border-transparent hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                      <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">{t("howToBuy")}</span>
                    </button>
                    <button onClick={() => handleNavClick('/affiliate')} className="group text-left text-white/90 hover:text-white hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-light text-[15px] tracking-wide backdrop-blur-sm border border-transparent hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                      <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">{t("affiliate")}</span>
                    </button>
                    <button onClick={() => handleNavClick('/stake')} className="group text-left text-white/90 hover:text-white hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-light text-[15px] tracking-wide backdrop-blur-sm border border-transparent hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                      <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">{t("stake")}</span>
                    </button>
                    <button onClick={() => handleNavClick('/token')} className="group text-left text-white/90 hover:text-white hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-light text-[15px] tracking-wide backdrop-blur-sm border border-transparent hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                      <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">$NOMIQA</span>
                    </button>
                    <button onClick={() => handleNavClick('/about')} className="group text-left text-white/90 hover:text-white hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-light text-[15px] tracking-wide backdrop-blur-sm border border-transparent hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                      <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">{t("aboutUs")}</span>
                    </button>
                    <button onClick={() => handleNavClick('/privacy')} className="group text-left text-white/90 hover:text-white hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-light text-[15px] tracking-wide backdrop-blur-sm border border-transparent hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                      <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">{t("howWeProtect")}</span>
                    </button>
                    <button onClick={() => handleNavClick('/help')} className="group text-left text-white/90 hover:text-white hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-light text-[15px] tracking-wide backdrop-blur-sm border border-transparent hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                      <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">{t("help")}</span>
                    </button>
                    {user && (
                      <>
                        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-3" />
                        <button onClick={() => handleNavClick('/account')} className="group text-left text-white/90 hover:text-white hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-light text-[15px] tracking-wide backdrop-blur-sm border border-transparent hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                          <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">My Account</span>
                        </button>
                        <button onClick={() => handleNavClick('/orders')} className="group text-left text-white/90 hover:text-white hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-light text-[15px] tracking-wide backdrop-blur-sm border border-transparent hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                          <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">{t("myEsims")}</span>
                        </button>
                      </>
                    )}

                    <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-4" />

                    {user ? (
                      <button onClick={handleSignOut} className="group text-left text-white/70 hover:text-white/95 hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-light text-[15px] tracking-wide flex items-center gap-3 backdrop-blur-sm border border-transparent hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                        <LogOut className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
                        <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">{t('signOut')}</span>
                      </button>
                    ) : (
                      <>
                        <button onClick={() => { setMobileMenuOpen(false); navigate('/auth?mode=login'); }} className="group text-left text-white/80 hover:text-white hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-light text-[15px] tracking-wide flex items-center gap-3 backdrop-blur-sm border border-transparent hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                          <LogIn className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                          <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">{t('login')}</span>
                        </button>
                        <button onClick={() => { setMobileMenuOpen(false); navigate('/auth?mode=register'); }} className="text-left text-white hover:text-white bg-white/[0.1] hover:bg-white/[0.15] transition-all duration-300 py-4 px-5 rounded-lg font-normal text-[15px] tracking-wide border border-white/30 hover:border-white/40 mt-2 backdrop-blur-sm shadow-lg shadow-white/5">
                          {t('register')}
                        </button>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar - Subtle and always visible, hidden on shop page */}
        {!isShopPage && (
          <div className="lg:hidden pb-2">
            <form onSubmit={(e) => handleSearch(e, true)} className="w-full relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <Input
                type="text"
                placeholder={t("searchEsims")}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(e.target.value.trim().length > 0);
                }}
                onFocus={() => setShowSearchResults(searchQuery.trim().length > 0)}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                className="w-full pl-8 pr-3 h-9 bg-white/[0.02] backdrop-blur-xl border-white/[0.08] hover:border-white/[0.12] focus:border-neon-cyan/20 text-white placeholder:text-white/25 rounded-lg transition-all duration-300 text-xs"
              />
              
              {/* Search Results Dropdown - Shows unique countries only */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-black/95 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden z-50 shadow-2xl">
                  {searchResults.map(({ countryCode, countryName }) => (
                    <button
                      key={countryCode}
                      type="button"
                      onClick={() => handleResultClick(countryName)}
                      className="w-full px-3 py-2.5 flex items-center gap-2.5 hover:bg-neon-cyan/10 transition-colors duration-200 border-b border-white/5 last:border-0"
                    >
                      <div className="shrink-0">
                        {getCountryFlag(countryCode)}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-white text-sm font-light">{countryName}</div>
                      </div>
                      <MapPin className="w-3.5 h-3.5 text-neon-cyan/50" />
                    </button>
                  ))}
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </nav>
  );
};