import { useEffect, useState, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { supabase } from "@/integrations/supabase/client";
import { TranslationProvider } from "@/contexts/TranslationContext";
import { usePlatform } from "@/hooks/usePlatform";
import { AppErrorBoundary } from "@/components/app/AppErrorBoundary";
import { useDeepLinkAuth } from "@/hooks/useDeepLinkAuth";

// Lazy load layout shells — they're heavy (status bar, haptics, framer-motion)
const AppLayout = lazy(() => import("@/components/app/AppLayout").then(m => ({ default: m.AppLayout })));
const WebLayout = lazy(() => import("@/components/app/WebLayout").then(m => ({ default: m.WebLayout })));

// Lazy load WEB pages
const Index = lazy(() => import("./pages/Index"));
const ShopPage = lazy(() => import("./pages/ShopPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Orders = lazy(() => import("./pages/Orders"));
const Auth = lazy(() => import("./pages/Auth"));
const GettingStarted = lazy(() => import("./pages/GettingStarted"));
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
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const Download = lazy(() => import("./pages/Download"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const MobileOnly = lazy(() => import("./pages/MobileOnly"));
// ReferralLeaderboard removed from website for performance

// Lazy load APP pages (native only)
const AppHome = lazy(() => import("./pages/app/AppHome").then(m => ({ default: m.AppHome })));
const NetworkContribution = lazy(() => import("./pages/app/NetworkContribution").then(m => ({ default: m.NetworkContribution })));
const AppShop = lazy(() => import("./pages/app/AppShop").then(m => ({ default: m.AppShop })));
const AppProfile = lazy(() => import("./pages/app/AppProfile").then(m => ({ default: m.AppProfile })));
const AppAchievements = lazy(() => import("./pages/app/AppAchievements").then(m => ({ default: m.AppAchievements })));
const AppChallenges = lazy(() => import("./pages/app/AppChallenges").then(m => ({ default: m.AppChallenges })));
const AppLeaderboard = lazy(() => import("./pages/app/AppLeaderboard").then(m => ({ default: m.AppLeaderboard })));
const AppCheckout = lazy(() => import("./pages/app/AppCheckout").then(m => ({ default: m.AppCheckout })));
const AppInvite = lazy(() => import("./pages/app/AppInvite").then(m => ({ default: m.AppInvite })));
const AppRewards = lazy(() => import("./pages/app/AppRewards").then(m => ({ default: m.AppRewards })));
const AppNetworkStats = lazy(() => import("./pages/app/AppNetworkStats").then(m => ({ default: m.AppNetworkStats })));
const AppAuth = lazy(() => import("./pages/app/AppAuth").then(m => ({ default: m.AppAuth })));
const OAuthRedirect = lazy(() => import("./pages/app/OAuthRedirect"));

// Loading fallback component (with a safety timeout for slow/blocked mobile networks)
// Using forwardRef to prevent React warnings when used with Suspense
import { forwardRef } from "react";

const PageLoader = forwardRef<HTMLDivElement>((_, ref) => {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setShowHelp(true), 12000);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div 
      ref={ref} 
      className="min-h-screen bg-background flex items-center justify-center"
      style={{ 
        // Inline fallback for iOS WebView - CSS vars may not be ready yet
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div className="relative flex flex-col items-center gap-5 px-6 text-center">
        <div className="relative">
          <div 
            className="w-16 h-16 border-4 border-neon-cyan/20 border-t-neon-cyan rounded-full animate-spin" 
            style={{
              width: '64px',
              height: '64px',
              border: '4px solid rgba(0, 200, 255, 0.2)',
              borderTopColor: '#00c8ff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <div className="absolute inset-0 bg-neon-cyan/20 rounded-full blur-xl animate-pulse" />
        </div>

        {showHelp && (
          <div className="max-w-xs">
            <p className="text-sm text-muted-foreground" style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>
              Still loading? On some mobile browsers, storage/network settings can block the app from finishing.
            </p>
            <button
              type="button"
              className="mt-3 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              style={{
                marginTop: '12px',
                backgroundColor: '#00c8ff',
                color: '#0a0a0a',
                padding: '8px 16px',
                borderRadius: '6px',
                fontWeight: 500,
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
              }}
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
PageLoader.displayName = 'PageLoader';

const queryClient = new QueryClient();

function AffiliateTracker() {
  const location = useLocation();
  useScrollToTop();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    
    if (ref) {
      // Dynamically import affiliate tracking only when a referral code is present
      import("@/hooks/useAffiliateTracking").then(({ useAffiliateTracking: _unused }) => {
        // Store referral code in localStorage directly to avoid hook rules
        try {
          localStorage.setItem('referralCode', ref);
        } catch {}
      });
      
      // Defer referral tracking to not block initial render
      const trackClick = () => {
        supabase.functions.invoke('log-referral-visit', {
          body: { 
            affiliateCode: ref,
            referrerUrl: document.referrer || null,
            landingPage: window.location.pathname,
            userAgent: navigator.userAgent,
          }
        }).catch((error) => {
          console.error('Error tracking referral click:', error);
        });
      };

      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(trackClick, { timeout: 5000 });
      } else {
        setTimeout(trackClick, 100);
      }
    }
  }, [location]);

  return null;
}

/**
 * Native App Routes - Only rendered when running as installed Capacitor app
 */
const NativeAppRoutes = () => (
  <AppLayout>
    <Routes>
      <Route path="/app" element={<AppHome />} />
      <Route
        path="/app/map"
        element={
          <AppErrorBoundary
            title="Map unavailable"
            description="The map failed to load. Please refresh and try again."
          >
            <NetworkContribution />
          </AppErrorBoundary>
        }
      />
      <Route path="/app/invite" element={<AppInvite />} />
      <Route path="/app/rewards" element={<AppRewards />} />
      <Route path="/app/shop" element={<AppShop />} />
      <Route path="/app/profile" element={<AppProfile />} />
      <Route path="/app/achievements" element={<AppAchievements />} />
      <Route path="/app/challenges" element={<AppChallenges />} />
      <Route path="/app/leaderboard" element={<AppLeaderboard />} />
      <Route path="/app/network-stats" element={<AppNetworkStats />} />
      <Route path="/app/auth" element={<AppAuth />} />
      <Route path="/app/oauth-redirect" element={<OAuthRedirect />} />
      {/* Redirect old wallet route to profile */}
      <Route path="/app/wallet" element={<Navigate to="/app/profile" replace />} />
      <Route path="/auth" element={<AppAuth />} />
      <Route path="/checkout" element={<AppCheckout />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      {/* Redirect root to /app for native */}
      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  </AppLayout>
);

/**
 * Web Routes - Only rendered when accessed via browser
 */
const WebRoutes = () => (
  <WebLayout>
    <Routes>
      {/* Block ALL /app routes on web - redirect to mobile-only page */}
      {/* OAuth redirect is handled separately before WebRoutes */}
      <Route path="/app/*" element={<Navigate to="/mobile-only" replace />} />
      <Route path="/app" element={<Navigate to="/mobile-only" replace />} />
      
      {/* Base routes (no locale prefix) */}
      <Route path="/" element={<Index />} />
      <Route path="/shop" element={<ShopPage />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/account" element={<MyAccount />} />
      <Route path="/getting-started" element={<GettingStarted />} />
      <Route path="/roadmap" element={<Roadmap />} />
      <Route path="/affiliate" element={<Affiliate />} />
      <Route path="/r/:code" element={<AffiliateRedirect />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/about" element={<About />} />
      <Route path="/token" element={<Token />} />
      <Route path="/help" element={<Help />} />
      <Route path="/rewards" element={<Rewards />} />
      
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/admin/users" element={<AdminUsers />} />
      <Route path="/download" element={<Download />} />
      <Route path="/how-it-works" element={<HowItWorks />} />

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
        <Route path="roadmap" element={<Roadmap />} />
        <Route path="affiliate" element={<Affiliate />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
        <Route path="about" element={<About />} />
        <Route path="token" element={<Token />} />
        <Route path="help" element={<Help />} />
        <Route path="rewards" element={<Rewards />} />
        <Route path="download" element={<Download />} />
        <Route path="how-it-works" element={<HowItWorks />} />
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
        <Route path="roadmap" element={<Roadmap />} />
        <Route path="affiliate" element={<Affiliate />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
        <Route path="about" element={<About />} />
        <Route path="token" element={<Token />} />
        <Route path="help" element={<Help />} />
        <Route path="rewards" element={<Rewards />} />
        <Route path="download" element={<Download />} />
        <Route path="how-it-works" element={<HowItWorks />} />
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
        <Route path="roadmap" element={<Roadmap />} />
        <Route path="affiliate" element={<Affiliate />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
        <Route path="about" element={<About />} />
        <Route path="token" element={<Token />} />
        <Route path="help" element={<Help />} />
        <Route path="rewards" element={<Rewards />} />
        <Route path="download" element={<Download />} />
        <Route path="how-it-works" element={<HowItWorks />} />
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
        <Route path="roadmap" element={<Roadmap />} />
        <Route path="affiliate" element={<Affiliate />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
        <Route path="about" element={<About />} />
        <Route path="token" element={<Token />} />
        <Route path="help" element={<Help />} />
        <Route path="rewards" element={<Rewards />} />
        <Route path="download" element={<Download />} />
        <Route path="how-it-works" element={<HowItWorks />} />
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
        <Route path="roadmap" element={<Roadmap />} />
        <Route path="affiliate" element={<Affiliate />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
        <Route path="about" element={<About />} />
        <Route path="token" element={<Token />} />
        <Route path="help" element={<Help />} />
        <Route path="rewards" element={<Rewards />} />
        <Route path="download" element={<Download />} />
        <Route path="how-it-works" element={<HowItWorks />} />
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
        <Route path="roadmap" element={<Roadmap />} />
        <Route path="affiliate" element={<Affiliate />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
        <Route path="about" element={<About />} />
        <Route path="token" element={<Token />} />
        <Route path="help" element={<Help />} />
        <Route path="rewards" element={<Rewards />} />
        <Route path="download" element={<Download />} />
        <Route path="how-it-works" element={<HowItWorks />} />
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
        <Route path="roadmap" element={<Roadmap />} />
        <Route path="affiliate" element={<Affiliate />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
        <Route path="about" element={<About />} />
        <Route path="token" element={<Token />} />
        <Route path="help" element={<Help />} />
        <Route path="rewards" element={<Rewards />} />
        <Route path="download" element={<Download />} />
        <Route path="how-it-works" element={<HowItWorks />} />
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
        <Route path="roadmap" element={<Roadmap />} />
        <Route path="affiliate" element={<Affiliate />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
        <Route path="about" element={<About />} />
        <Route path="token" element={<Token />} />
        <Route path="help" element={<Help />} />
        <Route path="rewards" element={<Rewards />} />
        <Route path="download" element={<Download />} />
        <Route path="how-it-works" element={<HowItWorks />} />
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
        <Route path="roadmap" element={<Roadmap />} />
        <Route path="affiliate" element={<Affiliate />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
        <Route path="about" element={<About />} />
        <Route path="token" element={<Token />} />
        <Route path="help" element={<Help />} />
        <Route path="rewards" element={<Rewards />} />
        <Route path="download" element={<Download />} />
        <Route path="how-it-works" element={<HowItWorks />} />
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
        <Route path="roadmap" element={<Roadmap />} />
        <Route path="affiliate" element={<Affiliate />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
        <Route path="about" element={<About />} />
        <Route path="token" element={<Token />} />
        <Route path="help" element={<Help />} />
        <Route path="rewards" element={<Rewards />} />
        
        <Route path="download" element={<Download />} />
        <Route path="how-it-works" element={<HowItWorks />} />
      </Route>

      {/* Username-based affiliate links - must be last before catch-all */}
      <Route path="/:username" element={<AffiliateRedirect />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </WebLayout>
);

/**
 * Standalone Routes - Routes that don't need layout wrappers
 * These are rendered without WebLayout/AppLayout
 */
const StandaloneRoutes = () => {
  const location = useLocation();
  
  // OAuth redirect - minimal page for OAuth callback, no layout
  if (location.pathname === '/app/oauth-redirect') {
    return <OAuthRedirect />;
  }
  
  // Mobile-only page - shown when web users try to access /app/*
  if (location.pathname === '/mobile-only') {
    return <MobileOnly />;
  }
  
  return null;
};

/**
 * Main App Router - Detects platform and renders appropriate UI
 * CRITICAL: Website visitors see WebRoutes, Native app users see NativeAppRoutes
 * 
 * Web users visiting /app/* are redirected to /mobile-only page.
 * Only actual native platform OR localhost preview mode can access app UI.
 */
const AppRouter = () => {
  const { isNative } = usePlatform();
  
  // Handle OAuth deep link callbacks on native platforms
  useDeepLinkAuth();
  
  // Check for standalone routes first (OAuth, mobile-only page)
  const standaloneRoute = StandaloneRoutes();
  if (standaloneRoute) {
    return standaloneRoute;
  }
  
  // Only native platform (or localhost preview via ?appPreview=true) sees app UI
  return isNative ? <NativeAppRoutes /> : <WebRoutes />;
};



/**
 * App - Optimized for instant cold-start
 * 
 * Heavy modules (AppLayout, WebLayout, all page screens) are lazy-loaded.
 * The initial JS parse only includes React, Router, QueryClient, and the
 * lightweight PageLoader spinner — everything else streams in on demand.
 */
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TranslationProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AffiliateTracker />
            <AppErrorBoundary
              title="Site failed to load"
              description="This page couldn't finish loading. Please reload and try again."
            >
              <Suspense fallback={<PageLoader />}>
                <AppRouter />
              </Suspense>
            </AppErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </TranslationProvider>
    </QueryClientProvider>
  );
};

export default App;