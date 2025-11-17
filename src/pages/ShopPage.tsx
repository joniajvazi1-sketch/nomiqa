import { Navbar } from "@/components/Navbar";
import { Shop } from "@/components/Shop";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";

const ShopPage = () => {
  return (
    <div className="min-h-screen">
      <SEO page="shop" />
      <Navbar />
      <div className="pt-20">
        <Shop />
      </div>
      <Footer />
    </div>
  );
};

export default ShopPage;
