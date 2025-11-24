import { lazy, Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { SiteNavigation } from "@/components/SiteNavigation";
import { Footer } from "@/components/Footer";
import { SupportChatbot } from "@/components/SupportChatbot";

// Lazy load below-the-fold components with prefetch
const TrustPartners = lazy(() => import(/* webpackPrefetch: true */ "@/components/TrustPartners").then(m => ({ default: m.TrustPartners })));
const FeaturedProducts = lazy(() => import(/* webpackPrefetch: true */ "@/components/FeaturedProducts").then(m => ({ default: m.FeaturedProducts })));
const WhyNomiqa = lazy(() => import(/* webpackPrefetch: true */ "@/components/WhyNomiqa").then(m => ({ default: m.WhyNomiqa })));
const HowItWorksSteps = lazy(() => import(/* webpackPrefetch: true */ "@/components/HowItWorksSteps").then(m => ({ default: m.HowItWorksSteps })));
const ScrollableFeatures = lazy(() => import(/* webpackPrefetch: true */ "@/components/ScrollableFeatures").then(m => ({ default: m.ScrollableFeatures })));
const CoverageSection = lazy(() => import(/* webpackPrefetch: true */ "@/components/CoverageSection").then(m => ({ default: m.CoverageSection })));
const FAQ = lazy(() => import(/* webpackPrefetch: true */ "@/components/FAQ").then(m => ({ default: m.FAQ })));

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Suspense fallback={<div className="h-20 flex items-center justify-center"><div className="w-8 h-8 border-2 border-neon-cyan/20 border-t-neon-cyan rounded-full animate-spin"></div></div>}>
        <TrustPartners />
        <FeaturedProducts />
        <WhyNomiqa />
        <HowItWorksSteps />
        <ScrollableFeatures />
        <CoverageSection />
        <FAQ />
      </Suspense>
      <SiteNavigation />
      <Footer />
      <SupportChatbot />
    </div>
  );
};

export default Index;
