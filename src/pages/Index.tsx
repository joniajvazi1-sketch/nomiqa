import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { WhyNomiqa } from "@/components/WhyNomiqa";
import { EasyCheckout } from "@/components/EasyCheckout";
import { HowItWorks } from "@/components/HowItWorks";
import { EarnSection } from "@/components/EarnSection";
import { CoverageSection } from "@/components/CoverageSection";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <WhyNomiqa />
      <EasyCheckout />
      <HowItWorks />
      <EarnSection />
      <CoverageSection />
      <Footer />
    </div>
  );
};

export default Index;