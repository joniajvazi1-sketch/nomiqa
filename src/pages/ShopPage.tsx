import { lazy, Suspense } from "react";
import { Shop } from "@/components/Shop";
import { SiteNavigation } from "@/components/SiteNavigation";
import { SEO } from "@/components/SEO";
import { NetworkBackground } from "@/components/NetworkBackground";

// Lazy load chatbot - not needed until user interaction
const SupportChatbot = lazy(() => import(/* webpackPrefetch: true */ "@/components/SupportChatbot").then(m => ({ default: m.SupportChatbot })));

const ShopPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black/40 via-deep-space/60 to-black/40 relative">
      <SEO page="shop" />
      <NetworkBackground />
      
      {/* Simplified background - removed heavy blur-3xl effects for performance */}
      <div className="fixed inset-0 -z-10 overflow-hidden opacity-15 pointer-events-none" style={{ willChange: 'auto' }}>
        <div className="absolute top-20 left-10 w-96 h-96 bg-neon-cyan/20 rounded-full blur-2xl"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-neon-violet/20 rounded-full blur-2xl"></div>
      </div>
      
      <div className="pt-4 relative z-10">
        <Shop />
      </div>
      <SiteNavigation />
      <Suspense fallback={null}>
        <SupportChatbot />
      </Suspense>
    </div>
  );
};

export default ShopPage;
