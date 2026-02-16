import { SEO } from "@/components/SEO";
import { SocialTasks } from "@/components/SocialTasks";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const SocialRewards = () => {
  return (
    <>
      <SEO page="home" />
      <div className="min-h-screen bg-background pt-8">
        <SocialTasks />
      </div>
    </>
  );
};

export default SocialRewards;
