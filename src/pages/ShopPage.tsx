import { Navbar } from "@/components/Navbar";
import { Shop } from "@/components/Shop";
import { SiteNavigation } from "@/components/SiteNavigation";
import { Footer } from "@/components/Footer";
import { SupportChatbot } from "@/components/SupportChatbot";
import { SEO } from "@/components/SEO";

const ShopPage = () => {
  return (
    <div className="min-h-screen">
      <SEO page="shop" />
      <Navbar />
      <div className="pt-20">
        <Shop />
      </div>
      <SiteNavigation />
      <Footer />
      <SupportChatbot />
    </div>
  );
};

export default ShopPage;
