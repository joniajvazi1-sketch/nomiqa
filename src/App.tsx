import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useAffiliateTracking } from "@/hooks/useAffiliateTracking";
import { supabase } from "@/integrations/supabase/client";
import { TranslationProvider } from "@/contexts/TranslationContext";
import Index from "./pages/Index";
import ShopPage from "./pages/ShopPage";
import NotFound from "./pages/NotFound";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Auth from "./pages/Auth";
import GettingStarted from "./pages/GettingStarted";
import Stake from "./pages/Stake";
import Roadmap from "./pages/Roadmap";
import Affiliate from "./pages/Affiliate";
import AffiliateRedirect from "./pages/AffiliateRedirect";
import Privacy from "./pages/Privacy";
import About from "./pages/About";

const queryClient = new QueryClient();

function AffiliateTracker() {
  const location = useLocation();
  const { setReferralCode } = useAffiliateTracking();

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
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/getting-started" element={<GettingStarted />} />
            <Route path="/stake" element={<Stake />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/affiliate" element={<Affiliate />} />
            <Route path="/r/:code" element={<AffiliateRedirect />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/about" element={<About />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </TranslationProvider>
  </QueryClientProvider>
);

export default App;
