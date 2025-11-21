import { lazy, Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Footer } from "@/components/Footer";
import { StickyCTA } from "@/components/StickyCTA";

// Lazy load below-the-fold components
const TrustPartners = lazy(() => import("@/components/TrustPartners").then(m => ({ default: m.TrustPartners })));
const WhyNomiqa = lazy(() => import("@/components/WhyNomiqa").then(m => ({ default: m.WhyNomiqa })));
const HowItWorksSteps = lazy(() => import("@/components/HowItWorksSteps").then(m => ({ default: m.HowItWorksSteps })));
const LoyaltyProgram = lazy(() => import("@/components/LoyaltyProgram").then(m => ({ default: m.LoyaltyProgram })));
const ReferEarn = lazy(() => import("@/components/ReferEarn").then(m => ({ default: m.ReferEarn })));
const EarnRewardBlock = lazy(() => import("@/components/EarnRewardBlock").then(m => ({ default: m.EarnRewardBlock })));
const CoverageSection = lazy(() => import("@/components/CoverageSection").then(m => ({ default: m.CoverageSection })));
const EasyCheckout = lazy(() => import("@/components/EasyCheckout").then(m => ({ default: m.EasyCheckout })));

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Suspense fallback={<div className="h-20" />}>
        <TrustPartners />
        <WhyNomiqa />
        <HowItWorksSteps />
        <LoyaltyProgram />
        <ReferEarn />
        <EarnRewardBlock />
        <CoverageSection />
        <EasyCheckout />
      </Suspense>
      <Footer />
      <StickyCTA />
    </div>
  );
};

export default Index;
