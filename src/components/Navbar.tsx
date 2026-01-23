import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ShoppingCart, LogOut, LogIn, Menu, Globe, Check, User as UserIcon, Search, MapPin } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useNavbarSearch } from "@/hooks/useNavbarSearch";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Language, useTranslation } from "@/contexts/TranslationContext";
import { localizedPath } from "@/utils/localizedLinks";
import { getTranslatedCountryName } from "@/utils/countryTranslations";
import headerLogo from "@/assets/nomiqa-header-logo.png";
// Country flags now use emoji for performance (removed country-flag-icons library - 53KB savings)

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items } = useCart();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [_scrolled, setScrolled] = useState(false); // kept for potential future use
  const [showSearchResults, setShowSearchResults] = useState(false);
  const { language, setLanguage, t } = useTranslation();
  // Use lightweight search hook instead of fetching ALL products
  const { searchQuery, setSearchQuery, searchResults } = useNavbarSearch(language);

  // Check if we're on the shop page
  const isShopPage = location.pathname.includes('/shop');
  
  // Pages where search should be hidden for cleaner UX (check without language prefix)
  const pathWithoutLang = location.pathname.replace(/^\/(english|espanol|francais|deutsch|italiano|portugues|russian|chinese|japanese|arabic)/, '');
  const hideSearchPages = ['/affiliate', '/auth', '/checkout', '/account'];
  const shouldHideSearch = isShopPage || hideSearchPages.some(page => pathWithoutLang.includes(page) || location.pathname.includes(page));

  // Scroll detection for blur effect - works with both window and WebLayout scroll container
  useEffect(() => {
    const handleScroll = () => {
      // Check window scroll first
      if (window.scrollY > 20) {
        setScrolled(true);
        return;
      }
      // Check the WebLayout scroll container (fixed div with overflow-y-auto)
      const scrollContainer = document.querySelector('.fixed.inset-0.overflow-y-auto');
      if (scrollContainer && scrollContainer.scrollTop > 20) {
        setScrolled(true);
        return;
      }
      setScrolled(false);
    };
    
    // Listen to window scroll
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Also listen to the WebLayout scroll container
    const scrollContainer = document.querySelector('.fixed.inset-0.overflow-y-auto');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
    };
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
    let isMounted = true;
    
    // Add timeout to prevent hanging on stale sessions
    const timeout = setTimeout(() => {
      if (isMounted) {
        // Session check taking too long, continue without user
        console.warn('Navbar: Session check timeout');
      }
    }, 5000);

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        clearTimeout(timeout);
        if (isMounted) {
          setUser(session?.user ?? null);
        }
      })
      .catch((err) => {
        clearTimeout(timeout);
        console.error('Navbar: Session error', err);
        if (isMounted) {
          setUser(null);
        }
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        // Even if there's an error, clear local state
      }
    } catch (err) {
      console.error('Sign out exception:', err);
    }
    // Always clear UI state and navigate
    setUser(null);
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

  // Search is now handled by useNavbarSearch hook

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

  const handleResultClick = (name: string, isRegional: boolean) => {
    const typeParam = isRegional ? '&type=regional' : '';
    navigate(localizedPath(`/shop?search=${encodeURIComponent(name)}${typeParam}`, language));
    setSearchQuery("");
    setShowSearchResults(false);
    setMobileMenuOpen(false);
  };

  // Region image mapping for search results
  const getRegionImage = (code: string): string | null => {
    const regionImageMap: Record<string, string> = {
      'EUROPE': '/regions/europe.png',
      'EU-PLUS-UK': '/regions/europe.png',
      'ASIA': '/regions/asia.png',
      'CARIBBEAN-ISLANDS': '/regions/caribbean.png',
      'LATIN-AMERICA': '/regions/latin-america.png',
      'MIDDLE-EAST-AND-NORTH-AFRICA': '/regions/middle-east-africa.png',
      'AFRICA': '/regions/middle-east-africa.png',
      'NORTH-AMERICA': '/regions/north-america.png',
      'OCEANIA': '/regions/oceania.png',
      'WORLD': '/regions/world.png',
    };
    return regionImageMap[code] || null;
  };

  // Country code to emoji flag mapping
  const getCountryEmoji = (code: string): string => {
    if (!code || code.length !== 2) return '🏳️';
    const codePoints = code.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  const getCountryFlag = (code: string, isRegional: boolean) => {
    if (isRegional) {
      const regionImage = getRegionImage(code);
      if (regionImage) {
        return <img src={regionImage} alt={code} width={24} height={16} className="w-6 h-4 rounded object-cover" />;
      }
      return <div className="w-6 h-4 flex items-center justify-center text-sm bg-white/5 rounded">🌐</div>;
    }
    return <span className="text-lg leading-none">{getCountryEmoji(code)}</span>;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-deep-space/95 backdrop-blur-xl border-b border-white/10 shadow-lg">
      {/* Subtle decorative gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-neon-violet/5 via-transparent to-neon-cyan/5 pointer-events-none opacity-40" />
      <div className="absolute top-0 left-1/4 w-96 h-px bg-gradient-to-r from-transparent via-neon-cyan/20 to-transparent opacity-30" />
      
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
                  src={headerLogo} 
                  alt="nomiqa" 
                  width={32}
                  height={32}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-md relative z-10 opacity-95 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110 shadow-lg group-hover:shadow-neon-cyan/50 object-contain"
                />
                
                {/* Shine effect on hover */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-20 pointer-events-none" />
              </div>
              
              <span className="text-xl sm:text-2xl font-light bg-gradient-to-r from-neon-cyan via-white to-neon-violet bg-clip-text text-transparent group-hover:from-white group-hover:via-neon-cyan group-hover:to-white transition-all duration-700 group-hover:tracking-wide">
                nomiqa
              </span>
            </button>
          </div>

          {/* Desktop Search Bar - Hidden on certain pages */}
          {!shouldHideSearch && (
            <div className="hidden lg:flex flex-1 max-w-4xl">
              <form onSubmit={(e) => handleSearch(e, false)} className="w-full relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  type="text"
                  placeholder={t("searchEsims")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 h-11 bg-black/60 backdrop-blur-xl border border-white/20 hover:border-white/30 focus:border-neon-cyan/40 text-white placeholder:text-white/40 rounded-xl transition-colors duration-200 text-sm font-light"
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

            {/* Desktop My Account Icon - Show only when logged in */}
            {user && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="hidden lg:flex relative bg-white/[0.05] backdrop-blur-xl border border-neon-cyan/30 hover:bg-neon-cyan/10 hover:border-neon-cyan/50 transition-all duration-300 h-10 w-10 rounded-lg shadow-lg hover:shadow-neon-cyan/20 hover:scale-105" 
                onClick={() => navigate(localizedPath('/account', language))} 
                aria-label="My Account"
              >
                <UserIcon className="w-5 h-5 text-neon-cyan" />
              </Button>
            )}

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

            {/* Mobile My Account Icon - Show only when logged in - Premium */}
            {user && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="flex lg:hidden relative bg-white/[0.05] backdrop-blur-xl border border-neon-cyan/30 hover:bg-neon-cyan/10 hover:border-neon-cyan/50 transition-all duration-300 h-9 w-9 rounded-lg shadow-lg hover:shadow-neon-cyan/20 hover:scale-105" 
                onClick={() => navigate(localizedPath('/account', language))} 
                aria-label="My Account"
              >
                <UserIcon className="w-4 h-4 text-neon-cyan" />
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
                <SheetContent side="right" className="w-[85vw] max-w-[380px] bg-deep-space/95 border-l border-white/20 shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] via-white/[0.02] to-transparent pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-tl from-neon-cyan/[0.03] via-transparent to-neon-violet/[0.02] pointer-events-none" />
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.05] rounded-full blur-3xl pointer-events-none" />
                  
                  <SheetHeader className="relative z-10 border-b border-white/20 pb-5 mb-1">
                    <SheetTitle className="text-white font-light text-lg tracking-wider uppercase">{t("menu")}</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-0.5 mt-6 relative z-10">
                    {/* Featured: Download App - Subtle highlight */}
                    <button onClick={() => handleNavClick('/download')} className="group text-left text-white hover:text-white bg-white/[0.06] hover:bg-white/[0.1] transition-all duration-300 py-4 px-5 rounded-lg font-normal text-base tracking-wide backdrop-blur-sm border border-white/15 hover:border-white/30 mb-2">
                      <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">
                        {t("navDownloadApp")}
                      </span>
                    </button>
                    
                    {/* Getting Started - Subtle highlight */}
                    <button onClick={() => handleNavClick('/getting-started')} className="group text-left text-white/90 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-normal text-base tracking-wide backdrop-blur-sm border border-white/10 hover:border-white/25 mb-2">
                      <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">
                        {t("navGettingStarted")}
                      </span>
                    </button>
                    
                    <button onClick={() => handleNavClick('/how-it-works')} className="group text-left text-white/90 hover:text-white hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-light text-base tracking-wide backdrop-blur-sm border border-transparent hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                      <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">{t("navHowDePINWorks")}</span>
                    </button>
                    <button onClick={() => handleNavClick('/shop')} className="group text-left text-white/90 hover:text-white hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-light text-base tracking-wide backdrop-blur-sm border border-transparent hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                      <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">{t("navEsimPlans")}</span>
                    </button>
                    {/* Earn & Refer - Highlighted */}
                    <button onClick={() => handleNavClick('/affiliate')} className="group text-left text-white hover:text-white bg-neon-cyan/10 hover:bg-neon-cyan/20 transition-all duration-300 py-4 px-5 rounded-lg font-normal text-base tracking-wide backdrop-blur-sm border border-neon-cyan/30 hover:border-neon-cyan/50">
                      <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">
                        {t("navEarnRefer")}
                      </span>
                    </button>
                    <button onClick={() => handleNavClick('/token')} className="group text-left text-white/90 hover:text-white hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-light text-base tracking-wide backdrop-blur-sm border border-transparent hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                      <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">$NOMIQA</span>
                    </button>
                    <button onClick={() => handleNavClick('/about')} className="group text-left text-white/90 hover:text-white hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-light text-base tracking-wide backdrop-blur-sm border border-transparent hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                      <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">{t("aboutUs")}</span>
                    </button>
                    <button onClick={() => handleNavClick('/privacy')} className="group text-left text-white/90 hover:text-white hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-light text-base tracking-wide backdrop-blur-sm border border-transparent hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                      <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">{t("navPrivacy")}</span>
                    </button>
                    <button onClick={() => handleNavClick('/help')} className="group text-left text-white/90 hover:text-white hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-light text-base tracking-wide backdrop-blur-sm border border-transparent hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                      <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">{t("help")}</span>
                    </button>
                    {user && (
                      <>
                        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-3" />
                        <button onClick={() => handleNavClick('/account')} className="group text-left text-white/90 hover:text-white hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-light text-base tracking-wide backdrop-blur-sm border border-transparent hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                          <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">{t("myAccount")}</span>
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
                  <Button variant="ghost" size="icon" className="text-white/90 hover:text-neon-cyan hover:bg-neon-cyan/5 border border-white/5 hover:border-neon-cyan/30 h-10 w-10 transition-all duration-300" aria-label="Open menu">
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
                    {/* Featured: Download App - Subtle highlight */}
                    <button onClick={() => handleNavClick('/download')} className="group text-left text-white hover:text-white bg-white/[0.06] hover:bg-white/[0.1] transition-all duration-300 py-4 px-5 rounded-lg font-normal text-[15px] tracking-wide backdrop-blur-sm border border-white/15 hover:border-white/30 mb-2">
                      <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">
                        {t("navDownloadApp")}
                      </span>
                    </button>
                    
                    {/* Getting Started - Subtle highlight */}
                    <button onClick={() => handleNavClick('/getting-started')} className="group text-left text-white/90 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-normal text-[15px] tracking-wide backdrop-blur-sm border border-white/10 hover:border-white/25 mb-2">
                      <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">
                        {t("navGettingStarted")}
                      </span>
                    </button>
                    
                    
                    <button onClick={() => handleNavClick('/how-it-works')} className="group text-left text-white/90 hover:text-white hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-light text-[15px] tracking-wide backdrop-blur-sm border border-transparent hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                      <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">{t("navHowDePINWorks")}</span>
                    </button>
                    <button onClick={() => handleNavClick('/shop')} className="group text-left text-white/90 hover:text-white hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-light text-[15px] tracking-wide backdrop-blur-sm border border-transparent hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                      <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">{t("navEsimPlans")}</span>
                    </button>
                    {/* Earn & Refer - Highlighted */}
                    <button onClick={() => handleNavClick('/affiliate')} className="group text-left text-white hover:text-white bg-neon-cyan/10 hover:bg-neon-cyan/20 transition-all duration-300 py-4 px-5 rounded-lg font-normal text-[15px] tracking-wide backdrop-blur-sm border border-neon-cyan/30 hover:border-neon-cyan/50">
                      <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">
                        {t("navEarnRefer")}
                      </span>
                    </button>
                    <button onClick={() => handleNavClick('/token')} className="group text-left text-white/90 hover:text-white hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-light text-[15px] tracking-wide backdrop-blur-sm border border-transparent hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                      <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">$NOMIQA</span>
                    </button>
                    <button onClick={() => handleNavClick('/about')} className="group text-left text-white/90 hover:text-white hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-light text-[15px] tracking-wide backdrop-blur-sm border border-transparent hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                      <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">{t("aboutUs")}</span>
                    </button>
                    <button onClick={() => handleNavClick('/privacy')} className="group text-left text-white/90 hover:text-white hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-light text-[15px] tracking-wide backdrop-blur-sm border border-transparent hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                      <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">{t("navPrivacy")}</span>
                    </button>
                    <button onClick={() => handleNavClick('/help')} className="group text-left text-white/90 hover:text-white hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-light text-[15px] tracking-wide backdrop-blur-sm border border-transparent hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                      <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">{t("help")}</span>
                    </button>
                    {user && (
                      <>
                        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-3" />
                        <button onClick={() => handleNavClick('/account')} className="group text-left text-white/90 hover:text-white hover:bg-white/[0.08] transition-all duration-300 py-4 px-5 rounded-lg font-light text-[15px] tracking-wide backdrop-blur-sm border border-transparent hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                          <span className="transition-transform duration-300 inline-block group-hover:translate-x-0.5">{t("myAccount")}</span>
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

        {/* Mobile Search Bar - Subtle styling, hidden on shop page */}
        {!isShopPage && (
          <div className="lg:hidden pb-2">
            <form onSubmit={(e) => handleSearch(e, true)} className="w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
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
                className="w-full pl-9 pr-3 h-9 bg-white/[0.03] backdrop-blur-xl border border-white/20 hover:border-white/30 focus:border-neon-cyan/40 text-white placeholder:text-white/40 rounded-lg transition-all duration-300 text-xs"
              />
              
              {/* Search Results Dropdown - Shows unique countries and regions */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-black/95 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden z-50 shadow-2xl">
                  {searchResults.map(({ code, name, isRegional }) => (
                    <button
                      key={`${code}-${isRegional ? 'regional' : 'local'}`}
                      type="button"
                      onClick={() => handleResultClick(name, isRegional)}
                      className="w-full px-3 py-2.5 flex items-center gap-2.5 hover:bg-neon-cyan/10 transition-colors duration-200 border-b border-white/5 last:border-0"
                    >
                      <div className="shrink-0">
                        {getCountryFlag(code, isRegional)}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-white text-sm font-light">{name}</div>
                        {isRegional && <div className="text-neon-violet text-[10px]">Regional</div>}
                      </div>
                      {isRegional ? <Globe className="w-3.5 h-3.5 text-neon-violet/50" /> : <MapPin className="w-3.5 h-3.5 text-neon-cyan/50" />}
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