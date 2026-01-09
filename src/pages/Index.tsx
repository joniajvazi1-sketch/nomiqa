import { lazy, Suspense, memo } from "react";
import { Hero } from "@/components/Hero";
import { SEO } from "@/components/SEO";

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
const InviteReminderSection = lazy(() => import("@/components/InviteReminderSection").then(m => ({ default: m.InviteReminderSection })));
const FAQ = lazy(() => import("@/components/FAQ").then(m => ({ default: m.FAQ })));
const SiteNavigation = lazy(() => import("@/components/SiteNavigation").then(m => ({ default: m.SiteNavigation })));

const LoadingSpinner = memo(() => (
  <div className="h-20 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-neon-cyan/20 border-t-neon-cyan rounded-full animate-spin" />
  </div>
));
LoadingSpinner.displayName = "LoadingSpinner";

const Index = () => {
  return (
    <>
      <SEO page="home" />
      <Hero />
      {/* DePIN-First: Educate about DePIN before showing products */}
      <Suspense fallback={<LoadingSpinner />}>
        <DePINAdvantage />
      </Suspense>
      <Suspense fallback={<LoadingSpinner />}>
        <WhatIsDePIN />
      </Suspense>
      <Suspense fallback={<LoadingSpinner />}>
        <DataMarketplace />
      </Suspense>
      <Suspense fallback={<LoadingSpinner />}>
        <LiveNetworkStats />
      </Suspense>
      <Suspense fallback={<LoadingSpinner />}>
        <TrustPartners />
      </Suspense>
      <Suspense fallback={<LoadingSpinner />}>
        <FeaturedProducts />
      </Suspense>
      <Suspense fallback={<LoadingSpinner />}>
        <HowItWorksSteps />
        <ScrollableFeatures />
      </Suspense>
      <Suspense fallback={<LoadingSpinner />}>
        <CoverageSection />
        <InviteReminderSection />
        <FAQ />
        <SiteNavigation />
      </Suspense>
      <Suspense fallback={null}>
        <SupportChatbot />
      </Suspense>
    </>
  );
};

export default Index;
