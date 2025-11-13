import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { WhyNomiqa } from "@/components/WhyNomiqa";
import { HowItWorksSteps } from "@/components/HowItWorksSteps";
import { CoverageSection } from "@/components/CoverageSection";
import { EasyCheckout } from "@/components/EasyCheckout";
import { EarnSection } from "@/components/EarnSection";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { StickyCTA } from "@/components/StickyCTA";
import { TrustPartners } from "@/components/TrustPartners";
import { EarnRewardBlock } from "@/components/EarnRewardBlock";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <EarnRewardBlock />
      <TrustPartners />
      <HowItWorksSteps />
      <WhyNomiqa />
      <CoverageSection />
      <EasyCheckout />
      <EarnSection />
      <FAQ />
      <Footer />
      <StickyCTA />
    </div>
  );
};

export default Index;
