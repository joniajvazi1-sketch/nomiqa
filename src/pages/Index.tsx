import { lazy, Suspense, memo, useState, useEffect } from "react";
import { Hero } from "@/components/Hero";
import { SEO } from "@/components/SEO";

// Lazy load ChatbotBubble with extra deferral - only load after FCP
const ChatbotBubble = lazy(() => import("@/components/ChatbotBubble").then(m => ({ default: m.ChatbotBubble })));

// Lazy load all below-the-fold components to improve TTI
const SupportChatbot = lazy(() => import("@/components/SupportChatbot").then(m => ({ default: m.SupportChatbot })));
const DePINAdvantage = lazy(() => import("@/components/DePINAdvantage").then(m => ({ default: m.DePINAdvantage })));
const WhatIsDePIN = lazy(() => import("@/components/WhatIsDePIN").then(m => ({ default: m.WhatIsDePIN })));
const DataMarketplace = lazy(() => import("@/components/DataMarketplace").then(m => ({ default: m.DataMarketplace })));
const LiveNetworkStats = lazy(() => import("@/components/LiveNetworkStats").then(m => ({ default: m.LiveNetworkStats })));

const TrustPartners = lazy(() => import("@/components/TrustPartners").then(m => ({ default: m.TrustPartners })));
const FeaturedProducts = lazy(() => import("@/components/FeaturedProducts").then(m => ({ default: m.FeaturedProducts })));
const HowItWorksSteps = lazy(() => import("@/components/HowItWorksSteps").then(m => ({ default: m.HowItWorksSteps })));
const ScrollableFeatures = lazy(() => import("@/components/ScrollableFeatures").then(m => ({ default: m.ScrollableFeatures })));
const CoverageSection = lazy(() => import("@/components/CoverageSection").then(m => ({ default: m.CoverageSection })));
const FAQ = lazy(() => import("@/components/FAQ").then(m => ({ default: m.FAQ })));
const SiteNavigation = lazy(() => import("@/components/SiteNavigation").then(m => ({ default: m.SiteNavigation })));

// Section-specific skeleton loaders to prevent CLS
const DePINSkeleton = memo(() => (
  <div className="py-14 md:py-20 bg-gradient-to-b from-background to-card/20">
    <div className="container px-4">
      <div className="h-8 w-48 bg-muted/30 rounded mx-auto mb-4" />
      <div className="h-6 w-96 max-w-full bg-muted/20 rounded mx-auto mb-8" />
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div className="h-64 bg-muted/10 rounded-xl" />
        <div className="h-64 bg-muted/10 rounded-xl" />
      </div>
    </div>
  </div>
));
DePINSkeleton.displayName = "DePINSkeleton";

const StatsSkeleton = memo(() => (
  <div className="py-14 md:py-20 bg-gradient-to-b from-card/20 via-background to-background">
    <div className="container px-4">
      <div className="h-8 w-64 bg-muted/30 rounded mx-auto mb-4" />
      <div className="h-6 w-80 max-w-full bg-muted/20 rounded mx-auto mb-10" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 md:h-40 bg-muted/10 rounded-2xl border border-border/30" />
        ))}
      </div>
    </div>
  </div>
));
StatsSkeleton.displayName = "StatsSkeleton";

const PartnersSkeleton = memo(() => (
  <div className="py-12 md:py-16">
    <div className="container px-4">
      <div className="h-6 w-48 bg-muted/30 rounded mx-auto mb-8" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-muted/10 rounded-xl" />
        ))}
      </div>
    </div>
  </div>
));
PartnersSkeleton.displayName = "PartnersSkeleton";

const ProductsSkeleton = memo(() => (
  <div className="py-14 md:py-20 bg-gradient-to-b from-background to-card/10">
    <div className="container px-4">
      <div className="h-8 w-56 bg-muted/30 rounded mx-auto mb-4" />
      <div className="h-6 w-72 max-w-full bg-muted/20 rounded mx-auto mb-10" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-40 bg-muted/10 rounded-xl border border-border/30" />
        ))}
      </div>
    </div>
  </div>
));
ProductsSkeleton.displayName = "ProductsSkeleton";

const SectionSkeleton = memo(() => (
  <div className="py-14 md:py-20">
    <div className="container px-4">
      <div className="h-8 w-64 bg-muted/30 rounded mx-auto mb-4" />
      <div className="h-6 w-80 max-w-full bg-muted/20 rounded mx-auto mb-10" />
      <div className="h-48 bg-muted/10 rounded-xl max-w-4xl mx-auto" />
    </div>
  </div>
));
SectionSkeleton.displayName = "SectionSkeleton";

const Index = () => {
  // Defer non-critical components until after FCP to improve initial paint time
  const [showDeferredComponents, setShowDeferredComponents] = useState(false);
  
  useEffect(() => {
    // Use requestIdleCallback if available, otherwise setTimeout
    // This ensures ChatbotBubble and SupportChatbot load after FCP
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => setShowDeferredComponents(true), { timeout: 2000 });
    } else {
      setTimeout(() => setShowDeferredComponents(true), 500);
    }
  }, []);

  return (
    <>
      <SEO page="home" />
      <Hero />
      {/* DePIN-First: Educate about DePIN before showing products */}
      <Suspense fallback={<DePINSkeleton />}>
        <div className="animate-section-in" style={{ animationDelay: '0.05s' }}>
          <DePINAdvantage />
        </div>
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <div className="animate-section-in" style={{ animationDelay: '0.1s' }}>
          <WhatIsDePIN />
        </div>
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <div className="animate-section-in" style={{ animationDelay: '0.15s' }}>
          <DataMarketplace />
        </div>
      </Suspense>
      <Suspense fallback={<StatsSkeleton />}>
        <div className="animate-section-in" style={{ animationDelay: '0.2s' }}>
          <LiveNetworkStats />
        </div>
      </Suspense>
      <Suspense fallback={<PartnersSkeleton />}>
        <TrustPartners />
      </Suspense>
      <Suspense fallback={<ProductsSkeleton />}>
        <FeaturedProducts />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <HowItWorksSteps />
        <ScrollableFeatures />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <CoverageSection />
        <FAQ />
        <SiteNavigation />
      </Suspense>
      {/* ChatbotBubble and SupportChatbot deferred until after FCP */}
      {showDeferredComponents && (
        <>
          <Suspense fallback={null}>
            <ChatbotBubble />
          </Suspense>
          <Suspense fallback={null}>
            <SupportChatbot />
          </Suspense>
        </>
      )}
    </>
  );
};

export default Index;
