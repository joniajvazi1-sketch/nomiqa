import { useTranslation } from "@/contexts/TranslationContext";

export const TermsTokenV3 = () => {
  const { t } = useTranslation();
  return (
    <section>
      <h2 className="text-2xl md:text-3xl font-light mb-6 text-neon-cyan">
        {t("termsTokenTitle")}
      </h2>
      <p className="text-muted-foreground leading-relaxed mb-4">{t("termsTokenIntro")}</p>
      <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-6">
        <li>{t("termsTokenItem1")}</li>
        <li>{t("termsTokenItem2")}</li>
        <li>{t("termsTokenItem3")}</li>
        <li>{t("termsTokenItem4")}</li>
      </ul>

      {/* Token is NOT */}
      <p className="text-muted-foreground leading-relaxed mb-2 font-semibold">{t("termsTokenNotTitle")}</p>
      <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-6">
        <li>{t("termsTokenNotItem1")}</li>
        <li>{t("termsTokenNotItem2")}</li>
        <li>{t("termsTokenNotItem3")}</li>
        <li>{t("termsTokenNotItem4")}</li>
        <li>{t("termsTokenNotItem5")}</li>
        <li>{t("termsTokenNotItem6")}</li>
      </ul>

      {/* Restricted Jurisdictions */}
      <div className="mb-6 p-4 border border-neon-cyan/20 rounded-xl bg-white/[0.02]">
        <h3 className="text-xl font-light mb-3 text-white">{t("termsTokenRestrictedTitle")}</h3>
        <p className="text-muted-foreground leading-relaxed mb-2">{t("termsTokenRestrictedContent")}</p>
        <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
          <li>{t("termsTokenRestrictedItem1")}</li>
          <li>{t("termsTokenRestrictedItem2")}</li>
          <li>{t("termsTokenRestrictedItem3")}</li>
        </ul>
      </div>

      {/* Purchaser Representation */}
      <div className="mb-6 p-4 border border-neon-violet/20 rounded-xl bg-white/[0.02]">
        <h3 className="text-xl font-light mb-3 text-white">{t("termsTokenPurchaserTitle")}</h3>
        <p className="text-muted-foreground leading-relaxed mb-2">{t("termsTokenPurchaserContent")}</p>
        <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
          <li>{t("termsTokenPurchaserItem1")}</li>
          <li>{t("termsTokenPurchaserItem2")}</li>
          <li>{t("termsTokenPurchaserItem3")}</li>
          <li>{t("termsTokenPurchaserItem4")}</li>
          <li>{t("termsTokenPurchaserItem5")}</li>
        </ul>
      </div>

      {/* Vesting */}
      <div className="mb-6">
        <h3 className="text-xl font-light mb-3 text-white">{t("termsTokenVestingTitle")}</h3>
        <p className="text-muted-foreground leading-relaxed">{t("termsTokenVestingContent")}</p>
      </div>

      {/* Secondary Market */}
      <div className="mb-6">
        <h3 className="text-xl font-light mb-3 text-white">{t("termsTokenSecondaryTitle")}</h3>
        <p className="text-muted-foreground leading-relaxed">{t("termsTokenSecondaryContent")}</p>
      </div>

      {/* Governance Rights */}
      <div className="mb-6 p-4 border border-neon-cyan/20 rounded-xl bg-white/[0.02]">
        <h3 className="text-xl font-light mb-3 text-white">{t("termsTokenGovernanceTitle")}</h3>
        <p className="text-muted-foreground leading-relaxed mb-2">{t("termsTokenGovernanceContent")}</p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
          <li>{t("termsTokenGovernanceItem1")}</li>
          <li>{t("termsTokenGovernanceItem2")}</li>
          <li>{t("termsTokenGovernanceItem3")}</li>
          <li>{t("termsTokenGovernanceItem4")}</li>
          <li>{t("termsTokenGovernanceItem5")}</li>
        </ul>
      </div>

      {/* No Public Offering */}
      <div className="mb-6">
        <h3 className="text-xl font-light mb-3 text-white">{t("termsTokenNoOfferingTitle")}</h3>
        <p className="text-muted-foreground leading-relaxed">{t("termsTokenNoOfferingContent")}</p>
      </div>

      {/* Blockchain Finality */}
      <div className="mb-6">
        <h3 className="text-xl font-light mb-3 text-white">{t("termsTokenBlockchainTitle")}</h3>
        <p className="text-muted-foreground leading-relaxed">{t("termsTokenBlockchainContent")}</p>
      </div>

      {/* AML & Compliance */}
      <div className="mb-6 p-4 border border-neon-violet/20 rounded-xl bg-white/[0.02]">
        <h3 className="text-xl font-light mb-3 text-white">{t("termsTokenAMLTitle")}</h3>
        <p className="text-muted-foreground leading-relaxed">{t("termsTokenAMLContent")}</p>
      </div>

      {/* Marketing Disclaimer */}
      <div className="mb-6">
        <h3 className="text-xl font-light mb-3 text-white">{t("termsTokenMarketingTitle")}</h3>
        <p className="text-muted-foreground leading-relaxed">{t("termsTokenMarketingContent")}</p>
      </div>

      {/* No Guarantees */}
      <p className="text-muted-foreground leading-relaxed mb-2 font-semibold">{t("termsTokenGuarantees")}</p>
      <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
        <li>{t("termsTokenGuaranteeItem1")}</li>
        <li>{t("termsTokenGuaranteeItem2")}</li>
        <li>{t("termsTokenGuaranteeItem3")}</li>
        <li>{t("termsTokenGuaranteeItem4")}</li>
      </ul>
      <p className="text-muted-foreground leading-relaxed font-semibold italic">{t("termsTokenVoluntary")}</p>
    </section>
  );
};
