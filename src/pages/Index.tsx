import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { WhyNomiqa } from "@/components/WhyNomiqa";
import { HowItWorksSteps } from "@/components/HowItWorksSteps";
import { CoverageSection } from "@/components/CoverageSection";
import { EasyCheckout } from "@/components/EasyCheckout";
import { Footer } from "@/components/Footer";
import { StickyCTA } from "@/components/StickyCTA";
import { TrustPartners } from "@/components/TrustPartners";
import { EarnRewardBlock } from "@/components/EarnRewardBlock";
import { ReferEarn } from "@/components/ReferEarn";
import { LoyaltyProgram } from "@/components/LoyaltyProgram";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <TrustPartners />
      <WhyNomiqa />
      <HowItWorksSteps />
      <LoyaltyProgram />
      <ReferEarn />
      <EarnRewardBlock />
      <CoverageSection />
      <EasyCheckout />
      <Footer />
      <StickyCTA />
    </div>
  );
};

export default Index;
