import { useTranslation } from "@/contexts/TranslationContext";

export const Footer = () => {
  const { t } = useTranslation();
  
  return (
    <footer className="bg-gradient-to-br from-nomiqa-cream via-nomiqa-peach/20 to-nomiqa-cream text-foreground py-12 border-t border-border">
      <div className="container px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8 text-center md:text-left">
          <div className="mx-auto md:mx-0">
            <h3 className="text-xl font-bold mb-4">nomiqa</h3>
            <p className="text-muted-foreground">
              {t("footerTagline")}
            </p>
          </div>
          
          <div className="mx-auto md:mx-0">
            <h4 className="font-semibold mb-4">{t("products")}</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-nomiqa-orange transition-colors">{t("shop")}</a></li>
              <li><a href="#" className="hover:text-nomiqa-orange transition-colors">Coverage</a></li>
              <li><a href="#" className="hover:text-nomiqa-orange transition-colors">Pricing</a></li>
            </ul>
          </div>
          
          <div className="mx-auto md:mx-0">
            <h4 className="font-semibold mb-4">{t("company")}</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-nomiqa-orange transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-nomiqa-orange transition-colors">{t("affiliate")}</a></li>
              <li><a href="#" className="hover:text-nomiqa-orange transition-colors">NMQ Token</a></li>
            </ul>
          </div>
          
          <div className="mx-auto md:mx-0">
            <h4 className="font-semibold mb-4">{t("support")}</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-nomiqa-orange transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-nomiqa-orange transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-nomiqa-orange transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border pt-8 text-center text-muted-foreground">
          <p>© 2024 Business Unlimited Worldwide Ltd. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};