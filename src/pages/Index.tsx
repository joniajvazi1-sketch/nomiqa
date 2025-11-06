import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Shop } from "@/components/Shop";
import { HowItWorks } from "@/components/HowItWorks";
import { CoverageSection } from "@/components/CoverageSection";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Shop />
      <HowItWorks />
      <CoverageSection />
      <Footer />
    </div>
  );
};

export default Index;