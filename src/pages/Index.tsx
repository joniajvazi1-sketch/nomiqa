import { lazy, Suspense, memo } from "react";
import { Hero } from "@/components/Hero";

// Lazy load all below-the-fold components to improve TTI
const SupportChatbot = lazy(() => import("@/components/SupportChatbot").then(m => ({ default: m.SupportChatbot })));
const DePINAdvantage = lazy(() => import("@/components/DePINAdvantage").then(m => ({ default: m.DePINAdvantage })));
const HowYouEarn = lazy(() => import("@/components/HowYouEarn").then(m => ({ default: m.HowYouEarn })));
const GlobalNetworkMap = lazy(() => import("@/components/GlobalNetworkMap").then(m => ({ default: m.GlobalNetworkMap })));
const TrustPartners = lazy(() => import("@/components/TrustPartners").then(m => ({ default: m.TrustPartners })));
const FeaturedProducts = lazy(() => import("@/components/FeaturedProducts").then(m => ({ default: m.FeaturedProducts })));
const WhyNomiqa = lazy(() => import("@/components/WhyNomiqa").then(m => ({ default: m.WhyNomiqa })));
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
      <Hero />
      {/* Progressive loading: critical sections first, then lower priority */}
      <Suspense fallback={<LoadingSpinner />}>
        <DePINAdvantage />
      </Suspense>
      <Suspense fallback={<LoadingSpinner />}>
        <HowYouEarn />
      </Suspense>
      <Suspense fallback={<LoadingSpinner />}>
        <GlobalNetworkMap />
        <TrustPartners />
      </Suspense>
      <Suspense fallback={<LoadingSpinner />}>
        <FeaturedProducts />
      </Suspense>
      <Suspense fallback={<LoadingSpinner />}>
        <WhyNomiqa />
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
