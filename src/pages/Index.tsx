import { lazy, Suspense, memo } from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Footer } from "@/components/Footer";
import { SupportChatbot } from "@/components/SupportChatbot";
import { DePINAdvantage } from "@/components/DePINAdvantage";
import { HowYouEarn } from "@/components/HowYouEarn";
import { GlobalNetworkMap } from "@/components/GlobalNetworkMap";

// Lazy load below-the-fold components with prefetch
const TrustPartners = lazy(() => import(/* webpackPrefetch: true */ "@/components/TrustPartners").then(m => ({ default: m.TrustPartners })));
const FeaturedProducts = lazy(() => import(/* webpackPrefetch: true */ "@/components/FeaturedProducts").then(m => ({ default: m.FeaturedProducts })));
const WhyNomiqa = lazy(() => import(/* webpackPrefetch: true */ "@/components/WhyNomiqa").then(m => ({ default: m.WhyNomiqa })));
const HowItWorksSteps = lazy(() => import(/* webpackPrefetch: true */ "@/components/HowItWorksSteps").then(m => ({ default: m.HowItWorksSteps })));
const ScrollableFeatures = lazy(() => import(/* webpackPrefetch: true */ "@/components/ScrollableFeatures").then(m => ({ default: m.ScrollableFeatures })));
const CoverageSection = lazy(() => import(/* webpackPrefetch: true */ "@/components/CoverageSection").then(m => ({ default: m.CoverageSection })));
const FAQ = lazy(() => import(/* webpackPrefetch: true */ "@/components/FAQ").then(m => ({ default: m.FAQ })));
const SiteNavigation = lazy(() => import(/* webpackPrefetch: true */ "@/components/SiteNavigation").then(m => ({ default: m.SiteNavigation })));

const LoadingSpinner = memo(() => (
  <div className="h-20 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-neon-cyan/20 border-t-neon-cyan rounded-full animate-spin" />
  </div>
));
LoadingSpinner.displayName = "LoadingSpinner";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      {/* Network First Strategy Sections */}
      <DePINAdvantage />
      <HowYouEarn />
      <GlobalNetworkMap />
      <Suspense fallback={<LoadingSpinner />}>
        <TrustPartners />
        <FeaturedProducts />
        <WhyNomiqa />
        <HowItWorksSteps />
        <ScrollableFeatures />
        <CoverageSection />
        <FAQ />
        <SiteNavigation />
      </Suspense>
      <Footer />
      <SupportChatbot />
    </div>
  );
};

export default Index;
