import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { PlansSection } from "@/components/PlansSection";
import { HowItWorks } from "@/components/HowItWorks";
import { CoverageSection } from "@/components/CoverageSection";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <PlansSection />
      <HowItWorks />
      <CoverageSection />
      <Footer />
    </div>
  );
};

export default Index;