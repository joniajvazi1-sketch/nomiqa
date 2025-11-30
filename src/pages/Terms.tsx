import { Navbar } from "@/components/Navbar";
import { SiteNavigation } from "@/components/SiteNavigation";
import { Footer } from "@/components/Footer";
import { SupportChatbot } from "@/components/SupportChatbot";
import { NetworkBackground } from "@/components/NetworkBackground";
import { useTranslation } from "@/contexts/TranslationContext";
import { SEO } from "@/components/SEO";
import { useEffect, useState } from "react";

export default function Terms() {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black/40 via-deep-space/60 to-black/40 relative overflow-hidden">
      <SEO page="terms" />
      <NetworkBackground />
      
      {/* Premium glowing orbs background */}
      <div className="fixed inset-0 -z-10 overflow-hidden opacity-20">
        <div className="absolute top-40 left-20 w-96 h-96 bg-neon-cyan/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-[500px] h-[500px] bg-neon-violet/30 rounded-full blur-3xl"></div>
      </div>
      
      <Navbar />
      
      <div className="pt-24 pb-20 px-4">
        <div className={`max-w-4xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="font-light text-4xl md:text-5xl mb-4 bg-gradient-to-r from-neon-cyan via-white to-neon-violet bg-clip-text text-transparent">
              {t("termsTitle")}
            </h1>
            <p className="text-muted-foreground text-lg">
              {t("termsSubtitle")}
            </p>
          </div>

          {/* Content Container */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-12 space-y-12">
            
            {/* 1. Legal Notice / Impressum */}
            <section>
              <h2 className="text-2xl md:text-3xl font-light mb-6 text-neon-cyan">
                {t("termsLegalNoticeTitle")}
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p className="font-semibold text-white">{t("termsLegalNoticeCompany")}</p>
                <p>{t("termsLegalNoticeAddress")}</p>
                <p>{t("termsLegalNoticeReg")}</p>
                <p>{t("termsLegalNoticeDirector")}</p>
                <p>{t("termsLegalNoticeEmail")}</p>
                <p>{t("termsLegalNoticeWebsite")}</p>
                
                <div className="pt-4">
                  <p className="font-semibold text-white">{t("termsVATTitle")}</p>
                  <p>{t("termsVATContent")}</p>
                </div>
                
                <div className="pt-4">
                  <p className="font-semibold text-white">{t("termsResponsibleTitle")}</p>
                  <p>{t("termsResponsibleContent")}</p>
                </div>
                
                <div className="pt-4">
                  <p className="font-semibold text-white">{t("termsODRTitle")}</p>
                  <p>{t("termsODRLink")}</p>
                  <p>{t("termsODRContent")}</p>
                </div>
              </div>
            </section>

            {/* 2. Terms & Conditions */}
            <section>
              <h2 className="text-2xl md:text-3xl font-light mb-6 text-neon-violet">
                {t("termsTCTitle")}
              </h2>
              
              {/* Scope */}
              <div className="mb-6">
                <h3 className="text-xl font-light mb-3 text-white">{t("termsScopeTitle")}</h3>
                <p className="text-muted-foreground leading-relaxed">{t("termsScopeContent")}</p>
              </div>

              {/* Service Description */}
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

              {/* Contract Formation */}
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

              {/* Requirements */}
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

              {/* Technical Delivery */}
              <div className="mb-6">
                <h3 className="text-xl font-light mb-3 text-white">{t("termsDeliveryTitle")}</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>{t("termsDeliveryItem1")}</li>
                  <li>{t("termsDeliveryItem2")}</li>
                  <li>{t("termsDeliveryItem3")}</li>
                </ul>
              </div>

              {/* Prices & VAT */}
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

              {/* Network Coverage */}
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

              {/* Withdrawal Rights */}
              <div className="mb-6">
                <h3 className="text-xl font-light mb-3 text-white">{t("termsWithdrawalTitle")}</h3>
                <p className="text-muted-foreground leading-relaxed mb-2">{t("termsWithdrawalContent")}</p>
                <p className="text-muted-foreground leading-relaxed italic">{t("termsWithdrawalConfirmation")}</p>
              </div>

              {/* Liability */}
              <div className="mb-6">
                <h3 className="text-xl font-light mb-3 text-white">{t("termsLiabilityTitle")}</h3>
                <p className="text-muted-foreground leading-relaxed mb-2">{t("termsLiabilityContent")}</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>{t("termsLiabilityItem1")}</li>
                  <li>{t("termsLiabilityItem2")}</li>
                  <li>{t("termsLiabilityItem3")}</li>
                  <li>{t("termsLiabilityItem4")}</li>
                  <li>{t("termsLiabilityItem5")}</li>
                  <li>{t("termsLiabilityItem6")}</li>
                  <li>{t("termsLiabilityItem7")}</li>
                </ul>
              </div>

              {/* Prohibited Use */}
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

              {/* Support */}
              <div className="mb-6">
                <h3 className="text-xl font-light mb-3 text-white">{t("termsSupportTitle")}</h3>
                <p className="text-muted-foreground leading-relaxed">{t("termsSupportEmail")}</p>
                <p className="text-muted-foreground leading-relaxed">{t("termsSupportResponse")}</p>
              </div>

              {/* Governing Law */}
              <div className="mb-6">
                <h3 className="text-xl font-light mb-3 text-white">{t("termsGoverningTitle")}</h3>
                <p className="text-muted-foreground leading-relaxed">{t("termsGoverningContent")}</p>
              </div>
            </section>

            {/* 3. Privacy Policy */}
            <section>
              <h2 className="text-2xl md:text-3xl font-light mb-6 text-neon-cyan">
                {t("termsPrivacyTitle")}
              </h2>
              
              {/* Data Controller */}
              <div className="mb-6">
                <h3 className="text-xl font-light mb-3 text-white">{t("termsPrivacyControllerTitle")}</h3>
                <p className="text-muted-foreground leading-relaxed">{t("termsPrivacyControllerContent")}</p>
              </div>

              {/* Data We Process */}
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

              {/* Purpose */}
              <div className="mb-6">
                <h3 className="text-xl font-light mb-3 text-white">{t("termsPrivacyPurposeTitle")}</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>{t("termsPrivacyPurposeItem1")}</li>
                  <li>{t("termsPrivacyPurposeItem2")}</li>
                  <li>{t("termsPrivacyPurposeItem3")}</li>
                  <li>{t("termsPrivacyPurposeItem4")}</li>
                </ul>
              </div>

              {/* Third-Party Sharing */}
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

              {/* Data Retention */}
              <div className="mb-6">
                <h3 className="text-xl font-light mb-3 text-white">{t("termsPrivacyRetentionTitle")}</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>{t("termsPrivacyRetentionItem1")}</li>
                  <li>{t("termsPrivacyRetentionItem2")}</li>
                  <li>{t("termsPrivacyRetentionItem3")}</li>
                </ul>
              </div>

              {/* Your Rights */}
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

            {/* 4. Withdrawal Policy */}
            <section>
              <h2 className="text-2xl md:text-3xl font-light mb-6 text-neon-violet">
                {t("termsWithdrawalPolicyTitle")}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">{t("termsWithdrawalPolicyContent")}</p>
              <p className="text-muted-foreground leading-relaxed mb-2 font-semibold">{t("termsWithdrawalPolicyCustomer")}</p>
              <p className="text-muted-foreground leading-relaxed italic">{t("termsWithdrawalPolicyConfirmation")}</p>
            </section>

            {/* 5. Token Disclaimer */}
            <section>
              <h2 className="text-2xl md:text-3xl font-light mb-6 text-neon-cyan">
                {t("termsTokenTitle")}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">{t("termsTokenIntro")}</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                <li>{t("termsTokenItem1")}</li>
                <li>{t("termsTokenItem2")}</li>
                <li>{t("termsTokenItem3")}</li>
                <li>{t("termsTokenItem4")}</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mb-2 font-semibold">{t("termsTokenNotTitle")}</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                <li>{t("termsTokenNotItem1")}</li>
                <li>{t("termsTokenNotItem2")}</li>
                <li>{t("termsTokenNotItem3")}</li>
                <li>{t("termsTokenNotItem4")}</li>
                <li>{t("termsTokenNotItem5")}</li>
                <li>{t("termsTokenNotItem6")}</li>
                <li>{t("termsTokenNotItem7")}</li>
                <li>{t("termsTokenNotItem8")}</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mb-2 font-semibold">{t("termsTokenGuarantees")}</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                <li>{t("termsTokenGuaranteeItem1")}</li>
                <li>{t("termsTokenGuaranteeItem2")}</li>
                <li>{t("termsTokenGuaranteeItem3")}</li>
                <li>{t("termsTokenGuaranteeItem4")}</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">{t("termsTokenVoluntary")}</p>
            </section>

            {/* Last Updated */}
            <div className="pt-8 border-t border-white/10 text-center text-muted-foreground text-sm">
              {t("termsLastUpdated")}
            </div>
          </div>
        </div>
      </div>

      <SiteNavigation />
      <Footer />
      <SupportChatbot />
    </div>
  );
}
