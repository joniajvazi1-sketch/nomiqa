import { useTranslation } from "@/contexts/TranslationContext";

export const TermsPrivacy = () => {
  const { t } = useTranslation();
  return (
    <section>
      <h2 className="text-2xl md:text-3xl font-light mb-6 text-neon-cyan">
        {t("termsPrivacyTitle")}
      </h2>
      
      <div className="mb-6">
        <h3 className="text-xl font-light mb-3 text-white">{t("termsPrivacyControllerTitle")}</h3>
        <p className="text-muted-foreground leading-relaxed">{t("termsPrivacyControllerContent")}</p>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-light mb-3 text-white">{t("termsPrivacyDataTitle")}</h3>
        <p className="text-muted-foreground leading-relaxed mb-2 font-semibold">{t("termsPrivacyDataPersonal")}</p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
          <li>{t("termsPrivacyDataItem1")}</li>
          <li>{t("termsPrivacyDataItem2")}</li>
          <li>{t("termsPrivacyDataItem3")}</li>
        </ul>
        <p className="text-muted-foreground leading-relaxed mb-2 font-semibold">{t("termsPrivacyDataCheckout")}</p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
          <li>{t("termsPrivacyDataItem4")}</li>
          <li>{t("termsPrivacyDataItem5")}</li>
          <li>{t("termsPrivacyDataItem6")}</li>
          <li>{t("termsPrivacyDataItem7")}</li>
          <li>{t("termsPrivacyDataItem8")}</li>
        </ul>
        <p className="text-muted-foreground leading-relaxed mb-2 font-semibold">{t("termsPrivacyDataESIM")}</p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
          <li>{t("termsPrivacyDataItem9")}</li>
          <li>{t("termsPrivacyDataItem10")}</li>
          <li>{t("termsPrivacyDataItem11")}</li>
          <li>{t("termsPrivacyDataItem12")}</li>
        </ul>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-light mb-3 text-white">{t("termsPrivacyNotCollectedTitle")}</h3>
        <p className="text-muted-foreground leading-relaxed mb-2">{t("termsPrivacyNotCollectedIntro")}</p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
          <li>{t("termsPrivacyNotCollected1")}</li>
          <li>{t("termsPrivacyNotCollected2")}</li>
          <li>{t("termsPrivacyNotCollected3")}</li>
          <li>{t("termsPrivacyNotCollected4")}</li>
          <li>{t("termsPrivacyNotCollected5")}</li>
          <li>{t("termsPrivacyNotCollected6")}</li>
          <li>{t("termsPrivacyNotCollected7")}</li>
        </ul>
      </div>


      <div className="mb-6">
        <h3 className="text-xl font-light mb-3 text-white">{t("termsPrivacyPurposeTitle")}</h3>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
          <li>{t("termsPrivacyPurposeItem1")}</li>
          <li>{t("termsPrivacyPurposeItem2")}</li>
          <li>{t("termsPrivacyPurposeItem3")}</li>
          <li>{t("termsPrivacyPurposeItem4")}</li>
        </ul>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-light mb-3 text-white">{t("termsPrivacyThirdPartyTitle")}</h3>
        <p className="text-muted-foreground leading-relaxed mb-2">{t("termsPrivacyThirdPartyContent")}</p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
          <li>{t("termsPrivacyThirdPartyItem1")}</li>
          <li>{t("termsPrivacyThirdPartyItem2")}</li>
          <li>{t("termsPrivacyThirdPartyItem3")}</li>
          <li>{t("termsPrivacyThirdPartyItem4")}</li>
          <li>{t("termsPrivacyThirdPartyItem5")}</li>
        </ul>
        <p className="text-muted-foreground leading-relaxed mb-2 font-semibold">{t("termsPrivacyThirdPartyTransfers")}</p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
          <li>{t("termsPrivacyThirdPartyTransfer1")}</li>
          <li>{t("termsPrivacyThirdPartyTransfer2")}</li>
        </ul>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-light mb-3 text-white">{t("termsPrivacyRetentionTitle")}</h3>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
          <li>{t("termsPrivacyRetentionItem1")}</li>
          <li>{t("termsPrivacyRetentionItem2")}</li>
          <li>{t("termsPrivacyRetentionItem3")}</li>
        </ul>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-light mb-3 text-white">{t("termsPrivacyRightsTitle")}</h3>
        <p className="text-muted-foreground leading-relaxed mb-2">{t("termsPrivacyRightsContent")}</p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
          <li>{t("termsPrivacyRightsItem1")}</li>
          <li>{t("termsPrivacyRightsItem2")}</li>
          <li>{t("termsPrivacyRightsItem3")}</li>
          <li>{t("termsPrivacyRightsItem4")}</li>
          <li>{t("termsPrivacyRightsItem5")}</li>
        </ul>
        <p className="text-muted-foreground leading-relaxed">{t("termsPrivacyRightsContact")}</p>
      </div>
    </section>
  );
};
