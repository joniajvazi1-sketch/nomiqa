import { Navbar } from "@/components/Navbar";
import { Shop } from "@/components/Shop";
import { Footer } from "@/components/Footer";

const ShopPage = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-20">
        <Shop />
      </div>
      <Footer />
    </div>
  );
};

export default ShopPage;
