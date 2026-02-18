import { useTranslation } from "@/contexts/TranslationContext";

export const TermsESIM = () => {
  const { t } = useTranslation();
  return (
    <section>
      <h2 className="text-2xl md:text-3xl font-light mb-6 text-neon-violet">
        {t("termsTCTitle")}
      </h2>
      
      <div className="mb-6">
        <h3 className="text-xl font-light mb-3 text-white">{t("termsScopeTitle")}</h3>
        <p className="text-muted-foreground leading-relaxed">{t("termsScopeContent")}</p>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-light mb-3 text-white">{t("termsServiceTitle")}</h3>
        <p className="text-muted-foreground leading-relaxed mb-2">{t("termsServiceContent")}</p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
          <li>{t("termsServiceItem1")}</li>
          <li>{t("termsServiceItem2")}</li>
          <li>{t("termsServiceItem3")}</li>
        </ul>
        <p className="text-muted-foreground leading-relaxed mt-2">{t("termsServiceNote")}</p>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-light mb-3 text-white">{t("termsContractTitle")}</h3>
        <p className="text-muted-foreground leading-relaxed mb-2">{t("termsContractContent")}</p>
        <ol className="list-decimal list-inside text-muted-foreground space-y-1 ml-4">
          <li>{t("termsContractStep1")}</li>
          <li>{t("termsContractStep2")}</li>
          <li>{t("termsContractStep3")}</li>
          <li>{t("termsContractStep4")}</li>
          <li>{t("termsContractStep5")}</li>
        </ol>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-light mb-3 text-white">{t("termsRequirementsTitle")}</h3>
        <p className="text-muted-foreground leading-relaxed mb-2">{t("termsRequirementsContent")}</p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
          <li>{t("termsRequirementsItem1")}</li>
          <li>{t("termsRequirementsItem2")}</li>
          <li>{t("termsRequirementsItem3")}</li>
          <li>{t("termsRequirementsItem4")}</li>
        </ul>
        <p className="text-muted-foreground leading-relaxed mt-3">{t("termsRequirementsWarning")}</p>
        <p className="text-muted-foreground leading-relaxed mt-2">{t("termsRequirementsNoRefund")}</p>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-light mb-3 text-white">{t("termsDeliveryTitle")}</h3>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
          <li>{t("termsDeliveryItem1")}</li>
          <li>{t("termsDeliveryItem2")}</li>
          <li>{t("termsDeliveryItem3")}</li>
        </ul>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-light mb-3 text-white">{t("termsPricesTitle")}</h3>
        <p className="text-muted-foreground leading-relaxed mb-2 font-semibold">{t("termsPricesVATTitle")}</p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
          <li>{t("termsPricesVATItem1")}</li>
          <li>{t("termsPricesVATItem2")}</li>
        </ul>
        <p className="text-muted-foreground leading-relaxed mb-2 font-semibold">{t("termsPricesCryptoTitle")}</p>
        <p className="text-muted-foreground leading-relaxed mb-2">{t("termsPricesCryptoAccepted")}</p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
          <li>{t("termsPricesCryptoItem1")}</li>
          <li>{t("termsPricesCryptoItem2")}</li>
          <li>{t("termsPricesCryptoItem3")}</li>
          <li>{t("termsPricesCryptoItem4")}</li>
          <li>{t("termsPricesCryptoItem5")}</li>
          <li>{t("termsPricesCryptoItem6")}</li>
        </ul>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-light mb-3 text-white">{t("termsNetworkTitle")}</h3>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
          <li>{t("termsNetworkItem1")}</li>
          <li>{t("termsNetworkItem2")}</li>
          <li>{t("termsNetworkItem3")}</li>
          <li>{t("termsNetworkItem4")}</li>
          <li>{t("termsNetworkItem5")}</li>
        </ul>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-light mb-3 text-white">{t("termsWithdrawalTitle")}</h3>
        <p className="text-muted-foreground leading-relaxed mb-2">{t("termsWithdrawalContent")}</p>
        <p className="text-muted-foreground leading-relaxed italic">{t("termsWithdrawalConfirmation")}</p>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-light mb-3 text-white">{t("termsLiabilityTitle")}</h3>
        <p className="text-muted-foreground leading-relaxed mb-2">{t("termsLiabilityContent")}</p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
          <li>{t("termsLiabilityItem1")}</li>
          <li>{t("termsLiabilityItem2")}</li>
          <li>{t("termsLiabilityItem3")}</li>
          <li>{t("termsLiabilityItem4")}</li>
          <li>{t("termsLiabilityItem5")}</li>
          <li>{t("termsLiabilityItem6")}</li>
          <li>{t("termsLiabilityItem7")}</li>
        </ul>
        <p className="text-muted-foreground leading-relaxed mb-2 font-semibold">{t("termsLiabilityCapTitle")}</p>
        <p className="text-muted-foreground leading-relaxed">{t("termsLiabilityCapContent")}</p>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-light mb-3 text-white">{t("termsProhibitedTitle")}</h3>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
          <li>{t("termsProhibitedItem1")}</li>
          <li>{t("termsProhibitedItem2")}</li>
          <li>{t("termsProhibitedItem3")}</li>
          <li>{t("termsProhibitedItem4")}</li>
          <li>{t("termsProhibitedItem5")}</li>
          <li>{t("termsProhibitedItem6")}</li>
        </ul>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-light mb-3 text-white">{t("termsSupportTitle")}</h3>
        <p className="text-muted-foreground leading-relaxed">{t("termsSupportEmail")}</p>
        <p className="text-muted-foreground leading-relaxed">{t("termsSupportResponse")}</p>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-light mb-3 text-white">{t("termsGoverningTitle")}</h3>
        <p className="text-muted-foreground leading-relaxed">{t("termsGoverningContent")}</p>
      </div>
    </section>
  );
};
