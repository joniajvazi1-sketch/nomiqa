import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { ValuePropositions } from "@/components/ValuePropositions";
import { WhyNomiqa } from "@/components/WhyNomiqa";
import { HowItWorksSteps } from "@/components/HowItWorksSteps";
import { EasyCheckout } from "@/components/EasyCheckout";
import { EarnSection } from "@/components/EarnSection";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <ValuePropositions />
      <HowItWorksSteps />
      <WhyNomiqa />
      <EasyCheckout />
      <FAQ />
      <EarnSection />
      <Footer />
    </div>
  );
};

export default Index;