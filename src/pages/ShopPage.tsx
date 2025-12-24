import { lazy, Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { Shop } from "@/components/Shop";
import { SiteNavigation } from "@/components/SiteNavigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { NetworkBackground } from "@/components/NetworkBackground";

// Lazy load chatbot - not needed until user interaction
const SupportChatbot = lazy(() => import(/* webpackPrefetch: true */ "@/components/SupportChatbot").then(m => ({ default: m.SupportChatbot })));

const ShopPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black/40 via-deep-space/60 to-black/40 relative">
      <SEO page="shop" />
      <NetworkBackground />
      
      {/* Premium glowing orbs background */}
      <div className="fixed inset-0 -z-10 overflow-hidden opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-neon-cyan/30 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-neon-violet/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 left-1/4 w-[500px] h-[500px] bg-neon-coral/20 rounded-full blur-3xl"></div>
      </div>
      
      <Navbar />
      <div className="pt-20 relative z-10">
        <Shop />
      </div>
      <SiteNavigation />
      <Footer />
      <Suspense fallback={null}>
        <SupportChatbot />
      </Suspense>
    </div>
  );
};

export default ShopPage;
