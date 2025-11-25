import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useAffiliateTracking } from "@/hooks/useAffiliateTracking";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { supabase } from "@/integrations/supabase/client";
import { TranslationProvider } from "@/contexts/TranslationContext";

// Lazy load pages for better initial load performance
const Index = lazy(() => import("./pages/Index"));
const ShopPage = lazy(() => import("./pages/ShopPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Orders = lazy(() => import("./pages/Orders"));
const Auth = lazy(() => import("./pages/Auth"));
const GettingStarted = lazy(() => import("./pages/GettingStarted"));
const Stake = lazy(() => import("./pages/Stake"));
const Roadmap = lazy(() => import("./pages/Roadmap"));
const Affiliate = lazy(() => import("./pages/Affiliate"));
const AffiliateRedirect = lazy(() => import("./pages/AffiliateRedirect"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const About = lazy(() => import("./pages/About"));
const Token = lazy(() => import("./pages/Token"));
const MyAccount = lazy(() => import("./pages/MyAccount"));
const Help = lazy(() => import("./pages/Help"));
const Rewards = lazy(() => import("./pages/Rewards"));


// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-neon-cyan/20 border-t-neon-cyan rounded-full animate-spin" />
      <div className="absolute inset-0 bg-neon-cyan/20 rounded-full blur-xl animate-pulse" />
    </div>
  </div>
);

const queryClient = new QueryClient();

function AffiliateTracker() {
  const location = useLocation();
  const { setReferralCode } = useAffiliateTracking();
  useScrollToTop();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    
    if (ref) {
      setReferralCode(ref);
      
      // Track click via secure edge function
      const trackClick = async () => {
        try {
          await supabase.functions.invoke('track-affiliate-click', {
            body: { referralCode: ref }
          });
        } catch (error) {
          console.error('Error tracking affiliate click:', error);
        }
      };

      trackClick();
    }
  }, [location, setReferralCode]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TranslationProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AffiliateTracker />
          <Suspense fallback={<PageLoader />}>
            <Routes>
            {/* Base routes (no locale prefix) */}
            <Route path="/" element={<Index />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/account" element={<MyAccount />} />
            <Route path="/getting-started" element={<GettingStarted />} />
            <Route path="/stake" element={<Stake />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/affiliate" element={<Affiliate />} />
            <Route path="/r/:code" element={<AffiliateRedirect />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
            <Route path="/about" element={<About />} />
            <Route path="/token" element={<Token />} />
            <Route path="/help" element={<Help />} />
            <Route path="/rewards" element={<Rewards />} />
            

            {/* Localized route groups */}
            {/** German */}
            <Route path="/deutsch">
              <Route index element={<Index />} />
              <Route path="shop" element={<ShopPage />} />
              <Route path="auth" element={<Auth />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="orders" element={<Orders />} />
              <Route path="account" element={<MyAccount />} />
              <Route path="getting-started" element={<GettingStarted />} />
              <Route path="stake" element={<Stake />} />
              <Route path="roadmap" element={<Roadmap />} />
              <Route path="affiliate" element={<Affiliate />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="terms" element={<Terms />} />
              <Route path="about" element={<About />} />
              <Route path="token" element={<Token />} />
              <Route path="help" element={<Help />} />
              <Route path="rewards" element={<Rewards />} />
            </Route>
            {/** English */}
            <Route path="/english">
              <Route index element={<Index />} />
              <Route path="shop" element={<ShopPage />} />
              <Route path="auth" element={<Auth />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="orders" element={<Orders />} />
              <Route path="account" element={<MyAccount />} />
              <Route path="getting-started" element={<GettingStarted />} />
              <Route path="stake" element={<Stake />} />
              <Route path="roadmap" element={<Roadmap />} />
              <Route path="affiliate" element={<Affiliate />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="terms" element={<Terms />} />
              <Route path="about" element={<About />} />
              <Route path="token" element={<Token />} />
              <Route path="help" element={<Help />} />
              <Route path="rewards" element={<Rewards />} />
            </Route>
            {/** French */}
            <Route path="/francais">
              <Route index element={<Index />} />
              <Route path="shop" element={<ShopPage />} />
              <Route path="auth" element={<Auth />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="orders" element={<Orders />} />
              <Route path="account" element={<MyAccount />} />
              <Route path="getting-started" element={<GettingStarted />} />
              <Route path="stake" element={<Stake />} />
              <Route path="roadmap" element={<Roadmap />} />
              <Route path="affiliate" element={<Affiliate />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="terms" element={<Terms />} />
              <Route path="about" element={<About />} />
              <Route path="token" element={<Token />} />
              <Route path="help" element={<Help />} />
              <Route path="rewards" element={<Rewards />} />
            </Route>
            {/** Spanish */}
            <Route path="/espanol">
              <Route index element={<Index />} />
              <Route path="shop" element={<ShopPage />} />
              <Route path="auth" element={<Auth />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="orders" element={<Orders />} />
              <Route path="account" element={<MyAccount />} />
              <Route path="getting-started" element={<GettingStarted />} />
              <Route path="stake" element={<Stake />} />
              <Route path="roadmap" element={<Roadmap />} />
              <Route path="affiliate" element={<Affiliate />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="terms" element={<Terms />} />
              <Route path="about" element={<About />} />
              <Route path="token" element={<Token />} />
              <Route path="help" element={<Help />} />
              <Route path="rewards" element={<Rewards />} />
            </Route>
            {/** Portuguese */}
            <Route path="/portugues">
              <Route index element={<Index />} />
              <Route path="shop" element={<ShopPage />} />
              <Route path="auth" element={<Auth />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="orders" element={<Orders />} />
              <Route path="account" element={<MyAccount />} />
              <Route path="getting-started" element={<GettingStarted />} />
              <Route path="stake" element={<Stake />} />
              <Route path="roadmap" element={<Roadmap />} />
              <Route path="affiliate" element={<Affiliate />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="terms" element={<Terms />} />
              <Route path="about" element={<About />} />
              <Route path="token" element={<Token />} />
              <Route path="help" element={<Help />} />
              <Route path="rewards" element={<Rewards />} />
            </Route>
            {/** Russian */}
            <Route path="/russian">
              <Route index element={<Index />} />
              <Route path="shop" element={<ShopPage />} />
              <Route path="auth" element={<Auth />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="orders" element={<Orders />} />
              <Route path="account" element={<MyAccount />} />
              <Route path="getting-started" element={<GettingStarted />} />
              <Route path="stake" element={<Stake />} />
              <Route path="roadmap" element={<Roadmap />} />
              <Route path="affiliate" element={<Affiliate />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="terms" element={<Terms />} />
              <Route path="about" element={<About />} />
              <Route path="token" element={<Token />} />
              <Route path="help" element={<Help />} />
              <Route path="rewards" element={<Rewards />} />
            </Route>
            {/** Chinese */}
            <Route path="/chinese">
              <Route index element={<Index />} />
              <Route path="shop" element={<ShopPage />} />
              <Route path="auth" element={<Auth />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="orders" element={<Orders />} />
              <Route path="account" element={<MyAccount />} />
              <Route path="getting-started" element={<GettingStarted />} />
              <Route path="stake" element={<Stake />} />
              <Route path="roadmap" element={<Roadmap />} />
              <Route path="affiliate" element={<Affiliate />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="terms" element={<Terms />} />
              <Route path="about" element={<About />} />
              <Route path="token" element={<Token />} />
              <Route path="help" element={<Help />} />
              <Route path="rewards" element={<Rewards />} />
            </Route>
            {/** Japanese */}
            <Route path="/japanese">
              <Route index element={<Index />} />
              <Route path="shop" element={<ShopPage />} />
              <Route path="auth" element={<Auth />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="orders" element={<Orders />} />
              <Route path="account" element={<MyAccount />} />
              <Route path="getting-started" element={<GettingStarted />} />
              <Route path="stake" element={<Stake />} />
              <Route path="roadmap" element={<Roadmap />} />
              <Route path="affiliate" element={<Affiliate />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="terms" element={<Terms />} />
              <Route path="about" element={<About />} />
              <Route path="token" element={<Token />} />
              <Route path="help" element={<Help />} />
            </Route>
            {/** Arabic */}
            <Route path="/arabic">
              <Route index element={<Index />} />
              <Route path="shop" element={<ShopPage />} />
              <Route path="auth" element={<Auth />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="orders" element={<Orders />} />
              <Route path="account" element={<MyAccount />} />
              <Route path="getting-started" element={<GettingStarted />} />
              <Route path="stake" element={<Stake />} />
              <Route path="roadmap" element={<Roadmap />} />
              <Route path="affiliate" element={<Affiliate />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="terms" element={<Terms />} />
              <Route path="about" element={<About />} />
              <Route path="token" element={<Token />} />
              <Route path="rewards" element={<Rewards />} />
            </Route>
            {/** Italian */}
            <Route path="/italiano">
              <Route index element={<Index />} />
              <Route path="shop" element={<ShopPage />} />
              <Route path="auth" element={<Auth />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="orders" element={<Orders />} />
              <Route path="account" element={<MyAccount />} />
              <Route path="getting-started" element={<GettingStarted />} />
              <Route path="stake" element={<Stake />} />
              <Route path="roadmap" element={<Roadmap />} />
              <Route path="affiliate" element={<Affiliate />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="terms" element={<Terms />} />
              <Route path="about" element={<About />} />
              <Route path="token" element={<Token />} />
              <Route path="help" element={<Help />} />
            </Route>
            {/** Italian */}
            <Route path="/italiano">
              <Route index element={<Index />} />
              <Route path="shop" element={<ShopPage />} />
              <Route path="auth" element={<Auth />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="orders" element={<Orders />} />
              <Route path="account" element={<MyAccount />} />
              <Route path="getting-started" element={<GettingStarted />} />
              <Route path="stake" element={<Stake />} />
              <Route path="roadmap" element={<Roadmap />} />
              <Route path="affiliate" element={<Affiliate />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="terms" element={<Terms />} />
              <Route path="about" element={<About />} />
              <Route path="token" element={<Token />} />
              <Route path="help" element={<Help />} />
              <Route path="rewards" element={<Rewards />} />
              
            </Route>

            {/* Username-based affiliate links - must be last before catch-all */}
            <Route path="/:username" element={<AffiliateRedirect />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </TranslationProvider>
  </QueryClientProvider>
);

export default App;
